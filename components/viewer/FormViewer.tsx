/**
 * FormViewer Component
 * Renders forms from JSON/PersistedForm at runtime
 * Similar to FormEngine's FormViewer
 */

import React, { useEffect, useMemo } from 'react';
import { Box, Paper, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import type { PersistedForm } from '../../stores/types/formEngine';
import { FormConverter } from '../../utils/formConversion';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormDataStore } from '../../stores/formDataStore';
import FormViewerCanvas from './FormViewerCanvas';
import FormModal from '../form-components/FormModal';

export interface FormViewerProps {
  /**
   * Form data in PersistedForm format (from database/API)
   */
  formData: PersistedForm;
  
  /**
   * Initial form values (optional)
   */
  initialValues?: Record<string, any>;
  
  /**
   * Callback when form is submitted
   */
  onSubmit?: (data: Record<string, any>) => void | Promise<void>;
  
  /**
   * Callback when form data changes
   */
  onDataChange?: (data: Record<string, any>) => void;
  
  /**
   * Theme customization (optional)
   */
  theme?: ReturnType<typeof createTheme>;
  
  /**
   * Container styling (optional)
   */
  containerSx?: Record<string, any>;
  
  /**
   * Enable form mode (default: true)
   */
  formMode?: boolean;
}

const FormViewer: React.FC<FormViewerProps> = ({
  formData,
  initialValues = {},
  onSubmit,
  onDataChange,
  theme,
  containerSx,
  formMode = true,
}) => {
  const { setComponents, setFormMode } = useFormBuilderStore();
  const { setInitialData, getAllData, data } = useFormDataStore();

  // Convert PersistedForm to ComponentDefinition[]
  const components = useMemo(() => {
    try {
      return FormConverter.toComponentDefinitions(formData);
    } catch (error) {
      console.error('Error converting form data:', error);
      return [];
    }
  }, [formData]);

  // Set components in store
  useEffect(() => {
    setComponents(components);
  }, [components, setComponents]);

  // Set form mode
  useEffect(() => {
    setFormMode(formMode);
  }, [formMode, setFormMode]);

  // Set initial data
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setInitialData(initialValues);
    }
  }, [initialValues, setInitialData]);

  // Notify on data change
  useEffect(() => {
    if (onDataChange && Object.keys(data).length > 0) {
      onDataChange(getAllData());
    }
  }, [data, getAllData, onDataChange]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      await onSubmit(getAllData());
    }
  };

  // Default theme
  const defaultTheme = useMemo(
    () =>
      theme ||
      createTheme({
        palette: {
          mode: 'light',
          primary: {
            main: '#1976d2',
          },
        },
      }),
    [theme]
  );

  if (components.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        No form components to render
      </Box>
    );
  }

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          ...containerSx,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <FormViewerCanvas components={components} />
          
          {/* Render modals separately (they manage their own visibility) */}
          {components
            .filter((comp) => comp.props?.modal)
            .map((component) => (
              <FormModal key={component.id} component={component} />
            ))}
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default FormViewer;

