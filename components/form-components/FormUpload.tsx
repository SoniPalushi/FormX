import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormUploadProps {
  component: ComponentDefinition;
}

const FormUpload: React.FC<FormUploadProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const label = component.props?.label || 'Upload File';
  const accept = component.props?.accept || '*/*';
  const multiple = component.props?.multiple || false;
  const variant = component.props?.variant || 'outlined';
  const fullWidth = component.props?.fullWidth !== false;

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
      <Button
        variant={variant as any}
        component="label"
        startIcon={<CloudUploadIcon />}
        disabled
        fullWidth={fullWidth}
        onClick={(e) => e.stopPropagation()}
        sx={{ pointerEvents: 'none' }}
      >
        {label}
        <input
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          onClick={(e) => e.stopPropagation()}
        />
      </Button>
    </Box>
  );
};

export default FormUpload;

