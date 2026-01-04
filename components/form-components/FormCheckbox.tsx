import React from 'react';
import { FormControlLabel, Checkbox as MuiCheckbox, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormCheckboxProps {
  component: ComponentDefinition;
}

const FormCheckbox: React.FC<FormCheckboxProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  const {
    computedLabel,
    computedValue,
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
    htmlAttributes,
  } = useFormComponent({ component, formMode });
  
  const disabled = component.props?.disabled || false;
  const required = component.props?.required || false;
  const indeterminate = component.props?.indeterminate || false;
  const color = component.props?.color || 'primary';
  const size = component.props?.size || 'medium';
  const margin = component.props?.margin;
  const padding = component.props?.padding;
  const classes = component.props?.classes || component.props?.className || [];
  
  const displayChecked = formMode ? (boundValue ?? false) : (computedValue ?? component.props?.checked ?? false);
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
        display: 'inline-block',
        margin: margin ? `${margin.top || 0}px ${margin.right || 0}px ${margin.bottom || 0}px ${margin.left || 0}px` : undefined,
        padding: padding ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px` : undefined,
        ...wrapperResponsiveSx,
      }}
      className={Array.isArray(classes) ? classes.join(' ') : classes}
      style={wrapperResponsiveCss ? { ...htmlAttributes, style: wrapperResponsiveCss } : htmlAttributes}
    >
      <FormControlLabel
        control={
          <MuiCheckbox 
            checked={displayChecked} 
            disabled={disabled}
            indeterminate={indeterminate}
            color={color as any}
            size={size as any}
            required={required}
            error={hasError}
            onChange={(e) => {
              if (formMode) {
                handleChange(e.target.checked);
              }
            }}
            onClick={(e) => {
              if (!formMode) {
                e.stopPropagation();
              }
            }}
            sx={responsiveSx}
            style={responsiveCss ? { style: responsiveCss } : undefined}
            {...htmlAttributes}
          />
        }
        label={computedLabel || component.props?.label || ''}
        onClick={(e) => {
          if (!formMode) {
            e.stopPropagation();
          }
        }}
      />
    </Box>
  );
};

export default FormCheckbox;

