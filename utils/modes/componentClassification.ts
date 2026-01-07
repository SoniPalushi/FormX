/**
 * Component Classification System
 * 
 * Defines which components are available in Simple Mode vs Advanced Mode.
 * Components not listed here are available in both modes.
 */

import type { ComponentType } from '../stores/types';

export type ComponentCategory = 'simple' | 'advanced';

export interface ComponentClassification {
  category: ComponentCategory;
  requiresRole?: string[]; // For future role-based access
}

/**
 * Components that are only available in Advanced Mode
 * All other components are available in Simple Mode
 */
export const ADVANCED_COMPONENTS: ComponentType[] = [
  // Advanced data components
  'DataGrid',
  'List',
  'Tree',
  'DataBrowse',
  'AutoBrowse',
  
  // Advanced calendar components
  'Calendar',
  'CalendarDay',
  'CalendarWeek',
  'CalendarMonth',
  
  // Advanced special components
  'Wizard',
  'CurrencyExRate',
  'MapLocationPicker',
  
  // Validators (advanced)
  'RequiredFieldValidator',
  'RangeValidator',
  'RegExValidator',
];

/**
 * Check if a component is available in current mode
 */
export function isComponentAvailable(
  componentType: ComponentType,
  advancedMode: boolean,
  userRoles?: string[]
): boolean {
  // If component is in advanced list, check mode
  if (ADVANCED_COMPONENTS.includes(componentType)) {
    return advancedMode;
  }
  
  // All other components are available in simple mode
  return true;
}

/**
 * Filter components based on mode
 */
export function filterComponentsByMode<T extends { type: ComponentType }>(
  components: T[],
  advancedMode: boolean,
  userRoles?: string[]
): T[] {
  return components.filter(component =>
    isComponentAvailable(component.type, advancedMode, userRoles)
  );
}

