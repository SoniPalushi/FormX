import React from 'react';
import { TextField, Box, InputAdornment, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormCurrencyExRateProps {
  component: ComponentDefinition;
}

const FormCurrencyExRate: React.FC<FormCurrencyExRateProps> = ({ component }) => {
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
  
  const fromCurrency = component.props?.fromCurrency || 'USD';
  const toCurrency = component.props?.toCurrency || 'EUR';
  const exchangeRate = component.props?.exchangeRate || component.props?.rate || 1;
  const amount = component.props?.amount || component.props?.value || 0;
  const variant = component.props?.variant || 'outlined';
  const fullWidth = component.props?.fullWidth !== false;
  const disabled = component.props?.disabled || false;
  const size = component.props?.size || 'medium';
  const margin = component.props?.margin;
  const padding = component.props?.padding;
  const width = component.props?.width;
  const classes = component.props?.classes || component.props?.className || [];
  
  const calculatedWidth = width || (fullWidth ? '100%' : 'auto');
  const displayValue = formMode ? boundValue : computedValue;
  const displayHelperText = validationError || computedHelperText || '';
  const hasError = !!validationError || !isValid;
  const convertedAmount = (displayValue || amount) * exchangeRate;

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
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label={computedLabel || 'Amount'}
          value={displayValue || amount || ''}
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
          type="number"
          size={size as any}
          InputProps={{
            startAdornment: <InputAdornment position="start">{fromCurrency}</InputAdornment>,
          }}
          helperText={displayHelperText}
          error={hasError}
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
          {...htmlAttributes}
        />
        
        <Box sx={{ fontSize: '1.2rem', color: 'text.secondary' }}>→</Box>
        
        <TextField
          label="Converted"
          value={convertedAmount.toFixed(2)}
          variant={variant as any}
          fullWidth={!width && fullWidth}
          disabled
          size={size as any}
          InputProps={{
            startAdornment: <InputAdornment position="start">{toCurrency}</InputAdornment>,
          }}
          sx={{
            ...(width ? { width } : undefined),
          }}
        />
        
        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          Rate: {exchangeRate}
        </Box>
      </Box>
    </Box>
  );
};

export default FormCurrencyExRate;

