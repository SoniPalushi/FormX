import React from 'react';
import { Box, Alert } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormRegExValidatorProps {
  component: ComponentDefinition;
}

/**
 * RegExValidator - Validates that a target field matches a regular expression
 * This is a non-visual component that adds validation to other components
 */
const FormRegExValidator: React.FC<FormRegExValidatorProps> = ({ component }) => {
  const { formMode } = useFormBuilderStore();
  const { shouldRender } = useFormComponent({ component, formMode });

  const pattern = component.props?.pattern || component.props?.regex || '';
  const errorMessage = component.props?.errorMessage || component.props?.message || 'Invalid format';

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
          RegEx Validator: {pattern || 'Not configured'}
        </Alert>
      </Box>
    );
  }

  // In form mode, validators don't render visually
  return null;
};

export default FormRegExValidator;

