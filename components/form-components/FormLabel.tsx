import React from 'react';
import { Typography, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormLabelProps {
  component: ComponentDefinition;
}

const FormLabel: React.FC<FormLabelProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const label = component.props?.label || component.props?.text || '';

  return (
    <Box
      onClick={(e) => {
        e.stopPropagation();
        selectComponent(component.id);
      }}
      sx={{
        border: isSelected ? '2px solid #1976d2' : '2px solid transparent',
        borderRadius: 1,
        p: 0.5,
        cursor: 'pointer',
        display: 'inline-block',
      }}
    >
      <Typography variant="body1">{label}</Typography>
    </Box>
  );
};

export default FormLabel;

