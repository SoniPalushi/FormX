/**
 * API Configuration Manager
 * Manages API base URL, endpoints, headers, and timeout settings
 * Supports environment-based configuration and multi-tenant support
 * 
 * Supports two API sources:
 * 1. Gaia API (https://gaia.oxana.io/api/) - Production/Legacy
 * 2. Local/Cloudflare Worker API - Development/Testing
 */

export interface APIConfig {
  baseUrl: string;
  endpoints: {
    dataviews: string;
    forms: string;
    [key: string]: string;
  };
  headers?: Record<string, string>;
  timeout?: number;
}

export interface GaiaAPIConfig {
  baseUrl: string;
  enabled: boolean;
  endpoints: {
    dataviewsList: string;    // POST - lista e dataview-ve (dataview_pid_7)
    formsList: string;        // POST - lista e formave (dataview_pid_1)
    forms: string;            // GET/POST/PUT/DELETE - CRUD për forma
    dataviewYaml: string;     // GET - OpenAPI YAML spec për një dataview
  };
}

export class APIConfigManager {
  private config: APIConfig;
  private gaiaConfig: GaiaAPIConfig;

  constructor(config?: Partial<APIConfig>) {
    // Local/Development API Configuration
    this.config = {
      // Përdor Cloudflare Worker URL për testim, ose environment variable
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://raspy-hill-b911.soncekreatx.workers.dev',
      endpoints: {
        dataviews: '/api/dataviews',
        dataviewData: '/api/dataviews', // Base path, will append /{id}/data
        forms: '/forms',
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
      ...config,
    };

    // Gaia API Configuration (from obviaversion/forms)
    this.gaiaConfig = {
      baseUrl: import.meta.env.VITE_GAIA_API_URL || 'https://gaia.oxana.io/api',
      enabled: import.meta.env.VITE_USE_GAIA_API === 'true',
      endpoints: {
        dataviewsList: '/dataview_pid_7/Post',  // Lista e dataview-ve
        formsList: '/dataview_pid_1/Post',       // Lista e formave
        forms: '/forms',                          // CRUD endpoint për forma
        dataviewYaml: '',                         // /{dataview_name}/yaml - dynamic
      },
    };
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Get a specific endpoint URL
   */
  getEndpoint(name: string): string {
    return this.config.endpoints[name] || `/${name}`;
  }

  /**
   * Get full URL for an endpoint
   */
  getFullUrl(endpointName: string): string {
    const baseUrl = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;
    const endpoint = this.config.endpoints[endpointName] || `/${endpointName}`;
    const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${endpointPath}`;
  }

  /**
   * Set the base URL
   */
  setBaseUrl(url: string): void {
    this.config.baseUrl = url;
  }

  /**
   * Set an endpoint URL
   */
  setEndpoint(name: string, url: string): void {
    this.config.endpoints[name] = url;
  }

  /**
   * Set a header
   */
  setHeader(key: string, value: string): void {
    if (!this.config.headers) {
      this.config.headers = {};
    }
    this.config.headers[key] = value;
  }

  /**
   * Get all headers
   */
  getHeaders(): Record<string, string> {
    return { ...this.config.headers } || {};
  }

  /**
   * Set timeout
   */
  setTimeout(timeout: number): void {
    this.config.timeout = timeout;
  }

  /**
   * Get timeout
   */
  getTimeout(): number {
    return this.config.timeout || 30000;
  }

  /**
   * Get full configuration
   */
  getConfig(): APIConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<APIConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      endpoints: {
        ...this.config.endpoints,
        ...config.endpoints,
      },
      headers: {
        ...this.config.headers,
        ...config.headers,
      },
    };
  }

  // ============================================
  // Gaia API Methods
  // ============================================

  /**
   * Check if Gaia API is enabled
   */
  isGaiaEnabled(): boolean {
    return this.gaiaConfig.enabled;
  }

  /**
   * Enable/disable Gaia API
   */
  setGaiaEnabled(enabled: boolean): void {
    this.gaiaConfig.enabled = enabled;
  }

  /**
   * Get Gaia API base URL
   */
  getGaiaBaseUrl(): string {
    return this.gaiaConfig.baseUrl;
  }

  /**
   * Set Gaia base URL
   */
  setGaiaBaseUrl(url: string): void {
    this.gaiaConfig.baseUrl = url;
  }

  /**
   * Get Gaia endpoint URL
   */
  getGaiaEndpoint(name: keyof GaiaAPIConfig['endpoints']): string {
    return this.gaiaConfig.endpoints[name] || '';
  }

  /**
   * Get full Gaia URL for an endpoint
   */
  getGaiaFullUrl(endpointName: keyof GaiaAPIConfig['endpoints']): string {
    const baseUrl = this.gaiaConfig.baseUrl.endsWith('/')
      ? this.gaiaConfig.baseUrl.slice(0, -1)
      : this.gaiaConfig.baseUrl;
    const endpoint = this.gaiaConfig.endpoints[endpointName] || '';
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Get Gaia OpenAPI YAML URL for a dataview
   * Format: https://gaia.oxana.io/api/{dataview_name}/yaml
   */
  getGaiaDataviewYamlUrl(dataviewName: string): string {
    const baseUrl = this.gaiaConfig.baseUrl.endsWith('/')
      ? this.gaiaConfig.baseUrl.slice(0, -1)
      : this.gaiaConfig.baseUrl;
    return `${baseUrl}/${dataviewName}/yaml`;
  }

  /**
   * Get Gaia configuration
   */
  getGaiaConfig(): GaiaAPIConfig {
    return { ...this.gaiaConfig };
  }

  /**
   * Update Gaia configuration
   */
  updateGaiaConfig(config: Partial<GaiaAPIConfig>): void {
    this.gaiaConfig = {
      ...this.gaiaConfig,
      ...config,
      endpoints: {
        ...this.gaiaConfig.endpoints,
        ...config.endpoints,
      },
    };
  }

  /**
   * Get effective base URL (Gaia if enabled, otherwise local)
   */
  getEffectiveBaseUrl(): string {
    return this.gaiaConfig.enabled ? this.gaiaConfig.baseUrl : this.config.baseUrl;
  }

  /**
   * Get effective forms endpoint URL
   */
  getEffectiveFormsUrl(): string {
    if (this.gaiaConfig.enabled) {
      return this.getGaiaFullUrl('forms');
    }
    return this.getFullUrl('forms');
  }

  /**
   * Get effective dataviews list endpoint URL
   */
  getEffectiveDataviewsListUrl(): string {
    if (this.gaiaConfig.enabled) {
      return this.getGaiaFullUrl('dataviewsList');
    }
    return this.getFullUrl('dataviews');
  }

  /**
   * Get effective forms list endpoint URL
   */
  getEffectiveFormsListUrl(): string {
    if (this.gaiaConfig.enabled) {
      return this.getGaiaFullUrl('formsList');
    }
    return this.getFullUrl('forms');
  }
}

// Global instance
export const apiConfig = new APIConfigManager();

