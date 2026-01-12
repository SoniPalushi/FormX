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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, GridOn as GridIcon, Clear as ClearIcon } from '@mui/icons-material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface CommonPropertiesEditorProps {
  component: ComponentDefinition;
  onPropertyChange: (key: string, value: any) => void;
}

/**
 * Common properties that most form components should have
 */
// Default dimensions for different component types
const getDefaultDimensions = (type: string): { width: string; height: string } => {
  switch (type) {
    case 'Select':
    case 'DropDown':
    case 'AutoComplete':
      return { width: '300px', height: 'auto' };
    case 'TextInput':
      return { width: '300px', height: 'auto' };
    case 'TextArea':
      return { width: '100%', height: '120px' };
    case 'Button':
      return { width: 'auto', height: 'auto' };
    case 'Label':
    case 'Heading':
      return { width: 'auto', height: 'auto' };
    case 'Image':
      return { width: '200px', height: '150px' };
    case 'Container':
      return { width: '100%', height: '100px' };
    case 'Grid':
      return { width: '100%', height: '150px' };
    case 'CheckBox':
    case 'Toggle':
      return { width: 'auto', height: 'auto' };
    case 'RadioGroup':
    case 'CheckBoxGroup':
      return { width: '100%', height: 'auto' };
    case 'DateTime':
    case 'DateTimeCb':
      return { width: '250px', height: 'auto' };
    case 'Upload':
    case 'MultiUpload':
      return { width: '100%', height: '150px' };
    case 'DataGrid':
      return { width: '100%', height: '400px' };
    case 'Repeater':
    case 'RepeaterEx':
      return { width: '100%', height: 'auto' };
    default:
      return { width: '100%', height: 'auto' };
  }
};

export const CommonPropertiesEditor: React.FC<CommonPropertiesEditorProps> = ({
  component,
  onPropertyChange,
}) => {
  const { findComponentParent } = useFormBuilderStore();
  
  // Check if component is inside a Grid
  const parent = findComponentParent(component.id);
  const isInsideGrid = parent?.type === 'Grid';
  const gridColumns = parent?.props?.columns || 6;
  
  // Get default dimensions for this component type
  const defaultDimensions = getDefaultDimensions(component.type);
  
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

  // Column span options based on 12-column grid
  const columnSpanOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  return (
    <Box>
      <Typography variant="overline" sx={{ display: 'block', mb: 0.75, mt: 1.5, fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
        Common Properties
      </Typography>
      <Divider sx={{ mb: 1.5 }} />

      {/* Grid Column Span - Only show when inside a Grid */}
      {isInsideGrid && (
        <Accordion 
          defaultExpanded 
          sx={{ 
            mb: 1.5, 
            '&:before': { display: 'none' },
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'primary.light',
            borderRadius: '4px !important',
            bgcolor: 'primary.50',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              minHeight: 40,
              '& .MuiAccordionSummary-content': { my: 0.5 },
              bgcolor: 'primary.light',
              borderRadius: '4px 4px 0 0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GridIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'primary.dark' }}>
                Grid Column Span
              </Typography>
              <Typography variant="caption" sx={{ color: 'primary.main', ml: 0.5 }}>
                (Parent: {gridColumns} columns)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 1.5, pb: 1.5 }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: 'text.secondary' }}>
              Set how many columns this component spans at different screen sizes (out of 12)
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* XS - Extra Small (phones) */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Extra small devices (phones, 0px and up)">
                  <Typography variant="caption" sx={{ width: 30, fontWeight: 600 }}>XS:</Typography>
                </Tooltip>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select
                    value={component.props?.xs || component.props?.columnSpan || Math.floor(12 / gridColumns) || 12}
                    onChange={(e) => onPropertyChange('xs', Number(e.target.value))}
                  >
                    {columnSpanOptions.map((span) => (
                      <MenuItem key={span} value={span}>
                        {span} col{span > 1 ? 's' : ''} ({Math.round((span / 12) * 100)}%)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              {/* SM - Small (tablets) */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Small devices (tablets, 600px and up)">
                  <Typography variant="caption" sx={{ width: 30, fontWeight: 600 }}>SM:</Typography>
                </Tooltip>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select
                    value={component.props?.sm || component.props?.xs || component.props?.columnSpan || Math.floor(12 / gridColumns) || 12}
                    onChange={(e) => onPropertyChange('sm', Number(e.target.value))}
                  >
                    {columnSpanOptions.map((span) => (
                      <MenuItem key={span} value={span}>
                        {span} col{span > 1 ? 's' : ''} ({Math.round((span / 12) * 100)}%)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              {/* MD - Medium (small laptops) */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Medium devices (small laptops, 900px and up)">
                  <Typography variant="caption" sx={{ width: 30, fontWeight: 600 }}>MD:</Typography>
                </Tooltip>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select
                    value={component.props?.md || component.props?.sm || component.props?.xs || component.props?.columnSpan || Math.floor(12 / gridColumns) || 12}
                    onChange={(e) => onPropertyChange('md', Number(e.target.value))}
                  >
                    {columnSpanOptions.map((span) => (
                      <MenuItem key={span} value={span}>
                        {span} col{span > 1 ? 's' : ''} ({Math.round((span / 12) * 100)}%)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              {/* LG - Large (desktops) */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Large devices (desktops, 1200px and up)">
                  <Typography variant="caption" sx={{ width: 30, fontWeight: 600 }}>LG:</Typography>
                </Tooltip>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select
                    value={component.props?.lg || component.props?.md || component.props?.sm || component.props?.xs || component.props?.columnSpan || Math.floor(12 / gridColumns) || 12}
                    onChange={(e) => onPropertyChange('lg', Number(e.target.value))}
                  >
                    {columnSpanOptions.map((span) => (
                      <MenuItem key={span} value={span}>
                        {span} col{span > 1 ? 's' : ''} ({Math.round((span / 12) * 100)}%)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              {/* XL - Extra Large (large desktops) */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Extra large devices (large desktops, 1536px and up)">
                  <Typography variant="caption" sx={{ width: 30, fontWeight: 600 }}>XL:</Typography>
                </Tooltip>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select
                    value={component.props?.xl || component.props?.lg || component.props?.md || component.props?.sm || component.props?.xs || component.props?.columnSpan || Math.floor(12 / gridColumns) || 12}
                    onChange={(e) => onPropertyChange('xl', Number(e.target.value))}
                  >
                    {columnSpanOptions.map((span) => (
                      <MenuItem key={span} value={span}>
                        {span} col{span > 1 ? 's' : ''} ({Math.round((span / 12) * 100)}%)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Data Key - Important for form inputs (data binding) */}
      {isFormInput && (
        <>
          <TextField
            label="Data Key"
            value={component.props?.dataKey || ''}
            onChange={(e) => {
              const value = e.target.value.trim();
              onPropertyChange('dataKey', value || undefined);
              // Note: Component name will auto-update to match dataKey if not explicitly set
            }}
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            helperText="Field name for form data binding (e.g., 'customerName', 'email')"
            placeholder="e.g., customerName"
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
      <Box sx={{ mt: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Width
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
            Default: {defaultDimensions.width}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Value"
            value={component.props?.width || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                // Allow clearing - remove the property
                onPropertyChange('width', undefined);
              } else {
                onPropertyChange('width', value);
              }
            }}
            size="small"
            sx={{ flex: 2 }}
            placeholder={defaultDimensions.width}
            helperText={component.props?.width ? '' : `Default: ${defaultDimensions.width}`}
            InputProps={{
              endAdornment: component.props?.width ? (
                <IconButton
                  size="small"
                  onClick={() => onPropertyChange('width', undefined)}
                  sx={{ p: 0.25 }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              ) : null,
            }}
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
                const currentWidth = component.props?.width || '';
                const currentValue = currentWidth?.replace(/[^0-9]/g, '') || '';
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
      <Box sx={{ mt: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Height
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
            Default: {defaultDimensions.height}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Value"
            value={component.props?.height || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                // Allow clearing - remove the property
                onPropertyChange('height', undefined);
              } else {
                onPropertyChange('height', value);
              }
            }}
            size="small"
            sx={{ flex: 2 }}
            placeholder={defaultDimensions.height}
            helperText={component.props?.height ? '' : `Default: ${defaultDimensions.height}`}
            InputProps={{
              endAdornment: component.props?.height ? (
                <IconButton
                  size="small"
                  onClick={() => onPropertyChange('height', undefined)}
                  sx={{ p: 0.25 }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              ) : null,
            }}
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
                const currentHeight = component.props?.height || '';
                const currentValue = currentHeight?.replace(/[^0-9]/g, '') || '';
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

