import React from 'react';
import { TextField, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormDateTimeProps {
  component: ComponentDefinition;
}

const FormDateTime: React.FC<FormDateTimeProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const label = component.props?.label || '';
  const value = component.props?.value || '';
  const variant = component.props?.variant || 'outlined';
  const fullWidth = component.props?.fullWidth !== false;
  const type = component.props?.type || 'datetime-local'; // datetime-local, date, time

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
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      <TextField
        label={label}
        type={type}
        value={value}
        variant={variant as any}
        fullWidth={fullWidth}
        disabled
        InputLabelProps={{ shrink: true }}
        onClick={(e) => e.stopPropagation()}
      />
    </Box>
  );
};

export default FormDateTime;

