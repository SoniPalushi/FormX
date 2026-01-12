import React from 'react';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';
import DraggableComponent from '../builder/DraggableComponent';

interface FormHeaderProps {
  component: ComponentDefinition;
}

const FormHeader: React.FC<FormHeaderProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode });
  
  // Use the form component hook for conditional rendering and computed properties
  const {
    computedLabel,
    responsiveSx,
    wrapperResponsiveSx,
    shouldRender,
    handleClick,
    htmlAttributes,
  } = useFormComponent({ component: latestComponent, formMode });
  
  const { setNodeRef, isOver } = useDroppable({
    id: latestComponent.id,
    data: {
      accepts: ['component'],
    },
    disabled: formMode,
  });

  const title = computedLabel || latestComponent.props?.title || latestComponent.props?.text || 'Header';
  const position = latestComponent.props?.position || 'static';
  const color = latestComponent.props?.color || 'primary';

  // Don't render if conditional rendering says no
  if (!shouldRender) {
    return null;
  }

  return (
    <Box
      ref={setNodeRef}
      onClick={(e) => {
        if (!formMode) {
          e.stopPropagation();
          selectComponent(component.id);
        } else {
          handleClick(e);
        }
      }}
      sx={{
        border: isSelected && !formMode
          ? '2px solid #1976d2'
          : isOver && !formMode
          ? '2px dashed #1976d2'
          : '2px solid transparent',
        borderRadius: 1,
        cursor: formMode ? 'default' : 'pointer',
        position: 'relative',
        mb: 1,
        ...getSxStyles({
          includeMinDimensions: !formMode,
          additionalSx: wrapperResponsiveSx,
        }),
      }}
      className={`${formMode ? '' : 'form-builder-header'} ${className}`.trim()}
      style={htmlAttributes}
    >
      <AppBar
        position={position as any}
        color={color as any}
        sx={{
          bgcolor: isOver && !formMode ? 'action.hover' : undefined,
          ...responsiveSx,
        }}
      >
        <Toolbar>
          {latestComponent.children && latestComponent.children.length > 0 ? (
            latestComponent.children.map((child) => (
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
