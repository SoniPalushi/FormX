/**
 * Dataview Manager
 * Manages dataviews list, dynamic field loading, and integration with OpenAPI Utils
 */

import { RemoteArray } from '../data/RemoteArray';
import { openAPIUtils } from '../api/openApiUtils';
import { dataCache } from '../cache/dataCache';
import { apiConfig } from '../../config/apiConfig';
import type { Dataview, RemoteArrayOptions } from '../../stores/types';

export interface DataviewManagerOptions {
  apiBaseUrl?: string;
  recordsPerPage?: number;
}

export class DataviewManager {
  list: RemoteArray;
  private dataviewsMap: Map<string, Dataview> = new Map();

  constructor(options: DataviewManagerOptions = {}) {
    const baseUrl = options.apiBaseUrl || apiConfig.getBaseUrl();
    const recordsPerPage = options.recordsPerPage || 50;

    // Initialize RemoteArray for dataviews list
    this.list = new RemoteArray(
      {
        recordsPerPage,
        fetchPromise: async (params) => {
          // Përdor full URL nëse baseUrl tashmë përmban path, ose kombinim
          const endpoint = apiConfig.getEndpoint('dataviews');
          const url = endpoint.startsWith('http') 
            ? endpoint 
            : baseUrl.endsWith('/') 
              ? `${baseUrl}${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`
              : `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: apiConfig.getHeaders(),
            body: JSON.stringify({
              page: params.startPage,
              pageSize: params.recordsPerPage,
              filters: params.filterData,
              sort: params.sortData,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch dataviews: ${response.statusText}`);
          }

          const result = await response.json();
          
          // Map response to dataviews
          const dataviews: Dataview[] = (result.data || result.items || result).map((item: any) => ({
            id: item.id || item.dataview_id,
            name: item.name || item.title,
            description: item.description || '',
            url: item.url || item.openapi_url || '',
            fields: item.fields || undefined,
          }));

          // Cache dataviews
          dataviews.forEach((dv) => {
            this.dataviewsMap.set(dv.id, dv);
          });

          return {
            data: dataviews,
            totalRecords: result.totalRecords || result.total || dataviews.length,
            totalPages: result.totalPages,
          };
        },
        autoInit: false,
      },
      {
        onDataLoaded: (data) => {
          // Cache loaded dataviews
          data.forEach((dv: Dataview) => {
            this.dataviewsMap.set(dv.id, dv);
          });
        },
      }
    );
  }

  /**
   * Load dataview data from API endpoint
   * Përdor endpoint-in e implementuar: POST /api/dataviews/{id}/data
   */
  async loadDataview(dataviewId: string): Promise<any[]> {
    const dataview = this.getDataview(dataviewId);
    if (!dataview) {
      throw new Error(`Dataview not found: ${dataviewId}`);
    }

    // Check cache first
    const cacheKey = `dataview-data-${dataviewId}`;
    const cached = dataCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Përdor endpoint-in e implementuar për të ngarkuar të dhënat
      const baseUrl = apiConfig.getBaseUrl();
      const endpoint = apiConfig.getEndpoint('dataviewData');
      
      // Ndërto URL: /api/dataviews/{id}/data
      const url = endpoint.startsWith('http')
        ? `${endpoint}/${dataviewId}/data`
        : baseUrl.endsWith('/')
        ? `${baseUrl}${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}/${dataviewId}/data`
        : `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}/${dataviewId}/data`;

      const response = await fetch(url, {
        method: 'POST',
        headers: apiConfig.getHeaders(),
        body: JSON.stringify({
          page: 1,
          pageSize: 50, // Default page size
          filters: {},
          sort: [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dataview data: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle different response formats
      let data: any[] = [];
      if (Array.isArray(result)) {
        data = result;
      } else if (result.data && Array.isArray(result.data)) {
        data = result.data;
      } else if (result.items && Array.isArray(result.items)) {
        data = result.items;
      } else if (result.records && Array.isArray(result.records)) {
        data = result.records;
      }

      // Cache data
      dataCache.set(cacheKey, data, 3600000); // Cache for 1 hour

      return data;
    } catch (error) {
      console.error(`Failed to load dataview ${dataviewId}:`, error);
      
      // Fallback: nëse endpoint-i nuk funksionon, provo me OpenAPI URL nëse ekziston
      if (dataview.url) {
        try {
          console.log(`Trying fallback to OpenAPI URL: ${dataview.url}`);
          const data = await openAPIUtils.generateAndLoadDataView(dataview.url);
          const cacheKey = `dataview-data-${dataviewId}`;
          dataCache.set(cacheKey, data, 3600000);
          return data;
        } catch (fallbackError) {
          console.error(`Fallback also failed:`, fallbackError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Load dataview fields (column names)
   */
  async loadDataviewFields(dataviewId: string): Promise<string[]> {
    const dataview = this.getDataview(dataviewId);
    if (!dataview) {
      throw new Error(`Dataview not found: ${dataviewId}`);
    }

    // Check if fields are already cached
    if (dataview.fields && dataview.fields.length > 0) {
      return dataview.fields;
    }

    // Check cache
    const cacheKey = `dataview-fields-${dataviewId}`;
    const cached = dataCache.get(cacheKey);
    if (cached) {
      // Update dataview with cached fields
      dataview.fields = cached;
      return cached;
    }

    try {
      // Load a sample record to extract field names
      const data = await this.loadDataview(dataviewId);
      
      if (data.length === 0) {
        // Try to get fields from OpenAPI spec
        if (dataview.url) {
          const client = await openAPIUtils.get(dataview.url);
          const schemas = client.inst.getSchemas();
          
          // Try to find schema that represents the data
          for (const [schemaName, schema] of Object.entries(schemas)) {
            if ((schema as any).properties) {
              const fields = Object.keys((schema as any).properties);
              if (fields.length > 0) {
                dataview.fields = fields;
                dataCache.set(cacheKey, fields, 86400000); // Cache for 24 hours
                return fields;
              }
            }
          }
        }
        
        return [];
      }

      // Extract field names from first record
      const firstRecord = data[0];
      const fields = Object.keys(firstRecord);
      
      // Cache fields
      dataview.fields = fields;
      dataCache.set(cacheKey, fields, 86400000); // Cache for 24 hours

      return fields;
    } catch (error) {
      console.error(`Failed to load fields for dataview ${dataviewId}:`, error);
      throw error;
    }
  }

  /**
   * Get dataview by ID
   */
  getDataview(dataviewId: string): Dataview | null {
    // Check map first
    const cachedDataview = this.dataviewsMap.get(dataviewId);
    if (cachedDataview) {
      return cachedDataview;
    }

    // Check loaded pages in RemoteArray
    const allLoaded = this.list.getAllLoadedData();
    const foundDataview = allLoaded.find((dv: Dataview) => dv.id === dataviewId);
    
    if (foundDataview) {
      this.dataviewsMap.set(dataviewId, foundDataview);
      return foundDataview;
    }

    return null;
  }

  /**
   * Clear cache for a specific dataview or all dataviews
   */
  clearCache(dataviewId?: string): void {
    if (dataviewId) {
      // Clear specific dataview cache
      dataCache.delete(`dataview-data-${dataviewId}`);
      dataCache.delete(`dataview-fields-${dataviewId}`);
      
      // Remove from map
      const dataview = this.dataviewsMap.get(dataviewId);
      if (dataview) {
        dataview.fields = undefined;
      }
    } else {
      // Clear all dataview caches
      const stats = dataCache.getStats();
      stats.keys.forEach((key) => {
        if (key.startsWith('dataview-')) {
          dataCache.delete(key);
        }
      });
      
      // Clear map
      this.dataviewsMap.clear();
    }
  }

  /**
   * Refresh dataviews list
   */
  async refresh(): Promise<void> {
    this.list.reset();
    await this.list.init();
  }
}

// Global instance (will be initialized with proper config)
let dataviewManagerInstance: DataviewManager | null = null;

/**
 * Get or create global DataviewManager instance
 */
export function getDataviewManager(options?: DataviewManagerOptions): DataviewManager {
  if (!dataviewManagerInstance) {
    dataviewManagerInstance = new DataviewManager(options);
  }
  return dataviewManagerInstance;
}

