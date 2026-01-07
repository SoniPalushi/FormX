/**
 * Data Source Resolver
 * Resolves data from various sources: static array, function, computed property, or dataKey
 */

import { ComputedPropertyEvaluator } from '../properties/computedProperties';
import type { ComponentDefinition } from '../../stores/types';

export interface DataSourceResolverOptions {
  source: any; // Can be array, function, computed property object, string (dataKey or JSON), or null
  formData: Record<string, any>;
  component: ComponentDefinition;
  getAllData: () => Record<string, any>;
  getData: (key: string) => any;
}

/**
 * Resolve data from various source types
 * Supports:
 * 1. Static array - direct array
 * 2. Computed property - object with computeType
 * 3. Function - function that receives (formData, component)
 * 4. DataKey - string that references form data store
 * 5. JSON string - stringified JSON array/object
 * 6. RemoteArray - RemoteArray instance
 * 7. Dataview reference - object with dataview_id or string starting with "dataview:"
 */
export async function resolveDataSource({
  source,
  formData,
  component,
  getAllData,
  getData,
}: DataSourceResolverOptions): Promise<any> {
  if (!source) {
    return null;
  }

  // If it's a RemoteArray instance
  if (source instanceof RemoteArray) {
    return source.currentPage;
  }

  // If it's already an array or object, use it directly
  if (Array.isArray(source)) {
    return source;
  }

  if (typeof source === 'object' && source !== null) {
    // Check if it's a dataview reference
    if ('dataview_id' in source && source.type === 'dataview') {
      try {
        const dataviewManager = getDataviewManager();
        const data = await dataviewManager.loadDataview(source.dataview_id);
        return data;
      } catch (error) {
        console.error('Error loading dataview:', error);
        return null;
      }
    }

    // Check if it's a computed property (object with computeType)
    if ('computeType' in source) {
      try {
        const evaluated = ComputedPropertyEvaluator.evaluate(
          source as any,
          formData || getAllData()
        );
        return evaluated;
      } catch (error) {
        console.error('Error evaluating computed data source:', error);
        return null;
      }
    }

    // If it's a plain object, return it
    return source;
  }

  // If it's a function (data provider)
  if (typeof source === 'function') {
    try {
      const result = source(formData || getAllData(), component);
      return result;
    } catch (error) {
      console.error('Error executing data source function:', error);
      return null;
    }
  }

  // If it's a string (could be JSON, dataKey, or dataview reference)
  if (typeof source === 'string') {
    // Check if it's a dataview reference
    if (source.startsWith('dataview:')) {
      try {
        const dataviewId = source.replace('dataview:', '');
        const dataviewManager = getDataviewManager();
        const data = await dataviewManager.loadDataview(dataviewId);
        return data;
      } catch (error) {
        console.error('Error loading dataview:', error);
        return null;
      }
    }

    // Check if it's a RemoteArray reference
    if (source.startsWith('remote:')) {
      // RemoteArray references would need a cache/registry
      // For now, return null - this can be extended
      console.warn('RemoteArray reference not yet supported:', source);
      return null;
    }

    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(source);
      return parsed;
    } catch {
      // If not JSON, try as dataKey
      const data = getData(source);
      return data !== undefined ? data : null;
    }
  }

  return null;
}

/**
 * Resolve array data source (ensures result is an array)
 * Async version that supports RemoteArray and dataview references
 */
export async function resolveArrayDataSource(options: DataSourceResolverOptions): Promise<any[]> {
  const resolved = await resolveDataSource(options);
  
  if (Array.isArray(resolved)) {
    return resolved;
  }
  
  if (resolved === null || resolved === undefined) {
    return [];
  }
  
  // If it's a RemoteArray instance
  if (resolved instanceof RemoteArray) {
    return resolved.currentPage;
  }
  
  // If it's an object, try to convert to array
  if (typeof resolved === 'object') {
    // If it has common array-like properties, try to extract array
    if ('items' in resolved && Array.isArray(resolved.items)) {
      return resolved.items;
    }
    if ('data' in resolved && Array.isArray(resolved.data)) {
      return resolved.data;
    }
    if ('results' in resolved && Array.isArray(resolved.results)) {
      return resolved.results;
    }
    // If it's an object with numeric keys, convert to array
    const keys = Object.keys(resolved);
    if (keys.length > 0 && keys.every(k => !isNaN(Number(k)))) {
      return keys.map(k => resolved[k]);
    }
  }
  
  return [];
}

/**
 * Synchronous version (for backward compatibility)
 * Note: This won't work with RemoteArray or dataview references
 */
export function resolveArrayDataSourceSync(options: DataSourceResolverOptions): any[] {
  const source = options.source;
  
  if (!source) {
    return [];
  }

  // If it's already an array
  if (Array.isArray(source)) {
    return source;
  }

  // For async sources, return empty array (caller should use async version)
  if (source instanceof RemoteArray) {
    return source.currentPage;
  }

  if (typeof source === 'object' && source !== null) {
    // Check if it's a dataview reference (can't load synchronously)
    if ('dataview_id' in source) {
      return [];
    }

    // Check if it's a computed property
    if ('computeType' in source) {
      try {
        const evaluated = ComputedPropertyEvaluator.evaluate(
          source as any,
          options.formData || options.getAllData()
        );
        return Array.isArray(evaluated) ? evaluated : [];
      } catch (error) {
        console.error('Error evaluating computed data source:', error);
        return [];
      }
    }
  }

  if (typeof source === 'function') {
    try {
      const result = source(options.formData || options.getAllData(), options.component);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error executing data source function:', error);
      return [];
    }
  }

  if (typeof source === 'string') {
    // Check for dataview reference (can't load synchronously)
    if (source.startsWith('dataview:')) {
      return [];
    }

    try {
      const parsed = JSON.parse(source);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      const data = options.getData(source);
      return Array.isArray(data) ? data : [];
    }
  }

  return [];
}

