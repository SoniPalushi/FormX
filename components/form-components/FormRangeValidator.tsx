import React from 'react';
import { Box, Alert } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormRangeValidatorProps {
  component: ComponentDefinition;
}

/**
 * RangeValidator - Validates that a target field value is within a range
 * This is a non-visual component that adds validation to other components
 */
const FormRangeValidator: React.FC<FormRangeValidatorProps> = ({ component }) => {
  const { formMode } = useFormBuilderStore();
  const { shouldRender } = useFormComponent({ component, formMode });

  const min = component.props?.min || component.props?.minimum;
  const max = component.props?.max || component.props?.maximum;

  if (!formMode) {
    // In builder mode, show a visual indicator
    return (
      <Box
        sx={{
          p: 1,
          border: '1px dashed #ccc',
          borderRadius: 1,
          bgcolor: 'info.light',
        }}
      >
        <Alert severity="info" sx={{ fontSize: '0.75rem', py: 0 }}>
          Range Validator: {min !== undefined && max !== undefined ? `${min} - ${max}` : 'Not configured'}
        </Alert>
      </Box>
    );
  }

  // In form mode, validators don't render visually
  return null;
};

export default FormRangeValidator;

