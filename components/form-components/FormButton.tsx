import React from 'react';
import { Button, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormButtonProps {
  component: ComponentDefinition;
}

const FormButton: React.FC<FormButtonProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode, components, findComponent } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get latest component from store to ensure real-time updates
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  const {
    computedLabel,
    responsiveSx,
    responsiveCss,
    wrapperResponsiveSx,
    wrapperResponsiveCss,
    shouldRender,
    handleClick,
    htmlAttributes,
  } = useFormComponent({ component: latestComponent, formMode });
  
  const variant = latestComponent.props?.variant || 'contained';
  const color = latestComponent.props?.color || 'primary';
  const width = latestComponent.props?.width;
  const margin = latestComponent.props?.margin;
  const padding = latestComponent.props?.padding;
  const classes = latestComponent.props?.classes || latestComponent.props?.className || [];

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
        {computedLabel || latestComponent.props?.label || latestComponent.props?.text || 'Button'}
      </Button>
    </Box>
  );
};

export default FormButton;

