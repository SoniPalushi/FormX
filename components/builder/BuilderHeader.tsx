import React, { useRef, useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  Undo as UndoIcon,
  Redo as RedoIcon,
  Save as SaveIcon,
  FolderOpen as FolderOpenIcon,
  DesktopWindows as DesktopIcon,
  Tablet as TabletIcon,
  PhoneAndroid as PhoneIcon,
  ViewModule as ViewModuleIcon,
  Article as FormModeIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useHistoryStore } from '../../stores/historyStore';
import { downloadPersistedForm, readFormFromFile } from '../../utils/formExport';
import { downloadAsReactComponent } from '../../utils/formToReact';
import SaveFormDialog from './SaveFormDialog';

const BuilderHeader: React.FC = () => {
  const { t } = useTranslation();
  const { formMode, toggleFormMode, setPreviewMode, previewMode, setComponents, components } = useFormBuilderStore();
  const { undo, redo, canUndo, canRedo } = useHistoryStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const handleUndo = () => {
    undo((state) => {
      setComponents(state);
    });
  };

  const handleRedo = () => {
    redo((state) => {
      setComponents(state);
    });
  };

  const handlePreviewMode = (mode: 'desktop' | 'tablet' | 'mobile' | null) => {
    setPreviewMode(mode);
  };

  const handleSaveClick = () => {
    setSaveDialogOpen(true);
  };

  const handleSave = (metadata: {
    formName: string;
    description?: string;
    author?: string;
    format: 'persisted' | 'react';
    reactFormat?: 'tsx' | 'jsx';
  }) => {
    try {
      if (metadata.format === 'persisted') {
        // Use PersistedForm format (JSON for database)
        downloadPersistedForm(
          components,
          `${metadata.formName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`,
          {
            defaultLanguage: 'en-US',
            languages: [
              { code: 'en-US', name: 'English (US)' },
              { code: 'es-ES', name: 'Spanish (ES)' },
            ],
          }
        );
      } else {
        // Export as React component (TSX/JSX)
        const extension = metadata.reactFormat || 'tsx';
        const filename = `${metadata.formName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${extension}`;
        downloadAsReactComponent(components, filename, {
          format: metadata.reactFormat || 'tsx',
          componentName: metadata.formName.replace(/[^a-zA-Z0-9]/g, ''),
          useMUI: true,
          includeTypes: extension === 'tsx',
        });
      }
    } catch (error) {
      alert(`Failed to save form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const importedComponents = await readFormFromFile(file);
        setComponents(importedComponents);
        // Clear file input so same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        alert(`Failed to load form: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        bgcolor: 'primary.main',
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
          animation: 'shimmer 3s infinite',
          '@keyframes shimmer': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' },
          },
        },
      }}
    >
      <Toolbar sx={{ minHeight: '44px !important', gap: 0.5, px: 1.5, position: 'relative', zIndex: 1 }}>
        {/* Left Nav Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', width: 350, gap: 1 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1, 
              fontSize: '1.1rem', 
              fontWeight: 700,
              letterSpacing: '0.5px',
              background: 'linear-gradient(45deg, #fff 30%, rgba(255,255,255,0.8) 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'transform 0.2s ease',
              },
            }}
          >
            {t('builder.title')}
          </Typography>
        </Box>

        {/* Middle Nav Section - Toolbar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <IconButton
            color="inherit"
            onClick={handleUndo}
            disabled={!canUndo}
            title={t('common.undo')}
            size="small"
            sx={{
              transition: 'all 0.2s ease',
              transform: 'scale(1)',
              '&:hover:not(:disabled)': {
                transform: 'scale(1.1) rotate(-5deg)',
                bgcolor: 'rgba(255,255,255,0.15)',
              },
              '&:active:not(:disabled)': {
                transform: 'scale(0.95)',
              },
            }}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={handleRedo}
            disabled={!canRedo}
            title={t('common.redo')}
            size="small"
            sx={{
              transition: 'all 0.2s ease',
              transform: 'scale(1)',
              '&:hover:not(:disabled)': {
                transform: 'scale(1.1) rotate(5deg)',
                bgcolor: 'rgba(255,255,255,0.15)',
              },
              '&:active:not(:disabled)': {
                transform: 'scale(0.95)',
              },
            }}
          >
            <RedoIcon fontSize="small" />
          </IconButton>

          <Box sx={{ width: 1, height: 20, bgcolor: 'rgba(255,255,255,0.25)', mx: 0.5 }} />

          <IconButton
            color="inherit"
            onClick={() => toggleFormMode()}
            title={formMode ? 'Form Mode ON' : 'Form Mode OFF'}
            size="small"
            sx={{ 
              border: formMode ? '2px solid rgba(255,255,255,0.8)' : 'none',
              bgcolor: formMode ? 'rgba(255,255,255,0.15)' : 'transparent',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: formMode ? 'scale(1.05)' : 'scale(1)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
                transform: 'scale(1.1)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              },
            }}
          >
            <FormModeIcon fontSize="small" />
          </IconButton>

          <Box sx={{ width: 1, height: 20, bgcolor: 'rgba(255,255,255,0.25)', mx: 0.5 }} />

          <ToggleButtonGroup
            value={previewMode}
            exclusive
            onChange={(_, value) => handlePreviewMode(value)}
            size="small"
            sx={{ 
              height: 28,
              '& .MuiToggleButton-root': {
                px: 1,
                py: 0.5,
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'rgba(255,255,255,0.9)',
                '&.Mui-selected': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.25)',
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              },
            }}
          >
            <ToggleButton value="desktop" title={t('builder.desktop')}>
              <DesktopIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="tablet" title={t('builder.tablet')}>
              <TabletIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="mobile" title={t('builder.mobile')}>
              <PhoneIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ width: 1, height: 20, bgcolor: 'rgba(255,255,255,0.25)', mx: 0.5 }} />

          <IconButton 
            color="inherit" 
            title={t('common.save')} 
            size="small" 
            onClick={handleSaveClick}
            sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.15) rotate(10deg)',
                bgcolor: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            <SaveIcon fontSize="small" />
          </IconButton>
          <IconButton 
            color="inherit" 
            title={t('builder.openForm') || 'Open Form'} 
            size="small" 
            onClick={handleLoad}
            sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.15) rotate(-10deg)',
                bgcolor: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            <FolderOpenIcon fontSize="small" />
          </IconButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </Box>
      </Toolbar>
      <SaveFormDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSave}
        defaultFormName="My Form"
      />
    </AppBar>
  );
};

export default BuilderHeader;

