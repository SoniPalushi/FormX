import React, { memo } from 'react';
import { Paper, Typography } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import type { ComponentLibraryItem as ComponentLibraryItemType } from '../../stores/types';

interface ComponentLibraryItemProps {
  component: ComponentLibraryItemType;
}

const ComponentLibraryItemComponent: React.FC<ComponentLibraryItemProps> = ({ component }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${component.type}`,
    data: {
      type: component.type,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <Paper
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        p: 1,
        cursor: 'grab',
        textAlign: 'center',
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        // Use specific GPU-accelerated properties instead of 'all' for better performance
        transition: 'background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
        // Use will-change to hint browser about upcoming transforms
        willChange: 'transform, background-color',
        '&:hover': {
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
        },
        '&:active': {
          cursor: 'grabbing',
          transform: 'translateY(0)',
        },
        ...style,
      }}
      elevation={0}
    >
      <Typography 
        variant="caption" 
        sx={{ 
          fontSize: '0.7rem', 
          display: 'block', 
          fontWeight: 500,
        }}
      >
        {component.componentNameLabel}
      </Typography>
    </Paper>
  );
};

// Memoize the component to prevent unnecessary re-renders
const ComponentLibraryItem = memo(ComponentLibraryItemComponent, (prevProps, nextProps) => {
  return prevProps.component.type === nextProps.component.type;
});

export default ComponentLibraryItem;

