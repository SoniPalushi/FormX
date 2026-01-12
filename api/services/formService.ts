/**
 * Form Service
 * API service for form operations
 * Supports both Gaia API (legacy) and local API
 * 
 * Gaia API Endpoints:
 * - Forms List: POST /dataview_pid_1/Post
 * - Load Form: GET /forms/{id}
 * - Save Form: POST /forms
 * - Delete Form: DELETE /forms/{id}
 */

import { apiConfig } from '../../config/apiConfig';
import { RemoteArray } from '../../utils/data/RemoteArray';

// ============================================
// Types
// ============================================

export interface SaveFormRequest {
  formName: string;
  description?: string;
  formData: any; // ComponentDefinition[]
}

export interface FormResponse {
  id: string;
  formName: string;
  description?: string;
  formData: any;
  createdAt: string;
  updatedAt: string;
}

/**
 * Gaia Form Data structure (from obviaversion)
 * form_literal contains the JSON string of the form structure
 */
export interface GaiaFormData {
  id?: string | number;
  form_name?: string;
  form_literal?: string; // JSON string of form structure
  created_at?: string;
  updated_at?: string;
  // Additional fields from dataview_pid_1
  [key: string]: any;
}

/**
 * Gaia API Input structure for dataview requests
 * Based on obviaversion/forms/app/forms.js
 */
export interface GaiaDvInput {
  tableData: {
    currentRecord: number;
    recordsPerPage: number;
  };
  advancedSqlFilters?: any;
}

// ============================================
// Form Service
// ============================================

class FormService {
  private localBaseUrl: string = '/api/forms';

  /**
   * Get the effective base URL based on configuration
   */
  private getBaseUrl(): string {
    if (apiConfig.isGaiaEnabled()) {
      return apiConfig.getGaiaFullUrl('forms');
    }
    return apiConfig.getFullUrl('forms') || this.localBaseUrl;
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): Record<string, string> {
    return apiConfig.getHeaders();
  }

  // ============================================
  // CRUD Operations
  // ============================================

  /**
   * Save a form
   * Gaia: POST /forms
   * Local: POST /api/forms
   */
  async saveForm(data: SaveFormRequest): Promise<FormResponse> {
    const url = this.getBaseUrl();
    
    // Transform to Gaia format if Gaia is enabled
    const body = apiConfig.isGaiaEnabled()
      ? {
          form_name: data.formName,
          form_literal: JSON.stringify(data.formData),
          description: data.description,
        }
      : data;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to save form');
    }

    const result = await response.json();
    
    // Transform Gaia response to standard format
    if (apiConfig.isGaiaEnabled()) {
      return this.transformGaiaToFormResponse(result);
    }
    
    return result;
  }

  /**
   * Update an existing form
   * Gaia: PUT /forms/{id} or POST /forms with id
   * Local: PUT /api/forms/{id}
   */
  async updateForm(id: string, data: SaveFormRequest): Promise<FormResponse> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/${id}`;
    
    const body = apiConfig.isGaiaEnabled()
      ? {
          id,
          form_name: data.formName,
          form_literal: JSON.stringify(data.formData),
          description: data.description,
        }
      : { ...data, id };

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to update form');
    }

    const result = await response.json();
    
    if (apiConfig.isGaiaEnabled()) {
      return this.transformGaiaToFormResponse(result);
    }
    
    return result;
  }

  /**
   * Load a form by ID
   * Gaia: GET /forms/{id}
   * Local: GET /api/forms/{id}
   */
  async loadForm(id: string): Promise<FormResponse> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/${id}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to load form');
    }

    const result = await response.json();
    
    if (apiConfig.isGaiaEnabled()) {
      return this.transformGaiaToFormResponse(result);
    }
    
    return result;
  }

  /**
   * List forms
   * Gaia: POST /dataview_pid_1/Post (with pagination)
   * Local: GET /api/forms
   */
  async listForms(options?: {
    page?: number;
    pageSize?: number;
    filters?: any;
  }): Promise<{ data: FormResponse[]; totalRecords?: number; totalPages?: number }> {
    if (apiConfig.isGaiaEnabled()) {
      return this.listFormsGaia(options);
    }
    return this.listFormsLocal();
  }

  /**
   * List forms from Gaia API using dataview_pid_1
   */
  private async listFormsGaia(options?: {
    page?: number;
    pageSize?: number;
    filters?: any;
  }): Promise<{ data: FormResponse[]; totalRecords?: number; totalPages?: number }> {
    const url = apiConfig.getGaiaFullUrl('formsList');
    const page = options?.page || 0;
    const pageSize = options?.pageSize || 15;

    const body: GaiaDvInput = {
      tableData: {
        currentRecord: page * pageSize,
        recordsPerPage: pageSize,
      },
    };

    if (options?.filters) {
      body.advancedSqlFilters = options.filters;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to list forms');
    }

    const result = await response.json();
    
    // Handle different response formats
    const items = result.data || result.items || result.records || result;
    const formsList = Array.isArray(items) ? items : [];
    
    return {
      data: formsList.map((item: GaiaFormData) => this.transformGaiaToFormResponse(item)),
      totalRecords: result.totalRecords || result.total || formsList.length,
      totalPages: result.totalPages,
    };
  }

  /**
   * List forms from local API
   */
  private async listFormsLocal(): Promise<{ data: FormResponse[]; totalRecords?: number }> {
    const url = this.getBaseUrl();

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to list forms');
    }

    const result = await response.json();
    const data = Array.isArray(result) ? result : (result.data || result.items || []);
    
    return {
      data,
      totalRecords: data.length,
    };
  }

  /**
   * Delete a form
   * Gaia: DELETE /forms/{id}
   * Local: DELETE /api/forms/{id}
   */
  async deleteForm(id: string): Promise<void> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/${id}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete form');
    }
  }

  // ============================================
  // RemoteArray Factory (for pagination)
  // ============================================

  /**
   * Create a RemoteArray for forms list with pagination
   * Similar to Builder.formList in obviaversion
   */
  createFormsRemoteArray(recordsPerPage: number = 15): RemoteArray {
    return new RemoteArray({
      recordsPerPage,
      fetchPromise: async (params) => {
        const result = await this.listForms({
          page: params.startPage,
          pageSize: params.recordsPerPage,
          filters: params.filterData,
        });

        return {
          data: result.data,
          totalRecords: result.totalRecords || result.data.length,
          totalPages: result.totalPages,
        };
      },
      autoInit: false,
    });
  }

  // ============================================
  // Transformation Helpers
  // ============================================

  /**
   * Transform Gaia form data to standard FormResponse
   */
  private transformGaiaToFormResponse(gaiaForm: GaiaFormData): FormResponse {
    let formData = gaiaForm.form_literal;
    
    // Parse form_literal if it's a JSON string
    if (typeof formData === 'string') {
      try {
        formData = JSON.parse(formData);
      } catch {
        console.warn('Failed to parse form_literal:', gaiaForm.id);
      }
    }

    return {
      id: String(gaiaForm.id || ''),
      formName: gaiaForm.form_name || 'Untitled Form',
      description: gaiaForm.description || '',
      formData,
      createdAt: gaiaForm.created_at || new Date().toISOString(),
      updatedAt: gaiaForm.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Transform standard SaveFormRequest to Gaia format
   */
  private transformToGaiaFormat(data: SaveFormRequest, id?: string): GaiaFormData {
    return {
      id,
      form_name: data.formName,
      form_literal: JSON.stringify(data.formData),
      description: data.description,
    };
  }

  // ============================================
  // Import/Export (Client-side)
  // ============================================

  /**
   * Export form as JSON (client-side only)
   */
  exportFormAsJSON(formData: any, filename: string = 'form.json'): void {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import form from JSON file
   */
  async importFormFromJSON(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          resolve(json);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Check if using Gaia API
   */
  isUsingGaiaAPI(): boolean {
    return apiConfig.isGaiaEnabled();
  }

  /**
   * Switch to Gaia API
   */
  useGaiaAPI(enabled: boolean = true): void {
    apiConfig.setGaiaEnabled(enabled);
  }
}

export const formService = new FormService();
