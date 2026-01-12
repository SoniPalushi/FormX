import React from 'react';
import { Box, Paper, Grid as MuiGrid, Typography } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useComponentProperties } from '../../hooks/useComponentProperties';
import DraggableComponent from '../builder/DraggableComponent';
import { GridOn as GridIcon } from '@mui/icons-material';

interface FormGridProps {
  component: ComponentDefinition;
}

const FormGrid: React.FC<FormGridProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode, findComponent, components } = useFormBuilderStore();
  
  // Get latest component from store to ensure we have updated children
  const latestFromStore = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  // Get dynamic properties using reusable hook
  const { latestComponent: componentWithProps, className, getSxStyles } = useComponentProperties({ 
    component: latestFromStore, 
    formMode: false 
  });
  
  const isSelected = selectedComponentId === component.id;
  const { setNodeRef, isOver } = useDroppable({
    id: component.id,
    data: {
      type: 'container',
      accepts: ['component'],
      componentType: 'Grid',
    },
    disabled: formMode,
  });

  // Get grid properties - simplified to standard grid only (max 6 columns)
  const columns = Math.min(componentWithProps.props?.columns || 2, 6);
  const spacing = componentWithProps.props?.spacing || 2;

  // Render standard MUI Grid
  const renderGrid = () => {
    if (!componentWithProps.children || componentWithProps.children.length === 0) {
      return (
        <Box 
          sx={{ 
            color: 'text.secondary', 
            textAlign: 'center', 
            py: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            minHeight: '100px',
          }}
        >
          <GridIcon sx={{ fontSize: 40, opacity: 0.5 }} />
          <Typography variant="body2">
            {isOver ? 'Release to drop here' : 'Drop components here'}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {columns} columns • Spacing: {spacing}
          </Typography>
        </Box>
      );
    }

    // Standard MUI Grid with configurable columns (max 6)
    // Calculate default span: each child takes one "visual column"
    const defaultSpan = Math.floor(12 / columns) || 6;
    
    return (
      <MuiGrid container spacing={spacing}>
        {componentWithProps.children.map((child) => {
          // Get column span from child props or use calculated default
          const md = child.props?.md || child.props?.columnSpan || defaultSpan;
          const xs = child.props?.xs || 12; // Full width on mobile
          const sm = child.props?.sm || Math.min(md * 2, 12); // Double span on tablets
          const lg = child.props?.lg || md;
          const xl = child.props?.xl || lg;

          return (
            <MuiGrid item xs={xs} sm={sm} md={md} lg={lg} xl={xl} key={child.id}>
              <DraggableComponent component={child} />
            </MuiGrid>
          );
        })}
      </MuiGrid>
    );
  };

  return (
    <Paper
      ref={setNodeRef}
      data-droppable-id={component.id}
      data-component-type="Grid"
      onClick={(e) => {
        if (!formMode) {
          e.stopPropagation();
          selectComponent(component.id);
        }
      }}
      sx={{
        border: isSelected
          ? '2px solid #1976d2'
          : isOver
          ? '3px dashed #4caf50'
          : '2px dashed #bdbdbd',
        borderRadius: 1,
        p: componentWithProps.props?.padding ? undefined : 2,
        cursor: formMode ? 'default' : 'pointer',
        bgcolor: isOver ? 'rgba(76, 175, 80, 0.1)' : 'background.paper',
        position: 'relative',
        minHeight: componentWithProps.props?.height || '150px',
        minWidth: componentWithProps.props?.width || '100%',
        pointerEvents: 'auto',
        zIndex: isOver ? 10 : 1,
        transition: 'all 0.2s ease',
        ...getSxStyles({
          includeMinDimensions: !formMode,
          defaultMinWidth: componentWithProps.props?.width || '100%',
          defaultMinHeight: componentWithProps.props?.height || '150px',
        }),
      }}
      className={`form-builder-grid ${className}`.trim()}
      elevation={isOver ? 2 : 0}
    >
      {/* Grid info indicator */}
      {!formMode && (
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            bgcolor: 'primary.main',
            color: 'white',
            px: 1,
            py: 0.25,
            borderRadius: 0.5,
            fontSize: '0.65rem',
            fontWeight: 600,
            opacity: 0.8,
          }}
        >
          Grid {columns}col
        </Box>
      )}
      {renderGrid()}
    </Paper>
  );
};

export default FormGrid;
