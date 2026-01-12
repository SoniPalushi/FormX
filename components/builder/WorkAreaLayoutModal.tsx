import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid as MuiGrid,
} from '@mui/material';
import {
  ViewModule as LayoutIcon,
  ViewHeadline as HeaderIcon,
  ViewAgenda as BodyIcon,
  ViewStream as FooterIcon,
  ViewSidebar as SidebarIcon,
  Dashboard as DashboardIcon,
  GridView as GridIcon,
} from '@mui/icons-material';

export interface LayoutSection {
  id: string;
  name: string;
  type: 'header' | 'body' | 'footer' | 'sidebar' | 'main' | 'aside' | 'column';
  flex?: number;
  minHeight?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface WorkAreaLayout {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  sections: LayoutSection[];
  direction: 'row' | 'column';
}

const layoutTemplates: WorkAreaLayout[] = [
  {
    id: 'simple',
    name: 'Simple Body',
    description: 'Single content area - perfect for simple forms',
    icon: <BodyIcon />,
    direction: 'column',
    sections: [
      { id: 'body', name: 'Body', type: 'body', flex: 1, minHeight: '400px' },
    ],
  },
  {
    id: 'header-body',
    name: 'Header + Body',
    description: 'Header on top with main content area',
    icon: <HeaderIcon />,
    direction: 'column',
    sections: [
      { id: 'header', name: 'Header', type: 'header', minHeight: '60px', position: 'top' },
      { id: 'body', name: 'Body', type: 'body', flex: 1, minHeight: '300px' },
    ],
  },
  {
    id: 'header-body-footer',
    name: 'Header + Body + Footer',
    description: 'Classic layout with header, content, and footer',
    icon: <LayoutIcon />,
    direction: 'column',
    sections: [
      { id: 'header', name: 'Header', type: 'header', minHeight: '60px', position: 'top' },
      { id: 'body', name: 'Body', type: 'body', flex: 1, minHeight: '250px' },
      { id: 'footer', name: 'Footer', type: 'footer', minHeight: '50px', position: 'bottom' },
    ],
  },
  {
    id: 'sidebar-body',
    name: 'Sidebar + Body',
    description: 'Left sidebar with main content area',
    icon: <SidebarIcon />,
    direction: 'row',
    sections: [
      { id: 'sidebar', name: 'Sidebar', type: 'sidebar', minHeight: '400px', flex: 1, position: 'left' },
      { id: 'body', name: 'Body', type: 'body', flex: 3, minHeight: '400px' },
    ],
  },
  {
    id: 'header-sidebar-body',
    name: 'Header + Sidebar + Body',
    description: 'Header with sidebar and main content',
    icon: <DashboardIcon />,
    direction: 'column',
    sections: [
      { id: 'header', name: 'Header', type: 'header', minHeight: '60px', position: 'top' },
      { id: 'sidebar', name: 'Sidebar', type: 'sidebar', flex: 1, minHeight: '300px', position: 'left' },
      { id: 'body', name: 'Body', type: 'body', flex: 3, minHeight: '300px' },
    ],
  },
  {
    id: 'header-sidebar-body-footer',
    name: 'Full Layout',
    description: 'Complete layout with all sections',
    icon: <DashboardIcon />,
    direction: 'column',
    sections: [
      { id: 'header', name: 'Header', type: 'header', minHeight: '60px', position: 'top' },
      { id: 'sidebar', name: 'Sidebar', type: 'sidebar', flex: 1, minHeight: '250px', position: 'left' },
      { id: 'body', name: 'Body', type: 'body', flex: 3, minHeight: '250px' },
      { id: 'footer', name: 'Footer', type: 'footer', minHeight: '50px', position: 'bottom' },
    ],
  },
  {
    id: 'two-columns',
    name: 'Two Columns',
    description: 'Two equal columns side by side',
    icon: <GridIcon />,
    direction: 'row',
    sections: [
      { id: 'left', name: 'Left Column', type: 'column', flex: 1, minHeight: '400px' },
      { id: 'right', name: 'Right Column', type: 'column', flex: 1, minHeight: '400px' },
    ],
  },
  {
    id: 'three-columns',
    name: 'Three Columns',
    description: 'Three equal columns',
    icon: <GridIcon />,
    direction: 'row',
    sections: [
      { id: 'col1', name: 'Column 1', type: 'column', flex: 1, minHeight: '400px' },
      { id: 'col2', name: 'Column 2', type: 'column', flex: 1, minHeight: '400px' },
      { id: 'col3', name: 'Column 3', type: 'column', flex: 1, minHeight: '400px' },
    ],
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Dashboard layout with header, sidebar, main, and widget area',
    icon: <DashboardIcon />,
    direction: 'column',
    sections: [
      { id: 'header', name: 'Header', type: 'header', minHeight: '60px', position: 'top' },
      { id: 'sidebar', name: 'Sidebar', type: 'sidebar', flex: 1, minHeight: '200px', position: 'left' },
      { id: 'main', name: 'Main Content', type: 'main', flex: 2, minHeight: '200px' },
      { id: 'aside', name: 'Widget Area', type: 'aside', flex: 1, minHeight: '200px', position: 'right' },
    ],
  },
];

// Preview component for layout
const LayoutPreview: React.FC<{ layout: WorkAreaLayout; selected: boolean }> = ({ layout, selected }) => {
  const renderSections = () => {
    // Group sections for complex layouts
    const hasHeader = layout.sections.find(s => s.type === 'header');
    const hasFooter = layout.sections.find(s => s.type === 'footer');
    const middleSections = layout.sections.filter(s => s.type !== 'header' && s.type !== 'footer');

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0.5 }}>
        {hasHeader && (
          <Box
            sx={{
              bgcolor: '#90caf9',
              borderRadius: 0.5,
              p: 0.25,
              textAlign: 'center',
              fontSize: '0.5rem',
              color: '#1565c0',
            }}
          >
            Header
          </Box>
        )}
        
        {middleSections.length > 0 && (
          <Box sx={{ display: 'flex', flex: 1, gap: 0.5 }}>
            {middleSections.map((section) => (
              <Box
                key={section.id}
                sx={{
                  flex: section.flex || 1,
                  bgcolor: section.type === 'sidebar' ? '#c8e6c9' : 
                           section.type === 'aside' ? '#fff9c4' : '#e3f2fd',
                  borderRadius: 0.5,
                  p: 0.25,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.45rem',
                  color: section.type === 'sidebar' ? '#2e7d32' : 
                         section.type === 'aside' ? '#f57f17' : '#1565c0',
                  minHeight: 30,
                }}
              >
                {section.name}
              </Box>
            ))}
          </Box>
        )}
        
        {hasFooter && (
          <Box
            sx={{
              bgcolor: '#ffccbc',
              borderRadius: 0.5,
              p: 0.25,
              textAlign: 'center',
              fontSize: '0.5rem',
              color: '#bf360c',
            }}
          >
            Footer
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        width: 80,
        height: 60,
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderRadius: 1,
        p: 0.5,
        bgcolor: 'background.paper',
      }}
    >
      {renderSections()}
    </Box>
  );
};

interface WorkAreaLayoutModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (layout: WorkAreaLayout) => void;
  currentLayoutId?: string;
}

const WorkAreaLayoutModal: React.FC<WorkAreaLayoutModalProps> = ({
  open,
  onClose,
  onSelect,
  currentLayoutId,
}) => {
  const [selectedLayout, setSelectedLayout] = useState<WorkAreaLayout | null>(
    layoutTemplates.find(l => l.id === currentLayoutId) || null
  );

  const handleSelect = () => {
    if (selectedLayout) {
      onSelect(selectedLayout);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LayoutIcon color="primary" />
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Choose Work Area Layout
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Select a layout template for your form. Each section is a container where you can add components.
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <MuiGrid container spacing={2} sx={{ mt: 1 }}>
          {layoutTemplates.map((layout) => (
            <MuiGrid item xs={12} sm={6} md={4} key={layout.id}>
              <Paper
                sx={{
                  p: 2,
                  border: selectedLayout?.id === layout.id ? '2px solid' : '1px solid',
                  borderColor: selectedLayout?.id === layout.id ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  bgcolor: selectedLayout?.id === layout.id ? 'primary.50' : 'background.paper',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                }}
                onClick={() => setSelectedLayout(layout)}
              >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <LayoutPreview layout={layout} selected={selectedLayout?.id === layout.id} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {layout.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {layout.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {layout.sections.map((section) => (
                        <Typography
                          key={section.id}
                          variant="caption"
                          sx={{
                            px: 0.75,
                            py: 0.25,
                            bgcolor: 'grey.100',
                            borderRadius: 0.5,
                            fontSize: '0.65rem',
                          }}
                        >
                          {section.name}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </MuiGrid>
          ))}
        </MuiGrid>
        
        {selectedLayout && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Selected: {selectedLayout.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This layout contains {selectedLayout.sections.length} section(s):
              {' '}
              {selectedLayout.sections.map(s => s.name).join(', ')}.
              Each section will be a drop zone where you can add your form components.
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSelect}
          variant="contained"
          disabled={!selectedLayout}
        >
          Apply Layout
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkAreaLayoutModal;
export { layoutTemplates };

