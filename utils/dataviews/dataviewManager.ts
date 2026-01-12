/**
 * Dataview Manager
 * Manages dataviews list, dynamic field loading, and integration with OpenAPI Utils
 * 
 * Supports two API sources:
 * 1. Gaia API (https://gaia.oxana.io/api/) - Uses OpenAPI YAML specs for data loading
 * 2. Local/Cloudflare Worker API - Direct endpoint calls
 * 
 * Gaia API Flow:
 * 1. List dataviews: POST /dataview_pid_7/Post
 * 2. Load dataview data: OpenAPI_utils.generateAndLoadDataView(/{name}/yaml)
 * 3. Cache loaded data in Builder.data pattern
 */

import { RemoteArray } from '../data/RemoteArray';
import { openAPIUtils } from '../api/openApiUtils';
import { dataCache } from '../cache/dataCache';
import { apiConfig } from '../../config/apiConfig';
import type { Dataview, RemoteArrayOptions } from '../../stores/types';

/**
 * Gaia API Input structure for dataview list requests
 */
export interface GaiaDvInput {
  tableData: {
    currentRecord: number;
    recordsPerPage: number;
  };
  advancedSqlFilters?: any;
}

export interface DataviewManagerOptions {
  apiBaseUrl?: string;
  recordsPerPage?: number;
}

export class DataviewManager {
  list: RemoteArray;
  private dataviewsMap: Map<string, Dataview> = new Map();
  private localBaseUrl: string;
  private recordsPerPage: number;

  constructor(options: DataviewManagerOptions = {}) {
    this.localBaseUrl = options.apiBaseUrl || apiConfig.getBaseUrl();
    this.recordsPerPage = options.recordsPerPage || 50;

    // Initialize RemoteArray for dataviews list
    this.list = new RemoteArray(
      {
        recordsPerPage: this.recordsPerPage,
        fetchPromise: async (params) => {
          // Use Gaia API if enabled, otherwise use local API
          if (apiConfig.isGaiaEnabled()) {
            return this.fetchDataviewsListGaia(params);
          }
          return this.fetchDataviewsListLocal(params);
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
   * Fetch dataviews list from Gaia API
   * Uses POST /dataview_pid_7/Post endpoint
   */
  private async fetchDataviewsListGaia(params: {
    startPage: number;
    recordsPerPage: number;
    filterData?: any;
    sortData?: any;
  }) {
    const url = apiConfig.getGaiaFullUrl('dataviewsList');
    
    const body: GaiaDvInput = {
      tableData: {
        currentRecord: params.startPage * params.recordsPerPage,
        recordsPerPage: params.recordsPerPage,
      },
    };

    if (params.filterData) {
      body.advancedSqlFilters = params.filterData;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: apiConfig.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dataviews: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Map response to dataviews - Gaia format
    const items = result.data || result.items || result.records || result;
    const dataviews: Dataview[] = (Array.isArray(items) ? items : []).map((item: any) => ({
      id: item.id || item.dataview_id || item.name,
      name: item.name || item.title || item.id,
      description: item.description || '',
      // For Gaia, construct the OpenAPI YAML URL
      url: apiConfig.getGaiaDataviewYamlUrl(item.name || item.id),
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
  }

  /**
   * Fetch dataviews list from local/Cloudflare Worker API
   */
  private async fetchDataviewsListLocal(params: {
    startPage: number;
    recordsPerPage: number;
    filterData?: any;
    sortData?: any;
  }) {
    const endpoint = apiConfig.getEndpoint('dataviews');
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : this.localBaseUrl.endsWith('/') 
        ? `${this.localBaseUrl}${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`
        : `${this.localBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

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
  }

  /**
   * Load dataview data from API endpoint
   * 
   * Gaia API: Uses OpenAPI_utils.generateAndLoadDataView(/{name}/yaml)
   * Local API: POST /api/dataviews/{id}/data
   * 
   * @param dataviewId - The dataview ID or name
   * @param filterData - Optional filter parameters for cascading dropdowns
   */
  async loadDataview(dataviewId: string, filterData?: any): Promise<any[]> {
    const dataview = this.getDataview(dataviewId);
    if (!dataview) {
      throw new Error(`Dataview not found: ${dataviewId}`);
    }

    // Create cache key (include filter for filtered results)
    const filterKey = filterData ? `-${JSON.stringify(filterData)}` : '';
    const cacheKey = `dataview-data-${dataviewId}${filterKey}`;
    
    // Check cache first (skip if filter is applied for fresh data)
    if (!filterData) {
      const cached = dataCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      let data: any[] = [];

      if (apiConfig.isGaiaEnabled()) {
        // Gaia API: Use OpenAPI YAML pattern
        data = await this.loadDataviewGaia(dataview, filterData);
      } else {
        // Local API: Use direct endpoint
        data = await this.loadDataviewLocal(dataviewId, filterData);
      }

      // Cache data (shorter cache time if filtered)
      const cacheTime = filterData ? 300000 : 3600000; // 5 min or 1 hour
      dataCache.set(cacheKey, data, cacheTime);

      return data;
    } catch (error) {
      console.error(`Failed to load dataview ${dataviewId}:`, error);
      
      // Fallback: try OpenAPI URL if available
      if (dataview.url) {
        try {
          console.log(`Trying fallback to OpenAPI URL: ${dataview.url}`);
          const data = await openAPIUtils.generateAndLoadDataView(dataview.url);
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
   * Load dataview data using Gaia OpenAPI pattern
   * Similar to OpenAPI_utils.generateAndLoadDataView in obviaversion
   * 
   * For cascading dropdowns, filterData contains the filter parameters
   * (e.g., { state_code: "AL" } to filter cities by state)
   */
  private async loadDataviewGaia(dataview: Dataview, filterData?: any): Promise<any[]> {
    // Get OpenAPI YAML URL for this dataview
    const yamlUrl = dataview.url || apiConfig.getGaiaDataviewYamlUrl(dataview.name);
    
    console.log(`Loading dataview from Gaia OpenAPI: ${yamlUrl}`, filterData ? `with filters: ${JSON.stringify(filterData)}` : '');
    
    // Try to load with filters if we have a direct POST endpoint
    // For Gaia, dataviews typically have a POST endpoint that accepts filters
    if (filterData && Object.keys(filterData).length > 0) {
      try {
        // Try to call the dataview POST endpoint directly with filters
        // Format: https://gaia.oxana.io/api/{dataview_name}/Post
        const dataviewName = dataview.name || dataview.id;
        const baseUrl = apiConfig.getGaiaBaseUrl();
        const postUrl = `${baseUrl}/${dataviewName}/Post`;
        
        const response = await fetch(postUrl, {
          method: 'POST',
          headers: apiConfig.getHeaders(),
          body: JSON.stringify({
            tableData: {
              currentRecord: 0,
              recordsPerPage: this.recordsPerPage,
            },
            advancedSqlFilters: filterData,
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          const items = result.data || result.items || result.records || result;
          return Array.isArray(items) ? items : [];
        }
      } catch (error) {
        console.warn('Failed to load with server-side filters, falling back to client-side filtering:', error);
      }
    }
    
    // Fallback: Use OpenAPI utils to load data, then apply client-side filtering
    const data = await openAPIUtils.generateAndLoadDataView(yamlUrl, this.recordsPerPage);
    
    // Apply client-side filtering if filterData is provided
    if (filterData && Object.keys(filterData).length > 0) {
      return this.applyClientFilter(data, filterData);
    }
    
    return data;
  }

  /**
   * Load dataview data using local API endpoint
   */
  private async loadDataviewLocal(dataviewId: string, filterData?: any): Promise<any[]> {
    const baseUrl = apiConfig.getBaseUrl();
    const endpoint = apiConfig.getEndpoint('dataviewData');
    
    // Build URL: /api/dataviews/{id}/data
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
        pageSize: this.recordsPerPage,
        filters: filterData || {},
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

    return data;
  }

  /**
   * Apply client-side filtering to data
   * Used for cascading dropdowns when server doesn't support filtering
   */
  private applyClientFilter(data: any[], filterData: Record<string, any>): any[] {
    return data.filter((item) => {
      for (const [key, value] of Object.entries(filterData)) {
        if (value === undefined || value === null || value === '') {
          continue;
        }
        if (item[key] !== value) {
          return false;
        }
      }
      return true;
    });
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

