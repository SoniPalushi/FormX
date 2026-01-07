import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import type { ComponentDefinition } from '../../stores/types';
import FormComponentRenderer from '../form-components/FormComponentRenderer';

interface DraggableComponentProps {
  component: ComponentDefinition;
  children?: React.ReactNode;
}

const DraggableComponent: React.FC<DraggableComponentProps> = ({ component, children }) => {
  // Subscribe to components array to ensure re-render when component updates
  const components = useFormBuilderStore((state) => state.components);
  const { selectComponent, selectedComponentId, findComponent } = useFormBuilderStore();
  
  // Get the latest component data from store - this will re-run when components changes
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  const isSelected = selectedComponentId === component.id;
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create custom listeners that only activate on drag handle or after delay
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: latestComponent.id,
    data: {
      type: 'existing-component',
      component: latestComponent,
    },
  });

  // Separate drag handle listeners
  const dragHandleListeners = {
    onPointerDown: (e: React.PointerEvent) => {
      // Only allow drag if holding Shift or clicking on a specific area
      if (e.shiftKey || (e.target as HTMLElement).closest('[data-drag-handle]')) {
        listeners?.onPointerDown?.(e as any);
      }
    },
  };

  // Don't apply transform to the original component - let DragOverlay handle visual feedback
  // This prevents layout shifts
  const style = undefined;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Handle pointer down - start tracking for click detection
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only track left mouse button
    if (e.button !== 0) return;
    
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    
    // Set a timeout to detect click (if no drag happens)
    clickTimeoutRef.current = setTimeout(() => {
      if (dragStartRef.current && !isDragging) {
        // Check if mouse hasn't moved much
        const deltaX = Math.abs(e.clientX - dragStartRef.current.x);
        const deltaY = Math.abs(e.clientY - dragStartRef.current.y);
        if (deltaX < 5 && deltaY < 5) {
          selectComponent(component.id);
        }
      }
      dragStartRef.current = null;
    }, 150);
  };

  // Handle pointer move - cancel click if dragging
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartRef.current) {
      const deltaX = Math.abs(e.clientX - dragStartRef.current.x);
      const deltaY = Math.abs(e.clientY - dragStartRef.current.y);
      // If moved more than 5px, cancel click timeout
      if (deltaX > 5 || deltaY > 5) {
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }
      }
    }
  };

  // Handle pointer up - immediate click detection
  const handlePointerUp = (e: React.PointerEvent) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    
    if (dragStartRef.current && !isDragging) {
      const deltaX = Math.abs(e.clientX - dragStartRef.current.x);
      const deltaY = Math.abs(e.clientY - dragStartRef.current.y);
      
      // If mouse didn't move much, treat as click
      if (deltaX < 5 && deltaY < 5) {
        e.stopPropagation();
        selectComponent(component.id);
      }
    }
    dragStartRef.current = null;
  };

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      data-component-id={latestComponent.id}
      sx={{
        position: 'relative',
        cursor: 'pointer',
        // When dragging, make invisible but maintain exact dimensions and position
        // Use opacity instead of visibility to prevent layout recalculation
        opacity: isDragging ? 0 : 1,
        pointerEvents: isDragging ? 'none' : 'auto',
        // Critical: Maintain the component's space in the layout flow
        // Don't use display: none or visibility: hidden as they can cause shifts
        outline: isSelected && !isDragging ? '2px solid' : '2px solid transparent',
        outlineColor: isSelected && !isDragging ? 'primary.main' : 'transparent',
        outlineOffset: '2px',
        borderRadius: 1.5,
        // Disable all transitions during drag to prevent layout shifts
        transition: isDragging ? 'none !important' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        // Never apply transform during drag - let DragOverlay handle it
        transform: isDragging ? 'none !important' : (isSelected ? 'scale(1.01)' : 'scale(1)'),
        boxShadow: isSelected && !isDragging ? '0 4px 12px rgba(25, 118, 210, 0.2)' : 'none',
        // Prevent any layout shifts by maintaining dimensions
        willChange: isDragging ? 'auto' : 'transform',
        // Ensure the component doesn't collapse
        minHeight: 'fit-content',
        '&:hover': {
          outline: isSelected && !isDragging ? '2px solid' : '2px dashed',
          outlineColor: isSelected && !isDragging ? 'primary.main' : 'primary.light',
          transform: isDragging ? 'none !important' : (isSelected ? 'scale(1.02)' : 'scale(1.01)'),
          boxShadow: '0 6px 16px rgba(25, 118, 210, 0.15)',
        },
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Always allow clicks to select
        selectComponent(latestComponent.id);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Drag handle - only visible when selected, for dragging */}
      {isSelected && (
        <Box
          {...listeners}
          data-drag-handle
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 20,
            height: 20,
            cursor: 'grab',
            zIndex: 10,
            bgcolor: 'rgba(25, 118, 210, 0.1)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.7,
              },
            },
            '&:hover': {
              bgcolor: 'rgba(25, 118, 210, 0.25)',
              transform: 'scale(1.1) rotate(5deg)',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
            },
            '&:active': {
              cursor: 'grabbing',
              transform: 'scale(0.95)',
            },
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Box
            sx={{
              width: '10px',
              height: '10px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 3px)',
              gridTemplateRows: 'repeat(3, 3px)',
              gap: '1px',
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: '2px',
                  height: '2px',
                  bgcolor: 'primary.main',
                  borderRadius: '50%',
                }}
              />
            ))}
          </Box>
        </Box>
      )}
      
      {/* Content - clickable for selection */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children || <FormComponentRenderer component={latestComponent} />}
      </Box>
    </Box>
  );
};

export default DraggableComponent;

