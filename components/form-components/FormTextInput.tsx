import React from 'react';
import { TextField, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormTextInputProps {
  component: ComponentDefinition;
}

const FormTextInput: React.FC<FormTextInputProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Use the form component hook for all integrations
  const {
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
    handleChange,
    handleClick,
    handleFocus,
    handleBlur,
    htmlAttributes,
  } = useFormComponent({ component, formMode });
  
  // Get component props
  const variant = component.props?.variant || 'outlined';
  const fullWidth = component.props?.fullWidth !== false;
  const required = component.props?.required || false;
  const disabled = component.props?.disabled || false;
  const type = component.props?.type || 'text';
  const maxLength = component.props?.maxLength;
  const pattern = component.props?.pattern;
  const size = component.props?.size || 'medium';
  const margin = component.props?.margin;
  const padding = component.props?.padding;
  const width = component.props?.width;
  const height = component.props?.height;
  const classes = component.props?.classes || component.props?.className || [];

  // Calculate width: use explicit width if provided, otherwise use fullWidth
  const calculatedWidth = width || (fullWidth ? '100%' : 'auto');
  
  // Don't render if conditional rendering says no
  if (!shouldRender) {
    return null;
  }

  // Use bound value in form mode, otherwise use computed value
  const displayValue = formMode ? boundValue : computedValue;
  
  // Combine validation error with helper text
  const displayHelperText = validationError || computedHelperText || '';
  const hasError = !!validationError || !isValid;

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
        height: height || 'auto',
        margin: margin ? `${margin.top || 0}px ${margin.right || 0}px ${margin.bottom || 0}px ${margin.left || 0}px` : undefined,
        padding: padding ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px` : undefined,
        ...wrapperResponsiveSx,
      }}
      className={Array.isArray(classes) ? classes.join(' ') : classes}
      style={wrapperResponsiveCss ? { ...htmlAttributes, style: wrapperResponsiveCss } : htmlAttributes}
    >
      <TextField
        label={computedLabel}
        placeholder={computedPlaceholder}
        value={displayValue || ''}
        onChange={(e) => {
          if (formMode) {
            handleChange(e.target.value);
          }
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        variant={variant as any}
        fullWidth={!width && fullWidth}
        disabled={disabled}
        required={required}
        type={type}
        inputProps={{
          maxLength,
          pattern,
          ...htmlAttributes,
        }}
        helperText={displayHelperText}
        error={hasError}
        size={size as any}
        onClick={(e) => {
          if (!formMode) {
            e.stopPropagation();
          }
        }}
        sx={{
          ...(width ? { width } : undefined),
          ...responsiveSx,
        }}
        style={responsiveCss ? { style: responsiveCss } : undefined}
      />
    </Box>
  );
};

export default FormTextInput;

