/**
 * Hook for getting dynamic component properties
 * Ensures real-time updates when properties change in PropertyEditor
 */

import { useMemo, useCallback } from 'react';
import { useFormBuilderStore } from '../stores/formBuilderStore';
import type { ComponentDefinition } from '../stores/types';

interface UseComponentPropertiesOptions {
  component: ComponentDefinition;
  formMode?: boolean;
}

interface UseComponentPropertiesReturn {
  // Latest component from store
  latestComponent: ComponentDefinition;
  
  // Layout properties
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  padding?: { top?: number; right?: number; bottom?: number; left?: number };
  width?: string;
  height?: string;
  
  // Styling properties
  classes: string[];
  className: string;
  
  // Common properties
  size?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  
  // Helper values
  marginString: string | undefined;
  paddingString: string | undefined;
  
  // Helper functions
  getSxStyles: (options?: {
    includeMinDimensions?: boolean;
    defaultMinWidth?: string;
    defaultMinHeight?: string;
    additionalSx?: Record<string, any>;
  }) => Record<string, any>;
}

export function useComponentProperties({
  component,
  formMode = false,
}: UseComponentPropertiesOptions): UseComponentPropertiesReturn {
  const { findComponent, components } = useFormBuilderStore();
  
  // Get latest component from store to ensure real-time updates
  const latestComponent = useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  // Extract properties
  const margin = latestComponent.props?.margin;
  const padding = latestComponent.props?.padding;
  const width = latestComponent.props?.width;
  const height = latestComponent.props?.height;
  const classes = latestComponent.props?.classes || latestComponent.props?.className || [];
  const size = latestComponent.props?.size;
  const disabled = latestComponent.props?.disabled;
  const required = latestComponent.props?.required;
  const id = latestComponent.props?.id;
  const name = latestComponent.props?.name;
  
  // Convert classes array to string
  const className = useMemo(() => {
    return Array.isArray(classes) ? classes.join(' ') : (typeof classes === 'string' ? classes : '');
  }, [classes]);
  
  // Helper values - margin and padding as CSS strings
  const marginString = useMemo(() => {
    if (!margin) return undefined;
    return `${margin.top || 0}px ${margin.right || 0}px ${margin.bottom || 0}px ${margin.left || 0}px`;
  }, [margin]);
  
  const paddingString = useMemo(() => {
    if (!padding) return undefined;
    return `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px`;
  }, [padding]);
  
  // Helper function to get sx styles object
  const getSxStyles = useCallback((options?: {
    includeMinDimensions?: boolean;
    defaultMinWidth?: string;
    defaultMinHeight?: string;
    additionalSx?: Record<string, any>;
  }) => {
    const {
      includeMinDimensions = !formMode,
      defaultMinWidth,
      defaultMinHeight,
      additionalSx = {},
    } = options || {};
    
    const styles: Record<string, any> = {
      width: width || 'auto',
      height: height || 'auto',
      ...(marginString ? { margin: marginString } : {}),
      ...(paddingString ? { padding: paddingString } : {}),
      ...additionalSx,
    };
    
    if (includeMinDimensions) {
      styles.minWidth = width || defaultMinWidth || 'auto';
      styles.minHeight = height || defaultMinHeight || 'auto';
    }
    
    return styles;
  }, [width, height, marginString, paddingString, formMode]);
  
  return {
    latestComponent,
    margin,
    padding,
    width,
    height,
    classes: Array.isArray(classes) ? classes : (typeof classes === 'string' ? classes.split(' ').filter(Boolean) : []),
    className,
    size,
    disabled,
    required,
    id,
    name,
    marginString,
    paddingString,
    getSxStyles,
  };
}

