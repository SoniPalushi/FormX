import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import type { ComponentLibraryItem } from '../../stores/types';

interface ComponentLibraryItemProps {
  component: ComponentLibraryItem;
}

const ComponentLibraryItem: React.FC<ComponentLibraryItemProps> = ({ component }) => {
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
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(25, 118, 210, 0.1), transparent)',
          transition: 'left 0.5s ease',
        },
        '&:hover': {
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          borderColor: 'primary.main',
          transform: 'translateY(-4px) scale(1.02)',
          boxShadow: '0 6px 16px rgba(25, 118, 210, 0.3)',
          '&::before': {
            left: '100%',
          },
        },
        '&:active': {
          cursor: 'grabbing',
          transform: 'translateY(-2px) scale(0.98)',
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
          transition: 'font-weight 0.2s ease',
          '&:hover': {
            fontWeight: 600,
          },
        }}
      >
        {component.componentNameLabel}
      </Typography>
    </Paper>
  );
};

export default ComponentLibraryItem;

