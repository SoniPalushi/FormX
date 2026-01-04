import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Paper,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import PropertyEditor from './PropertyEditor';

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

      {/* Property Editor */}
      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {selectedComponent ? (
          <Box
            sx={{
              animation: 'fadeIn 0.3s ease-in',
              '@keyframes fadeIn': {
                from: {
                  opacity: 0,
                  transform: 'translateY(-10px)',
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            <PropertyEditor component={selectedComponent} />
          </Box>
        ) : (
          <Box 
            sx={{ 
              p: 2, 
              textAlign: 'center', 
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '0.8125rem',
                opacity: 0.6,
                transition: 'opacity 0.3s ease',
                '&:hover': {
                  opacity: 1,
                },
              }}
            >
              Select a component to edit its properties
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PropertyPanel;

