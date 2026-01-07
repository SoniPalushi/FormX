import React from 'react';
import { Box, Typography } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import DraggableComponent from './DraggableComponent';

interface FormCanvasProps {
  components: ComponentDefinition[];
}

const FormCanvas: React.FC<FormCanvasProps> = ({ components }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });
  const { selectComponent } = useFormBuilderStore();

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Deselect when clicking on blank canvas area
    // Components stop propagation via e.stopPropagation(), so if this handler fires,
    // it means the click was on blank space (not on a component)
    selectComponent(null);
  };

  return (
    <Box
      ref={setNodeRef}
      onClick={handleCanvasClick}
      sx={{
        minHeight: 400,
        border: '2px dashed',
        borderColor: isOver ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 1.5,
        bgcolor: isOver ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
        cursor: 'default',
        // Prevent canvas from shifting during drag
        position: 'relative',
        transform: 'none',
        willChange: 'auto',
      }}
    >
      {components.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            color: 'text.secondary',
          }}
        >
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            Drag components here to start building your form
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            // Prevent layout shifts during drag
            position: 'relative',
            minHeight: 'fit-content',
          }}
        >
          {components.map((component) => (
            <DraggableComponent key={component.id} component={component} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FormCanvas;

