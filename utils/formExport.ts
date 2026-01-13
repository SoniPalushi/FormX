/**
 * Form Export Utilities
 * 
 * This module provides utilities for exporting form structures
 * in a format that can be used in other systems.
 * Supports both legacy ComponentDefinition format and new PersistedForm format.
 */

import type { ComponentDefinition } from '../stores/types';
import type { PersistedForm } from '../stores/types/formEngine';
import { FormConverter } from './formConversion';

/**
 * Form Structure Format
 * 
 * The form is stored as a tree structure where each component is a node:
 * 
 * {
 *   id: string;                    // Unique identifier
 *   type: ComponentType;            // Component type (e.g., 'TextInput', 'Container')
 *   props: Record<string, any>;    // Component properties (label, value, classes, etc.)
 *   children?: ComponentDefinition[]; // Nested components (for containers)
 *   parentId?: string;              // Optional reference to parent (for easier traversal)
 * }
 */

export interface FormExport {
  version: string;
  metadata: {
    formName: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    author?: string;
  };
  structure: ComponentDefinition[];
}

/**
 * Clean component for export (remove builder-specific props, unwrap dependencies, fix template format)
 */
function cleanComponentForExport(component: ComponentDefinition): ComponentDefinition {
  const cleaned: ComponentDefinition = {
    id: component.id,
    guid: component.guid,
    name: component.name,
    type: component.type,
    props: {},
    children: component.children ? component.children.map(cleanComponentForExport) : undefined,
  };

  // Clean props - remove wrapper objects and builder-specific props
  for (const [key, value] of Object.entries(component.props || {})) {
    // Skip builder-specific properties
    if (key === 'isCmp' || key === 'isWa' || key === 'isNotWa' || key === 'data-triggers') {
      continue;
    }

    // Unwrap ComponentProperty format { value: ... } to direct value
    if (value && typeof value === 'object' && !Array.isArray(value) && 'value' in value && Object.keys(value).length === 1) {
      cleaned.props[key] = (value as any).value;
    } else {
      cleaned.props[key] = value;
    }
  }

  // Clean dependencies - unwrap if wrapped and fix template format
  if (cleaned.props.dependencies) {
    let deps = cleaned.props.dependencies;
    
    // Check if dependencies are wrapped in { value: ... }
    if (deps && typeof deps === 'object' && 'value' in deps && Object.keys(deps).length === 1) {
      deps = deps.value;
      cleaned.props.dependencies = deps;
    }
    
    // Fix template format - ensure curly braces for template strings
    if (deps && typeof deps === 'object') {
      const fixTemplate = (prop: any) => {
        if (prop && typeof prop === 'object' && prop.type === 'template' && prop.template) {
          // If template doesn't have curly braces, add them
          if (!prop.template.includes('{')) {
            prop.template = prop.template.replace(/data\.(\w+)/g, '{data.$1}');
          }
        }
      };
      
      fixTemplate(deps.label);
      fixTemplate(deps.placeholder);
      fixTemplate(deps.value);
      fixTemplate(deps.options);
    }
  }

  return cleaned;
}

/**
 * Export form structure as JSON (Standard React Form Builder format)
 * This format uses direct prop values, proper IDs, and standard component types
 */
export function exportFormStructure(
  components: ComponentDefinition[],
  metadata: {
    formName: string;
    description?: string;
    author?: string;
  }
): FormExport {
  const cleanedComponents = components.map(cleanComponentForExport);
  
  return {
    version: '1.0.0',
    metadata: {
      ...metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    structure: cleanedComponents,
  };
}

/**
 * Export form structure as flat JSON (simplified format)
 * Useful for systems that don't need nested structures
 */
export function exportFormFlat(components: ComponentDefinition[]): any[] {
  const flatten = (comps: ComponentDefinition[]): any[] => {
    const result: any[] = [];
    
    comps.forEach((comp) => {
      result.push({
        id: comp.id,
        type: comp.type,
        props: comp.props,
        parentId: comp.parentId,
      });
      
      if (comp.children && comp.children.length > 0) {
        result.push(...flatten(comp.children));
      }
    });
    
    return result;
  };
  
  return flatten(components);
}

/**
 * Export form structure as HTML form schema
 * Useful for generating HTML forms or form validation schemas
 */
export function exportFormSchema(components: ComponentDefinition[]): any {
  const buildSchema = (comps: ComponentDefinition[]): any => {
    const fields: any[] = [];
    
    comps.forEach((comp) => {
      const field: any = {
        id: comp.id,
        type: comp.type,
        label: comp.props?.label || comp.props?.text || '',
        required: comp.props?.required || false,
        placeholder: comp.props?.placeholder || '',
        value: comp.props?.value || '',
      };
      
      // Add type-specific properties
      if (comp.type === 'Select' || comp.type === 'DropDown' || comp.type === 'RadioGroup') {
        field.options = comp.props?.options || [];
      }
      
      if (comp.type === 'TextArea') {
        field.rows = comp.props?.rows || 4;
      }
      
      if (comp.type === 'DateTime' || comp.type === 'DateTimeCb') {
        field.dateType = comp.props?.type || 'datetime-local';
      }
      
      // Handle nested components (containers)
      if (comp.children && comp.children.length > 0) {
        field.children = buildSchema(comp.children);
      }
      
      fields.push(field);
    });
    
    return fields;
  };
  
  return {
    fields: buildSchema(components),
  };
}

/**
 * Export form structure as JSON Schema
 * Useful for form validation in other systems
 */
export function exportFormJSONSchema(components: ComponentDefinition[]): any {
  const buildJSONSchema = (comps: ComponentDefinition[]): any => {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    
    comps.forEach((comp) => {
      if (comp.type === 'Container' || comp.type === 'Form' || comp.type === 'Header' || comp.type === 'Footer') {
        // Skip container types in JSON schema
        return;
      }
      
      const propName = comp.props?.name || comp.id;
      let schema: any = {
        type: getJSONSchemaType(comp.type),
      };
      
      if (comp.props?.label) {
        schema.title = comp.props.label;
      }
      
      if (comp.props?.required) {
        required.push(propName);
      }
      
      if (comp.type === 'Select' || comp.type === 'DropDown' || comp.type === 'RadioGroup') {
        schema.enum = comp.props?.options?.map((opt: any) => 
          typeof opt === 'string' ? opt : opt.value
        ) || [];
      }
      
      if (comp.type === 'TextArea') {
        schema.maxLength = comp.props?.maxLength;
        schema.minLength = comp.props?.minLength;
      }
      
      if (comp.type === 'TextInput' || comp.type === 'Amount') {
        schema.pattern = comp.props?.pattern;
        schema.min = comp.props?.min;
        schema.max = comp.props?.max;
      }
      
      properties[propName] = schema;
    });
    
    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  };
  
  return buildJSONSchema(components);
}

function getJSONSchemaType(componentType: string): string {
  const typeMap: Record<string, string> = {
    TextInput: 'string',
    TextArea: 'string',
    Select: 'string',
    DropDown: 'string',
    RadioGroup: 'string',
    CheckBox: 'boolean',
    CheckBoxGroup: 'array',
    Toggle: 'boolean',
    DateTime: 'string',
    DateTimeCb: 'string',
    Amount: 'number',
    Upload: 'string',
    MultiUpload: 'array',
  };
  
  return typeMap[componentType] || 'string';
}

/**
 * Clean form structure (remove builder-specific properties)
 * Useful when exporting for production use
 */
export function cleanFormStructure(components: ComponentDefinition[]): ComponentDefinition[] {
  const clean = (comps: ComponentDefinition[]): ComponentDefinition[] => {
    return comps.map((comp) => {
      const cleaned: ComponentDefinition = {
        id: comp.id,
        type: comp.type,
        props: { ...comp.props },
      };
      
      // Remove builder-specific properties
      delete (cleaned.props as any).isCmp;
      delete (cleaned.props as any).isWa;
      delete (cleaned.props as any).isNotWa;
      delete (cleaned.props as any).guid;
      delete (cleaned.props as any)['data-triggers'];
      
      // Clean classes (remove builder classes)
      if (cleaned.props.classes && Array.isArray(cleaned.props.classes)) {
        cleaned.props.classes = cleaned.props.classes.filter(
          (cls: string) => 
            !cls.includes('selected-component') && 
            !cls.includes('default-component') &&
            !cls.includes('active-container')
        );
      }
      
      // Recursively clean children
      if (comp.children && comp.children.length > 0) {
        cleaned.children = clean(comp.children);
      }
      
      return cleaned;
    });
  };
  
  return clean(components);
}

/**
 * Download form structure as JSON file
 */
export function downloadFormJSON(
  components: ComponentDefinition[],
  filename: string = 'form-structure.json',
  metadata?: { formName: string; description?: string; author?: string }
): void {
  const exportData = metadata
    ? exportFormStructure(components, metadata)
    : { structure: cleanFormStructure(components) };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Unwrap component props from ComponentProperty format
 */
function unwrapComponentProps(component: any): ComponentDefinition {
  const unwrapped: ComponentDefinition = {
    id: component.id || component.key,
    guid: component.guid,
    name: component.name,
    type: component.type,
    props: {},
    children: component.children ? component.children.map(unwrapComponentProps) : undefined,
  };

  // Unwrap props from { value: ... } format
  for (const [key, value] of Object.entries(component.props || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value) && 'value' in value && Object.keys(value).length === 1) {
      unwrapped.props[key] = (value as any).value;
    } else {
      unwrapped.props[key] = value;
    }
  }

  // Unwrap dependencies if wrapped
  if (unwrapped.props.dependencies) {
    const deps = unwrapped.props.dependencies;
    if (deps && typeof deps === 'object' && 'value' in deps && Object.keys(deps).length === 1) {
      unwrapped.props.dependencies = deps.value;
    }
  }

  return unwrapped;
}

/**
 * Read form from JSON file with automatic migration and format detection
 */
export function readFormFromFile(file: File): Promise<ComponentDefinition[]> {
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        // Import migration utilities
        const { migrateForm } = await import('./formMigration');
        
        // Attempt migration if needed
        const migrationResult = migrateForm(json);
        
        if (!migrationResult.success) {
          console.warn('Migration warnings:', migrationResult.warnings);
          if (migrationResult.errors.length > 0) {
            throw new Error(`Migration failed: ${migrationResult.errors.join(', ')}`);
          }
        }
        
        const dataToImport = migrationResult.data;
        
        // Check if it's a Standard React Form Builder format (form.form.children)
        if (dataToImport.form && dataToImport.form.children && Array.isArray(dataToImport.form.children)) {
          const components = dataToImport.form.children.map(unwrapComponentProps);
          resolve(components);
        }
        // Check if it's a PersistedForm format (with ComponentProperty wrapping)
        else if (dataToImport.form && dataToImport.version) {
          const components = importFromPersistedForm(dataToImport as PersistedForm);
          resolve(components);
        } 
        // Check if it's a FormExport format
        else if (dataToImport.structure && Array.isArray(dataToImport.structure)) {
          const components = dataToImport.structure.map(unwrapComponentProps);
          resolve(components);
        }
        // Check if it's a direct array of components
        else if (Array.isArray(dataToImport) && dataToImport.every((c: any) => (c.id || c.key) && c.type)) {
          const components = dataToImport.map(unwrapComponentProps);
          resolve(components);
        }
        else {
          throw new Error('Invalid form data structure');
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
        reject(new Error('Failed to read or parse file: ' + (error instanceof Error ? error.message : 'Unknown error')));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Import form from JSON string with automatic migration and format detection
 */
export async function importFormFromJSON(jsonString: string): Promise<ComponentDefinition[]> {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Import migration utilities
    const { migrateForm } = await import('./formMigration');
    
    // Attempt migration if needed
    const migrationResult = migrateForm(parsed);
    
    if (!migrationResult.success && migrationResult.errors.length > 0) {
      throw new Error(`Migration failed: ${migrationResult.errors.join(', ')}`);
    }
    
    const dataToImport = migrationResult.data;
    
    // Check if it's a Standard React Form Builder format (form.form.children)
    if (dataToImport.form && dataToImport.form.children && Array.isArray(dataToImport.form.children)) {
      return dataToImport.form.children.map(unwrapComponentProps);
    }
    // Check if it's a PersistedForm format (with ComponentProperty wrapping)
    if (dataToImport.form && dataToImport.version) {
      return importFromPersistedForm(dataToImport as PersistedForm);
    }
    // Check if it's a FormExport format
    else if (dataToImport.structure && Array.isArray(dataToImport.structure)) {
      return dataToImport.structure.map(unwrapComponentProps);
    }
    // Check if it's a direct array of components
    else if (Array.isArray(dataToImport) && dataToImport.every((c: any) => (c.id || c.key) && c.type)) {
      return dataToImport.map(unwrapComponentProps);
    }
    
    throw new Error('Invalid form data structure');
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error('Invalid JSON format: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Export form as Standard React Form Builder format
 * Uses direct prop values, proper IDs (id/guid/name), and standard component types
 */
export function exportAsStandardFormat(
  components: ComponentDefinition[],
  options: {
    version?: string;
    metadata?: {
      formName?: string;
      description?: string;
      author?: string;
      formVersion?: string;
    };
    defaultLanguage?: string;
    languages?: Array<{ code: string; name: string }>;
  } = {}
): any {
  const cleanedComponents = components.map(cleanComponentForExport);
  
  // Create form root
  const formRoot: ComponentDefinition = {
    id: 'root',
    guid: crypto.randomUUID(),
    name: options.metadata?.formName || 'form',
    type: 'Form',
    props: {},
    children: cleanedComponents,
  };

  const now = new Date().toISOString();

  return {
    version: options.version || '1',
    metadata: {
      formName: options.metadata?.formName || 'Untitled Form',
      description: options.metadata?.description,
      author: options.metadata?.author,
      formVersion: options.metadata?.formVersion || '1.0',
      createdAt: now,
      updatedAt: now,
    },
    form: formRoot,
    defaultLanguage: options.defaultLanguage || 'al',
    languages: options.languages || [
      { code: 'al', name: 'Albanian' },
      { code: 'en-US', name: 'English (US)' },
    ],
    localization: {},
  };
}

/**
 * Export form as PersistedForm format (FormEngine compatible)
 * This is the legacy format with wrapped props and Mui prefixes
 */
export function exportAsPersistedForm(
  components: ComponentDefinition[],
  options: {
    version?: string; // Schema version
    id?: string; // Form ID
    metadata?: {
      formName?: string;
      description?: string;
      author?: string;
      formVersion?: string; // Form revision version
      tags?: string[];
      category?: string;
    };
    defaultLanguage?: string;
    languages?: Array<{ code: string; name: string }>;
    formValidator?: string;
    actions?: Record<string, any>;
  } = {}
): PersistedForm {
  return FormConverter.toPersistedForm(components, options);
}

/**
 * Import form from PersistedForm format
 */
export function importFromPersistedForm(persistedForm: PersistedForm): ComponentDefinition[] {
  return FormConverter.fromPersistedForm(persistedForm);
}

/**
 * Download form as PersistedForm JSON
 */
export function downloadPersistedForm(
  components: ComponentDefinition[],
  filename: string = 'form-persisted.json',
  options: {
    version?: string;
    id?: string;
    metadata?: {
      formName?: string;
      description?: string;
      author?: string;
      formVersion?: string;
      tags?: string[];
      category?: string;
    };
    defaultLanguage?: string;
    languages?: Array<{ code: string; name: string }>;
    formValidator?: string;
    actions?: Record<string, any>;
  } = {}
): void {
  const persistedForm = exportAsPersistedForm(components, options);
  const dataStr = JSON.stringify(persistedForm, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
