import React from 'react';
import { Box, Paper } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useComponentProperties } from '../../hooks/useComponentProperties';
import DraggableComponent from '../builder/DraggableComponent';

interface FormContainerProps {
  component: ComponentDefinition;
}

const FormContainer: React.FC<FormContainerProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  
  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode: false });
  
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
        p: latestComponent.props?.padding ? undefined : 2, // Use padding from props if set, otherwise default to 2
        cursor: 'pointer',
        bgcolor: isOver ? 'action.hover' : 'background.paper',
        position: 'relative',
        ...getSxStyles({
          includeMinDimensions: true,
          defaultMinWidth: '100%',
          defaultMinHeight: latestComponent.props?.height || '100px',
        }),
      }}
      className={`form-builder-container ${className}`.trim()}
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

