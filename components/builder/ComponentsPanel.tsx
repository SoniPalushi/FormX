import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { componentLibrary, getAllCategories } from '../../utils/componentLibrary';
import ComponentLibraryItem from './ComponentLibraryItem';
import { useModeStore } from '../../stores/modeStore';
import { filterComponentsByMode } from '../../utils/modes/componentClassification';

interface ComponentsPanelProps {
  onToggle: () => void;
}

const ComponentsPanel: React.FC<ComponentsPanelProps> = ({ onToggle }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Memoize categories to prevent recalculation
  const categories = useMemo(() => ['All', ...getAllCategories()], []);
  
  // Advanced Mode
  const advancedMode = useModeStore((state) => state.advancedMode);
  
  // Memoize filtered components for better performance
  const filteredComponents = useMemo(() => {
    const modeFiltered = filterComponentsByMode(componentLibrary, advancedMode);
    return modeFiltered.filter((component) => {
      const matchesSearch = component.componentNameLabel.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || component.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [advancedMode, searchTerm, selectedCategory]);
  
  // Memoize handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);
  
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);
  
  const handleCategoryChange = useCallback((_: React.SyntheticEvent, newValue: string) => {
    setSelectedCategory(newValue);
  }, []);

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
        }}
      >
        <IconButton 
          onClick={onToggle} 
          size="small" 
          sx={{ 
            mr: 1, 
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
        <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '0.9rem', fontWeight: 600 }}>
          {t('builder.components')}
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search components..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Category Filter */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', overflowX: 'auto', bgcolor: 'background.paper' }}>
        <Tabs
          value={selectedCategory}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              fontSize: '0.75rem',
              textTransform: 'none',
              px: 1.5,
              py: 0.5,
            },
            '& .Mui-selected': {
              color: 'primary.main',
              fontWeight: 600,
            },
          }}
        >
          {categories.map((category) => (
            <Tab
              key={category}
              label={category}
              value={category}
            />
          ))}
        </Tabs>
      </Box>

      {/* Component List */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, bgcolor: 'background.default' }}>
        <Grid container spacing={0.75}>
          {filteredComponents.map((component) => (
            <Grid item xs={6} key={component.type}>
              <ComponentLibraryItem component={component} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default ComponentsPanel;

