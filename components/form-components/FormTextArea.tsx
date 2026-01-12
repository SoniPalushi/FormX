import React from 'react';
import { TextField, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';

interface FormTextAreaProps {
  component: ComponentDefinition;
}

const FormTextArea: React.FC<FormTextAreaProps> = ({ component }) => {
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
  
  const rows = latestComponent.props?.rows || 4;
  const variant = latestComponent.props?.variant || 'outlined';
  const fullWidth = latestComponent.props?.fullWidth !== false;
  const required = latestComponent.props?.required || false;
  const disabled = latestComponent.props?.disabled || false;
  const maxLength = latestComponent.props?.maxLength;
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
          defaultMinWidth: '300px',
          defaultMinHeight: '120px',
          additionalSx: wrapperResponsiveSx,
        }),
      }}
      className={`${formMode ? '' : 'form-builder-text-area'} ${className}`.trim()}
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
        multiline
        rows={rows}
        inputProps={{
          maxLength,
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

export default FormTextArea;

