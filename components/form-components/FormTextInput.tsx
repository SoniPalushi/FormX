import React from 'react';
import { TextField, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';

interface FormTextInputProps {
  component: ComponentDefinition;
}

const FormTextInput: React.FC<FormTextInputProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode });
  
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
    computedDisabled,
    computedRequired,
    handleChange,
    handleClick,
    handleFocus,
    handleBlur,
    htmlAttributes,
  } = useFormComponent({ component: latestComponent, formMode });
  
  // Get component props from latest component
  const variant = latestComponent.props?.variant || 'outlined';
  const fullWidth = latestComponent.props?.fullWidth !== false;
  // Use dependency-computed required and disabled, fallback to props
  const required = computedRequired !== undefined ? computedRequired : (latestComponent.props?.required || false);
  const disabled = computedDisabled !== undefined ? computedDisabled : (latestComponent.props?.disabled || false);
  const type = latestComponent.props?.type || 'text';
  const maxLength = latestComponent.props?.maxLength;
  const pattern = latestComponent.props?.pattern;
  const size = latestComponent.props?.size || 'medium';
  const width = latestComponent.props?.width;

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
        ...getSxStyles({
          includeMinDimensions: !formMode,
          defaultMinWidth: '300px',
          defaultMinHeight: '56px',
          additionalSx: wrapperResponsiveSx,
        }),
      }}
      className={`${formMode ? '' : 'form-builder-text-input'} ${className}`.trim()}
      style={htmlAttributes}
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
      />
    </Box>
  );
};

export default FormTextInput;

