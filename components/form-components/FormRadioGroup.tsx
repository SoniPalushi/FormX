import React from 'react';
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  FormHelperText,
} from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';

interface FormRadioGroupProps {
  component: ComponentDefinition;
}

const FormRadioGroup: React.FC<FormRadioGroupProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode });
  
  // Use the form component hook for all integrations
  const {
    computedLabel,
    computedValue,
    computedHelperText,
    validationError,
    isValid,
    boundValue,
    responsiveSx,
    wrapperResponsiveSx,
    computedVisible,
    computedDisabled,
    computedRequired,
    handleChange,
    handleClick,
    handleFocus,
    handleBlur,
    htmlAttributes,
  } = useFormComponent({ component: latestComponent, formMode });
  
  const options = latestComponent.props?.options || [];
  const row = latestComponent.props?.row || false;
  const disabled = computedDisabled !== undefined ? computedDisabled : (latestComponent.props?.disabled || false);
  const required = computedRequired !== undefined ? computedRequired : (latestComponent.props?.required || false);
  const size = latestComponent.props?.size || 'medium';
  const color = latestComponent.props?.color || 'primary';
  const width = latestComponent.props?.width;

  const displayValue = formMode ? boundValue : computedValue;
  const displayHelperText = validationError || computedHelperText || '';
  const hasError = !!validationError || !isValid;

  // Don't render if conditional rendering says no
  if (!computedVisible) {
    return null;
  }

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
        display: 'block',
        width: width || 'auto',
        ...getSxStyles({
          includeMinDimensions: !formMode,
          defaultMinWidth: '300px',
          defaultMinHeight: '60px',
          additionalSx: wrapperResponsiveSx,
        }),
      }}
      className={`${formMode ? '' : 'form-builder-radio-group'} ${className}`.trim()}
      style={htmlAttributes}
    >
      <FormControl 
        disabled={!formMode || disabled}
        required={required}
        error={hasError}
        size={size as any}
        sx={responsiveSx}
      >
        {computedLabel && <FormLabel>{computedLabel}</FormLabel>}
        <RadioGroup 
          value={displayValue || ''} 
          row={row} 
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
        >
          {options.map((option: any, index: number) => {
            const optionValue = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label || option.value;
            return (
              <FormControlLabel
                key={index}
                value={optionValue}
                control={<Radio color={color as any} size={size as any} />}
                label={optionLabel}
              />
            );
          })}
        </RadioGroup>
        {displayHelperText && (
          <FormHelperText>{displayHelperText}</FormHelperText>
        )}
      </FormControl>
    </Box>
  );
};

export default FormRadioGroup;
