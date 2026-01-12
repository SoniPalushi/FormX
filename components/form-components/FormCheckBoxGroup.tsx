import React from 'react';
import {
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox as MuiCheckbox,
  Box,
  FormHelperText,
} from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';

interface FormCheckBoxGroupProps {
  component: ComponentDefinition;
}

const FormCheckBoxGroup: React.FC<FormCheckBoxGroupProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode });
  
  const {
    computedLabel,
    computedValue,
    computedHelperText,
    validationError,
    isValid,
    boundValue,
    responsiveSx,
    wrapperResponsiveSx,
    shouldRender,
    handleChange,
    handleClick,
    htmlAttributes,
  } = useFormComponent({ component: latestComponent, formMode });
  
  const options = latestComponent.props?.options || [];
  const disabled = latestComponent.props?.disabled || false;
  const required = latestComponent.props?.required || false;
  const row = latestComponent.props?.row || false;
  const color = latestComponent.props?.color || 'primary';
  const size = latestComponent.props?.size || 'medium';
  
  const displayValue = formMode ? (boundValue || []) : (computedValue || latestComponent.props?.value || []);
  const displayHelperText = validationError || computedHelperText || '';
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
        ...getSxStyles({
          includeMinDimensions: !formMode,
          defaultMinWidth: '200px',
          defaultMinHeight: '60px',
          additionalSx: wrapperResponsiveSx,
        }),
      }}
      className={`${formMode ? '' : 'form-builder-checkbox-group'} ${className}`.trim()}
      style={htmlAttributes}
    >
      <FormControl
        component="fieldset"
        error={hasError}
        required={required}
        disabled={!formMode || disabled}
        sx={responsiveSx}
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
        {displayHelperText && (
          <FormHelperText>{displayHelperText}</FormHelperText>
        )}
      </FormControl>
    </Box>
  );
};

export default FormCheckBoxGroup;
