import React from 'react';
import { FormControlLabel, Switch, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormToggleProps {
  component: ComponentDefinition;
}

const FormToggle: React.FC<FormToggleProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const label = component.props?.label || '';
  const checked = component.props?.checked || false;
  const color = component.props?.color || 'primary';

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
      <FormControlLabel
        control={<Switch checked={checked} disabled color={color as any} />}
        label={label}
        onClick={(e) => e.stopPropagation()}
      />
    </Box>
  );
};

export default FormToggle;

