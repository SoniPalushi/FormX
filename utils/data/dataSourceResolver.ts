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
 */
export function resolveDataSource({
  source,
  formData,
  component,
  getAllData,
  getData,
}: DataSourceResolverOptions): any {
  if (!source) {
    return null;
  }

  // If it's already an array or object, use it directly
  if (Array.isArray(source)) {
    return source;
  }

  if (typeof source === 'object' && source !== null) {
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

  // If it's a string (could be JSON or dataKey)
  if (typeof source === 'string') {
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
 */
export function resolveArrayDataSource(options: DataSourceResolverOptions): any[] {
  const resolved = resolveDataSource(options);
  
  if (Array.isArray(resolved)) {
    return resolved;
  }
  
  if (resolved === null || resolved === undefined) {
    return [];
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

