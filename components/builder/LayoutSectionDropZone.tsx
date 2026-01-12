import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { ComponentDefinition } from '../../stores/types';
import type { LayoutSection } from '../../stores/formBuilderStore';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import DraggableComponent from './DraggableComponent';
import {
  ViewHeadline as HeaderIcon,
  ViewAgenda as BodyIcon,
  ViewStream as FooterIcon,
  ViewSidebar as SidebarIcon,
  GridView as ColumnIcon,
  Dashboard as MainIcon,
  Widgets as AsideIcon,
} from '@mui/icons-material';

interface LayoutSectionDropZoneProps {
  section: LayoutSection;
  component?: ComponentDefinition;
}

const sectionColors: Record<string, { bg: string; border: string; text: string; hoverBg: string }> = {
  header: { bg: '#e3f2fd', border: '#1976d2', text: '#1565c0', hoverBg: '#bbdefb' },
  body: { bg: '#f5f5f5', border: '#757575', text: '#424242', hoverBg: '#e0e0e0' },
  footer: { bg: '#fff3e0', border: '#f57c00', text: '#e65100', hoverBg: '#ffe0b2' },
  sidebar: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32', hoverBg: '#c8e6c9' },
  main: { bg: '#e8eaf6', border: '#3f51b5', text: '#283593', hoverBg: '#c5cae9' },
  aside: { bg: '#fff8e1', border: '#ffc107', text: '#ff8f00', hoverBg: '#ffecb3' },
  column: { bg: '#fce4ec', border: '#e91e63', text: '#c2185b', hoverBg: '#f8bbd9' },
};

const sectionIcons: Record<string, React.ReactNode> = {
  header: <HeaderIcon />,
  body: <BodyIcon />,
  footer: <FooterIcon />,
  sidebar: <SidebarIcon />,
  main: <MainIcon />,
  aside: <AsideIcon />,
  column: <ColumnIcon />,
};

const LayoutSectionDropZone: React.FC<LayoutSectionDropZoneProps> = ({ section, component }) => {
  const { selectComponent, selectedComponentId, formMode, findComponent, components } = useFormBuilderStore();
  
  // Get latest component data from store
  const latestComponent = React.useMemo(() => {
    if (!component) return null;
    return findComponent(component.id) || component;
  }, [component?.id, components, findComponent]);
  
  const { setNodeRef, isOver } = useDroppable({
    id: component?.id || `section-${section.id}`,
    data: {
      type: 'section',
      sectionId: section.id,
      sectionType: section.type,
      accepts: ['component'],
    },
    disabled: formMode,
  });

  const colors = sectionColors[section.type] || sectionColors.body;
  const icon = sectionIcons[section.type] || <BodyIcon />;
  const hasChildren = latestComponent?.children && latestComponent.children.length > 0;

  // Use a unique ID that matches what's in the store
  const droppableId = component?.id || `section-${section.id}`;

  return (
    <Box
      ref={setNodeRef}
      data-droppable-id={droppableId}
      data-section-type={section.type}
      sx={{
        flex: section.flex || 1,
        minHeight: section.minHeight || '100px',
      }}
    >
      <Paper
        elevation={isOver ? 4 : 1}
        onClick={(e) => {
          if (!formMode && component) {
            e.stopPropagation();
            selectComponent(component.id);
          }
        }}
        sx={{
          height: '100%',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: isOver ? colors.hoverBg : colors.bg,
          border: isOver ? '3px solid' : '2px dashed',
          borderColor: isOver ? colors.border : colors.border + '40',
          borderRadius: 2,
          transition: 'all 0.2s ease',
          position: 'relative',
          cursor: formMode ? 'default' : 'pointer',
          boxShadow: isOver ? `0 0 20px ${colors.border}40` : 'none',
          '&:hover': {
            borderColor: formMode ? colors.border + '40' : colors.border,
            boxShadow: formMode ? 1 : 3,
          },
        }}
      >
      {/* Section Label */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.25,
          bgcolor: colors.border,
          color: 'white',
          borderRadius: 1,
          fontSize: '0.65rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          opacity: 0.9,
        }}
      >
        {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: '0.75rem' } })}
        {section.name}
      </Box>

      {/* Content Area */}
      <Box
        sx={{
          flex: 1,
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          minHeight: '60px',
        }}
      >
        {hasChildren ? (
          // Render children components
          latestComponent?.children?.map((child) => (
            <DraggableComponent key={child.id} component={child} />
          ))
        ) : (
          // Empty state
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.text,
              opacity: 0.6,
              py: 2,
            }}
          >
            {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 32, mb: 1, opacity: 0.5 } })}
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              {isOver ? 'Release to drop here' : `Drop components in ${section.name}`}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
    </Box>
  );
};

export default LayoutSectionDropZone;

