// API service for form operations

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

class FormService {
  private baseUrl: string = '/api/forms'; // Adjust based on your API

  async saveForm(data: SaveFormRequest): Promise<FormResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to save form');
    }

    return response.json();
  }

  async loadForm(id: string): Promise<FormResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`);

    if (!response.ok) {
      throw new Error('Failed to load form');
    }

    return response.json();
  }

  async listForms(): Promise<FormResponse[]> {
    const response = await fetch(this.baseUrl);

    if (!response.ok) {
      throw new Error('Failed to list forms');
    }

    return response.json();
  }

  async deleteForm(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete form');
    }
  }

  // Export form as JSON (client-side only)
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

  // Import form from JSON file
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
}

export const formService = new FormService();

