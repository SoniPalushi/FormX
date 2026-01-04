import React from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import DraggableComponent from '../builder/DraggableComponent';

interface FormSideNavProps {
  component: ComponentDefinition;
}

const FormSideNav: React.FC<FormSideNavProps> = ({ component }) => {
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

  const width = latestComponent.props?.width || 240;
  const variant = latestComponent.props?.variant || 'permanent';
  const anchor = latestComponent.props?.anchor || 'left';

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
        display: 'inline-block',
        minHeight: 200,
      }}
    >
      <Drawer
        variant={variant as any}
        anchor={anchor as any}
        open={true}
        sx={{
          width: width,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: width,
            boxSizing: 'border-box',
            position: 'relative',
            height: 'auto',
            border: '1px solid #e0e0e0',
            bgcolor: isOver ? 'action.hover' : 'background.paper',
          },
        }}
      >
        {latestComponent.children && latestComponent.children.length > 0 ? (
          <Box sx={{ p: 2 }}>
            {latestComponent.children.map((child) => (
              <DraggableComponent key={child.id} component={child} />
            ))}
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Side Navigation
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Drop navigation items here
            </Typography>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default FormSideNav;

