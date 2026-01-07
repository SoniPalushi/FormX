import React from 'react';
import { Button, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';

interface FormButtonProps {
  component: ComponentDefinition;
}

const FormButton: React.FC<FormButtonProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode });
  
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
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: width || 'auto',
        ...getSxStyles({
          includeMinDimensions: !formMode,
          defaultMinWidth: '120px',
          defaultMinHeight: '36px',
          additionalSx: wrapperResponsiveSx,
        }),
      }}
      className={`${formMode ? '' : 'form-builder-button'} ${className}`.trim()}
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

