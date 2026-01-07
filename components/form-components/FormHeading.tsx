import React from 'react';
import { Typography, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';

interface FormHeadingProps {
  component: ComponentDefinition;
}

const FormHeading: React.FC<FormHeadingProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode });
  
  // Use form component hook for computed properties
  const { computedLabel } = useFormComponent({ component: latestComponent, formMode });
  
  // Get text value - PropertyEditor saves it as 'text', but also check 'label' for compatibility
  const text = computedLabel || latestComponent.props?.text || latestComponent.props?.label || '';
  const variant = latestComponent.props?.variant || 'h4';
  const align = latestComponent.props?.align || 'left';

  return (
    <Box
      onClick={(e) => {
        if (!formMode) {
          e.stopPropagation();
          selectComponent(component.id);
        }
      }}
      sx={{
        border: isSelected && !formMode ? '2px solid #1976d2' : '2px solid transparent',
        borderRadius: 1,
        p: formMode ? 0 : 0.5,
        cursor: formMode ? 'default' : 'pointer',
        display: 'block',
        width: latestComponent.props?.width || '100%',
        ...getSxStyles({
          includeMinDimensions: !formMode,
          defaultMinWidth: '300px',
          defaultMinHeight: '40px',
        }),
      }}
      className={`${formMode ? '' : 'form-builder-heading'} ${className}`.trim()}
    >
      <Typography variant={variant as any} align={align as any}>
        {text}
      </Typography>
    </Box>
  );
};

export default FormHeading;

