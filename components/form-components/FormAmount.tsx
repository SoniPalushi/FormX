import React from 'react';
import { TextField, Box, InputAdornment } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';

interface FormAmountProps {
  component: ComponentDefinition;
}

const FormAmount: React.FC<FormAmountProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode });
  
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
  } = useFormComponent({ component: latestComponent, formMode });
  
  const currency = latestComponent.props?.currency || latestComponent.props?.currencySymbol || '$';
  const variant = latestComponent.props?.variant || 'outlined';
  const fullWidth = latestComponent.props?.fullWidth !== false;
  const required = latestComponent.props?.required || false;
  const disabled = latestComponent.props?.disabled || false;
  const decimalPlaces = latestComponent.props?.decimalPlaces ?? 2;
  const size = latestComponent.props?.size || 'medium';
  const width = latestComponent.props?.width;
  
  const calculatedWidth = width || (fullWidth ? '100%' : 'auto');
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
        ...getSxStyles({
          includeMinDimensions: !formMode,
          defaultMinWidth: '200px',
          defaultMinHeight: '56px',
          additionalSx: wrapperResponsiveSx,
        }),
      }}
      className={`${formMode ? '' : 'form-builder-amount'} ${className}`.trim()}
      style={wrapperResponsiveCss ? { ...htmlAttributes, style: wrapperResponsiveCss } : htmlAttributes}
    >
      <TextField
        label={computedLabel || 'Amount'}
        value={displayValue || ''}
        placeholder={computedPlaceholder || '0.00'}
        onChange={(e) => {
          if (formMode) {
            const numValue = e.target.value === '' ? '' : Number(e.target.value);
            handleChange(numValue);
          }
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        variant={variant as any}
        fullWidth={!width && fullWidth}
        disabled={disabled}
        required={required}
        type="number"
        inputProps={{
          step: Math.pow(10, -decimalPlaces),
          min: component.props?.min,
          max: component.props?.max,
          ...htmlAttributes,
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">{currency}</InputAdornment>
          ),
        }}
        helperText={displayHelperText}
        error={hasError || undefined}
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

export default FormAmount;

