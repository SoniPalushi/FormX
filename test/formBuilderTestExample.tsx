/**
 * Form Builder Test Example
 * 
 * This file demonstrates how to use the form builder test cases
 * in a React component or from the browser console.
 */

import React from 'react';
import { Button, Box, Typography, Paper } from '@mui/material';
import { 
  createCustomerRegistrationFormTest, 
  createProductOrderFormTest,
  exportFormAsJSON,
  loadTestFormIntoBuilder 
} from './formBuilderTest';
import { useFormBuilderStore } from '../stores/formBuilderStore';

/**
 * Example React Component that uses the test cases
 */
export const FormBuilderTestExample: React.FC = () => {
  const { setComponents, components } = useFormBuilderStore();

  const handleLoadCustomerForm = () => {
    const formComponents = createCustomerRegistrationFormTest();
    setComponents(formComponents);
    console.log('Customer Registration Form loaded!');
  };

  const handleLoadOrderForm = () => {
    const formComponents = createProductOrderFormTest();
    setComponents(formComponents);
    console.log('Product Order Form loaded!');
  };

  const handleExportForm = () => {
    if (components.length === 0) {
      alert('No form loaded. Please load a form first.');
      return;
    }

    const jsonExport = exportFormAsJSON(
      components,
      'My Form',
      'Exported form from Form Builder'
    );

    // Create a downloadable file
    const blob = new Blob([jsonExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'form-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('Form exported as JSON!');
  };

  const handleCopyToClipboard = () => {
    if (components.length === 0) {
      alert('No form loaded. Please load a form first.');
      return;
    }

    const jsonExport = exportFormAsJSON(
      components,
      'My Form',
      'Exported form from Form Builder'
    );

    navigator.clipboard.writeText(jsonExport).then(() => {
      alert('Form JSON copied to clipboard!');
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Form Builder Test Examples
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Load Test Forms
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button 
            variant="contained" 
            onClick={handleLoadCustomerForm}
          >
            Load Customer Registration Form
          </Button>
          <Button 
            variant="contained" 
            onClick={handleLoadOrderForm}
          >
            Load Product Order Form
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Loaded components: {components.length}
        </Typography>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Export Form
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={handleExportForm}
            disabled={components.length === 0}
          >
            Export as JSON File
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleCopyToClipboard}
            disabled={components.length === 0}
          >
            Copy JSON to Clipboard
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Usage Instructions
        </Typography>
        <Typography variant="body2" component="div">
          <ol>
            <li>Click "Load Customer Registration Form" or "Load Product Order Form" to load a test form</li>
            <li>The form will be loaded into the Form Builder</li>
            <li>You can edit the form in the Property Editor</li>
            <li>Click "Export as JSON File" to download the form as a JSON file</li>
            <li>Or click "Copy JSON to Clipboard" to copy the JSON to your clipboard</li>
          </ol>
          <p>
            <strong>Note:</strong> Replace dataview IDs (like 'countries_dataview_id') with actual dataview IDs 
            from your system before using the forms.
          </p>
        </Typography>
      </Paper>
    </Box>
  );
};

/**
 * Browser Console Usage Examples
 * 
 * You can also use these functions directly from the browser console:
 * 
 * // Load a test form
 * import { loadTestFormIntoBuilder } from './test/formBuilderTest';
 * loadTestFormIntoBuilder('customer'); // or 'order'
 * 
 * // Create and export a form
 * import { createCustomerRegistrationFormTest, exportFormAsJSON } from './test/formBuilderTest';
 * const form = createCustomerRegistrationFormTest();
 * const json = exportFormAsJSON(form, 'My Form', 'Description');
 * console.log(json);
 * 
 * // Copy to clipboard
 * navigator.clipboard.writeText(json);
 */

