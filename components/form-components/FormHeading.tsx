import React from 'react';
import { Typography, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormHeadingProps {
  component: ComponentDefinition;
}

const FormHeading: React.FC<FormHeadingProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode, components, findComponent } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get latest component from store to ensure real-time updates
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  // Use form component hook for computed properties
  const { computedLabel } = useFormComponent({ component: latestComponent, formMode });
  
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
        display: 'inline-block',
        width: '100%',
      }}
    >
      <Typography variant={variant as any} align={align as any}>
        {text}
      </Typography>
    </Box>
  );
};

export default FormHeading;

