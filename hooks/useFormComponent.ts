/**
 * Form Component Hook
 * Integrates validation, events, data binding, computed properties, responsive styles, and conditional rendering
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFormDataStore } from '../stores/formDataStore';
import { useFormBuilderStore } from '../stores/formBuilderStore';
import { ZodValidationBuilder } from '../utils/validation/zodValidation';
import { ActionHandler } from '../utils/actions/actionSystem';
import { ComputedPropertyEvaluator } from '../utils/properties/computedProperties';
import { ConditionalRenderer } from '../utils/rendering/conditionalRendering';
import { ResponsiveStyleResolver } from '../utils/styles/responsiveStyles';
import { useDependencies } from './useDependencies';
import type { ComponentDefinition } from '../stores/types';
import type { ComponentProperty, ActionData, ValidationSchema, ActionEventArgs, ComponentStore } from '../stores/types/formEngine';

interface UseFormComponentOptions {
  component: ComponentDefinition;
  formMode?: boolean; // Whether we're in form mode (not builder mode)
}

interface UseFormComponentReturn {
  // Computed values
  computedLabel?: string;
  computedValue: any;
  computedHelperText?: string;
  computedPlaceholder?: string;
  
  // Validation
  validationError: string | null;
  isValid: boolean;
  
  // Data binding
  boundValue: any;
  setBoundValue: (value: any) => void;
  
  // Responsive styles
  responsiveSx: Record<string, any>;
  responsiveCss: string;
  wrapperResponsiveSx: Record<string, any>;
  wrapperResponsiveCss: string;
  
  // Conditional rendering
  shouldRender: boolean;
  
  // Dependency-based computed values
  computedDisabled: boolean;
  computedRequired: boolean;
  computedVisible: boolean;
  filterParams: Record<string, any>;
  
  // Event handlers
  handleChange: (value: any) => void;
  handleClick: (event: React.MouseEvent) => void;
  handleFocus: (event: React.FocusEvent) => void;
  handleBlur: (event: React.FocusEvent) => void;
  
  // HTML attributes
  htmlAttributes: Record<string, any>;
  
  // Tooltip properties
  tooltipTitle?: string;
  tooltipPlacement?: string;
  tooltipArrow?: boolean;
}

export function useFormComponent({ component, formMode = false }: UseFormComponentOptions): UseFormComponentReturn {
  const { findComponent, components } = useFormBuilderStore();
  // Subscribe to data changes for reactive updates
  const data = useFormDataStore((state) => state.data);
  const { setData, getData, evaluateProperty } = useFormDataStore();
  
  // Get latest component - subscribe to components array for real-time updates
  const latestComponent = useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  // Data binding
  const dataKey = latestComponent.props?.dataKey as string | undefined;
  const disableDataBinding = latestComponent.props?.disableDataBinding || false;
  
  // Get dependencies configuration
  const dependencies = latestComponent.props?.dependencies as any;
  
  // Evaluate dependencies (disabled, enabled, visible, required, label, placeholder, filterParams, etc.)
  const {
    computedDisabled: depDisabled,
    computedRequired: depRequired,
    computedVisible: depVisible,
    computedLabel: depLabel,
    computedPlaceholder: depPlaceholder,
    computedValue: depValue,
    filterParams,
  } = useDependencies({
    dependencies,
    dataKey,
    formMode,
    defaultDisabled: latestComponent.props?.disabled || false,
    defaultRequired: latestComponent.props?.required || false,
    defaultLabel: latestComponent.props?.label as string | undefined,
    defaultPlaceholder: latestComponent.props?.placeholder as string | undefined,
  });
  
  // Get bound value from store if data binding is enabled
  const boundValue = useMemo(() => {
    if (!formMode || disableDataBinding || !dataKey) {
      return latestComponent.props?.value || latestComponent.props?.defaultValue;
    }
    return getData(dataKey) ?? latestComponent.props?.value ?? latestComponent.props?.defaultValue;
  }, [formMode, disableDataBinding, dataKey, getData, latestComponent.props]);
  
  // Set bound value
  const setBoundValue = useCallback((value: any) => {
    if (formMode && !disableDataBinding && dataKey) {
      setData(dataKey, value);
    }
  }, [formMode, disableDataBinding, dataKey, setData]);
  
  // Computed properties - reactive to data changes
  // Use dependency-computed label if available, otherwise use prop-based computed label
  const computedLabel = useMemo(() => {
    // If dependency provides a label, use it
    if (depLabel !== undefined) {
      return depLabel;
    }
    
    // Otherwise, use existing computed property logic
    const labelProp = latestComponent.props?.label;
    if (typeof labelProp === 'object' && labelProp !== null) {
      return evaluateProperty(labelProp as ComponentProperty);
    }
    return labelProp as string | undefined;
  }, [depLabel, latestComponent.props?.label, data, evaluateProperty]);

  const computedValue = useMemo(() => {
    // If dependency provides a computed value, use it
    if (depValue !== undefined) {
      return depValue;
    }
    
    // Otherwise, use existing logic
    const valueProp = latestComponent.props?.value;
    if (typeof valueProp === 'object' && valueProp !== null) {
      return evaluateProperty(valueProp as ComponentProperty);
    }
    return boundValue;
  }, [depValue, latestComponent.props?.value, boundValue, data, evaluateProperty]);

  const computedHelperText = useMemo(() => {
    const helperTextProp = latestComponent.props?.helperText || latestComponent.props?.helpText;
    if (typeof helperTextProp === 'object' && helperTextProp !== null) {
      return evaluateProperty(helperTextProp as ComponentProperty);
    }
    return helperTextProp as string | undefined;
  }, [latestComponent.props?.helperText, latestComponent.props?.helpText, data, evaluateProperty]);

  const computedPlaceholder = useMemo(() => {
    // If dependency provides a placeholder, use it
    if (depPlaceholder !== undefined) {
      return depPlaceholder;
    }
    
    // Otherwise, use existing logic
    const placeholderProp = latestComponent.props?.placeholder;
    if (typeof placeholderProp === 'object' && placeholderProp !== null) {
      return evaluateProperty(placeholderProp as ComponentProperty);
    }
    return placeholderProp as string | undefined;
  }, [depPlaceholder, latestComponent.props?.placeholder, data, evaluateProperty]);
  
  // Validation
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  
  const validateValue = useCallback(async (value: any) => {
    const schema = latestComponent.props?.schema as ValidationSchema | undefined;
    if (!schema || !schema.validations || schema.validations.length === 0) {
      setValidationError(null);
      setIsValid(true);
      return true;
    }
    
    // Determine data type
    const dataType = 
      latestComponent.type === 'Amount' ? 'number' :
      latestComponent.type === 'CheckBox' || latestComponent.type === 'Toggle' ? 'boolean' :
      latestComponent.type === 'DateTime' || latestComponent.type === 'DateTimeCb' ? 'date' :
      'string';
    
    try {
      const zodSchema = ZodValidationBuilder.buildSchema(schema.validations, dataType);
      await zodSchema.parseAsync(value);
      setValidationError(null);
      setIsValid(true);
      return true;
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || 'Validation failed';
      setValidationError(errorMessage);
      setIsValid(false);
      return false;
    }
  }, [latestComponent.props?.schema, latestComponent.type]);
  
  // Validate on value change
  useEffect(() => {
    if (formMode && computedValue !== undefined) {
      validateValue(computedValue);
    }
  }, [formMode, computedValue, validateValue]);
  
  // Responsive styles - detect device type (simplified, can be enhanced)
  const deviceType = useMemo(() => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 600) return 'mobile';
    if (width < 960) return 'tablet';
    return 'desktop';
  }, []);
  
  const responsiveSx = useMemo(() => {
    const style = latestComponent.props?.style;
    if (!style) return {};
    return ResponsiveStyleResolver.getStyle(style as any, deviceType);
  }, [latestComponent.props?.style, deviceType]);
  
  const responsiveCss = useMemo(() => {
    const css = latestComponent.props?.css;
    if (!css) return '';
    return ResponsiveStyleResolver.cssToString(ResponsiveStyleResolver.getCss(css as any, deviceType));
  }, [latestComponent.props?.css, deviceType]);
  
  const wrapperResponsiveSx = useMemo(() => {
    const wrapperStyle = latestComponent.props?.wrapperStyle;
    if (!wrapperStyle) return {};
    return ResponsiveStyleResolver.getStyle(wrapperStyle as any, deviceType);
  }, [latestComponent.props?.wrapperStyle, deviceType]);
  
  const wrapperResponsiveCss = useMemo(() => {
    const wrapperCss = latestComponent.props?.wrapperCss;
    if (!wrapperCss) return '';
    return ResponsiveStyleResolver.cssToString(ResponsiveStyleResolver.getCss(wrapperCss as any, deviceType));
  }, [latestComponent.props?.wrapperCss, deviceType]);
  
  // Conditional rendering - reactive to data changes
  // Combine renderWhen prop with dependency-based visibility
  const shouldRender = useMemo(() => {
    // First check dependency-based visibility
    if (formMode && depVisible === false) {
      return false;
    }
    
    // Then check renderWhen prop
    const renderWhen = latestComponent.props?.renderWhen as ComponentProperty<boolean> | undefined;
    if (!renderWhen) return true;
    return ConditionalRenderer.shouldRender(renderWhen, data);
  }, [formMode, depVisible, latestComponent.props?.renderWhen, data]);
  
  // Tooltip properties - reactive to data changes
  const tooltipTitle = useMemo(() => {
    const tooltipProps = latestComponent.props?.tooltipProps as Record<string, ComponentProperty> | undefined;
    if (!tooltipProps || !tooltipProps.title) return undefined;
    return evaluateProperty(tooltipProps.title);
  }, [latestComponent.props?.tooltipProps, data, evaluateProperty]);

  const tooltipPlacement = useMemo(() => {
    const tooltipProps = latestComponent.props?.tooltipProps as Record<string, ComponentProperty> | undefined;
    if (!tooltipProps || !tooltipProps.placement) return 'top';
    const placement = tooltipProps.placement;
    if (typeof placement === 'object' && placement !== null) {
      return evaluateProperty(placement);
    }
    return placement as string;
  }, [latestComponent.props?.tooltipProps, data, evaluateProperty]);

  const tooltipArrow = useMemo(() => {
    const tooltipProps = latestComponent.props?.tooltipProps as Record<string, ComponentProperty> | undefined;
    if (!tooltipProps || tooltipProps.arrow === undefined) return true;
    const arrow = tooltipProps.arrow;
    if (typeof arrow === 'object' && arrow !== null) {
      return evaluateProperty(arrow);
    }
    return arrow as boolean;
  }, [latestComponent.props?.tooltipProps, data, evaluateProperty]);

  // HTML attributes
  const htmlAttributes = useMemo(() => {
    const attrs = latestComponent.props?.htmlAttributes as Array<{ key: string; value: any }> | undefined;
    if (!attrs || !Array.isArray(attrs)) return {};
    
    const result: Record<string, any> = {};
    for (const attr of attrs) {
      if (attr.key && attr.value !== undefined) {
        // Evaluate if value is a computed property
        if (typeof attr.value === 'object' && attr.value !== null) {
          result[attr.key] = evaluateProperty(attr.value as ComponentProperty);
        } else {
          result[attr.key] = attr.value;
        }
      }
    }
    return result;
  }, [latestComponent.props?.htmlAttributes, data, evaluateProperty]); // Add data dependency for reactive updates
  
  // Helper function to convert ComponentDefinition to ComponentStore for ActionEventArgs
  const componentToStore = useCallback((component: ComponentDefinition): ComponentStore => {
    return {
      key: component.id,
      dataKey: component.props?.dataKey as string | undefined,
      type: component.type,
      props: (component.props || {}) as Record<string, ComponentProperty>,
      events: component.props?.events as Record<string, ActionData[]> | undefined,
      schema: component.props?.schema as ValidationSchema | undefined,
      css: component.props?.css as any,
      wrapperCss: component.props?.wrapperCss as any,
      style: component.props?.style as any,
      wrapperStyle: component.props?.wrapperStyle as any,
      htmlAttributes: component.props?.htmlAttributes as any,
      tooltipProps: component.props?.tooltipProps as any,
      modal: component.props?.modal as any,
      slot: component.props?.slot as string | undefined,
      slotCondition: component.props?.slotCondition as string | undefined,
      renderWhen: component.props?.renderWhen as ComponentProperty<boolean> | undefined,
      disableDataBinding: component.props?.disableDataBinding as ComponentProperty<boolean> | undefined,
    };
  }, []);
  
  // Event handlers
  const handleChange = useCallback(async (value: any) => {
    setBoundValue(value);
    
    if (formMode) {
      // Validate
      await validateValue(value);
      
      // Execute onChange actions
      const events = latestComponent.props?.events as Record<string, ActionData[]> | undefined;
      const onChangeActions = events?.onChange;
      if (onChangeActions && onChangeActions.length > 0) {
        const sender = componentToStore(latestComponent);
        const eventArgs: ActionEventArgs = {
          type: 'onChange',
          sender,
          store: useFormDataStore.getState(),
          args: [value],
          renderedProps: latestComponent.props || {},
          value,
          data,
          rootData: data,
        };
        await ActionHandler.executeActions(onChangeActions, eventArgs);
      }
    }
  }, [formMode, setBoundValue, validateValue, latestComponent, data, componentToStore]);
  
  const handleClick = useCallback(async (event: React.MouseEvent) => {
    if (formMode) {
      const events = latestComponent.props?.events as Record<string, ActionData[]> | undefined;
      const onClickActions = events?.onClick;
      if (onClickActions && onClickActions.length > 0) {
        const sender = componentToStore(latestComponent);
        const eventArgs: ActionEventArgs = {
          type: 'onClick',
          sender,
          store: useFormDataStore.getState(),
          args: [event],
          renderedProps: latestComponent.props || {},
          event,
          data,
          rootData: data,
        };
        await ActionHandler.executeActions(onClickActions, eventArgs);
      }
    }
  }, [formMode, latestComponent, data, componentToStore]);
  
  const handleFocus = useCallback(async (event: React.FocusEvent) => {
    if (formMode) {
      const events = latestComponent.props?.events as Record<string, ActionData[]> | undefined;
      const onFocusActions = events?.onFocus;
      if (onFocusActions && onFocusActions.length > 0) {
        const sender = componentToStore(latestComponent);
        const eventArgs: ActionEventArgs = {
          type: 'onFocus',
          sender,
          store: useFormDataStore.getState(),
          args: [event],
          renderedProps: latestComponent.props || {},
          event,
          data,
          rootData: data,
        };
        await ActionHandler.executeActions(onFocusActions, eventArgs);
      }
    }
  }, [formMode, latestComponent, data, componentToStore]);
  
  const handleBlur = useCallback(async (event: React.FocusEvent) => {
    if (formMode) {
      // Validate on blur
      await validateValue(computedValue);
      
      const events = latestComponent.props?.events as Record<string, ActionData[]> | undefined;
      const onBlurActions = events?.onBlur;
      if (onBlurActions && onBlurActions.length > 0) {
        const sender = componentToStore(latestComponent);
        const eventArgs: ActionEventArgs = {
          type: 'onBlur',
          sender,
          store: useFormDataStore.getState(),
          args: [event],
          renderedProps: latestComponent.props || {},
          event,
          data,
          rootData: data,
        };
        await ActionHandler.executeActions(onBlurActions, eventArgs);
      }
    }
  }, [formMode, computedValue, validateValue, latestComponent, data, componentToStore]);
  
  return {
    computedLabel,
    computedValue,
    computedHelperText,
    computedPlaceholder,
    validationError,
    isValid,
    boundValue,
    setBoundValue,
    responsiveSx,
    responsiveCss,
    wrapperResponsiveSx,
    wrapperResponsiveCss,
    shouldRender,
    // Dependency-based computed values
    computedDisabled: depDisabled,
    computedRequired: depRequired,
    computedVisible: depVisible,
    filterParams,
    handleChange,
    handleClick,
    handleFocus,
    handleBlur,
    htmlAttributes,
    // Tooltip properties
    tooltipTitle,
    tooltipPlacement,
    tooltipArrow,
  };
}

