import React from 'react';
import { Box, Alert } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormRequiredFieldValidatorProps {
  component: ComponentDefinition;
}

/**
 * RequiredFieldValidator - Validates that a target field is required
 * This is a non-visual component that adds validation to other components
 */
const FormRequiredFieldValidator: React.FC<FormRequiredFieldValidatorProps> = ({ component }) => {
  const { formMode } = useFormBuilderStore();
  const { shouldRender } = useFormComponent({ component, formMode });

  // Validators are typically non-visual in form mode
  // They modify validation rules of target components
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
          Required Field Validator (applies to target field)
        </Alert>
      </Box>
    );
  }

  // In form mode, validators don't render visually
  // They work by modifying the validation schema of target components
  return null;
};

export default FormRequiredFieldValidator;

