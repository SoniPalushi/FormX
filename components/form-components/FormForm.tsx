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
  const { selectComponent, selectedComponentId, formMode, components, findComponent } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get latest component from store to ensure real-time updates
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  const { setNodeRef, isOver } = useDroppable({
    id: latestComponent.id,
    data: {
      accepts: ['component'],
    },
    disabled: formMode,
  });

  return (
    <Paper
      ref={setNodeRef}
      component="form"
      onClick={(e) => {
        if (!formMode) {
          e.stopPropagation();
          selectComponent(component.id);
        }
      }}
      sx={{
        border: isSelected && !formMode
          ? '2px solid #1976d2'
          : isOver && !formMode
          ? '2px dashed #1976d2'
          : '2px solid transparent',
        borderRadius: 1,
        p: 2,
        cursor: formMode ? 'default' : 'pointer',
        minHeight: 100,
        bgcolor: isOver && !formMode ? 'action.hover' : 'background.paper',
        position: 'relative',
      }}
    >
      {latestComponent.children && latestComponent.children.length > 0 ? (
        latestComponent.children.map((child) => (
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

