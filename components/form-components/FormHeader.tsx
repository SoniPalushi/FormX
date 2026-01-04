import React from 'react';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import DraggableComponent from '../builder/DraggableComponent';

interface FormHeaderProps {
  component: ComponentDefinition;
}

const FormHeader: React.FC<FormHeaderProps> = ({ component }) => {
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

  const title = latestComponent.props?.title || latestComponent.props?.text || 'Header';
  const position = latestComponent.props?.position || 'static';
  const color = latestComponent.props?.color || 'primary';

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
        mb: 1,
      }}
    >
      <AppBar
        position={position as any}
        color={color as any}
        sx={{
          bgcolor: isOver ? 'action.hover' : undefined,
        }}
      >
        <Toolbar>
          {component.children && component.children.length > 0 ? (
            component.children.map((child) => (
              <DraggableComponent key={child.id} component={child} />
            ))
          ) : (
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default FormHeader;

