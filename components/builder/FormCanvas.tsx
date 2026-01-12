import React, { useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import DraggableComponent from './DraggableComponent';
import LayoutSectionDropZone from './LayoutSectionDropZone';

interface FormCanvasProps {
  components: ComponentDefinition[];
}

const FormCanvas: React.FC<FormCanvasProps> = ({ components }) => {
  const { selectComponent, canvasMode, workAreaLayout } = useFormBuilderStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const isLayoutMode = canvasMode === 'layout';
  const hasWorkAreaLayout = workAreaLayout !== null;
  
  // Only use canvas as droppable when NOT using workAreaLayout
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
    disabled: hasWorkAreaLayout, // Disable canvas droppable when using layout sections
  });

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Deselect when clicking on blank canvas area
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('free-canvas-background')) {
      selectComponent(null);
    }
  };

  return (
    <Box
      ref={(node) => {
        setNodeRef(node);
        if (node) {
          (canvasRef as any).current = node;
        }
      }}
      onClick={handleCanvasClick}
      className="free-canvas-background"
      sx={{
        minHeight: '600px',
        height: '100%',
        width: '100%',
        border: '2px dashed',
        borderColor: isOver ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 2,
        bgcolor: isOver ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
        cursor: 'default',
        position: 'relative',
        overflow: isLayoutMode ? 'auto' : 'visible',
        // Grid background only in free mode
        backgroundImage: isLayoutMode ? 'none' : `
          linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0',
      }}
    >
      {/* Work Area Layout Mode */}
      {hasWorkAreaLayout ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: workAreaLayout.direction,
            gap: 2,
            width: '100%',
            height: '100%',
            minHeight: '500px',
          }}
        >
          {workAreaLayout.sections.map((section) => {
            // Find the section component from components array
            const sectionComponent = components.find(c => c.props?.sectionId === section.id);
            
            return (
              <LayoutSectionDropZone
                key={section.id}
                section={section}
                component={sectionComponent}
              />
            );
          })}
        </Box>
      ) : components.length === 0 ? (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'text.secondary',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', textAlign: 'center' }}>
            Drag components here to start building your form
            <br />
            <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.7 }}>
              {isLayoutMode ? 'Layout mode - components stack vertically' : 'Free positioning - drag components anywhere'}
            </Typography>
            <br />
            <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.5, mt: 1 }}>
              Tip: Click the Dashboard icon in toolbar to choose a predefined layout
            </Typography>
          </Typography>
        </Box>
      ) : isLayoutMode ? (
        // Layout mode - components stack vertically
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
          }}
        >
          {components.map((component) => (
            <DraggableComponent key={component.id} component={component} />
          ))}
        </Box>
      ) : (
        // Free positioning mode - absolute positioning
        <>
          {components.map((component, index) => {
            const position = component.props?.position || { x: 0, y: 0 };
            const positionType = component.props?.positionType || 'absolute';
            
            // For new components without position, stack them initially
            const defaultX = positionType === 'absolute' && position.x === 0 && position.y === 0 
              ? 20 + (index * 250) 
              : position.x;
            const defaultY = positionType === 'absolute' && position.x === 0 && position.y === 0 
              ? 20 + (index * 100) 
              : position.y;
            
            return (
              <Box
                key={component.id}
                sx={{
                  position: 'absolute',
                  left: `${defaultX}px`,
                  top: `${defaultY}px`,
                  // Ensure components are visible and draggable
                  zIndex: 1,
                  // Make sure component doesn't overflow canvas
                  maxWidth: 'calc(100% - ' + defaultX + 'px)',
                }}
              >
                <DraggableComponent component={component} />
              </Box>
            );
          })}
        </>
      )}
    </Box>
  );
};

export default FormCanvas;

