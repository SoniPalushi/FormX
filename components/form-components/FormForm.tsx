import React from 'react';
import { Box, Paper } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import DraggableComponent from '../builder/DraggableComponent';

interface FormFormProps {
  component: ComponentDefinition;
}

const FormForm: React.FC<FormFormProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const { setNodeRef, isOver } = useDroppable({
    id: component.id,
    data: {
      accepts: ['component'],
    },
  });

  return (
    <Paper
      ref={setNodeRef}
      component="form"
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
        p: 2,
        cursor: 'pointer',
        minHeight: 100,
        bgcolor: isOver ? 'action.hover' : 'background.paper',
        position: 'relative',
      }}
    >
      {component.children && component.children.length > 0 ? (
        component.children.map((child) => (
          <DraggableComponent key={child.id} component={child} />
        ))
      ) : (
        <Box sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
          Drop form components here
        </Box>
      )}
    </Paper>
  );
};

export default FormForm;

