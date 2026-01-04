import React from 'react';
import { Box, Paper } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import DraggableComponent from '../builder/DraggableComponent';

interface FormContainerProps {
  component: ComponentDefinition;
}

const FormContainer: React.FC<FormContainerProps> = ({ component }) => {
  // Subscribe to components array to ensure re-render when component updates
  const components = useFormBuilderStore((state) => state.components);
  const { selectComponent, selectedComponentId, findComponent } = useFormBuilderStore();
  
  // Get the latest component data from store
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  const isSelected = selectedComponentId === component.id;
  const { setNodeRef, isOver } = useDroppable({
    id: latestComponent.id,
    data: {
      accepts: ['component'],
    },
  });

  // Get layout properties
  const flexDirection = latestComponent.props?.flexDirection || latestComponent.props?.direction || 'column';
  const gap = latestComponent.props?.gap || 1.5;
  const alignItems = latestComponent.props?.alignItems || 'stretch';
  const justifyContent = latestComponent.props?.justifyContent || 'flex-start';
  const flexWrap = latestComponent.props?.flexWrap || 'nowrap';

  return (
    <Paper
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation();
        selectComponent(latestComponent.id);
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
        minHeight: 50,
        bgcolor: isOver ? 'action.hover' : 'background.paper',
        position: 'relative',
      }}
    >
      {latestComponent.children && latestComponent.children.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: flexDirection as 'row' | 'column',
            gap: gap,
            alignItems: alignItems as any,
            justifyContent: justifyContent as any,
            flexWrap: flexWrap as any,
          }}
        >
          {latestComponent.children.map((child) => (
            <DraggableComponent key={child.id} component={child} />
          ))}
        </Box>
      ) : (
        <Box sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
          Drop components here
        </Box>
      )}
    </Paper>
  );
};

export default FormContainer;

