import React from 'react';
import { Typography, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormLabelProps {
  component: ComponentDefinition;
}

const FormLabel: React.FC<FormLabelProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode, components, findComponent } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get latest component from store to ensure real-time updates
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  // Use form component hook for computed properties and reactive updates
  const { computedLabel } = useFormComponent({ component: latestComponent, formMode });
  
  // Get label value - prefer computedLabel, fallback to props
  const label = computedLabel || latestComponent.props?.label || latestComponent.props?.text || '';

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
      }}
    >
      <Typography variant="body1">{label}</Typography>
    </Box>
  );
};

export default FormLabel;

