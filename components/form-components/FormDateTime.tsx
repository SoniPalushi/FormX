import React from 'react';
import { TextField, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';

interface FormDateTimeProps {
  component: ComponentDefinition;
}

const FormDateTime: React.FC<FormDateTimeProps> = ({ component }) => {
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
    computedVisible,
    computedDisabled,
    computedRequired,
    handleChange,
    handleClick,
    handleFocus,
    handleBlur,
    htmlAttributes,
  } = useFormComponent({ component: latestComponent, formMode });
  
  const variant = latestComponent.props?.variant || 'outlined';
  const fullWidth = latestComponent.props?.fullWidth !== false;
  const type = latestComponent.props?.type || 'datetime-local'; // datetime-local, date, time
  const size = latestComponent.props?.size || 'medium';
  const width = latestComponent.props?.width;

  const required = computedRequired !== undefined ? computedRequired : (latestComponent.props?.required || false);
  const disabled = computedDisabled !== undefined ? computedDisabled : (latestComponent.props?.disabled || false);
  const calculatedWidth = width || (fullWidth ? '100%' : 'auto');
  const displayValue = formMode ? boundValue : computedValue;
  const displayHelperText = validationError || computedHelperText || '';
  const hasError = !!validationError || !isValid;

  if (!computedVisible) return null;

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
      className={`${formMode ? '' : 'form-builder-datetime'} ${className}`.trim()}
      style={htmlAttributes}
    >
      <TextField
        label={computedLabel}
        type={type}
        value={displayValue || ''}
        placeholder={computedPlaceholder}
        variant={variant as any}
        fullWidth={!width && fullWidth}
        disabled={disabled}
        required={required}
        size={size as any}
        onChange={(e) => {
          if (formMode) {
            handleChange(e.target.value);
          }
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        InputLabelProps={{ shrink: true }}
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
      />
    </Box>
  );
};

export default FormDateTime;

