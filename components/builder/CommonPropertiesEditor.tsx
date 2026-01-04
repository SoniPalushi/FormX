import React from 'react';
import {
  TextField,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';

interface CommonPropertiesEditorProps {
  component: ComponentDefinition;
  onPropertyChange: (key: string, value: any) => void;
}

/**
 * Common properties that most form components should have
 */
export const CommonPropertiesEditor: React.FC<CommonPropertiesEditorProps> = ({
  component,
  onPropertyChange,
}) => {
  // Determine if this is a form input component
  const isFormInput = [
    'TextInput',
    'TextArea',
    'Select',
    'DropDown',
    'CheckBox',
    'RadioGroup',
    'Toggle',
    'DateTime',
    'DateTimeCb',
    'Amount',
    'AutoComplete',
    'Upload',
    'MultiUpload',
  ].includes(component.type);

  // Determine if this is a layout component
  const isLayoutComponent = [
    'Container',
    'Form',
    'Header',
    'Footer',
    'SideNav',
    'ViewStack',
  ].includes(component.type);

  return (
    <Box>
      <Typography variant="overline" sx={{ display: 'block', mb: 0.75, mt: 1.5, fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
        Common Properties
      </Typography>
      <Divider sx={{ mb: 1.5 }} />

      {/* ID/Name - Important for form inputs */}
      {isFormInput && (
        <>
          <TextField
            label="ID / Name"
            value={component.props?.id || component.props?.name || ''}
            onChange={(e) => {
              const value = e.target.value;
              onPropertyChange('id', value);
              onPropertyChange('name', value);
            }}
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            helperText="Used for form submission and element identification"
            InputProps={{
              sx: { fontSize: '0.8125rem' },
            }}
            InputLabelProps={{
              sx: { fontSize: '0.8125rem' },
            }}
          />
        </>
      )}

      {/* Required - For form inputs */}
      {isFormInput && (
        <FormControlLabel
          control={
            <Switch
              checked={component.props?.required || false}
              onChange={(e) => onPropertyChange('required', e.target.checked)}
              size="small"
            />
          }
          label="Required"
          sx={{ mt: 1 }}
        />
      )}

      {/* Disabled - For interactive components */}
      {(isFormInput || component.type === 'Button') && (
        <FormControlLabel
          control={
            <Switch
              checked={component.props?.disabled || false}
              onChange={(e) => onPropertyChange('disabled', e.target.checked)}
              size="small"
            />
          }
          label="Disabled"
          sx={{ mt: 1 }}
        />
      )}

      {/* Size - For many components */}
      {!isLayoutComponent && (
        <FormControl fullWidth sx={{ mt: 1 }}>
          <InputLabel>Size</InputLabel>
          <Select
            value={component.props?.size || 'medium'}
            label="Size"
            onChange={(e) => onPropertyChange('size', e.target.value)}
            size="small"
          >
            <MenuItem value="small">Small</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="large">Large</MenuItem>
          </Select>
        </FormControl>
      )}

      {/* CSS Classes */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
          CSS Classes (comma-separated)
        </Typography>
        <TextField
          value={(component.props?.classes || component.props?.className || []).join(', ')}
          onChange={(e) => {
            const classes = e.target.value
              .split(',')
              .map((c) => c.trim())
              .filter((c) => c);
            onPropertyChange('classes', classes);
            onPropertyChange('className', classes.join(' '));
          }}
          size="small"
          fullWidth
          placeholder="class1, class2, class3"
        />
      </Box>

      {/* Margin */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
          Margin
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Top"
            type="number"
            value={component.props?.margin?.top || component.props?.marginTop || ''}
            onChange={(e) => {
              const currentMargin = component.props?.margin || {};
              const newMargin = {
                ...currentMargin,
                top: e.target.value ? Number(e.target.value) : undefined,
              };
              // Only update if value actually changed
              if (newMargin.top !== currentMargin.top) {
                onPropertyChange('margin', newMargin);
              }
            }}
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Right"
            type="number"
            value={component.props?.margin?.right || component.props?.marginRight || ''}
            onChange={(e) => {
              const currentMargin = component.props?.margin || {};
              const newMargin = {
                ...currentMargin,
                right: e.target.value ? Number(e.target.value) : undefined,
              };
              if (newMargin.right !== currentMargin.right) {
                onPropertyChange('margin', newMargin);
              }
            }}
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Bottom"
            type="number"
            value={component.props?.margin?.bottom || component.props?.marginBottom || ''}
            onChange={(e) => {
              const currentMargin = component.props?.margin || {};
              const newMargin = {
                ...currentMargin,
                bottom: e.target.value ? Number(e.target.value) : undefined,
              };
              if (newMargin.bottom !== currentMargin.bottom) {
                onPropertyChange('margin', newMargin);
              }
            }}
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Left"
            type="number"
            value={component.props?.margin?.left || component.props?.marginLeft || ''}
            onChange={(e) => {
              const currentMargin = component.props?.margin || {};
              const newMargin = {
                ...currentMargin,
                left: e.target.value ? Number(e.target.value) : undefined,
              };
              if (newMargin.left !== currentMargin.left) {
                onPropertyChange('margin', newMargin);
              }
            }}
            size="small"
            sx={{ flex: 1 }}
          />
        </Box>
      </Box>

      {/* Padding */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
          Padding
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Top"
            type="number"
            value={component.props?.padding?.top || component.props?.paddingTop || ''}
            onChange={(e) => {
              const currentPadding = component.props?.padding || {};
              const newPadding = {
                ...currentPadding,
                top: e.target.value ? Number(e.target.value) : undefined,
              };
              if (newPadding.top !== currentPadding.top) {
                onPropertyChange('padding', newPadding);
              }
            }}
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Right"
            type="number"
            value={component.props?.padding?.right || component.props?.paddingRight || ''}
            onChange={(e) => {
              const currentPadding = component.props?.padding || {};
              const newPadding = {
                ...currentPadding,
                right: e.target.value ? Number(e.target.value) : undefined,
              };
              if (newPadding.right !== currentPadding.right) {
                onPropertyChange('padding', newPadding);
              }
            }}
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Bottom"
            type="number"
            value={component.props?.padding?.bottom || component.props?.paddingBottom || ''}
            onChange={(e) => {
              const currentPadding = component.props?.padding || {};
              const newPadding = {
                ...currentPadding,
                bottom: e.target.value ? Number(e.target.value) : undefined,
              };
              if (newPadding.bottom !== currentPadding.bottom) {
                onPropertyChange('padding', newPadding);
              }
            }}
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Left"
            type="number"
            value={component.props?.padding?.left || component.props?.paddingLeft || ''}
            onChange={(e) => {
              const currentPadding = component.props?.padding || {};
              const newPadding = {
                ...currentPadding,
                left: e.target.value ? Number(e.target.value) : undefined,
              };
              if (newPadding.left !== currentPadding.left) {
                onPropertyChange('padding', newPadding);
              }
            }}
            size="small"
            sx={{ flex: 1 }}
          />
        </Box>
      </Box>

      {/* Help Text / Description - For form inputs */}
      {isFormInput && (
        <TextField
          label="Help Text"
          value={component.props?.helpText || component.props?.helperText || ''}
          onChange={(e) => {
            onPropertyChange('helpText', e.target.value);
            onPropertyChange('helperText', e.target.value);
          }}
          size="small"
          fullWidth
          sx={{ mt: 1 }}
          multiline
          rows={2}
          helperText="Shown below the input to guide users"
        />
      )}

      {/* Error Message */}
      {isFormInput && (
        <TextField
          label="Error Message"
          value={component.props?.error || component.props?.errorMessage || ''}
          onChange={(e) => {
            onPropertyChange('error', e.target.value);
            onPropertyChange('errorMessage', e.target.value);
          }}
          size="small"
          fullWidth
          sx={{ mt: 1 }}
          helperText="Displayed when validation fails"
        />
      )}

      {/* Width */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
          Width
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Value"
            value={component.props?.width || ''}
            onChange={(e) => onPropertyChange('width', e.target.value)}
            onBlur={(e) => {
              const value = e.target.value.trim();
              if (value && value !== component.props?.width) {
                onPropertyChange('width', value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const value = (e.target as HTMLInputElement).value.trim();
                if (value && value !== component.props?.width) {
                  onPropertyChange('width', value);
                }
                (e.target as HTMLInputElement).blur();
              }
            }}
            size="small"
            sx={{ flex: 2 }}
            placeholder="100% or 200px"
          />
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Unit</InputLabel>
            <Select
              value={
                component.props?.width?.includes('%')
                  ? 'percent'
                  : component.props?.width?.includes('px')
                  ? 'pixels'
                  : 'auto'
              }
              label="Unit"
              onChange={(e) => {
                const currentValue = component.props?.width?.replace(/[^0-9]/g, '') || '';
                if (e.target.value === 'percent') {
                  onPropertyChange('width', currentValue ? `${currentValue}%` : '100%');
                } else if (e.target.value === 'pixels') {
                  onPropertyChange('width', currentValue ? `${currentValue}px` : '200px');
                } else {
                  onPropertyChange('width', 'auto');
                }
              }}
              size="small"
            >
              <MenuItem value="auto">Auto</MenuItem>
              <MenuItem value="percent">Percent (%)</MenuItem>
              <MenuItem value="pixels">Pixels (px)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Height */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
          Height
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Value"
            value={component.props?.height || ''}
            onChange={(e) => onPropertyChange('height', e.target.value)}
            size="small"
            sx={{ flex: 2 }}
            placeholder="auto or 100px"
          />
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Unit</InputLabel>
            <Select
              value={
                component.props?.height?.includes('%')
                  ? 'percent'
                  : component.props?.height?.includes('px')
                  ? 'pixels'
                  : 'auto'
              }
              label="Unit"
              onChange={(e) => {
                const currentValue = component.props?.height?.replace(/[^0-9]/g, '') || '';
                if (e.target.value === 'percent') {
                  onPropertyChange('height', currentValue ? `${currentValue}%` : '100%');
                } else if (e.target.value === 'pixels') {
                  onPropertyChange('height', currentValue ? `${currentValue}px` : '100px');
                } else {
                  onPropertyChange('height', 'auto');
                }
              }}
              size="small"
            >
              <MenuItem value="auto">Auto</MenuItem>
              <MenuItem value="percent">Percent (%)</MenuItem>
              <MenuItem value="pixels">Pixels (px)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

