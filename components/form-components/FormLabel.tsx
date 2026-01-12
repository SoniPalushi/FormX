import React from 'react';
import { Typography, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';

interface FormLabelProps {
  component: ComponentDefinition;
}

const FormLabel: React.FC<FormLabelProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode });
  
  // Use form component hook for computed properties, responsive styles, and conditional rendering
  const {
    computedLabel,
    responsiveSx,
    wrapperResponsiveSx,
    shouldRender,
    handleClick,
    htmlAttributes,
  } = useFormComponent({ component: latestComponent, formMode });
  
  // Get text value - PropertyEditor saves it as 'text', but also check 'label' for compatibility
  // Priority: computedLabel (for computed properties) > text > label
  const text = computedLabel || latestComponent.props?.text || latestComponent.props?.label || '';
  
  // Typography props
  const variant = latestComponent.props?.variant || 'body1';
  const color = latestComponent.props?.color || 'textPrimary';
  const align = latestComponent.props?.align || 'inherit';
  const noWrap = latestComponent.props?.noWrap || false;
  const gutterBottom = latestComponent.props?.gutterBottom || false;

  // Don't render if conditional rendering says no
  if (!shouldRender) {
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
        display: 'inline-flex',
        alignItems: 'center',
        ...getSxStyles({
          includeMinDimensions: !formMode,
          defaultMinWidth: '100px',
          defaultMinHeight: '32px',
          additionalSx: wrapperResponsiveSx,
        }),
      }}
      className={`${formMode ? '' : 'form-builder-label'} ${className}`.trim()}
      style={htmlAttributes}
    >
      <Typography 
        variant={variant as any}
        color={color as any}
        align={align as any}
        noWrap={noWrap}
        gutterBottom={gutterBottom}
        sx={responsiveSx}
      >
        {text}
      </Typography>
    </Box>
  );
};

export default FormLabel;
