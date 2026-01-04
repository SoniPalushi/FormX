import React from 'react';
import { Divider, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormHRuleProps {
  component: ComponentDefinition;
}

const FormHRule: React.FC<FormHRuleProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const variant = component.props?.variant || 'fullWidth';
  const orientation = component.props?.orientation || 'horizontal';

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
        width: '100%',
      }}
    >
      <Divider variant={variant as any} orientation={orientation as any} />
    </Box>
  );
};

export default FormHRule;

