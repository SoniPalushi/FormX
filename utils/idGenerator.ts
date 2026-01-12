/**
 * ID Generator Utilities
 * Generates unique IDs for forms, components, and GUIDs
 * 
 * ID Types:
 * - componentId: Internal unique ID for React keys and operations
 * - guid: Persistent UUID for backend tracking across saves/edits
 * - formId: Human-readable form identifier based on name
 * - name: Component reference name for dependencies (defaults to dataKey)
 */

/**
 * Generate a cryptographically secure UUID v4
 * Uses crypto.randomUUID() if available, otherwise fallback
 */
export function generateGuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a short unique ID for components
 * Format: comp-{type}-{shortId}
 * 
 * @param type - Component type (e.g., "Select", "TextInput")
 */
export function generateComponentId(type?: string): string {
  const shortId = generateShortId(8);
  const typePrefix = type ? type.toLowerCase().slice(0, 4) : 'comp';
  return `${typePrefix}-${shortId}`;
}

/**
 * Generate a short random string
 * Uses alphanumeric characters for readability
 */
export function generateShortId(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    // Fallback
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Generate a form ID from form name
 * Converts to lowercase, replaces spaces with underscores
 * 
 * @param formName - Human-readable form name
 * @param version - Optional version suffix (default: 'v1')
 */
export function generateFormId(formName: string, version: string = 'v1'): string {
  const sanitized = formName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_')         // Replace spaces with underscores
    .replace(/_+/g, '_')          // Remove consecutive underscores
    .slice(0, 50);                // Limit length
  
  return `${sanitized}_${version}`;
}

/**
 * Generate a component name from dataKey or type
 * Used as the reference name for dependencies
 * 
 * @param dataKey - Data binding key
 * @param type - Component type
 * @param existingNames - Set of existing names to avoid duplicates
 */
export function generateComponentName(
  dataKey?: string,
  type?: string,
  existingNames?: Set<string>
): string {
  let baseName = dataKey || type?.toLowerCase() || 'component';
  
  // Sanitize the name
  baseName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_');
  
  // If no existing names to check, return base name
  if (!existingNames || !existingNames.has(baseName)) {
    return baseName;
  }
  
  // Add suffix to make unique
  let counter = 1;
  let uniqueName = `${baseName}_${counter}`;
  while (existingNames.has(uniqueName)) {
    counter++;
    uniqueName = `${baseName}_${counter}`;
  }
  
  return uniqueName;
}

/**
 * Validate if a string is a valid UUID
 */
export function isValidGuid(guid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(guid);
}

/**
 * Validate if a string is a valid component ID
 */
export function isValidComponentId(id: string): boolean {
  // Match pattern: {prefix}-{alphanumeric}
  const idRegex = /^[a-z]+-[a-z0-9]+$/i;
  return idRegex.test(id);
}

/**
 * Extract component type from component ID
 */
export function getTypeFromComponentId(id: string): string | null {
  const match = id.match(/^([a-z]+)-/i);
  return match ? match[1] : null;
}

/**
 * Generate all IDs for a new component
 */
export function generateComponentIds(
  type: string,
  dataKey?: string,
  existingNames?: Set<string>
): {
  id: string;
  guid: string;
  name: string;
} {
  return {
    id: generateComponentId(type),
    guid: generateGuid(),
    name: generateComponentName(dataKey, type, existingNames),
  };
}

/**
 * Generate all IDs for a new form
 */
export function generateFormIds(formName: string): {
  formId: string;
  guid: string;
} {
  return {
    formId: generateFormId(formName),
    guid: generateGuid(),
  };
}

