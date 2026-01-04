import React from 'react';
import {
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox as MuiCheckbox,
  Box,
} from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormCheckBoxGroupProps {
  component: ComponentDefinition;
}

const FormCheckBoxGroup: React.FC<FormCheckBoxGroupProps> = ({ component }) => {
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
  
  const options = component.props?.options || [];
  const disabled = component.props?.disabled || false;
  const required = component.props?.required || false;
  const row = component.props?.row || false;
  const color = component.props?.color || 'primary';
  const size = component.props?.size || 'medium';
  const margin = component.props?.margin;
  const padding = component.props?.padding;
  const classes = component.props?.classes || component.props?.className || [];
  
  const displayValue = formMode ? (boundValue || []) : (computedValue || component.props?.value || []);
  const hasError = !!validationError || !isValid;

  if (!shouldRender) return null;

  const handleOptionChange = (optionValue: any, checked: boolean) => {
    if (formMode) {
      const currentValues = Array.isArray(displayValue) ? [...displayValue] : [];
      if (checked) {
        if (!currentValues.includes(optionValue)) {
          handleChange([...currentValues, optionValue]);
        }
      } else {
        handleChange(currentValues.filter((v: any) => v !== optionValue));
      }
    }
  };

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
        margin: margin ? `${margin.top || 0}px ${margin.right || 0}px ${margin.bottom || 0}px ${margin.left || 0}px` : undefined,
        padding: padding ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px` : undefined,
        ...wrapperResponsiveSx,
      }}
      className={Array.isArray(classes) ? classes.join(' ') : classes}
      style={wrapperResponsiveCss ? { ...htmlAttributes, style: wrapperResponsiveCss } : htmlAttributes}
    >
      <FormControl
        component="fieldset"
        error={hasError}
        required={required}
        disabled={disabled}
        sx={responsiveSx}
        style={responsiveCss ? { style: responsiveCss } : undefined}
      >
        {computedLabel && <FormLabel component="legend">{computedLabel}</FormLabel>}
        <FormGroup row={row}>
          {options.map((option: any, index: number) => {
            const optionValue = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label || option.value;
            const checked = Array.isArray(displayValue) && displayValue.includes(optionValue);

            return (
              <FormControlLabel
                key={index}
                control={
                  <MuiCheckbox
                    checked={checked}
                    onChange={(e) => {
                      if (formMode) {
                        handleOptionChange(optionValue, e.target.checked);
                      }
                    }}
                    color={color as any}
                    size={size as any}
                    onClick={(e) => {
                      if (!formMode) {
                        e.stopPropagation();
                      }
                    }}
                    {...htmlAttributes}
                  />
                }
                label={optionLabel}
                onClick={(e) => {
                  if (!formMode) {
                    e.stopPropagation();
                  }
                }}
              />
            );
          })}
        </FormGroup>
        {validationError && (
          <Box component="span" sx={{ fontSize: '0.75rem', mt: 0.5, color: 'error.main' }}>
            {validationError}
          </Box>
        )}
      </FormControl>
    </Box>
  );
};

export default FormCheckBoxGroup;

