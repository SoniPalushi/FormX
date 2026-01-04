/**
 * Form Validation Utilities
 * Validates form data preservation during save/load cycles
 */

import type { ComponentDefinition } from '../stores/types';
import type { PersistedForm } from '../stores/types/formEngine';
import { FormConverter } from './formConversion';
import { exportAsPersistedForm, importFromPersistedForm } from './formExport';

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  componentCount: {
    original: number;
    afterConversion: number;
  };
}

/**
 * Deep comparison of two objects
 */
function deepEqual(obj1: any, obj2: any, path: string = ''): { equal: boolean; differences: string[] } {
  const differences: string[] = [];

  if (obj1 === obj2) {
    return { equal: true, differences };
  }

  if (obj1 == null || obj2 == null) {
    differences.push(`${path}: null/undefined mismatch (${obj1} vs ${obj2})`);
    return { equal: false, differences };
  }

  if (typeof obj1 !== typeof obj2) {
    differences.push(`${path}: type mismatch (${typeof obj1} vs ${typeof obj2})`);
    return { equal: false, differences };
  }

  if (typeof obj1 !== 'object') {
    if (obj1 !== obj2) {
      differences.push(`${path}: value mismatch (${obj1} vs ${obj2})`);
    }
    return { equal: differences.length === 0, differences };
  }

  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    differences.push(`${path}: array/object mismatch`);
    return { equal: false, differences };
  }

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) {
      differences.push(`${path}: array length mismatch (${obj1.length} vs ${obj2.length})`);
    }
    const maxLength = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < maxLength; i++) {
      const result = deepEqual(obj1[i], obj2[i], `${path}[${i}]`);
      differences.push(...result.differences);
    }
    return { equal: differences.length === 0, differences };
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  const allKeys = new Set([...keys1, ...keys2]);

  for (const key of allKeys) {
    if (!(key in obj1)) {
      differences.push(`${path}.${key}: missing in first object`);
      continue;
    }
    if (!(key in obj2)) {
      differences.push(`${path}.${key}: missing in second object`);
      continue;
    }
    const result = deepEqual(obj1[key], obj2[key], `${path}.${key}`);
    differences.push(...result.differences);
  }

  return { equal: differences.length === 0, differences };
}

/**
 * Count components recursively
 */
function countComponents(components: ComponentDefinition[]): number {
  let count = components.length;
  for (const component of components) {
    if (component.children && component.children.length > 0) {
      count += countComponents(component.children);
    }
  }
  return count;
}

/**
 * Validate round-trip conversion (ComponentDefinition → PersistedForm → ComponentDefinition)
 */
export function validateRoundTrip(components: ComponentDefinition[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Step 1: Convert to PersistedForm
    const persistedForm = exportAsPersistedForm(components, {
      version: '1',
      defaultLanguage: 'en-US',
    });

    // Step 2: Convert back to ComponentDefinition
    const restoredComponents = importFromPersistedForm(persistedForm);

    // Step 3: Validate component count
    const originalCount = countComponents(components);
    const restoredCount = countComponents(restoredComponents);

    if (originalCount !== restoredCount) {
      errors.push(
        `Component count mismatch: original has ${originalCount} components, restored has ${restoredCount}`
      );
    }

    // Step 4: Deep comparison (with tolerance for minor differences)
    const comparison = compareComponents(components, restoredComponents);
    errors.push(...comparison.errors);
    warnings.push(...comparison.warnings);

    return {
      success: errors.length === 0,
      errors,
      warnings,
      componentCount: {
        original: originalCount,
        afterConversion: restoredCount,
      },
    };
  } catch (error) {
    errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      errors,
      warnings,
      componentCount: {
        original: countComponents(components),
        afterConversion: 0,
      },
    };
  }
}

/**
 * Compare two component arrays with tolerance for expected differences
 */
function compareComponents(
  original: ComponentDefinition[],
  restored: ComponentDefinition[]
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (original.length !== restored.length) {
    errors.push(`Root component count mismatch: ${original.length} vs ${restored.length}`);
    return { errors, warnings };
  }

  for (let i = 0; i < original.length; i++) {
    const result = compareComponent(original[i], restored[i], `component[${i}]`);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return { errors, warnings };
}

/**
 * Compare two components
 */
function compareComponent(
  original: ComponentDefinition,
  restored: ComponentDefinition,
  path: string
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check ID
  if (original.id !== restored.id) {
    errors.push(`${path}.id: mismatch (${original.id} vs ${restored.id})`);
  }

  // Check type
  if (original.type !== restored.type) {
    errors.push(`${path}.type: mismatch (${original.type} vs ${restored.type})`);
  }

  // Check props (with tolerance for computed properties)
  const propsComparison = deepEqual(original.props, restored.props, `${path}.props`);
  for (const diff of propsComparison.differences) {
    // Some differences are expected (e.g., computed properties stored differently)
    if (diff.includes('fnSource') || diff.includes('computeType')) {
      warnings.push(`${diff} (computed property format difference is expected)`);
    } else {
      errors.push(diff);
    }
  }

  // Check children
  if (original.children && original.children.length > 0) {
    if (!restored.children || restored.children.length === 0) {
      errors.push(`${path}.children: missing in restored component`);
    } else if (original.children.length !== restored.children.length) {
      errors.push(
        `${path}.children: count mismatch (${original.children.length} vs ${restored.children.length})`
      );
    } else {
      for (let i = 0; i < original.children.length; i++) {
        const childResult = compareComponent(
          original.children[i],
          restored.children[i],
          `${path}.children[${i}]`
        );
        errors.push(...childResult.errors);
        warnings.push(...childResult.warnings);
      }
    }
  } else if (restored.children && restored.children.length > 0) {
    errors.push(`${path}.children: unexpected children in restored component`);
  }

  return { errors, warnings };
}

/**
 * Validate PersistedForm structure
 */
export function validatePersistedForm(persistedForm: PersistedForm): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!persistedForm.version) {
    errors.push('Missing version field');
  }

  if (!persistedForm.form) {
    errors.push('Missing form field');
  } else {
    if (!persistedForm.form.key) {
      errors.push('Missing form.key');
    }
    if (!persistedForm.form.type) {
      errors.push('Missing form.type');
    }
  }

  if (!persistedForm.defaultLanguage) {
    warnings.push('Missing defaultLanguage (will use en-US)');
  }

  if (!persistedForm.languages || persistedForm.languages.length === 0) {
    warnings.push('Missing languages array (will use default)');
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
    componentCount: {
      original: 0,
      afterConversion: persistedForm.form?.children?.length || 0,
    },
  };
}

/**
 * Quick validation check
 */
export function quickValidate(components: ComponentDefinition[]): boolean {
  if (!Array.isArray(components)) {
    return false;
  }

  for (const component of components) {
    if (!component.id || !component.type) {
      return false;
    }
    if (component.children && !Array.isArray(component.children)) {
      return false;
    }
  }

  return true;
}

