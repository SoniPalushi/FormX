import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
} from '@mui/material';
import type { ComponentProperty } from '../../stores/types/formEngine';
import { ComputedPropertyEvaluator } from '../../utils/properties/computedProperties';

interface ComputedPropertyEditorProps {
  propertyKey: string;
  property?: ComponentProperty;
  formData?: Record<string, any>;
  onChange: (property: ComponentProperty) => void;
}

const ComputedPropertyEditor: React.FC<ComputedPropertyEditorProps> = ({
  propertyKey,
  property,
  formData = {},
  onChange,
}) => {
  const [mode, setMode] = useState<'static' | 'computed' | 'localized'>(
    property?.computeType === 'function' ? 'computed' :
    property?.computeType === 'localization' ? 'localized' :
    'static'
  );

  const [previewValue, setPreviewValue] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handleModeChange = (newMode: 'static' | 'computed' | 'localized') => {
    setMode(newMode);
    
    if (newMode === 'static') {
      onChange({ value: property?.value ?? '' });
    } else if (newMode === 'computed') {
      onChange({
        computeType: 'function',
        fnSource: property?.fnSource || `return data.${propertyKey};`,
      });
    } else if (newMode === 'localized') {
      onChange({
        computeType: 'localization',
        value: property?.value || propertyKey,
      });
    }
  };

  const handleStaticValueChange = (value: any) => {
    onChange({ value });
  };

  const handleFunctionSourceChange = (fnSource: string) => {
    onChange({
      computeType: 'function',
      fnSource,
    });
    
    // Try to preview the computed value
    try {
      const result = ComputedPropertyEvaluator.evaluate(
        { computeType: 'function', fnSource },
        formData
      );
      setPreviewValue(result);
      setPreviewError(null);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Evaluation error');
      setPreviewValue(null);
    }
  };

  const handleLocalizationKeyChange = (key: string) => {
    onChange({
      computeType: 'localization',
      value: key,
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          {propertyKey.charAt(0).toUpperCase() + propertyKey.slice(1)}
        </Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, value) => value && handleModeChange(value)}
          size="small"
        >
          <ToggleButton value="static">Static</ToggleButton>
          <ToggleButton value="computed">Computed</ToggleButton>
          <ToggleButton value="localized">Localized</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {mode === 'static' && (
        <TextField
          label="Value"
          value={property?.value ?? ''}
          onChange={(e) => handleStaticValueChange(e.target.value)}
          size="small"
          fullWidth
          multiline
          rows={2}
        />
      )}

      {mode === 'computed' && (
        <Box>
          <TextField
            label="Function Source Code"
            value={property?.fnSource || ''}
            onChange={(e) => handleFunctionSourceChange(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={6}
            placeholder="return data.firstName + ' ' + data.lastName;"
            helperText="JavaScript function that returns the computed value. Access form data via 'data' object."
          />
          {previewValue !== null && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Preview: {String(previewValue)}
            </Alert>
          )}
          {previewError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              Error: {previewError}
            </Alert>
          )}
        </Box>
      )}

      {mode === 'localized' && (
        <TextField
          label="Localization Key"
          value={property?.value || propertyKey}
          onChange={(e) => handleLocalizationKeyChange(e.target.value)}
          size="small"
          fullWidth
          helperText="Key for localization string (e.g., 'form.name.label')"
        />
      )}
    </Box>
  );
};

export default ComputedPropertyEditor;

