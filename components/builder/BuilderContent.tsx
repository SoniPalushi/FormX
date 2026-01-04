import React, { useState } from 'react';
import { Box, Drawer, Paper } from '@mui/material';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import ComponentsPanel from './ComponentsPanel';
import WorkArea from './WorkArea';
import PropertyPanel from './PropertyPanel';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useHistoryStore } from '../../stores/historyStore';
import type { ComponentDefinition, ComponentType } from '../../stores/types';

const DRAWER_WIDTH = 350;
const PROPERTY_PANEL_WIDTH = 300;

const BuilderContent: React.FC = () => {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const { components, previewMode, addComponent, moveComponent, findComponent } = useFormBuilderStore();
  const { addToHistory } = useHistoryStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<ComponentDefinition | null>(null);

  const getDefaultProps = (type: ComponentType): Record<string, any> => {
    const defaults: Partial<Record<ComponentType, Record<string, any>>> = {
      Label: { text: 'Label', label: 'Label' },
      Heading: { text: 'Heading', variant: 'h4' },
      Link: { text: 'Link', href: '#' },
      HRule: { variant: 'fullWidth' },
      Button: { label: 'Button', variant: 'contained' },
      TextInput: { label: 'Text Input', placeholder: 'Enter text...' },
      TextArea: { label: 'Text Area', rows: 4 },
      Select: { label: 'Select', options: [] },
      DropDown: { label: 'Dropdown', options: [] },
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !draggedComponent) {
      setActiveId(null);
      setDraggedComponent(null);
      return;
    }

    const targetId = over.id as string;
    const isNewComponent = active.data.current?.type !== 'existing-component';
    const activeComponentId = active.id as string;

    // Save current state for undo/redo before making changes
    addToHistory(JSON.parse(JSON.stringify(components)));

    if (isNewComponent && targetId === 'canvas') {
      // Adding new component to canvas root
      addComponent(draggedComponent);
    } else if (isNewComponent && targetId !== 'canvas') {
      // Adding new component to a container
      addComponent(draggedComponent, targetId);
    } else if (!isNewComponent && targetId === 'canvas') {
      // Moving existing component to canvas root
      moveComponent(activeComponentId, null);
    } else if (!isNewComponent && targetId !== 'canvas' && targetId !== activeComponentId) {
      // Moving existing component to a container (avoid dropping on itself)
      const targetComponent = findComponent(targetId);
      // Only allow dropping into containers
      if (targetComponent && (targetComponent.type === 'Container' || targetComponent.type === 'Form' || targetComponent.type === 'Header' || targetComponent.type === 'Footer' || targetComponent.type === 'SideNav' || targetComponent.type === 'ViewStack' || targetComponent.type === 'Repeater' || targetComponent.type === 'RepeaterEx' || targetComponent.type === 'Wizard')) {
        moveComponent(activeComponentId, targetId);
      }
    }

    // Add new state to history after operation completes
    requestAnimationFrame(() => {
      const { components: updatedComponents } = useFormBuilderStore.getState();
      addToHistory(updatedComponents);
    });

    setActiveId(null);
    setDraggedComponent(null);
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Drawer - Component Library */}
        <Drawer
          variant="persistent"
          open={leftOpen}
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100%',
              borderRight: '1px solid #e0e0e0',
            },
          }}
        >
          <ComponentsPanel onToggle={() => setLeftOpen(!leftOpen)} />
        </Drawer>

        {/* Center - Work Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'background.default',
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
            width: PROPERTY_PANEL_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: PROPERTY_PANEL_WIDTH,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100%',
              borderLeft: '1px solid #e0e0e0',
            },
          }}
        >
          <PropertyPanel onToggle={() => setRightOpen(!rightOpen)} />
        </Drawer>
      </Box>
      <DragOverlay>
        {activeId && draggedComponent ? (
          <Paper sx={{ p: 2, opacity: 0.8, maxWidth: 200 }}>
            {draggedComponent.type}
          </Paper>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default BuilderContent;
