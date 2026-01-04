import React from 'react';
import { Typography, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormHeadingProps {
  component: ComponentDefinition;
}

const FormHeading: React.FC<FormHeadingProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const text = component.props?.text || component.props?.label || '';
  const variant = component.props?.variant || 'h4';
  const align = component.props?.align || 'left';

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

