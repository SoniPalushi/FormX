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
import { ConditionalRenderer } from '../../utils/rendering/conditionalRendering';

interface ConditionalRenderingEditorProps {
  renderWhen?: ComponentProperty<boolean>;
  formData?: Record<string, any>;
  onChange: (renderWhen: ComponentProperty<boolean>) => void;
}

const ConditionalRenderingEditor: React.FC<ConditionalRenderingEditorProps> = ({
  renderWhen,
  formData = {},
  onChange,
}) => {
  const [mode, setMode] = useState<'always' | 'expression' | 'function'>(
    !renderWhen ? 'always' :
    renderWhen.computeType === 'function' ? 'function' :
    'expression'
  );

  const [previewResult, setPreviewResult] = useState<boolean | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handleModeChange = (newMode: 'always' | 'expression' | 'function') => {
    setMode(newMode);
    
    if (newMode === 'always') {
      onChange({ value: true });
    } else if (newMode === 'expression') {
      onChange({
        value: renderWhen?.value ?? true,
      });
    } else if (newMode === 'function') {
      onChange({
        computeType: 'function',
        fnSource: renderWhen?.fnSource || 'return true;',
      });
    }
  };

  const handleExpressionChange = (expression: string) => {
    try {
      // Try to evaluate the expression
      const result = ConditionalRenderer.shouldRender(
        { value: expression === '' ? true : expression } as ComponentProperty<boolean>,
        formData
      );
      setPreviewResult(result);
      setPreviewError(null);
      onChange({ value: expression === '' ? true : expression });
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Evaluation error');
      setPreviewResult(null);
      onChange({ value: expression });
    }
  };

  const handleFunctionSourceChange = (fnSource: string) => {
    onChange({
      computeType: 'function',
      fnSource,
    });
    
    // Try to preview
    try {
      const result = ConditionalRenderer.shouldRender(
        { computeType: 'function', fnSource } as ComponentProperty<boolean>,
        formData
      );
      setPreviewResult(result);
      setPreviewError(null);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Evaluation error');
      setPreviewResult(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          Conditional Rendering
        </Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, value) => value && handleModeChange(value)}
          size="small"
        >
          <ToggleButton value="always">Always</ToggleButton>
          <ToggleButton value="expression">Expression</ToggleButton>
          <ToggleButton value="function">Function</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {mode === 'always' && (
        <Alert severity="info">Component will always render</Alert>
      )}

      {mode === 'expression' && (
        <Box>
          <TextField
            label="Render When Expression"
            value={typeof renderWhen?.value === 'string' ? renderWhen.value : ''}
            onChange={(e) => handleExpressionChange(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={3}
            placeholder="data.field === 'value' && data.otherField > 10"
            helperText="JavaScript expression that evaluates to true/false. Access form data via 'data' object."
          />
          {previewResult !== null && (
            <Alert severity={previewResult ? 'success' : 'warning'} sx={{ mt: 1 }}>
              {previewResult ? 'Component will render' : 'Component will be hidden'}
            </Alert>
          )}
          {previewError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              Error: {previewError}
            </Alert>
          )}
        </Box>
      )}

      {mode === 'function' && (
        <Box>
          <TextField
            label="Function Source Code"
            value={renderWhen?.fnSource || ''}
            onChange={(e) => handleFunctionSourceChange(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={6}
            placeholder="return data.field === 'value';"
            helperText="JavaScript function that returns true/false. Access form data via 'data' object."
          />
          {previewResult !== null && (
            <Alert severity={previewResult ? 'success' : 'warning'} sx={{ mt: 1 }}>
              {previewResult ? 'Component will render' : 'Component will be hidden'}
            </Alert>
          )}
          {previewError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              Error: {previewError}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ConditionalRenderingEditor;

