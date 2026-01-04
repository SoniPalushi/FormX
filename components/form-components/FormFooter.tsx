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

  const text = latestComponent.props?.text || latestComponent.props?.label || 'Footer';
  const variant = latestComponent.props?.variant || 'elevation';
  const elevation = latestComponent.props?.elevation || 3;

  return (
    <Box
      ref={setNodeRef}
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

