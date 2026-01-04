/**
 * Zod-Based Validation System
 * Implements validation rules matching FormEngine's validation system
 */

import { z } from 'zod';
import type { ValidationRule, ValidationSchema } from '../../stores/types/formEngine';

// Validation rule builders
export class ZodValidationBuilder {
  /**
   * Build a Zod schema from validation rules
   */
  static buildSchema(rules: ValidationRule[], dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' = 'string'): z.ZodTypeAny {
    let schema: z.ZodTypeAny;

    // Start with base type
    switch (dataType) {
      case 'string':
        schema = z.string();
        break;
      case 'number':
        schema = z.number();
        break;
      case 'boolean':
        schema = z.boolean();
        break;
      case 'date':
        schema = z.date();
        break;
      case 'array':
        schema = z.array(z.any());
        break;
      case 'object':
        schema = z.object({}).passthrough();
        break;
      default:
        schema = z.string();
    }

    // Apply validation rules
    for (const rule of rules) {
      schema = this.applyRule(schema, rule, dataType);
    }

    return schema;
  }

  /**
   * Apply a single validation rule to a schema
   */
  private static applyRule(
    schema: z.ZodTypeAny,
    rule: ValidationRule,
    dataType: string
  ): z.ZodTypeAny {
    const { key, args = {}, message } = rule;

    switch (key) {
      // String validations
      case 'required':
        if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
          return schema;
        }
        return schema.min(1, message || 'This field is required');
      
      case 'min':
        if (dataType === 'string') {
          return (schema as z.ZodString).min(args.limit || 0, message || `Minimum length is ${args.limit}`);
        } else if (dataType === 'number') {
          return (schema as z.ZodNumber).min(args.limit || 0, message || `Minimum value is ${args.limit}`);
        } else if (dataType === 'array') {
          return (schema as z.ZodArray<any>).min(args.limit || 0, message || `Minimum items is ${args.limit}`);
        }
        return schema;
      
      case 'max':
        if (dataType === 'string') {
          return (schema as z.ZodString).max(args.limit || Infinity, message || `Maximum length is ${args.limit}`);
        } else if (dataType === 'number') {
          return (schema as z.ZodNumber).max(args.limit || Infinity, message || `Maximum value is ${args.limit}`);
        } else if (dataType === 'array') {
          return (schema as z.ZodArray<any>).max(args.limit || Infinity, message || `Maximum items is ${args.limit}`);
        }
        return schema;
      
      case 'length':
        if (dataType === 'string') {
          return (schema as z.ZodString).length(args.limit || 0, message || `Length must be ${args.limit}`);
        } else if (dataType === 'array') {
          return (schema as z.ZodArray<any>).length(args.limit || 0, message || `Array length must be ${args.limit}`);
        }
        return schema;
      
      case 'regex':
        if (dataType === 'string') {
          try {
            const regex = new RegExp(args.pattern || '');
            return (schema as z.ZodString).regex(regex, message || 'Invalid format');
          } catch {
            return schema;
          }
        }
        return schema;
      
      case 'email':
        if (dataType === 'string') {
          return (schema as z.ZodString).email(message || 'Invalid email address');
        }
        return schema;
      
      case 'url':
        if (dataType === 'string') {
          return (schema as z.ZodString).url(message || 'Invalid URL');
        }
        return schema;
      
      case 'uuid':
        if (dataType === 'string') {
          return (schema as z.ZodString).uuid(message || 'Invalid UUID');
        }
        return schema;
      
      case 'ip':
        if (dataType === 'string') {
          // Zod doesn't have built-in IP validation, use regex
          const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          return (schema as z.ZodString).regex(ipRegex, message || 'Invalid IP address');
        }
        return schema;
      
      case 'datetime':
        if (dataType === 'string') {
          return (schema as z.ZodString).datetime(message || 'Invalid datetime');
        }
        return schema;
      
      case 'includes':
        if (dataType === 'string') {
          return (schema as z.ZodString).includes(args.value || '', message || `Must include "${args.value}"`);
        }
        return schema;
      
      case 'startsWith':
        if (dataType === 'string') {
          return (schema as z.ZodString).startsWith(args.value || '', message || `Must start with "${args.value}"`);
        }
        return schema;
      
      case 'endsWith':
        if (dataType === 'string') {
          return (schema as z.ZodString).endsWith(args.value || '', message || `Must end with "${args.value}"`);
        }
        return schema;
      
      // Number validations
      case 'lessThan':
        if (dataType === 'number') {
          return (schema as z.ZodNumber).lt(args.limit || 0, message || `Must be less than ${args.limit}`);
        }
        return schema;
      
      case 'moreThan':
        if (dataType === 'number') {
          return (schema as z.ZodNumber).gt(args.limit || 0, message || `Must be greater than ${args.limit}`);
        }
        return schema;
      
      case 'integer':
        if (dataType === 'number') {
          return (schema as z.ZodNumber).int(message || 'Must be an integer');
        }
        return schema;
      
      case 'multipleOf':
        if (dataType === 'number') {
          return (schema as z.ZodNumber).multipleOf(args.value || 1, message || `Must be a multiple of ${args.value}`);
        }
        return schema;
      
      // Date validations
      case 'min':
        if (dataType === 'date') {
          const minDate = args.limit ? new Date(args.limit) : new Date();
          return (schema as z.ZodDate).min(minDate, message || `Date must be after ${minDate.toISOString()}`);
        }
        return schema;
      
      case 'max':
        if (dataType === 'date') {
          const maxDate = args.limit ? new Date(args.limit) : new Date();
          return (schema as z.ZodDate).max(maxDate, message || `Date must be before ${maxDate.toISOString()}`);
        }
        return schema;
      
      default:
        return schema;
    }
  }

  /**
   * Validate a value against a validation schema
   */
  static async validate(
    value: any,
    schema: ValidationSchema,
    dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' = 'string',
    formData?: Record<string, any>
  ): Promise<{ success: boolean; errors: string[] }> {
    try {
      // Filter rules by validateWhen condition if present
      const applicableRules = schema.validations.filter((rule) => {
        if (!rule.validateWhen) return true;
        
        // Evaluate validateWhen expression
        try {
          // Simple expression evaluation (can be enhanced)
          const fn = new Function('data', `return ${rule.validateWhen}`);
          return fn(formData || {});
        } catch {
          return true; // Default to applying rule if evaluation fails
        }
      });

      const zodSchema = this.buildSchema(applicableRules, dataType);
      await zodSchema.parseAsync(value);
      
      return { success: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map((e) => e.message),
        };
      }
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
      };
    }
  }

  /**
   * Get validation error messages for a component
   */
  static getValidationErrors(
    value: any,
    schema: ValidationSchema | undefined,
    dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' = 'string',
    formData?: Record<string, any>
  ): Promise<string[]> {
    if (!schema) return Promise.resolve([]);
    
    return this.validate(value, schema, dataType, formData).then((result) => 
      result.success ? [] : result.errors
    );
  }
}

