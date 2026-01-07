/**
 * API Configuration Manager
 * Manages API base URL, endpoints, headers, and timeout settings
 * Supports environment-based configuration and multi-tenant support
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

export class APIConfigManager {
  private config: APIConfig;

  constructor(config?: Partial<APIConfig>) {
    this.config = {
      baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
      endpoints: {
        dataviews: '/dataviews',
        forms: '/forms',
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
      ...config,
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
}

// Global instance
export const apiConfig = new APIConfigManager();

