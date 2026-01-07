import React from 'react';
import { FormControlLabel, Checkbox as MuiCheckbox, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';

interface FormCheckboxProps {
  component: ComponentDefinition;
}

const FormCheckbox: React.FC<FormCheckboxProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode });
  
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
  } = useFormComponent({ component: latestComponent, formMode });
  
  const disabled = latestComponent.props?.disabled || false;
  const required = latestComponent.props?.required || false;
  const indeterminate = latestComponent.props?.indeterminate || false;
  const color = latestComponent.props?.color || 'primary';
  const size = latestComponent.props?.size || 'medium';
  
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
        display: 'inline-flex',
        alignItems: 'center',
        ...getSxStyles({
          includeMinDimensions: !formMode,
          defaultMinWidth: '200px',
          defaultMinHeight: '42px',
          additionalSx: wrapperResponsiveSx,
        }),
      }}
      className={`${formMode ? '' : 'form-builder-checkbox'} ${className}`.trim()}
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
        label={computedLabel || latestComponent.props?.label || ''}
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

