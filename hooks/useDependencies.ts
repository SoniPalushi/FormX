/**
 * useDependencies Hook
 * Evaluates component dependencies and provides reactive computed values
 * 
 * Features:
 * - Computed disabled/enabled states
 * - Computed visibility
 * - Computed label, placeholder, value
 * - Cascading dropdown filtering
 * - Auto-reset on dependent field changes
 */

import { useMemo, useEffect, useRef, useCallback } from 'react';
import { useFormDataStore } from '../stores/formDataStore';
import { DependencyEvaluator } from '../utils/dependencies/dependencyEvaluator';
import type { ComponentDependencies } from '../stores/types';

interface UseDependenciesOptions {
  // Component's dependencies configuration
  dependencies?: ComponentDependencies;
  
  // Component's dataKey for data binding
  dataKey?: string;
  
  // Whether we're in form mode (not builder mode)
  formMode?: boolean;
  
  // Static/default values
  defaultDisabled?: boolean;
  defaultRequired?: boolean;
  defaultLabel?: string;
  defaultPlaceholder?: string;
}

interface UseDependenciesReturn {
  // Computed states
  computedDisabled: boolean;
  computedRequired: boolean;
  computedVisible: boolean;
  
  // Computed properties
  computedLabel?: string;
  computedPlaceholder?: string;
  computedValue?: any;
  computedOptions?: any[];
  
  // Filter params for cascading dropdowns
  filterParams: Record<string, any>;
  
  // List of fields this component depends on
  dependentFields: string[];
  
  // Whether dependencies exist
  hasDependencies: boolean;
}

export function useDependencies({
  dependencies,
  dataKey,
  formMode = false,
  defaultDisabled = false,
  defaultRequired = false,
  defaultLabel,
  defaultPlaceholder,
}: UseDependenciesOptions): UseDependenciesReturn {
  // Subscribe to form data for reactive updates
  const data = useFormDataStore((state) => state.data);
  const { setData, getData } = useFormDataStore();
  
  // Track previous values for resetOn logic
  const prevDataRef = useRef<Record<string, any>>({});
  
  // Check if dependencies exist
  const hasDependencies = useMemo(() => {
    return dependencies !== undefined && Object.keys(dependencies).length > 0;
  }, [dependencies]);
  
  // Extract dependent fields for optimization
  const dependentFields = useMemo(() => {
    return DependencyEvaluator.extractDependentFields(dependencies);
  }, [dependencies]);
  
  // Create dependency context
  const context = useMemo(() => ({
    data,
    parentData: undefined, // TODO: Add support for repeater parent data
    rootData: data,
    currentDataKey: dataKey,
  }), [data, dataKey]);
  
  // Evaluate all dependencies when form data changes
  const evaluatedDeps = useMemo(() => {
    if (!formMode || !hasDependencies) {
      return {};
    }
    return DependencyEvaluator.evaluateAllDependencies(dependencies, context);
  }, [formMode, hasDependencies, dependencies, context]);
  
  // Compute final values
  const computedDisabled = useMemo(() => {
    if (!formMode) return defaultDisabled;
    if (evaluatedDeps.disabled !== undefined) return evaluatedDeps.disabled;
    if (evaluatedDeps.enabled !== undefined) return !evaluatedDeps.enabled;
    return defaultDisabled;
  }, [formMode, evaluatedDeps.disabled, evaluatedDeps.enabled, defaultDisabled]);
  
  const computedRequired = useMemo(() => {
    if (!formMode) return defaultRequired;
    if (evaluatedDeps.required !== undefined) return evaluatedDeps.required;
    return defaultRequired;
  }, [formMode, evaluatedDeps.required, defaultRequired]);
  
  const computedVisible = useMemo(() => {
    if (!formMode) return true;
    if (evaluatedDeps.visible !== undefined) return evaluatedDeps.visible;
    return true;
  }, [formMode, evaluatedDeps.visible]);
  
  const computedLabel = useMemo(() => {
    if (evaluatedDeps.label !== undefined) return evaluatedDeps.label;
    return defaultLabel;
  }, [evaluatedDeps.label, defaultLabel]);
  
  const computedPlaceholder = useMemo(() => {
    if (evaluatedDeps.placeholder !== undefined) return evaluatedDeps.placeholder;
    return defaultPlaceholder;
  }, [evaluatedDeps.placeholder, defaultPlaceholder]);
  
  const computedValue = useMemo(() => {
    return evaluatedDeps.value;
  }, [evaluatedDeps.value]);
  
  const computedOptions = useMemo(() => {
    return evaluatedDeps.options;
  }, [evaluatedDeps.options]);
  
  const filterParams = useMemo(() => {
    return evaluatedDeps.filterParams || {};
  }, [evaluatedDeps.filterParams]);
  
  // Handle resetOn - reset field value when dependent fields change
  useEffect(() => {
    if (!formMode || !dependencies?.resetOn || !dataKey) {
      return;
    }
    
    const resetOn = dependencies.resetOn;
    const prevData = prevDataRef.current;
    
    // Check if any of the resetOn fields have changed
    const changedFields: string[] = [];
    for (const field of resetOn) {
      if (prevData[field] !== data[field]) {
        changedFields.push(field);
      }
    }
    
    // If any dependent field changed, reset this field's value
    if (changedFields.length > 0 && Object.keys(prevData).length > 0) {
      // Only reset if we had previous data (not on initial render)
      const currentValue = getData(dataKey);
      if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
        console.log(`Resetting ${dataKey} because ${changedFields.join(', ')} changed`);
        setData(dataKey, undefined);
      }
    }
    
    // Update previous data reference
    prevDataRef.current = { ...data };
  }, [formMode, dependencies?.resetOn, dataKey, data, getData, setData]);
  
  // Set computed value if it changed
  useEffect(() => {
    if (!formMode || !dataKey || computedValue === undefined) {
      return;
    }
    
    const currentValue = getData(dataKey);
    if (currentValue !== computedValue) {
      setData(dataKey, computedValue);
    }
  }, [formMode, dataKey, computedValue, getData, setData]);
  
  return {
    computedDisabled,
    computedRequired,
    computedVisible,
    computedLabel,
    computedPlaceholder,
    computedValue,
    computedOptions,
    filterParams,
    dependentFields,
    hasDependencies,
  };
}

/**
 * Hook to track which fields have changed
 * Useful for optimizing dependency evaluation
 */
export function useFieldChanges(fields: string[]): string[] {
  const data = useFormDataStore((state) => state.data);
  const prevDataRef = useRef<Record<string, any>>({});
  
  const changedFields = useMemo(() => {
    const changed: string[] = [];
    const prevData = prevDataRef.current;
    
    for (const field of fields) {
      if (prevData[field] !== data[field]) {
        changed.push(field);
      }
    }
    
    // Update ref (note: this happens during render, which is ok for refs)
    prevDataRef.current = { ...data };
    
    return changed;
  }, [fields, data]);
  
  return changedFields;
}

