import React from 'react';
import { Box, CardMedia } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormImageProps {
  component: ComponentDefinition;
}

const FormImage: React.FC<FormImageProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const src = component.props?.src || component.props?.url || '';
  const alt = component.props?.alt || component.props?.label || '';
  const width = component.props?.width || 'auto';
  const height = component.props?.height || 'auto';

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
          onClick={(e) => e.stopPropagation()}
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

