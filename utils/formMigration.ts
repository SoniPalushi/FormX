/**
 * Form Migration Utilities
 * Handles version migration for form storage formats
 */

import type { ComponentDefinition } from '../stores/types';
import type { PersistedForm } from '../stores/types/formEngine';
import { FormConverter } from './formConversion';

export interface MigrationResult {
  success: boolean;
  migrated: boolean;
  version: string;
  data: any;
  errors: string[];
  warnings: string[];
}

/**
 * Migrate form data to latest version
 */
export function migrateForm(data: any, fromVersion?: string): MigrationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Detect format and version
    const detected = detectFormatAndVersion(data);
    
    if (!detected.format) {
      return {
        success: false,
        migrated: false,
        version: 'unknown',
        data,
        errors: ['Unable to detect form format'],
        warnings: [],
      };
    }

    // If already latest version, no migration needed
    if (detected.version === '1' && detected.format === 'persisted') {
      return {
        success: true,
        migrated: false,
        version: '1',
        data,
        errors: [],
        warnings: [],
      };
    }

    // Perform migration based on detected format
    let migratedData: PersistedForm;
    
    if (detected.format === 'export' || detected.format === 'array') {
      // Migrate from FormExport or direct array to PersistedForm
      const components = detected.format === 'export' 
        ? (data as any).structure 
        : data as ComponentDefinition[];
      
      migratedData = FormConverter.toPersistedForm(components, {
        version: '1',
        defaultLanguage: 'en-US',
      });

      // Preserve metadata if available
      if (detected.format === 'export' && (data as any).metadata) {
        warnings.push('Metadata from FormExport format cannot be fully preserved in PersistedForm');
      }

      return {
        success: true,
        migrated: true,
        version: '1',
        data: migratedData,
        errors: [],
        warnings,
      };
    }

    if (detected.format === 'persisted') {
      // Migrate PersistedForm to latest version
      migratedData = migratePersistedForm(data as PersistedForm, detected.version);
      
      return {
        success: true,
        migrated: migratedData !== data,
        version: '1',
        data: migratedData,
        errors: [],
        warnings,
      };
    }

    return {
      success: false,
      migrated: false,
      version: detected.version,
      data,
      errors: ['Unknown format'],
      warnings: [],
    };
  } catch (error) {
    return {
      success: false,
      migrated: false,
      version: 'unknown',
      data,
      errors: [`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
    };
  }
}

/**
 * Detect form format and version
 */
function detectFormatAndVersion(data: any): {
  format: 'persisted' | 'export' | 'array' | null;
  version: string;
} {
  // Check for PersistedForm format
  if (data && typeof data === 'object' && data.form && data.version) {
    return {
      format: 'persisted',
      version: String(data.version) || '1',
    };
  }

  // Check for FormExport format
  if (data && typeof data === 'object' && data.structure && Array.isArray(data.structure)) {
    return {
      format: 'export',
      version: data.version || '1.0.0',
    };
  }

  // Check for direct array
  if (Array.isArray(data) && data.length > 0 && data[0].id && data[0].type) {
    return {
      format: 'array',
      version: '1.0.0',
    };
  }

  return {
    format: null,
    version: 'unknown',
  };
}

/**
 * Migrate PersistedForm between versions
 */
function migratePersistedForm(persistedForm: PersistedForm, fromVersion: string): PersistedForm {
  let migrated = { ...persistedForm };

  // Version 1 migrations
  if (fromVersion === '0' || !fromVersion) {
    // Ensure required fields exist
    if (!migrated.version) {
      migrated.version = '1';
    }
    if (!migrated.defaultLanguage) {
      migrated.defaultLanguage = 'en-US';
    }
    if (!migrated.languages) {
      migrated.languages = [
        { code: 'en-US', name: 'English (US)' },
        { code: 'es-ES', name: 'Spanish (ES)' },
      ];
    }
    if (!migrated.localization) {
      migrated.localization = {};
    }
  }

  // Future version migrations can be added here
  // Example for version 2:
  // if (fromVersion === '1') {
  //   // Add new fields, transform data, etc.
  //   migrated.version = '2';
  // }

  return migrated;
}

/**
 * Check if migration is needed
 */
export function needsMigration(data: any): boolean {
  const detected = detectFormatAndVersion(data);
  
  if (!detected.format) {
    return false; // Can't determine, assume no migration needed
  }

  // Migration needed if:
  // 1. Not PersistedForm format, OR
  // 2. PersistedForm but version < 1
  return detected.format !== 'persisted' || (detected.version !== '1' && detected.version !== 'unknown');
}

/**
 * Get migration info without performing migration
 */
export function getMigrationInfo(data: any): {
  needsMigration: boolean;
  fromFormat: string;
  fromVersion: string;
  toFormat: string;
  toVersion: string;
} {
  const detected = detectFormatAndVersion(data);
  
  return {
    needsMigration: needsMigration(data),
    fromFormat: detected.format || 'unknown',
    fromVersion: detected.version,
    toFormat: 'persisted',
    toVersion: '1',
  };
}

