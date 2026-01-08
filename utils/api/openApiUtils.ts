/**
 * OpenAPI Utils System
 * Provides dynamic API client generation from OpenAPI YAML/JSON specs
 * Supports caching and auto-import of generated clients
 */

import { dataCache } from '../cache/dataCache';
import { apiConfig } from '../../config/apiConfig';

export interface OpenAPIClient {
  inst: any; // Generated API client instance
  title: string; // API title
  constructor: any; // Client constructor
}

export interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version?: string;
    description?: string;
  };
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
  };
}

class OpenAPIUtils {
  private clientCache: Map<string, OpenAPIClient> = new Map();

  /**
   * Get or generate API client from OpenAPI URL
   */
  async get(url: string): Promise<OpenAPIClient> {
    // Check cache first
    const cacheKey = `openapi-client-${url}`;
    const cached = this.clientCache.get(url);
    if (cached) {
      return cached;
    }

    // Check dataCache
    const cachedClient = dataCache.get(cacheKey);
    if (cachedClient) {
      this.clientCache.set(url, cachedClient);
      return cachedClient;
    }

    // Fetch and generate client
    try {
      const spec = await this.fetchSpec(url);
      const client = await this.generateClient(spec, url);
      
      // Cache client
      this.clientCache.set(url, client);
      dataCache.set(cacheKey, client, 86400000); // Cache for 24 hours

      return client;
    } catch (error) {
      console.error('Failed to generate OpenAPI client:', error);
      throw error;
    }
  }

  /**
   * Generate and load dataview data from OpenAPI URL or direct POST endpoint
   */
  async generateAndLoadDataView(
    url: string,
    recordsPerPage: number = 50
  ): Promise<any[]> {
    try {
      // Check if URL is a direct POST endpoint (not an OpenAPI spec)
      // Detekto nëse është endpoint direkt që përdor POST
      const isDirectEndpoint = url.includes('/api/') && (
        url.endsWith('/Post') || 
        url.endsWith('/Get') || 
        url.match(/\/api\/[^/]+\/[^/]+$/) ||
        (!url.endsWith('.yaml') && !url.endsWith('.yml') && !url.endsWith('.json') && !url.includes('openapi'))
      );

      if (isDirectEndpoint) {
        // Direct endpoint - call it directly with POST method
        const response = await fetch(url, {
          method: 'POST',
          headers: apiConfig.getHeaders(),
          body: JSON.stringify({
            page: 1,
            pageSize: recordsPerPage,
            filters: {},
            sort: [],
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Handle different response formats
        if (Array.isArray(data)) {
          return data;
        } else if (data.items && Array.isArray(data.items)) {
          return data.items;
        } else if (data.data && Array.isArray(data.data)) {
          return data.data;
        }

        return [];
      }

      // Original OpenAPI spec logic (për OpenAPI specs)
      const client = await this.get(url);
      
      // Try to find a GET endpoint that returns an array
      // This is a simplified implementation - in production, you'd parse the spec more intelligently
      const spec = await this.fetchSpec(url);
      const listEndpoint = this.findListEndpoint(spec);
      
      if (!listEndpoint) {
        throw new Error('No list endpoint found in OpenAPI spec');
      }

      // Call the endpoint
      const response = await fetch(listEndpoint.url, {
        method: listEndpoint.method || 'GET',
        headers: apiConfig.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle pagination if needed
      if (Array.isArray(data)) {
        return data;
      } else if (data.items && Array.isArray(data.items)) {
        return data.items;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to load dataview data:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.clientCache.clear();
    // Clear from dataCache as well
    const keys = dataCache.getStats().keys;
    keys.forEach((key) => {
      if (key.startsWith('openapi-client-')) {
        dataCache.delete(key);
      }
    });
  }

  /**
   * Fetch OpenAPI spec from URL
   */
  private async fetchSpec(url: string): Promise<OpenAPISpec> {
    const cacheKey = `openapi-spec-${url}`;
    const cached = dataCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await fetch(url, {
      headers: apiConfig.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let spec: OpenAPISpec;

    if (contentType.includes('application/json')) {
      spec = await response.json();
    } else if (contentType.includes('yaml') || contentType.includes('yml') || url.endsWith('.yaml') || url.endsWith('.yml')) {
      // Parse YAML - for now, try to parse as JSON first, then fallback to text parsing
      // In production, you'd use a YAML parser like js-yaml
      const text = await response.text();
      try {
        // Try JSON first
        spec = JSON.parse(text);
      } catch {
        // Basic YAML parsing (simplified - in production use js-yaml)
        spec = this.parseYAML(text);
      }
    } else {
      // Try JSON by default
      spec = await response.json();
    }

    // Cache spec
    dataCache.set(cacheKey, spec, 3600000); // Cache for 1 hour

    return spec;
  }

  /**
   * Generate API client from OpenAPI spec
   * This is a simplified implementation - in production, you'd use a proper code generator
   */
  private async generateClient(spec: OpenAPISpec, url: string): Promise<OpenAPIClient> {
    const title = spec.info?.title || this.extractTitleFromUrl(url);
    
    // Create a simple client wrapper
    const client = {
      // Basic fetch wrapper
      async request(path: string, options: RequestInit = {}): Promise<any> {
        const baseUrl = url.substring(0, url.lastIndexOf('/'));
        const fullUrl = `${baseUrl}${path}`;
        
        const response = await fetch(fullUrl, {
          ...options,
          headers: {
            ...apiConfig.getHeaders(),
            ...options.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        return response.json();
      },
      
      // Get all paths
      getPaths(): Record<string, any> {
        return spec.paths || {};
      },
      
      // Get schemas
      getSchemas(): Record<string, any> {
        return spec.components?.schemas || {};
      },
    };

    return {
      inst: client,
      title,
      constructor: null, // Not used in simplified implementation
    };
  }

  /**
   * Extract title from URL
   */
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        // Remove .yaml, .yml, .json extensions
        return lastPart.replace(/\.(yaml|yml|json)$/i, '');
      }
      return 'API';
    } catch {
      return 'API';
    }
  }

  /**
   * Find list endpoint in OpenAPI spec
   */
  private findListEndpoint(spec: OpenAPISpec): { url: string; method: string } | null {
    const paths = spec.paths || {};
    
    // Look for GET endpoints that might return arrays
    for (const [path, methods] of Object.entries(paths)) {
      if (methods.get) {
        const responses = methods.get.responses || {};
        // Check if response is an array
        const response200 = responses['200'] || responses['200'] || responses['default'];
        if (response200) {
          const schema = response200.content?.['application/json']?.schema;
          if (schema?.type === 'array' || schema?.items) {
            return { url: path, method: 'GET' };
          }
        }
      }
    }

    // Fallback: return first GET endpoint
    for (const [path, methods] of Object.entries(paths)) {
      if (methods.get) {
        return { url: path, method: 'GET' };
      }
    }

    return null;
  }

  /**
   * Basic YAML parser (simplified - use js-yaml in production)
   */
  private parseYAML(text: string): OpenAPISpec {
    // This is a very basic YAML parser - in production, use js-yaml library
    // For now, try to extract basic info
    const lines = text.split('\n');
    const spec: any = {
      info: {},
      paths: {},
    };

    let currentSection = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('openapi:') || trimmed.startsWith('swagger:')) {
        spec.openapi = trimmed.split(':')[1]?.trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('title:')) {
        spec.info.title = trimmed.split(':').slice(1).join(':').trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('version:')) {
        spec.info.version = trimmed.split(':')[1]?.trim().replace(/['"]/g, '');
      }
    }

    // If parsing fails, return minimal spec
    if (!spec.info.title) {
      spec.info.title = 'API';
    }

    return spec as OpenAPISpec;
  }
}

// Global instance
export const openAPIUtils = new OpenAPIUtils();

