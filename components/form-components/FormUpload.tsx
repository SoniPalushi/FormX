import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormUploadProps {
  component: ComponentDefinition;
}

const FormUpload: React.FC<FormUploadProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode, components, findComponent } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get latest component from store to ensure real-time updates
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  const label = latestComponent.props?.label || 'Upload File';
  const accept = latestComponent.props?.accept || '*/*';
  const multiple = latestComponent.props?.multiple || false;
  const variant = latestComponent.props?.variant || 'outlined';
  const fullWidth = latestComponent.props?.fullWidth !== false;

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

