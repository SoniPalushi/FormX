import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Divider,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import PropertyEditor from './PropertyEditor';
import ContainerChildrenList from './ContainerChildrenList';
import AllComponentsList from './AllComponentsList';

interface PropertyPanelProps {
  onToggle: () => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ onToggle }) => {
  const { t } = useTranslation();
  const { selectedComponentId, findComponent } = useFormBuilderStore();

  const selectedComponent = selectedComponentId ? findComponent(selectedComponentId) : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          transition: 'all 0.3s ease',
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            flexGrow: 1, 
            fontSize: '0.9rem', 
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
        >
          {t('builder.properties')}
        </Typography>
        <IconButton 
          onClick={onToggle} 
          size="small" 
          sx={{ 
            color: 'inherit',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'rotate(90deg) scale(1.1)',
              bgcolor: 'rgba(255,255,255,0.15)',
            },
          }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider />

      {/* Property Editor - Use GPU-accelerated scrolling for better performance */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          display: 'flex', 
          flexDirection: 'column',
          // Enable GPU-accelerated scrolling
          WebkitOverflowScrolling: 'touch',
          // Prevent scroll anchoring issues
          overscrollBehavior: 'contain',
        }}
      >
        {selectedComponent ? (
          <Box sx={{ minHeight: 0 }}>
            {/* Container Children List - shows child elements for easy selection */}
            <Box sx={{ p: 1.5, pb: 0 }}>
              <ContainerChildrenList component={selectedComponent} />
            </Box>
            
            <PropertyEditor component={selectedComponent} />
          </Box>
        ) : (
          <AllComponentsList />
        )}
      </Box>
    </Box>
  );
};

export default PropertyPanel;

