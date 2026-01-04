import React, { useState } from 'react';
import { Box, Paper, Tabs, Tab, Typography } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import DraggableComponent from '../builder/DraggableComponent';

interface FormViewStackProps {
  component: ComponentDefinition;
}

const FormViewStack: React.FC<FormViewStackProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const [activeTab, setActiveTab] = useState(0);
  const { setNodeRef, isOver } = useDroppable({
    id: component.id,
    data: {
      accepts: ['component'],
    },
  });

  const orientation = component.props?.orientation || 'horizontal';
  const variant = component.props?.variant || 'standard';
  const tabs = component.props?.tabs || ['View 1', 'View 2', 'View 3'];

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
      }}
    >
      <Paper
        sx={{
          bgcolor: isOver ? 'action.hover' : 'background.paper',
          minHeight: 200,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          orientation={orientation as any}
          variant={variant as any}
        >
          {tabs.map((tab: string, index: number) => (
            <Tab key={index} label={tab} />
          ))}
        </Tabs>
        <Box sx={{ p: 2, minHeight: 150 }}>
          {component.children && component.children.length > 0 ? (
            component.children
              .filter((_, index) => index === activeTab)
              .map((child) => (
                <DraggableComponent key={child.id} component={child} />
              ))
          ) : (
            <Typography variant="body2" color="text.secondary" align="center">
              Drop components here for view {activeTab + 1}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default FormViewStack;

