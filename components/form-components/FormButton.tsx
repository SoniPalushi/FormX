import React from 'react';
import { Button, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormButtonProps {
  component: ComponentDefinition;
}

const FormButton: React.FC<FormButtonProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  const {
    computedLabel,
    responsiveSx,
    responsiveCss,
    wrapperResponsiveSx,
    wrapperResponsiveCss,
    shouldRender,
    handleClick,
    htmlAttributes,
  } = useFormComponent({ component, formMode });
  
  const variant = component.props?.variant || 'contained';
  const color = component.props?.color || 'primary';
  const width = component.props?.width;
  const margin = component.props?.margin;
  const padding = component.props?.padding;
  const classes = component.props?.classes || component.props?.className || [];

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
        display: 'inline-block',
        width: width || 'auto',
        margin: margin ? `${margin.top || 0}px ${margin.right || 0}px ${margin.bottom || 0}px ${margin.left || 0}px` : undefined,
        padding: padding ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px` : undefined,
        ...wrapperResponsiveSx,
      }}
      className={Array.isArray(classes) ? classes.join(' ') : classes}
      style={wrapperResponsiveCss ? { ...htmlAttributes, style: wrapperResponsiveCss } : htmlAttributes}
    >
      <Button 
        variant={variant as any} 
        color={color as any} 
        fullWidth={!!width && width !== 'auto'}
        onClick={(e) => {
          if (!formMode) {
            e.stopPropagation();
          }
        }}
        sx={{
          ...responsiveSx,
        }}
        style={responsiveCss ? { style: responsiveCss } : undefined}
        {...htmlAttributes}
      >
        {computedLabel || component.props?.label || component.props?.text || 'Button'}
      </Button>
    </Box>
  );
};

export default FormButton;

