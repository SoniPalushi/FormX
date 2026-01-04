import React from 'react';
import { Box, CardMedia } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormImageProps {
  component: ComponentDefinition;
}

const FormImage: React.FC<FormImageProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode, components, findComponent } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get latest component from store to ensure real-time updates
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  // Use form component hook for computed properties
  const { computedLabel } = useFormComponent({ component: latestComponent, formMode });
  
  const src = latestComponent.props?.src || latestComponent.props?.url || '';
  const alt = computedLabel || latestComponent.props?.alt || latestComponent.props?.label || '';
  const width = latestComponent.props?.width || 'auto';
  const height = latestComponent.props?.height || 'auto';

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
        display: 'inline-block',
      }}
    >
      {src ? (
        <CardMedia
          component="img"
          image={src}
          alt={alt}
          sx={{
            width,
            height,
            objectFit: 'contain',
          }}
          onClick={(e) => {
            if (!formMode) {
              e.stopPropagation();
            }
          }}
        />
      ) : (
        <Box
          sx={{
            width: width === 'auto' ? 200 : width,
            height: height === 'auto' ? 150 : height,
            border: '2px dashed #ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          No image
        </Box>
      )}
    </Box>
  );
};

export default FormImage;

