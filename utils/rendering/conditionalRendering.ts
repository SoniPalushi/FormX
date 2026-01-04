/**
 * Conditional Rendering System
 * Handles renderWhen property evaluation
 */

import type { ComponentProperty } from '../../stores/types/formEngine';
import { ComputedPropertyEvaluator } from '../properties/computedProperties';

export class ConditionalRenderer {
  /**
   * Evaluate renderWhen condition
   */
  static shouldRender(
    renderWhen: ComponentProperty<boolean> | undefined,
    formData: Record<string, any> = {},
    parentData?: Record<string, any>,
    rootData?: Record<string, any>
  ): boolean {
    if (!renderWhen) return true;

    // Evaluate the property
    const result = ComputedPropertyEvaluator.evaluate(
      renderWhen,
      formData,
      parentData,
      rootData
    );

    // Handle boolean result
    if (typeof result === 'boolean') {
      return result;
    }

    // Handle truthy/falsy values
    return Boolean(result);
  }

  /**
   * Evaluate renderWhen from string expression
   */
  static evaluateExpression(
    expression: string,
    formData: Record<string, any> = {},
    parentData?: Record<string, any>,
    rootData?: Record<string, any>
  ): boolean {
    try {
      const context = {
        formData,
        data: formData,
        parentData: parentData || {},
        rootData: rootData || formData,
      };

      const fn = new Function('formData', 'data', 'parentData', 'rootData', `
        return ${expression};
      `);

      const result = fn(context.formData, context.data, context.parentData, context.rootData);
      return Boolean(result);
    } catch (error) {
      console.error('Error evaluating renderWhen expression:', error);
      return true; // Default to rendering if evaluation fails
    }
  }
}

