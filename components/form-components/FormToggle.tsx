import React from 'react';
import { FormControlLabel, Switch, Box, FormHelperText, FormControl } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';

interface FormToggleProps {
  component: ComponentDefinition;
}

const FormToggle: React.FC<FormToggleProps> = ({ component }) => {
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
    computedVisible,
    computedDisabled,
    computedRequired,
    handleChange,
    handleClick,
    htmlAttributes,
  } = useFormComponent({ component: latestComponent, formMode });
  
  const checked = latestComponent.props?.checked || false;
  const color = latestComponent.props?.color || 'primary';
  const size = latestComponent.props?.size || 'medium';
  const width = latestComponent.props?.width;

  const disabled = computedDisabled !== undefined ? computedDisabled : (latestComponent.props?.disabled || false);
  const required = computedRequired !== undefined ? computedRequired : (latestComponent.props?.required || false);
  const displayChecked = formMode ? (boundValue ?? false) : (computedValue ?? checked);
  const hasError = !!validationError || !isValid;
  const displayHelperText = validationError || computedHelperText || '';

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
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: width || 'auto',
        ...getSxStyles({
          includeMinDimensions: !formMode,
          defaultMinWidth: '200px',
          defaultMinHeight: '42px',
          additionalSx: wrapperResponsiveSx,
        }),
      }}
      className={`${formMode ? '' : 'form-builder-toggle'} ${className}`.trim()}
      style={htmlAttributes}
    >
      <FormControl error={hasError} required={required}>
        <FormControlLabel
          control={
            <Switch
              checked={displayChecked}
              disabled={!formMode || disabled}
              color={color as any}
              size={size as any}
              required={required}
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
            />
          }
          label={computedLabel || latestComponent.props?.label || ''}
          onClick={(e) => {
            if (!formMode) {
              e.stopPropagation();
            }
          }}
        />
        {displayHelperText && (
          <FormHelperText sx={{ ml: 0 }}>{displayHelperText}</FormHelperText>
        )}
      </FormControl>
    </Box>
  );
};

export default FormToggle;

