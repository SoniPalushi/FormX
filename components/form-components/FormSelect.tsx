import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormDataStore } from '../../stores/formDataStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { ComputedPropertyEvaluator } from '../../utils/properties/computedProperties';

interface FormSelectProps {
  component: ComponentDefinition;
}

const FormSelect: React.FC<FormSelectProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  const {
    computedLabel,
    computedValue,
    computedHelperText,
    validationError,
    isValid,
    boundValue,
    setBoundValue,
    responsiveSx,
    responsiveCss,
    wrapperResponsiveSx,
    wrapperResponsiveCss,
    shouldRender,
    handleChange,
    handleClick,
    handleFocus,
    handleBlur,
    htmlAttributes,
  } = useFormComponent({ component, formMode });
  
  // Support multiple data source types for options
  const optionsSource = component.props?.optionsSource || component.props?.options;
  // Subscribe to form data for reactive updates
  const formData = useFormDataStore((state) => state.data);
  const { getAllData, getData } = useFormDataStore();
  
  const options = React.useMemo(() => {
    if (!optionsSource) return [];
    
    // If it's already an array, use it directly
    if (Array.isArray(optionsSource)) {
      return optionsSource;
    }
    
    // If it's a computed property (object with computeType)
    if (typeof optionsSource === 'object' && optionsSource !== null && 'computeType' in optionsSource) {
      try {
        const evaluated = ComputedPropertyEvaluator.evaluate(
          optionsSource as any,
          formData
        );
        return Array.isArray(evaluated) ? evaluated : [];
      } catch (error) {
        console.error('Error evaluating computed options:', error);
        return [];
      }
    }
    
    // If it's a function (data provider)
    if (typeof optionsSource === 'function') {
      try {
        const result = optionsSource(formData, component);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error executing optionsSource function:', error);
        return [];
      }
    }
    
    // If it's a string (could be JSON or dataKey)
    if (typeof optionsSource === 'string') {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(optionsSource);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // If not JSON, try as dataKey
        const data = getData(optionsSource);
        return Array.isArray(data) ? data : [];
      }
    }
    
    return [];
  }, [optionsSource, component, formData, getData]); // Added formData dependency for reactivity
  
  const variant = component.props?.variant || 'outlined';
  const fullWidth = component.props?.fullWidth !== false;
  const required = component.props?.required || false;
  const disabled = component.props?.disabled || false;
  const multiple = component.props?.multiple || false;
  const size = component.props?.size || 'medium';
  const margin = component.props?.margin;
  const padding = component.props?.padding;
  const width = component.props?.width;
  const classes = component.props?.classes || component.props?.className || [];

  // Default to fullWidth if not explicitly set and no width specified
  const calculatedWidth = width || (fullWidth ? '100%' : (formMode ? '100%' : '300px'));
  const displayValue = formMode ? boundValue : computedValue;
  const displayHelperText = validationError || computedHelperText || '';
  const hasError = !!validationError || !isValid;

  if (!shouldRender) return null;

  return (
    <Box
      onClick={(e) => {
        if (!formMode) {
          e.stopPropagation();
          selectComponent(component.id);
        } else {
          handleClick(e);
        }
      }}
      sx={{
        border: isSelected && !formMode ? '2px solid #1976d2' : '2px solid transparent',
        borderRadius: 1,
        p: formMode ? 0 : 0.5,
        cursor: formMode ? 'default' : 'pointer',
        width: calculatedWidth,
        margin: margin ? `${margin.top || 0}px ${margin.right || 0}px ${margin.bottom || 0}px ${margin.left || 0}px` : undefined,
        padding: padding ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px` : undefined,
        ...wrapperResponsiveSx,
      }}
      className={Array.isArray(classes) ? classes.join(' ') : classes}
      style={wrapperResponsiveCss ? { ...htmlAttributes, style: wrapperResponsiveCss } : htmlAttributes}
    >
      <FormControl 
        variant={variant as any} 
        fullWidth={!width && fullWidth} 
        disabled={disabled}
        required={required}
        error={hasError}
        size={size as any}
        sx={{
          ...(width ? { width } : undefined),
          minWidth: !width && !fullWidth ? '200px' : undefined,
          ...responsiveSx,
        }}
        style={responsiveCss ? { style: responsiveCss } : undefined}
      >
        <InputLabel>{computedLabel}</InputLabel>
        <Select 
          value={displayValue || ''} 
          label={computedLabel}
          multiple={multiple}
          onChange={(e) => {
            if (formMode) {
              handleChange(e.target.value);
            }
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={(e) => {
            if (!formMode) {
              e.stopPropagation();
            }
          }}
          {...htmlAttributes}
        >
          {options.map((option: any, index: number) => (
            <MenuItem key={index} value={typeof option === 'string' ? option : option.value}>
              {typeof option === 'string' ? option : option.label || option.value}
            </MenuItem>
          ))}
        </Select>
        {displayHelperText && (
          <Box component="span" sx={{ fontSize: '0.75rem', mt: 0.5, color: hasError ? 'error.main' : 'text.secondary' }}>
            {displayHelperText}
          </Box>
        )}
      </FormControl>
    </Box>
  );
};

export default FormSelect;

