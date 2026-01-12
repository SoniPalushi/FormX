/**
 * Dependency Evaluator
 * Evaluates component dependencies based on form data
 * 
 * Supports:
 * - Conditional disabled/enabled states
 * - Conditional visibility
 * - Data filtering (cascading dropdowns)
 * - Field reset on dependency change
 * - Dynamic labels, placeholders, values
 * - Conditional required state
 * - Dynamic options
 */

import type {
  DependencyCondition,
  FilterDependency,
  ComputedProperty,
  ComponentDependencies,
} from '../../stores/types';

export interface DependencyContext {
  // Current form data (all fields)
  data: Record<string, any>;
  
  // Parent data (for repeater items)
  parentData?: Record<string, any>;
  
  // Root form data
  rootData?: Record<string, any>;
  
  // Current component's dataKey
  currentDataKey?: string;
}

export class DependencyEvaluator {
  /**
   * Evaluate a dependency condition
   * Returns the result of the condition (typically boolean)
   */
  static evaluateCondition(
    condition: DependencyCondition | undefined,
    context: DependencyContext
  ): any {
    if (!condition) return undefined;

    const { data, parentData, rootData } = context;

    try {
      switch (condition.type) {
        case 'expression':
          return this.evaluateExpression(condition.expression || '', context);

        case 'fieldValue':
          return this.evaluateFieldValue(condition, data);

        case 'function':
          return this.evaluateFunction(condition.fnSource || '', context);

        default:
          return condition.default;
      }
    } catch (error) {
      console.error('Error evaluating dependency condition:', error);
      return condition.default;
    }
  }

  /**
   * Evaluate a JavaScript expression
   */
  private static evaluateExpression(
    expression: string,
    context: DependencyContext
  ): any {
    if (!expression) return undefined;

    try {
      const { data, parentData, rootData } = context;
      
      // Create a safe execution context
      const fn = new Function(
        'data',
        'parentData',
        'rootData',
        `try { return ${expression}; } catch(e) { return undefined; }`
      );

      return fn(data, parentData || {}, rootData || data);
    } catch (error) {
      console.error('Error evaluating expression:', expression, error);
      return undefined;
    }
  }

  /**
   * Evaluate a field value condition
   */
  private static evaluateFieldValue(
    condition: DependencyCondition,
    data: Record<string, any>
  ): boolean {
    const fieldValue = this.getNestedValue(data, condition.field || '');
    const compareValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === compareValue;

      case 'notEquals':
        return fieldValue !== compareValue;

      case 'contains':
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(compareValue);
        }
        if (typeof fieldValue === 'string') {
          return fieldValue.includes(String(compareValue));
        }
        return false;

      case 'notContains':
        if (Array.isArray(fieldValue)) {
          return !fieldValue.includes(compareValue);
        }
        if (typeof fieldValue === 'string') {
          return !fieldValue.includes(String(compareValue));
        }
        return true;

      case 'gt':
        return Number(fieldValue) > Number(compareValue);

      case 'gte':
        return Number(fieldValue) >= Number(compareValue);

      case 'lt':
        return Number(fieldValue) < Number(compareValue);

      case 'lte':
        return Number(fieldValue) <= Number(compareValue);

      case 'empty':
        return this.isEmpty(fieldValue);

      case 'notEmpty':
        return !this.isEmpty(fieldValue);

      case 'in':
        if (Array.isArray(compareValue)) {
          return compareValue.includes(fieldValue);
        }
        return false;

      case 'notIn':
        if (Array.isArray(compareValue)) {
          return !compareValue.includes(fieldValue);
        }
        return true;

      default:
        // Default: check if field has a truthy value
        return !this.isEmpty(fieldValue);
    }
  }

  /**
   * Evaluate a function source
   */
  private static evaluateFunction(
    fnSource: string,
    context: DependencyContext
  ): any {
    if (!fnSource) return undefined;

    try {
      const { data, parentData, rootData } = context;
      
      const fn = new Function(
        'data',
        'parentData',
        'rootData',
        `try { ${fnSource} } catch(e) { return undefined; }`
      );

      return fn(data, parentData || {}, rootData || data);
    } catch (error) {
      console.error('Error evaluating function:', fnSource, error);
      return undefined;
    }
  }

  /**
   * Evaluate a computed property (label, placeholder, value, options)
   */
  static evaluateComputedProperty(
    property: ComputedProperty | undefined,
    context: DependencyContext
  ): any {
    if (!property) return undefined;

    try {
      switch (property.type) {
        case 'expression':
          return this.evaluateExpression(property.expression || '', context);

        case 'function':
          return this.evaluateFunction(property.fnSource || '', context);

        case 'template':
          return this.evaluateTemplate(property.template || '', context);

        default:
          return property.default;
      }
    } catch (error) {
      console.error('Error evaluating computed property:', error);
      return property.default;
    }
  }

  /**
   * Evaluate a template string with placeholders
   * Template format: "{data.fieldName}" or "{data.field.nestedField}"
   */
  private static evaluateTemplate(
    template: string,
    context: DependencyContext
  ): string {
    if (!template) return '';

    const { data, parentData, rootData } = context;

    return template.replace(/\{([^}]+)\}/g, (match, path) => {
      try {
        // Remove 'data.' prefix if present
        const cleanPath = path.replace(/^data\./, '');
        const value = this.getNestedValue(data, cleanPath);
        return value !== undefined ? String(value) : '';
      } catch {
        return '';
      }
    });
  }

  /**
   * Build filter parameters from dependencies
   * Returns object to pass as filter to dataview
   */
  static buildFilterParams(
    filterBy: FilterDependency | FilterDependency[] | undefined,
    data: Record<string, any>
  ): Record<string, any> {
    if (!filterBy) return {};

    const filters = Array.isArray(filterBy) ? filterBy : [filterBy];
    const result: Record<string, any> = {};

    for (const filter of filters) {
      const sourceValue = this.getNestedValue(data, filter.sourceField);
      
      if (sourceValue !== undefined && sourceValue !== null && sourceValue !== '') {
        // Apply transform if provided
        let finalValue = sourceValue;
        if (filter.transform) {
          try {
            const transformFn = new Function('value', 'data', filter.transform);
            finalValue = transformFn(sourceValue, data);
          } catch (error) {
            console.error('Error applying filter transform:', error);
          }
        }
        
        result[filter.targetParam] = finalValue;
      }
    }

    return result;
  }

  /**
   * Check if a field should be reset based on resetOn configuration
   */
  static shouldResetField(
    resetOn: string[] | undefined,
    changedFields: string[]
  ): boolean {
    if (!resetOn || resetOn.length === 0) return false;
    return resetOn.some((field) => changedFields.includes(field));
  }

  /**
   * Evaluate all dependencies for a component
   * Returns computed values for all dependency properties
   */
  static evaluateAllDependencies(
    dependencies: ComponentDependencies | undefined,
    context: DependencyContext
  ): {
    disabled?: boolean;
    enabled?: boolean;
    visible?: boolean;
    required?: boolean;
    label?: string;
    placeholder?: string;
    value?: any;
    options?: any[];
    filterParams?: Record<string, any>;
  } {
    if (!dependencies) return {};

    const result: Record<string, any> = {};

    // Evaluate disabled/enabled
    if (dependencies.disabled) {
      result.disabled = Boolean(this.evaluateCondition(dependencies.disabled, context));
    }
    if (dependencies.enabled) {
      result.enabled = Boolean(this.evaluateCondition(dependencies.enabled, context));
      // If enabled is false, set disabled to true
      if (result.enabled === false) {
        result.disabled = true;
      }
    }

    // Evaluate visibility
    if (dependencies.visible) {
      result.visible = Boolean(this.evaluateCondition(dependencies.visible, context));
    }

    // Evaluate required
    if (dependencies.required) {
      result.required = Boolean(this.evaluateCondition(dependencies.required, context));
    }

    // Evaluate computed properties
    if (dependencies.label) {
      result.label = this.evaluateComputedProperty(dependencies.label, context);
    }
    if (dependencies.placeholder) {
      result.placeholder = this.evaluateComputedProperty(dependencies.placeholder, context);
    }
    if (dependencies.value) {
      result.value = this.evaluateComputedProperty(dependencies.value, context);
    }
    if (dependencies.options) {
      result.options = this.evaluateComputedProperty(dependencies.options, context);
    }

    // Build filter params
    if (dependencies.filterBy) {
      result.filterParams = this.buildFilterParams(dependencies.filterBy, context.data);
    }

    return result;
  }

  /**
   * Get nested value from object using dot notation
   * e.g., getNestedValue(data, "address.city") returns data.address.city
   */
  private static getNestedValue(obj: Record<string, any>, path: string): any {
    if (!path) return undefined;
    
    const keys = path.split('.');
    let value: any = obj;

    for (const key of keys) {
      if (value === null || value === undefined) return undefined;
      value = value[key];
    }

    return value;
  }

  /**
   * Check if a value is empty (null, undefined, empty string, empty array)
   */
  private static isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  }

  /**
   * Extract all field dependencies from a component's dependencies config
   * Returns list of dataKeys that this component depends on
   */
  static extractDependentFields(dependencies: ComponentDependencies | undefined): string[] {
    if (!dependencies) return [];

    const fields = new Set<string>();

    // Helper to extract fields from condition
    const extractFromCondition = (condition?: DependencyCondition) => {
      if (!condition) return;
      if (condition.field) fields.add(condition.field);
      if (condition.expression) {
        // Extract data.fieldName patterns from expression
        const matches = condition.expression.match(/data\.(\w+)/g) || [];
        matches.forEach((match) => {
          const field = match.replace('data.', '');
          fields.add(field);
        });
      }
    };

    // Helper to extract fields from computed property
    const extractFromComputed = (prop?: ComputedProperty) => {
      if (!prop) return;
      if (prop.expression) {
        const matches = prop.expression.match(/data\.(\w+)/g) || [];
        matches.forEach((match) => {
          const field = match.replace('data.', '');
          fields.add(field);
        });
      }
      if (prop.template) {
        const matches = prop.template.match(/\{data\.(\w+)\}/g) || [];
        matches.forEach((match) => {
          const field = match.replace('{data.', '').replace('}', '');
          fields.add(field);
        });
      }
    };

    // Extract from all dependency types
    extractFromCondition(dependencies.disabled);
    extractFromCondition(dependencies.enabled);
    extractFromCondition(dependencies.visible);
    extractFromCondition(dependencies.required);
    extractFromComputed(dependencies.label);
    extractFromComputed(dependencies.placeholder);
    extractFromComputed(dependencies.value);
    extractFromComputed(dependencies.options);

    // Add resetOn fields
    if (dependencies.resetOn) {
      dependencies.resetOn.forEach((field) => fields.add(field));
    }

    // Add filterBy source fields
    if (dependencies.filterBy) {
      const filters = Array.isArray(dependencies.filterBy)
        ? dependencies.filterBy
        : [dependencies.filterBy];
      filters.forEach((filter) => fields.add(filter.sourceField));
    }

    return Array.from(fields);
  }
}

