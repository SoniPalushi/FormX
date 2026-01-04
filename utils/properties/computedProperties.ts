/**
 * Computed/Dynamic Properties System
 * Handles property calculation based on form data
 */

import type { ComponentProperty } from '../../stores/types/formEngine';

export class ComputedPropertyEvaluator {
  /**
   * Evaluate a component property
   */
  static evaluate(
    property: ComponentProperty | undefined,
    formData: Record<string, any> = {},
    parentData?: Record<string, any>,
    rootData?: Record<string, any>
  ): any {
    if (!property) return undefined;

    // Static value
    if (property.value !== undefined && !property.computeType) {
      return property.value;
    }

    // Computed property
    if (property.computeType === 'function' && property.fnSource) {
      return this.evaluateFunction(property.fnSource, formData, parentData, rootData);
    }

    // Localized property
    if (property.computeType === 'localization') {
      return this.evaluateLocalization(property, formData);
    }

    return property.value;
  }

  /**
   * Evaluate a function-based computed property
   */
  private static evaluateFunction(
    fnSource: string,
    formData: Record<string, any>,
    parentData?: Record<string, any>,
    rootData?: Record<string, any>
  ): any {
    try {
      // Create a safe execution context
      const context = {
        formData,
        data: formData,
        parentData: parentData || {},
        rootData: rootData || formData,
      };

      // Execute the function
      const fn = new Function('formData', 'data', 'parentData', 'rootData', `
        try {
          ${fnSource}
        } catch (error) {
          console.error('Error in computed property:', error);
          return undefined;
        }
      `);

      return fn(context.formData, context.data, context.parentData, context.rootData);
    } catch (error) {
      console.error('Error evaluating computed property:', error);
      return undefined;
    }
  }

  /**
   * Evaluate a localized property
   */
  private static evaluateLocalization(
    property: ComponentProperty,
    formData: Record<string, any>
  ): string {
    // This would integrate with the localization system
    // For now, return the value if available
    const locale = formData._locale || 'en-US';
    const key = property.value as string;
    
    // Placeholder - would need access to localization store
    return key || '';
  }

  /**
   * Evaluate all properties of a component
   */
  static evaluateProps(
    props: Record<string, ComponentProperty>,
    formData: Record<string, any> = {},
    parentData?: Record<string, any>,
    rootData?: Record<string, any>
  ): Record<string, any> {
    const evaluated: Record<string, any> = {};
    
    for (const [key, property] of Object.entries(props)) {
      evaluated[key] = this.evaluate(property, formData, parentData, rootData);
    }
    
    return evaluated;
  }

  /**
   * Check if a property has dependencies that need to be tracked
   */
  static getDependencies(property: ComponentProperty): string[] {
    if (property.computeType === 'function' && property.fnSource) {
      // Simple regex to find formData.fieldName patterns
      const matches = property.fnSource.match(/formData\.(\w+)|data\.(\w+)/g) || [];
      return matches.map((match) => {
        const parts = match.split('.');
        return parts[parts.length - 1];
      });
    }
    return [];
  }
}

