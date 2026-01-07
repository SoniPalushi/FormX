/**
 * Feature Classification System
 * 
 * This file defines which features/properties are available in Simple Mode vs Advanced Mode.
 * Designed to be extensible for future role-based access control.
 */

export type FeatureCategory = 'simple' | 'advanced';

export interface FeatureClassification {
  category: FeatureCategory;
  requiresRole?: string[]; // For future role-based access
}

/**
 * Validation Rules Classification
 */
export const VALIDATION_RULES_CLASSIFICATION: Record<string, FeatureClassification> = {
  // Simple Mode Rules
  required: { category: 'simple' },
  min: { category: 'simple' },
  max: { category: 'simple' },
  length: { category: 'simple' },
  email: { category: 'simple' },
  url: { category: 'simple' },
  integer: { category: 'simple' },
  
  // Advanced Mode Rules
  regex: { category: 'advanced' },
  uuid: { category: 'advanced' },
  ip: { category: 'advanced' },
  datetime: { category: 'advanced' },
  includes: { category: 'advanced' },
  startsWith: { category: 'advanced' },
  endsWith: { category: 'advanced' },
  lessThan: { category: 'advanced' },
  moreThan: { category: 'advanced' },
  multipleOf: { category: 'advanced' },
};

/**
 * Event Handler Actions Classification
 */
export const EVENT_ACTIONS_CLASSIFICATION: Record<string, FeatureClassification> = {
  // Simple Mode Actions
  validate: { category: 'simple' },
  clear: { category: 'simple' },
  reset: { category: 'simple' },
  log: { category: 'simple' },
  addRow: { category: 'simple' },
  removeRow: { category: 'simple' },
  openModal: { category: 'simple' },
  closeModal: { category: 'simple' },
  
  // Advanced Mode Actions
  custom: { category: 'advanced' },
};

/**
 * Data Source Types Classification
 */
export const DATA_SOURCE_TYPES_CLASSIFICATION: Record<string, FeatureClassification> = {
  // Simple Mode Types
  static: { category: 'simple' },
  dataKey: { category: 'simple' },
  
  // Advanced Mode Types
  function: { category: 'advanced' },
  computed: { category: 'advanced' },
};

/**
 * Conditional Rendering Modes Classification
 */
export const CONDITIONAL_RENDERING_MODES_CLASSIFICATION: Record<string, FeatureClassification> = {
  // Simple Mode
  always: { category: 'simple' },
  
  // Advanced Mode
  expression: { category: 'advanced' },
  function: { category: 'advanced' },
};

/**
 * Component Properties Classification
 */
export const COMPONENT_PROPERTIES_CLASSIFICATION: Record<string, FeatureClassification> = {
  // Simple Mode Properties (most common properties)
  label: { category: 'simple' },
  placeholder: { category: 'simple' },
  defaultValue: { category: 'simple' },
  value: { category: 'simple' },
  required: { category: 'simple' },
  disabled: { category: 'simple' },
  size: { category: 'simple' },
  variant: { category: 'simple' },
  color: { category: 'simple' },
  fullWidth: { category: 'simple' },
  margin: { category: 'simple' },
  padding: { category: 'simple' },
  width: { category: 'simple' },
  height: { category: 'simple' },
  helpText: { category: 'simple' },
  errorMessage: { category: 'simple' },
  maxLength: { category: 'simple' },
  rows: { category: 'simple' },
  multiline: { category: 'simple' },
  options: { category: 'simple' },
  checked: { category: 'simple' },
  multiple: { category: 'simple' },
  type: { category: 'simple' },
  href: { category: 'simple' },
  src: { category: 'simple' },
  alt: { category: 'simple' },
  text: { category: 'simple' },
  id: { category: 'simple' },
  name: { category: 'simple' },
  classes: { category: 'simple' },
  className: { category: 'simple' },
  dataKey: { category: 'simple' },
  
  // Advanced Mode Properties
  pattern: { category: 'advanced' }, // RegEx pattern
  css: { category: 'advanced' }, // Responsive CSS
  style: { category: 'advanced' }, // Responsive inline styles
  wrapperCss: { category: 'advanced' },
  wrapperStyle: { category: 'advanced' },
  renderWhen: { category: 'advanced' }, // Conditional rendering
  events: { category: 'advanced' }, // Event handlers
  optionsSource: { category: 'advanced' }, // When using function/computed
  dataSource: { category: 'advanced' }, // When using function/computed
  htmlAttributes: { category: 'advanced' },
  tooltip: { category: 'advanced' },
  modal: { category: 'advanced' },
};

/**
 * Sections Classification
 */
export const SECTIONS_CLASSIFICATION: Record<string, FeatureClassification> = {
  // Simple Mode Sections
  commonProperties: { category: 'simple' },
  validation: { category: 'simple' }, // Basic validation only
  eventHandlers: { category: 'simple' }, // Common actions only
  
  // Advanced Mode Sections
  conditionalRendering: { category: 'advanced' },
  responsiveStyles: { category: 'advanced' },
  advancedValidation: { category: 'advanced' },
  customFunctions: { category: 'advanced' },
};

/**
 * Helper function to check if a feature is available in current mode
 */
export function isFeatureAvailable(
  featureKey: string,
  classification: Record<string, FeatureClassification>,
  advancedMode: boolean,
  userRoles?: string[]
): boolean {
  const feature = classification[featureKey];
  if (!feature) {
    // If not classified, default to advanced (safer)
    return advancedMode;
  }
  
  // Check role-based access (for future)
  if (feature.requiresRole && userRoles) {
    const hasRequiredRole = feature.requiresRole.some(role => userRoles.includes(role));
    if (!hasRequiredRole) {
      return false;
    }
  }
  
  // Check mode-based access
  if (feature.category === 'simple') {
    return true; // Always available
  }
  
  if (feature.category === 'advanced') {
    return advancedMode;
  }
  
  return false;
}

/**
 * Get all available features for a classification based on mode
 */
export function getAvailableFeatures(
  classification: Record<string, FeatureClassification>,
  advancedMode: boolean,
  userRoles?: string[]
): string[] {
  return Object.keys(classification).filter(key =>
    isFeatureAvailable(key, classification, advancedMode, userRoles)
  );
}

