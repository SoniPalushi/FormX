import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import DraggableComponent from '../builder/DraggableComponent';

interface FormFooterProps {
  component: ComponentDefinition;
}

const FormFooter: React.FC<FormFooterProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const { setNodeRef, isOver } = useDroppable({
    id: component.id,
    data: {
      accepts: ['component'],
    },
  });

  const text = component.props?.text || component.props?.label || 'Footer';
  const variant = component.props?.variant || 'elevation';
  const elevation = component.props?.elevation || 3;

  return (
    <Box
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation();
        selectComponent(component.id);
      }}
      sx={{
        border: isSelected
          ? '2px solid #1976d2'
          : isOver
          ? '2px dashed #1976d2'
          : '2px solid transparent',
        borderRadius: 1,
        cursor: 'pointer',
        position: 'relative',
        mt: 1,
      }}
    >
      <Paper
        variant={variant as any}
        elevation={elevation}
        sx={{
          p: 2,
          bgcolor: isOver ? 'action.hover' : 'background.paper',
          minHeight: 60,
        }}
      >
        {component.children && component.children.length > 0 ? (
          component.children.map((child) => (
            <DraggableComponent key={child.id} component={child} />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" align="center">
            {text}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default FormFooter;

