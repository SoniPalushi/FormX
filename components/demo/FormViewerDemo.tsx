/**
 * FormViewer Demo Page
 * Demonstrates how to use FormViewer component
 * This can be accessed as a separate route or integrated into the main app
 */

import React, { useState } from 'react';
import { Box, Button, Paper, Typography, Alert } from '@mui/material';
import { FormViewer } from '../viewer';
import type { PersistedForm } from '../../stores/types/formEngine';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { exportAsPersistedForm } from '../../utils/formExport';

const FormViewerDemo: React.FC = () => {
  const { components } = useFormBuilderStore();
  const [formData, setFormData] = useState<PersistedForm | null>(null);
  const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null);

  // Convert current builder components to PersistedForm
  const handleLoadFromBuilder = () => {
    if (components.length === 0) {
      alert('No components in builder. Please add some components first.');
      return;
    }

    const persistedForm = exportAsPersistedForm(components, {
      version: '1',
      defaultLanguage: 'al',
      languages: [
        { code: 'al', name: 'Albanian' },
        { code: 'en-US', name: 'English (US)' },
      ],
      metadata: {
        formName: 'Demo Form',
        description: 'Form created in builder',
      },
    });

    setFormData(persistedForm);
    setSubmittedData(null);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    console.log('Form submitted with data:', data);
    setSubmittedData(data);
    // In a real app, you would send this to your API
    alert('Form submitted! Check console for data.');
  };

  const handleDataChange = (data: Record<string, any>) => {
    console.log('Form data changed:', data);
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        FormViewer Demo
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        This page demonstrates how to use the FormViewer component to render forms at runtime.
        You can load a form from the builder or provide your own PersistedForm JSON.
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleLoadFromBuilder}
          disabled={components.length === 0}
        >
          Load Form from Builder
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            // Example: Load from a JSON file
            const exampleForm: PersistedForm = {
              version: '1',
              form: {
                key: 'root',
                type: 'Form',
                props: {},
                children: [
                  {
                    key: 'name-input',
                    type: 'MuiTextField',
                    props: {
                      label: { value: 'Name' },
                      required: { value: true },
                      placeholder: { value: 'Enter your name' },
                    },
                    dataKey: 'name',
                  },
                  {
                    key: 'email-input',
                    type: 'MuiTextField',
                    props: {
                      label: { value: 'Email' },
                      required: { value: true },
                      type: { value: 'email' },
                      placeholder: { value: 'Enter your email' },
                    },
                    dataKey: 'email',
                  },
                  {
                    key: 'submit-button',
                    type: 'MuiButton',
                    props: {
                      label: { value: 'Submit' },
                      variant: { value: 'contained' },
                      color: { value: 'primary' },
                    },
                  },
                ],
              },
              defaultLanguage: 'en-US',
              languages: [
                { code: 'en-US', name: 'English (US)' },
              ],
              localization: {},
            };
            setFormData(exampleForm);
            setSubmittedData(null);
          }}
        >
          Load Example Form
        </Button>
      </Box>

      {components.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No components in builder. Add some components in the Form Builder, then click "Load Form from Builder".
        </Alert>
      )}

      {formData ? (
        <Box>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Form Rendered with FormViewer
            </Typography>
            <FormViewer
              formData={formData}
              initialValues={{
                name: 'John Doe',
                email: 'john@example.com',
              }}
              onSubmit={handleSubmit}
              onDataChange={handleDataChange}
              containerSx={{
                maxWidth: '800px',
                margin: '0 auto',
              }}
            />
          </Paper>

          {submittedData && (
            <Paper elevation={2} sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Typography variant="h6" gutterBottom>
                Form Submitted Successfully!
              </Typography>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(submittedData, null, 2)}
              </Typography>
            </Paper>
          )}
        </Box>
      ) : (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="body1" color="text.secondary">
            Click "Load Form from Builder" or "Load Example Form" to see FormViewer in action.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default FormViewerDemo;

