import React, { useState, useRef } from 'react';
import { Box, Drawer, IconButton, Tooltip } from '@mui/material';
import { ChevronRight as ChevronRightIcon, ChevronLeft as ChevronLeftIcon } from '@mui/icons-material';
import { DndContext, DragOverlay, pointerWithin, closestCenter, rectIntersection } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import ComponentsPanel from './ComponentsPanel';
import WorkArea from './WorkArea';
import PropertyPanel from './PropertyPanel';
import FormComponentRenderer from '../form-components/FormComponentRenderer';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useHistoryStore } from '../../stores/historyStore';
import type { ComponentDefinition, ComponentType } from '../../stores/types';

const DRAWER_WIDTH = 400;
const PROPERTY_PANEL_WIDTH = 300;

const BuilderContent: React.FC = () => {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const { components, previewMode, addComponent, moveComponent, findComponent, updateComponent, canvasMode } = useFormBuilderStore();
  const { addToHistory } = useHistoryStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<ComponentDefinition | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Track mouse position during drag for free positioning
  React.useEffect(() => {
    if (activeId) {
      const handleMouseMove = (e: MouseEvent) => {
        const canvasElement = document.querySelector('[data-canvas-container]') as HTMLElement;
        if (canvasElement) {
          const rect = canvasElement.getBoundingClientRect();
          const x = e.clientX - rect.left - 16; // Subtract padding
          const y = e.clientY - rect.top - 16;
          setDragPosition({ x: Math.max(0, x), y: Math.max(0, y) });
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [activeId]);

  const getDefaultProps = (type: ComponentType): Record<string, any> => {
    const defaults: Partial<Record<ComponentType, Record<string, any>>> = {
      Label: { text: 'Label', label: 'Label' },
      Heading: { text: 'Heading', variant: 'h4' },
      Link: { text: 'Link', href: '#' },
      HRule: { variant: 'fullWidth' },
      Button: { label: 'Button', variant: 'contained' },
      TextInput: { label: 'Text Input', placeholder: 'Enter text...' },
      TextArea: { label: 'Text Area', rows: 4 },
      Select: { label: 'Select', options: [], fullWidth: true },
      DropDown: { label: 'Dropdown', options: [], fullWidth: true },
      CheckBox: { label: 'Checkbox', checked: false },
      CheckBoxGroup: { label: 'Checkbox Group', options: [] },
      RadioGroup: { label: 'Radio Group', options: [] },
      Toggle: { label: 'Toggle', checked: false },
      DateTime: { label: 'Date Time', type: 'datetime-local' },
      DateTimeCb: { label: 'Date Time', type: 'datetime-local' },
      Image: { src: '', alt: 'Image' },
      Upload: { label: 'Upload File' },
      MultiUpload: { label: 'Upload Files', multiple: true },
      Container: { classes: [] },
      Form: {},
      Header: {},
      Footer: {},
      SideNav: {},
      ViewStack: {},
      Amount: { label: 'Amount' },
      Tree: {},
      AutoComplete: { label: 'AutoComplete' },
      CurrencyExRate: {},
      AutoBrowse: {},
      Repeater: {},
      RepeaterEx: {},
      List: {},
      DataGrid: {},
      CalendarDay: {},
      CalendarWeek: {},
      CalendarMonth: {},
      Calendar: {},
      CreditCard: {},
      Wizard: {},
      RequiredFieldValidator: {},
      RangeValidator: {},
      RegExValidator: {},
      DataBrowse: {},
      MapLocationPicker: {},
      Grid: { gridType: 'standard', columns: 12, spacing: 2 },
    };
    return defaults[type] || {};
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const data = event.active.data.current;
    
    if (data?.type === 'existing-component') {
      // Dragging an existing component
      setDraggedComponent(data.component);
    } else if (data?.type) {
      // Dragging a new component from library
      setDraggedComponent({
        id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: data.type as ComponentType,
        props: getDefaultProps(data.type as ComponentType),
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Track mouse position during drag for free positioning
    if (event.over?.id === 'canvas') {
      const canvasElement = document.querySelector('[data-canvas-container]') as HTMLElement;
      if (canvasElement) {
        // Use the over rect to get approximate position
        const overRect = event.over.rect;
        const canvasRect = canvasElement.getBoundingClientRect();
        const x = overRect.left - canvasRect.left + (overRect.width / 2) - 16; // Center of drop zone
        const y = overRect.top - canvasRect.top + (overRect.height / 2) - 16;
        setDragPosition({ x: Math.max(0, x), y: Math.max(0, y) });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !draggedComponent) {
      setActiveId(null);
      setDraggedComponent(null);
      setDragPosition(null);
      return;
    }

    const targetId = over.id as string;
    const isNewComponent = active.data.current?.type !== 'existing-component';
    const activeComponentId = active.id as string;

    // Save current state for undo/redo before making changes
    addToHistory(JSON.parse(JSON.stringify(components)));

    // Check if dropping into a container first (containers take priority over canvas)
    const targetComponent = targetId !== 'canvas' ? findComponent(targetId) : null;
    
    // Check if it's a layout section (from Work Area Layout)
    const isLayoutSection = targetComponent?.props?.isLayoutSection === true;
    
    const isContainer = targetComponent && (
      isLayoutSection ||
      targetComponent.type === 'Container' || 
      targetComponent.type === 'Grid' || 
      targetComponent.type === 'Form' || 
      targetComponent.type === 'Header' || 
      targetComponent.type === 'Footer' || 
      targetComponent.type === 'SideNav' || 
      targetComponent.type === 'ViewStack' || 
      targetComponent.type === 'Repeater' || 
      targetComponent.type === 'RepeaterEx' || 
      targetComponent.type === 'Wizard'
    );

    // Handle dropping into containers
    if (isContainer) {
      if (isNewComponent) {
        // Adding new component to a container
        addComponent(draggedComponent, targetId);
      } else if (targetId !== activeComponentId) {
        // Moving existing component to a container (avoid dropping on itself)
        moveComponent(activeComponentId, targetId);
      }
    } else if (targetId === 'canvas') {
      // Handle dropping on canvas based on canvas mode
      if (canvasMode === 'free') {
        // Free positioning mode - use absolute positioning
        const canvasElement = document.querySelector('[data-canvas-container]') as HTMLElement;
        let finalPosition = dragPosition;
        
        // If we don't have drag position, use over rect
        if (!finalPosition && canvasElement && event.over) {
          const canvasRect = canvasElement.getBoundingClientRect();
          const overRect = event.over.rect;
          const x = overRect.left - canvasRect.left - 16;
          const y = overRect.top - canvasRect.top - 16;
          finalPosition = { x: Math.max(0, x), y: Math.max(0, y) };
        }
        
        // Default position if still no position - stack components
        if (!finalPosition) {
          const existingCount = components.filter(c => !c.parentId).length;
          finalPosition = { x: 20 + (existingCount * 50), y: 20 + (existingCount * 50) };
        }

        if (isNewComponent) {
          // Adding new component with absolute position
          const newComponent = {
            ...draggedComponent,
            props: {
              ...draggedComponent.props,
              position: finalPosition,
              positionType: 'absolute',
            },
          };
          addComponent(newComponent);
        } else {
          // Moving existing component - update its position
          updateComponent(activeComponentId, {
            props: {
              ...findComponent(activeComponentId)?.props,
              position: finalPosition,
              positionType: 'absolute',
            },
          });
          // Also move to canvas root if it was in a container
          moveComponent(activeComponentId, null);
        }
      } else {
        // Layout mode - just add/move without position
        if (isNewComponent) {
          addComponent(draggedComponent);
        } else {
          moveComponent(activeComponentId, null);
        }
      }
    }

    // Add new state to history after operation completes
    requestAnimationFrame(() => {
      const { components: updatedComponents } = useFormBuilderStore.getState();
      addToHistory(updatedComponents);
    });

    setActiveId(null);
    setDraggedComponent(null);
    setDragPosition(null);
  };

  return (
    <DndContext
      collisionDetection={(args) => {
        // Use multiple strategies to find the best drop target
        
        // 1. First try rectIntersection - best for finding droppables under the dragged element
        const rectCollisions = rectIntersection(args);
        
        // 2. Then try pointerWithin - finds droppables directly under the pointer
        const pointerCollisions = pointerWithin(args);
        
        // 3. Combine and prioritize non-canvas droppables
        const allCollisions = [...rectCollisions, ...pointerCollisions];
        const uniqueCollisions = allCollisions.filter((collision, index, self) => 
          index === self.findIndex((c) => c.id === collision.id)
        );
        
        // Filter out canvas to prefer sections/containers
        const nonCanvasCollisions = uniqueCollisions.filter(
          (collision) => collision.id !== 'canvas'
        );
        
        if (nonCanvasCollisions.length > 0) {
          return nonCanvasCollisions;
        }
        
        // Fall back to any collisions found
        if (uniqueCollisions.length > 0) {
          return uniqueCollisions;
        }
        
        // Last resort - try closestCenter
        return closestCenter(args);
      }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      // Prevent drag from affecting parent containers
      autoScroll={{ threshold: { x: 0, y: 0.2 } }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          flex: 1, 
          overflow: 'hidden',
          // Prevent workspace container from reacting to drag
          position: 'relative',
          transform: 'none !important',
          willChange: 'auto',
        }}
      >
        {/* Left Drawer - Component Library */}
        <Drawer
          variant="persistent"
          open={leftOpen}
          sx={{
            width: leftOpen ? DRAWER_WIDTH : 0,
            flexShrink: 0,
            transition: 'width 0.2s ease',
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100%',
              borderRight: '1px solid #e0e0e0',
            },
          }}
        >
          <ComponentsPanel onToggle={() => setLeftOpen(false)} />
        </Drawer>
        
        {/* Left Drawer Toggle Button - visible when drawer is closed */}
        {!leftOpen && (
          <Tooltip title="Show Components" placement="right">
            <IconButton
              onClick={() => setLeftOpen(true)}
              sx={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1200,
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: '0 8px 8px 0',
                width: 24,
                height: 48,
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* Center - Work Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'background.default',
            // Prevent main area from reacting to drag
            position: 'relative',
            transform: 'none',
            willChange: 'auto',
          }}
        >
          <WorkArea />
        </Box>

        {/* Right Drawer - Property Editor */}
        <Drawer
          variant="persistent"
          anchor="right"
          open={rightOpen}
          sx={{
            width: rightOpen ? PROPERTY_PANEL_WIDTH : 0,
            flexShrink: 0,
            transition: 'width 0.2s ease',
            '& .MuiDrawer-paper': {
              width: PROPERTY_PANEL_WIDTH,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100%',
              borderLeft: '1px solid #e0e0e0',
            },
          }}
        >
          <PropertyPanel onToggle={() => setRightOpen(false)} />
        </Drawer>
        
        {/* Right Drawer Toggle Button - visible when drawer is closed */}
        {!rightOpen && (
          <Tooltip title="Show Properties" placement="left">
            <IconButton
              onClick={() => setRightOpen(true)}
              sx={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1200,
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: '8px 0 0 8px',
                width: 24,
                height: 48,
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <DragOverlay
        dropAnimation={null} // Disable drop animation to prevent layout shifts
        style={{
          cursor: 'grabbing',
        }}
      >
        {activeId && draggedComponent ? (
          <Box
            sx={{
              opacity: 0.9,
              transform: 'rotate(2deg)',
              pointerEvents: 'none',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              willChange: 'transform',
              maxWidth: '400px',
              // Prevent any layout impact
              isolation: 'isolate',
            }}
          >
            <FormComponentRenderer component={draggedComponent} />
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default BuilderContent;
