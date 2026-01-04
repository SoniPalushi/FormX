import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Delete as DeleteIcon, ContentCopy as DuplicateIcon } from '@mui/icons-material';
import type { ComponentDefinition } from '../../stores/types';
import { useHistoryStore } from '../../stores/historyStore';
import { CommonPropertiesEditor } from './CommonPropertiesEditor';
import ValidationEditor from './ValidationEditor';
import EventHandlerEditor from './EventHandlerEditor';
import ComputedPropertyEditor from './ComputedPropertyEditor';
import ResponsiveStylesEditor from './ResponsiveStylesEditor';
import ConditionalRenderingEditor from './ConditionalRenderingEditor';
// Import store directly for getState()
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface PropertyEditorProps {
  component: ComponentDefinition;
}

const PropertyEditor: React.FC<PropertyEditorProps> = ({ component }) => {
  const { updateComponent, deleteComponent, duplicateComponent, components, findComponent } = useFormBuilderStore();
  const { addToHistory } = useHistoryStore();
  const updatingRef = React.useRef(false);

  // Get the latest component data from store to ensure we have updated props
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);

  // Ensure component has props object
  const componentWithProps = React.useMemo(() => {
    const comp = latestComponent;
    if (!comp.props) {
      return { ...comp, props: {} };
    }
    return comp;
  }, [latestComponent]);

  const handlePropertyChange = React.useCallback((key: string, value: any) => {
    // Prevent recursive updates
    if (updatingRef.current) return;
    
    // Get current component from store
    const currentComponent = findComponent(component.id);
    if (!currentComponent) return;

    // Compare values (handle objects/arrays properly)
    const currentValue = currentComponent.props?.[key];
    
    // Special handling for optionsSource - always update when changing source type
    if (key === 'optionsSource') {
      // For optionsSource, we want to allow updates even if values seem equal
      // because we're switching between different source types
    } else {
      const valuesEqual = typeof value === 'object' && value !== null && typeof currentValue === 'object' && currentValue !== null
        ? JSON.stringify(currentValue) === JSON.stringify(value)
        : currentValue === value;
      
      if (valuesEqual && value !== undefined) return;
    }

    updatingRef.current = true;

    // Update component - handle undefined by deleting the property
    const newProps = { ...(currentComponent.props || {}) };
    if (value === undefined) {
      delete newProps[key];
    } else {
      newProps[key] = value;
    }

    updateComponent(component.id, {
      props: newProps,
    });
    
    // Reset flag and add to history after update completes
    setTimeout(() => {
      updatingRef.current = false;
      const currentComponents = useFormBuilderStore.getState().components;
      addToHistory(JSON.parse(JSON.stringify(currentComponents)));
    }, 0);
  }, [component.id, findComponent, updateComponent, addToHistory]);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this component?')) {
      addToHistory(components);
      deleteComponent(componentWithProps.id);
    }
  };

  const handleDuplicate = () => {
    addToHistory(components);
    duplicateComponent(componentWithProps.id);
  };

  const renderPropertyField = (key: string, value: any) => {
    const valueType = typeof value;

    if (valueType === 'boolean') {
      return (
        <FormControlLabel
          key={key}
          control={
            <Switch
              checked={value}
              onChange={(e) => handlePropertyChange(key, e.target.checked)}
              size="small"
            />
          }
          label={key}
        />
      );
    }

    if (valueType === 'number') {
      return (
        <TextField
          key={key}
          label={key}
          type="number"
          value={value}
          onChange={(e) => handlePropertyChange(key, Number(e.target.value))}
          size="small"
          fullWidth
          sx={{ mt: 1 }}
        />
      );
    }

    if (Array.isArray(value)) {
      return (
        <Box key={key} sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
            {key}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {value.map((item: any, index: number) => (
              <Chip key={index} label={String(item)} size="small" />
            ))}
          </Box>
          <TextField
            label={`Add ${key} item`}
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                handlePropertyChange(key, [...value, input.value]);
                input.value = '';
              }
            }}
          />
        </Box>
      );
    }

    if (valueType === 'object' && value !== null) {
      return (
        <Accordion key={key} sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">{key}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {Object.entries(value).map(([nestedKey, nestedValue]) =>
              renderPropertyField(`${key}.${nestedKey}`, nestedValue)
            )}
          </AccordionDetails>
        </Accordion>
      );
    }

    // String or default
    return (
      <TextField
        key={key}
        label={key}
        value={String(value)}
        onChange={(e) => handlePropertyChange(key, e.target.value)}
        size="small"
        fullWidth
        sx={{ mt: 1 }}
        multiline={String(value).length > 50}
        rows={String(value).length > 50 ? 3 : 1}
      />
    );
  };

  const renderComponentSpecificFields = () => {
    switch (componentWithProps.type) {
      case 'TextInput':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Placeholder"
              value={componentWithProps.props?.placeholder || ''}
              onChange={(e) => handlePropertyChange('placeholder', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Default Value"
              value={componentWithProps.props?.value || componentWithProps.props?.defaultValue || ''}
              onChange={(e) => {
                handlePropertyChange('value', e.target.value);
                handlePropertyChange('defaultValue', e.target.value);
              }}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Max Length"
              type="number"
              value={componentWithProps.props?.maxLength || ''}
              onChange={(e) => handlePropertyChange('maxLength', e.target.value ? Number(e.target.value) : undefined)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Pattern (RegEx)"
              value={componentWithProps.props?.pattern || ''}
              onChange={(e) => handlePropertyChange('pattern', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
              helperText="HTML5 pattern attribute for validation"
            />
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={componentWithProps.props?.type || 'text'}
                label="Type"
                onChange={(e) => handlePropertyChange('type', e.target.value)}
                size="small"
              >
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="password">Password</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="tel">Telephone</MenuItem>
                <MenuItem value="url">URL</MenuItem>
                <MenuItem value="search">Search</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Variant</InputLabel>
              <Select
                value={componentWithProps.props?.variant || 'outlined'}
                label="Variant"
                onChange={(e) => handlePropertyChange('variant', e.target.value)}
                size="small"
              >
                <MenuItem value="outlined">Outlined</MenuItem>
                <MenuItem value="filled">Filled</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.fullWidth !== false}
                  onChange={(e) => handlePropertyChange('fullWidth', e.target.checked)}
                  size="small"
                />
              }
              label="Full Width"
              sx={{ mt: 0.75 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.multiline || false}
                  onChange={(e) => handlePropertyChange('multiline', e.target.checked)}
                  size="small"
                />
              }
              label="Multiline"
              sx={{ mt: 0.75 }}
            />
          </>
        );

      case 'TextArea':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Placeholder"
              value={componentWithProps.props?.placeholder || ''}
              onChange={(e) => handlePropertyChange('placeholder', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Default Value"
              value={componentWithProps.props?.value || componentWithProps.props?.defaultValue || ''}
              onChange={(e) => {
                handlePropertyChange('value', e.target.value);
                handlePropertyChange('defaultValue', e.target.value);
              }}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
              multiline
              rows={3}
            />
            <TextField
              label="Rows"
              type="number"
              value={componentWithProps.props?.rows || 4}
              onChange={(e) => handlePropertyChange('rows', Number(e.target.value))}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Max Length"
              type="number"
              value={componentWithProps.props?.maxLength || ''}
              onChange={(e) => handlePropertyChange('maxLength', e.target.value ? Number(e.target.value) : undefined)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Variant</InputLabel>
              <Select
                value={componentWithProps.props?.variant || 'outlined'}
                label="Variant"
                onChange={(e) => handlePropertyChange('variant', e.target.value)}
                size="small"
              >
                <MenuItem value="outlined">Outlined</MenuItem>
                <MenuItem value="filled">Filled</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.fullWidth !== false}
                  onChange={(e) => handlePropertyChange('fullWidth', e.target.checked)}
                  size="small"
                />
              }
              label="Full Width"
              sx={{ mt: 0.75 }}
            />
          </>
        );

      case 'Button':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || componentWithProps.props?.text || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Variant</InputLabel>
              <Select
                value={componentWithProps.props?.variant || 'contained'}
                label="Variant"
                onChange={(e) => handlePropertyChange('variant', e.target.value)}
                size="small"
              >
                <MenuItem value="contained">Contained</MenuItem>
                <MenuItem value="outlined">Outlined</MenuItem>
                <MenuItem value="text">Text</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Color</InputLabel>
              <Select
                value={componentWithProps.props?.color || 'primary'}
                label="Color"
                onChange={(e) => handlePropertyChange('color', e.target.value)}
                size="small"
              >
                <MenuItem value="primary">Primary</MenuItem>
                <MenuItem value="secondary">Secondary</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
              </Select>
            </FormControl>
          </>
        );

      case 'Label':
      case 'Heading':
        return (
          <>
            <TextField
              label="Text"
              value={componentWithProps.props?.text || componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('text', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
              multiline
              rows={2}
            />
            {componentWithProps.type === 'Heading' && (
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>Variant</InputLabel>
                <Select
                  value={componentWithProps.props?.variant || 'h4'}
                  label="Variant"
                  onChange={(e) => handlePropertyChange('variant', e.target.value)}
                  size="small"
                >
                  <MenuItem value="h1">H1</MenuItem>
                  <MenuItem value="h2">H2</MenuItem>
                  <MenuItem value="h3">H3</MenuItem>
                  <MenuItem value="h4">H4</MenuItem>
                  <MenuItem value="h5">H5</MenuItem>
                  <MenuItem value="h6">H6</MenuItem>
                </Select>
              </FormControl>
            )}
          </>
        );

      case 'Link':
        return (
          <>
            <TextField
              label="Text"
              value={componentWithProps.props?.text || ''}
              onChange={(e) => handlePropertyChange('text', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Href"
              value={componentWithProps.props?.href || ''}
              onChange={(e) => handlePropertyChange('href', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
          </>
        );

      case 'Select':
      case 'DropDown':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Default Value"
              value={componentWithProps.props?.value || componentWithProps.props?.defaultValue || ''}
              onChange={(e) => {
                handlePropertyChange('value', e.target.value);
                handlePropertyChange('defaultValue', e.target.value);
              }}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                Options Data Source
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel id={`source-type-label-${componentWithProps.id}`}>Source Type</InputLabel>
                <Select
                  key={`source-type-select-${componentWithProps.id}-${JSON.stringify(componentWithProps.props?.optionsSource)}`}
                  labelId={`source-type-label-${componentWithProps.id}`}
                  value={(() => {
                    const optionsSource = componentWithProps.props?.optionsSource;
                    // Check if it's a function
                    if (typeof optionsSource === 'function') {
                      return 'function';
                    }
                    // Check if it's a computed property object
                    if (typeof optionsSource === 'object' && optionsSource !== null && 'computeType' in optionsSource) {
                      return 'computed';
                    }
                    // Check if it's a string (could be function code or dataKey)
                    if (typeof optionsSource === 'string' && optionsSource !== '') {
                      // If it looks like function code (contains => or function), it's a function
                      if (optionsSource.includes('=>') || optionsSource.includes('function') || optionsSource.startsWith('(')) {
                        return 'function';
                      }
                      // Otherwise it's a dataKey
                      return 'dataKey';
                    }
                    // Default to static
                    return 'static';
                  })()}
                  label="Source Type"
                  onChange={(e) => {
                    e.stopPropagation();
                    const newValue = e.target.value;
                    if (newValue === 'static') {
                      // Clear optionsSource to use static options
                      handlePropertyChange('optionsSource', undefined);
                    } else if (newValue === 'function') {
                      // Set as string first, will be converted to function when user enters code
                      handlePropertyChange('optionsSource', '(data, component) => { return []; }');
                    } else if (newValue === 'computed') {
                      handlePropertyChange('optionsSource', { computeType: 'function', fnSource: 'return [];' });
                    } else if (newValue === 'dataKey') {
                      handlePropertyChange('optionsSource', '');
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <MenuItem value="static">Static Array</MenuItem>
                  <MenuItem value="function">Function (Data Provider)</MenuItem>
                  <MenuItem value="computed">Computed Property</MenuItem>
                  <MenuItem value="dataKey">Data Key (from Form Data)</MenuItem>
                </Select>
              </FormControl>
              
              {(() => {
                const optionsSource = componentWithProps.props?.optionsSource;
                let sourceType: string;
                // Check if it's a function
                if (typeof optionsSource === 'function') {
                  sourceType = 'function';
                }
                // Check if it's a computed property object
                else if (typeof optionsSource === 'object' && optionsSource !== null && 'computeType' in optionsSource) {
                  sourceType = 'computed';
                }
                // Check if it's a string (could be function code or dataKey)
                else if (typeof optionsSource === 'string' && optionsSource !== '') {
                  // If it looks like function code (contains => or function), it's a function
                  if (optionsSource.includes('=>') || optionsSource.includes('function') || optionsSource.startsWith('(')) {
                    sourceType = 'function';
                  } else {
                    // Otherwise it's a dataKey
                    sourceType = 'dataKey';
                  }
                }
                // Default to static
                else {
                  sourceType = 'static';
                }
                
                if (sourceType === 'static') {
                  return (
                    <>
                      <Typography variant="caption">Options (one per line, or value:label format)</Typography>
                      <TextField
                        value={(componentWithProps.props?.options || []).map((opt: any) => 
                          typeof opt === 'string' ? opt : `${opt.value || opt.key}:${opt.label || opt.value || opt.key}`
                        ).join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n').filter((o) => o.trim());
                          const options = lines.map((line) => {
                            if (line.includes(':')) {
                              const [value, label] = line.split(':').map(s => s.trim());
                              return { value, label: label || value };
                            }
                            return line;
                          });
                          handlePropertyChange('options', options);
                        }}
                        size="small"
                        fullWidth
                        multiline
                        rows={4}
                        sx={{ mt: 0.5 }}
                        helperText="Format: option1 or value1:Label 1"
                      />
                    </>
                  );
                } else if (sourceType === 'function') {
                  return (
                    <TextField
                      label="Function Source Code"
                      value={
                        typeof componentWithProps.props?.optionsSource === 'function'
                          ? componentWithProps.props.optionsSource.toString()
                          : String(componentWithProps.props?.optionsSource || '')
                      }
                      onChange={(e) => {
                        try {
                          // Try to evaluate as function
                          const fn = new Function('data', 'component', `return ${e.target.value}`);
                          handlePropertyChange('optionsSource', fn);
                        } catch {
                          // Store as string if not valid function
                          handlePropertyChange('optionsSource', e.target.value);
                        }
                      }}
                      size="small"
                      fullWidth
                      multiline
                      rows={4}
                      sx={{ mt: 0.5 }}
                      placeholder="(data, component) => { return [{value: '1', label: 'Option 1'}]; }"
                      helperText="JavaScript function that returns an array of options"
                    />
                  );
                } else if (sourceType === 'computed') {
                  return (
                    <Box sx={{ mt: 0.5 }}>
                      <ComputedPropertyEditor
                        propertyKey="options"
                        property={componentWithProps.props?.optionsSource as any}
                        formData={{}}
                        onChange={(property) => handlePropertyChange('optionsSource', property)}
                      />
                    </Box>
                  );
                } else if (sourceType === 'dataKey') {
                  return (
                    <TextField
                      label="Data Key"
                      value={String(componentWithProps.props?.optionsSource || '')}
                      onChange={(e) => handlePropertyChange('optionsSource', e.target.value)}
                      size="small"
                      fullWidth
                      sx={{ mt: 0.5 }}
                      helperText="Key in form data store that contains the options array (e.g., 'countries', 'user.roles')"
                    />
                  );
                }
                return null;
              })()}
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.multiple || false}
                  onChange={(e) => handlePropertyChange('multiple', e.target.checked)}
                  size="small"
                />
              }
              label="Multiple Selection"
              sx={{ mt: 0.75 }}
            />
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Variant</InputLabel>
              <Select
                value={componentWithProps.props?.variant || 'outlined'}
                label="Variant"
                onChange={(e) => handlePropertyChange('variant', e.target.value)}
                size="small"
              >
                <MenuItem value="outlined">Outlined</MenuItem>
                <MenuItem value="filled">Filled</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.fullWidth !== false}
                  onChange={(e) => handlePropertyChange('fullWidth', e.target.checked)}
                  size="small"
                />
              }
              label="Full Width"
              sx={{ mt: 0.75 }}
            />
          </>
        );

      case 'Image':
        return (
          <>
            <TextField
              label="Source (URL)"
              value={componentWithProps.props?.src || ''}
              onChange={(e) => handlePropertyChange('src', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Alt Text"
              value={componentWithProps.props?.alt || ''}
              onChange={(e) => handlePropertyChange('alt', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
          </>
        );

      case 'Header':
        return (
          <>
            <TextField
              label="Title"
              value={componentWithProps.props?.title || componentWithProps.props?.text || ''}
              onChange={(e) => handlePropertyChange('title', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Position</InputLabel>
              <Select
                value={componentWithProps.props?.position || 'static'}
                label="Position"
                onChange={(e) => handlePropertyChange('position', e.target.value)}
                size="small"
              >
                <MenuItem value="static">Static</MenuItem>
                <MenuItem value="fixed">Fixed</MenuItem>
                <MenuItem value="sticky">Sticky</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Color</InputLabel>
              <Select
                value={componentWithProps.props?.color || 'primary'}
                label="Color"
                onChange={(e) => handlePropertyChange('color', e.target.value)}
                size="small"
              >
                <MenuItem value="primary">Primary</MenuItem>
                <MenuItem value="secondary">Secondary</MenuItem>
                <MenuItem value="inherit">Inherit</MenuItem>
                <MenuItem value="transparent">Transparent</MenuItem>
              </Select>
            </FormControl>
          </>
        );

      case 'Footer':
        return (
          <>
            <TextField
              label="Text"
              value={componentWithProps.props?.text || componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('text', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Elevation"
              type="number"
              value={componentWithProps.props?.elevation || 3}
              onChange={(e) => handlePropertyChange('elevation', Number(e.target.value))}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
          </>
        );

      case 'Amount':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Currency Symbol"
              value={componentWithProps.props?.currency || componentWithProps.props?.currencySymbol || '$'}
              onChange={(e) => handlePropertyChange('currency', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Decimal Places"
              type="number"
              value={componentWithProps.props?.decimalPlaces ?? 2}
              onChange={(e) => handlePropertyChange('decimalPlaces', Number(e.target.value))}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Min Value"
              type="number"
              value={componentWithProps.props?.min || ''}
              onChange={(e) => handlePropertyChange('min', e.target.value ? Number(e.target.value) : undefined)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Max Value"
              type="number"
              value={componentWithProps.props?.max || ''}
              onChange={(e) => handlePropertyChange('max', e.target.value ? Number(e.target.value) : undefined)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
          </>
        );

      case 'AutoComplete':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption">Options (one per line)</Typography>
              <TextField
                value={(componentWithProps.props?.options || []).join('\n')}
                onChange={(e) => {
                  const options = e.target.value.split('\n').filter((o) => o.trim());
                  handlePropertyChange('options', options);
                }}
                size="small"
                fullWidth
                multiline
                rows={4}
                sx={{ mt: 0.5 }}
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.multiple || false}
                  onChange={(e) => handlePropertyChange('multiple', e.target.checked)}
                  size="small"
                />
              }
              label="Multiple Selection"
              sx={{ mt: 0.75 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.freeSolo || false}
                  onChange={(e) => handlePropertyChange('freeSolo', e.target.checked)}
                  size="small"
                />
              }
              label="Free Solo (Allow Custom Input)"
              sx={{ mt: 0.75 }}
            />
          </>
        );

      case 'Wizard':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption">Steps (one per line)</Typography>
              <TextField
                value={(componentWithProps.props?.steps || []).join('\n')}
                onChange={(e) => {
                  const steps = e.target.value.split('\n').filter((s) => s.trim());
                  handlePropertyChange('steps', steps);
                }}
                size="small"
                fullWidth
                multiline
                rows={4}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </>
        );

      case 'ViewStack':
        return (
          <>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Orientation</InputLabel>
              <Select
                value={componentWithProps.props?.orientation || 'horizontal'}
                label="Orientation"
                onChange={(e) => handlePropertyChange('orientation', e.target.value)}
                size="small"
              >
                <MenuItem value="horizontal">Horizontal</MenuItem>
                <MenuItem value="vertical">Vertical</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption">Tabs (one per line)</Typography>
              <TextField
                value={(componentWithProps.props?.tabs || []).join('\n')}
                onChange={(e) => {
                  const tabs = e.target.value.split('\n').filter((t) => t.trim());
                  handlePropertyChange('tabs', tabs);
                }}
                size="small"
                fullWidth
                multiline
                rows={3}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </>
        );

      case 'CheckBox':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.checked || false}
                  onChange={(e) => handlePropertyChange('checked', e.target.checked)}
                  size="small"
                />
              }
              label="Checked (Default)"
              sx={{ mt: 0.75 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.indeterminate || false}
                  onChange={(e) => handlePropertyChange('indeterminate', e.target.checked)}
                  size="small"
                />
              }
              label="Indeterminate"
              sx={{ mt: 0.75 }}
            />
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Color</InputLabel>
              <Select
                value={componentWithProps.props?.color || 'primary'}
                label="Color"
                onChange={(e) => handlePropertyChange('color', e.target.value)}
                size="small"
              >
                <MenuItem value="primary">Primary</MenuItem>
                <MenuItem value="secondary">Secondary</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="default">Default</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Size</InputLabel>
              <Select
                value={componentWithProps.props?.size || 'medium'}
                label="Size"
                onChange={(e) => handlePropertyChange('size', e.target.value)}
                size="small"
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </Select>
            </FormControl>
          </>
        );

      case 'RadioGroup':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Default Value"
              value={componentWithProps.props?.value || componentWithProps.props?.defaultValue || ''}
              onChange={(e) => {
                handlePropertyChange('value', e.target.value);
                handlePropertyChange('defaultValue', e.target.value);
              }}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption">Options (one per line, or key:value format)</Typography>
              <TextField
                value={(componentWithProps.props?.options || []).map((opt: any) => 
                  typeof opt === 'string' ? opt : `${opt.value || opt.key}:${opt.label || opt.value || opt.key}`
                ).join('\n')}
                onChange={(e) => {
                  const lines = e.target.value.split('\n').filter((o) => o.trim());
                  const options = lines.map((line) => {
                    if (line.includes(':')) {
                      const [value, label] = line.split(':').map(s => s.trim());
                      return { value, label: label || value };
                    }
                    return line;
                  });
                  handlePropertyChange('options', options);
                }}
                size="small"
                fullWidth
                multiline
                rows={4}
                sx={{ mt: 0.5 }}
                helperText="Format: option1 or value1:Label 1"
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.row || false}
                  onChange={(e) => handlePropertyChange('row', e.target.checked)}
                  size="small"
                />
              }
              label="Row Layout"
              sx={{ mt: 0.75 }}
            />
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Size</InputLabel>
              <Select
                value={componentWithProps.props?.size || 'medium'}
                label="Size"
                onChange={(e) => handlePropertyChange('size', e.target.value)}
                size="small"
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </Select>
            </FormControl>
          </>
        );

      case 'Toggle':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.checked || false}
                  onChange={(e) => handlePropertyChange('checked', e.target.checked)}
                  size="small"
                />
              }
              label="Checked (Default)"
              sx={{ mt: 0.75 }}
            />
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Color</InputLabel>
              <Select
                value={componentWithProps.props?.color || 'primary'}
                label="Color"
                onChange={(e) => handlePropertyChange('color', e.target.value)}
                size="small"
              >
                <MenuItem value="primary">Primary</MenuItem>
                <MenuItem value="secondary">Secondary</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="default">Default</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Size</InputLabel>
              <Select
                value={componentWithProps.props?.size || 'medium'}
                label="Size"
                onChange={(e) => handlePropertyChange('size', e.target.value)}
                size="small"
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </Select>
            </FormControl>
          </>
        );

      case 'DateTime':
      case 'DateTimeCb':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Default Value"
              value={componentWithProps.props?.value || componentWithProps.props?.defaultValue || ''}
              onChange={(e) => {
                handlePropertyChange('value', e.target.value);
                handlePropertyChange('defaultValue', e.target.value);
              }}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={componentWithProps.props?.type || 'datetime-local'}
                label="Type"
                onChange={(e) => handlePropertyChange('type', e.target.value)}
                size="small"
              >
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="time">Time</MenuItem>
                <MenuItem value="datetime-local">Date & Time</MenuItem>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="week">Week</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Min Date/Time"
              value={componentWithProps.props?.min || ''}
              onChange={(e) => handlePropertyChange('min', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
              helperText="Format: YYYY-MM-DD or YYYY-MM-DDTHH:mm"
            />
            <TextField
              label="Max Date/Time"
              value={componentWithProps.props?.max || ''}
              onChange={(e) => handlePropertyChange('max', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
              helperText="Format: YYYY-MM-DD or YYYY-MM-DDTHH:mm"
            />
            <TextField
              label="Step (seconds)"
              type="number"
              value={componentWithProps.props?.step || ''}
              onChange={(e) => handlePropertyChange('step', e.target.value ? Number(e.target.value) : undefined)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
              helperText="For time inputs, step in seconds"
            />
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Variant</InputLabel>
              <Select
                value={componentWithProps.props?.variant || 'outlined'}
                label="Variant"
                onChange={(e) => handlePropertyChange('variant', e.target.value)}
                size="small"
              >
                <MenuItem value="outlined">Outlined</MenuItem>
                <MenuItem value="filled">Filled</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.fullWidth !== false}
                  onChange={(e) => handlePropertyChange('fullWidth', e.target.checked)}
                  size="small"
                />
              }
              label="Full Width"
              sx={{ mt: 0.75 }}
            />
          </>
        );

      case 'Container':
        return (
          <>
            <FormControl fullWidth sx={{ mt: 0.75 }}>
              <InputLabel>Layout Direction</InputLabel>
              <Select
                value={componentWithProps.props?.flexDirection || componentWithProps.props?.direction || 'column'}
                label="Layout Direction"
                onChange={(e) => {
                  handlePropertyChange('flexDirection', e.target.value);
                  handlePropertyChange('direction', e.target.value);
                }}
                size="small"
              >
                <MenuItem value="row">Row (Inline)</MenuItem>
                <MenuItem value="column">Column (Stacked)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Gap"
              type="number"
              value={componentWithProps.props?.gap || 1.5}
              onChange={(e) => handlePropertyChange('gap', e.target.value ? Number(e.target.value) : 1.5)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
              helperText="Spacing between items (in theme spacing units)"
            />
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Align Items</InputLabel>
              <Select
                value={componentWithProps.props?.alignItems || 'stretch'}
                label="Align Items"
                onChange={(e) => handlePropertyChange('alignItems', e.target.value)}
                size="small"
              >
                <MenuItem value="stretch">Stretch</MenuItem>
                <MenuItem value="flex-start">Flex Start</MenuItem>
                <MenuItem value="flex-end">Flex End</MenuItem>
                <MenuItem value="center">Center</MenuItem>
                <MenuItem value="baseline">Baseline</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Justify Content</InputLabel>
              <Select
                value={componentWithProps.props?.justifyContent || 'flex-start'}
                label="Justify Content"
                onChange={(e) => handlePropertyChange('justifyContent', e.target.value)}
                size="small"
              >
                <MenuItem value="flex-start">Flex Start</MenuItem>
                <MenuItem value="flex-end">Flex End</MenuItem>
                <MenuItem value="center">Center</MenuItem>
                <MenuItem value="space-between">Space Between</MenuItem>
                <MenuItem value="space-around">Space Around</MenuItem>
                <MenuItem value="space-evenly">Space Evenly</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Flex Wrap</InputLabel>
              <Select
                value={componentWithProps.props?.flexWrap || 'nowrap'}
                label="Flex Wrap"
                onChange={(e) => handlePropertyChange('flexWrap', e.target.value)}
                size="small"
              >
                <MenuItem value="nowrap">No Wrap</MenuItem>
                <MenuItem value="wrap">Wrap</MenuItem>
                <MenuItem value="wrap-reverse">Wrap Reverse</MenuItem>
              </Select>
            </FormControl>
          </>
        );

      case 'Repeater':
      case 'RepeaterEx':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <TextField
              label="Min Items"
              type="number"
              value={componentWithProps.props?.min || componentWithProps.props?.minItems || 0}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : 0;
                handlePropertyChange('min', value);
                handlePropertyChange('minItems', value);
              }}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
              helperText="Minimum number of items required"
            />
            <TextField
              label="Max Items"
              type="number"
              value={componentWithProps.props?.max || componentWithProps.props?.maxItems || ''}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : undefined;
                handlePropertyChange('max', value);
                handlePropertyChange('maxItems', value);
              }}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
              helperText="Maximum number of items allowed (leave empty for unlimited)"
            />
            <TextField
              label="Data Provider (JSON array or function)"
              value={
                typeof componentWithProps.props?.dataProvider === 'string'
                  ? componentWithProps.props.dataProvider
                  : Array.isArray(componentWithProps.props?.dataProvider)
                  ? JSON.stringify(componentWithProps.props.dataProvider, null, 2)
                  : ''
              }
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handlePropertyChange('dataProvider', parsed);
                } catch {
                  // If not valid JSON, treat as function string
                  handlePropertyChange('dataProvider', e.target.value);
                }
              }}
              size="small"
              fullWidth
              multiline
              rows={4}
              sx={{ mt: 0.75 }}
              helperText="Array of data objects or JavaScript function: (data, component) => []"
            />
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                Item Render When (Conditional Rendering)
              </Typography>
              <ConditionalRenderingEditor
                renderWhen={componentWithProps.props?.itemRenderWhen}
                formData={{}}
                onChange={(itemRenderWhen) => handlePropertyChange('itemRenderWhen', itemRenderWhen)}
              />
            </Box>
          </>
        );

      case 'DataGrid':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                Data Source
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Source Type</InputLabel>
                <Select
                  value={
                    typeof componentWithProps.props?.dataSource === 'function' ? 'function' :
                    typeof componentWithProps.props?.dataSource === 'object' && componentWithProps.props?.dataSource?.computeType ? 'computed' :
                    typeof componentWithProps.props?.dataSource === 'string' && !Array.isArray(componentWithProps.props?.rows) && !Array.isArray(componentWithProps.props?.data) ? 'dataKey' :
                    'static'
                  }
                  label="Source Type"
                  onChange={(e) => {
                    if (e.target.value === 'static') {
                      // When switching to static, preserve existing data if available
                      const existingData = componentWithProps.props?.dataSource || 
                                         componentWithProps.props?.rows || 
                                         componentWithProps.props?.data;
                      // Only set if we have actual data, otherwise leave it
                      if (existingData !== undefined && existingData !== null) {
                        if (Array.isArray(existingData) && existingData.length > 0) {
                          handlePropertyChange('dataSource', existingData);
                        } else if (!Array.isArray(existingData)) {
                          // If it's not an array, try to convert or set empty array
                          handlePropertyChange('dataSource', []);
                        }
                      }
                    } else if (e.target.value === 'function') {
                      handlePropertyChange('dataSource', '(data, component) => { return []; }');
                    } else if (e.target.value === 'computed') {
                      handlePropertyChange('dataSource', { computeType: 'function', fnSource: 'return [];' });
                    } else if (e.target.value === 'dataKey') {
                      handlePropertyChange('dataSource', '');
                    }
                  }}
                >
                  <MenuItem value="static">Static Array</MenuItem>
                  <MenuItem value="function">Function (Data Provider)</MenuItem>
                  <MenuItem value="computed">Computed Property</MenuItem>
                  <MenuItem value="dataKey">Data Key (from Form Data)</MenuItem>
                </Select>
              </FormControl>
              
              {(() => {
                const sourceType = 
                  typeof componentWithProps.props?.dataSource === 'function' ? 'function' :
                  typeof componentWithProps.props?.dataSource === 'object' && componentWithProps.props?.dataSource?.computeType ? 'computed' :
                  typeof componentWithProps.props?.dataSource === 'string' && !Array.isArray(componentWithProps.props?.rows) && !Array.isArray(componentWithProps.props?.data) ? 'dataKey' :
                  'static';
                
                if (sourceType === 'static') {
                  return (
                    <>
                      <Typography variant="caption">Rows Data (JSON array)</Typography>
                      <TextField
                        value={JSON.stringify(
                          (Array.isArray(componentWithProps.props?.dataSource) && componentWithProps.props.dataSource.length > 0) ? componentWithProps.props.dataSource :
                          (Array.isArray(componentWithProps.props?.rows) && componentWithProps.props.rows.length > 0) ? componentWithProps.props.rows :
                          (Array.isArray(componentWithProps.props?.data) && componentWithProps.props.data.length > 0) ? componentWithProps.props.data :
                          [], 
                          null, 
                          2
                        )}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            // Set all three properties to ensure compatibility
                            handlePropertyChange('dataSource', parsed);
                            handlePropertyChange('rows', parsed);
                            handlePropertyChange('data', parsed);
                          } catch {
                            // If JSON is invalid, still try to save as string for user to fix
                            handlePropertyChange('dataSource', e.target.value);
                          }
                        }}
                        size="small"
                        fullWidth
                        multiline
                        rows={6}
                        sx={{ mt: 0.5 }}
                        helperText="Array of objects, e.g., [{id: 1, name: 'John'}, {id: 2, name: 'Jane'}]"
                      />
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, mb: 0.5 }}>Columns</Typography>
                      <TextField
                        value={JSON.stringify(componentWithProps.props?.columns || [], null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            handlePropertyChange('columns', parsed);
                          } catch {}
                        }}
                        size="small"
                        fullWidth
                        multiline
                        rows={4}
                        helperText="Array of column definitions, e.g., [{field: 'id', headerName: 'ID'}, {field: 'name', headerName: 'Name'}]"
                      />
                    </>
                  );
                } else if (sourceType === 'function') {
                  return (
                    <TextField
                      label="Function Name or Code"
                      value={
                        typeof componentWithProps.props?.dataSource === 'function'
                          ? componentWithProps.props.dataSource.toString()
                          : String(componentWithProps.props?.dataSource || '')
                      }
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        // If it's just a function name (simple identifier), save as string for external import
                        if (value.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
                          handlePropertyChange('dataSource', value);
                        } else {
                          // Try to parse as function code
                          try {
                            const fn = new Function('data', 'component', `return ${value}`);
                            handlePropertyChange('dataSource', fn);
                          } catch {
                            // If parsing fails, save as string (might be function name or invalid code)
                            handlePropertyChange('dataSource', value);
                          }
                        }
                      }}
                      size="small"
                      fullWidth
                      multiline
                      rows={4}
                      sx={{ mt: 0.5 }}
                      placeholder="fetchConsumers or (data, component) => { return [{id: 1, name: 'John'}]; }"
                      helperText="Enter function name (e.g., 'fetchConsumers') for external API import, or full function code for inline function"
                    />
                  );
                } else if (sourceType === 'computed') {
                  return (
                    <Box sx={{ mt: 0.5 }}>
                      <ComputedPropertyEditor
                        propertyKey="dataSource"
                        property={componentWithProps.props?.dataSource as any}
                        formData={{}}
                        onChange={(property) => handlePropertyChange('dataSource', property)}
                      />
                    </Box>
                  );
                } else if (sourceType === 'dataKey') {
                  return (
                    <TextField
                      label="Data Key"
                      value={String(componentWithProps.props?.dataSource || '')}
                      onChange={(e) => handlePropertyChange('dataSource', e.target.value)}
                      size="small"
                      fullWidth
                      sx={{ mt: 0.5 }}
                      helperText="Key in form data store that contains the rows array"
                    />
                  );
                }
                return null;
              })()}
            </Box>
          </>
        );

      case 'List':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                Items Data Source
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Source Type</InputLabel>
                <Select
                  value={
                    typeof componentWithProps.props?.dataSource === 'function' ? 'function' :
                    typeof componentWithProps.props?.dataSource === 'object' && componentWithProps.props?.dataSource?.computeType ? 'computed' :
                    typeof componentWithProps.props?.dataSource === 'string' && !Array.isArray(componentWithProps.props?.items) && !Array.isArray(componentWithProps.props?.data) ? 'dataKey' :
                    'static'
                  }
                  label="Source Type"
                  onChange={(e) => {
                    if (e.target.value === 'static') {
                      handlePropertyChange('dataSource', []);
                    } else if (e.target.value === 'function') {
                      handlePropertyChange('dataSource', '(data, component) => { return []; }');
                    } else if (e.target.value === 'computed') {
                      handlePropertyChange('dataSource', { computeType: 'function', fnSource: 'return [];' });
                    } else if (e.target.value === 'dataKey') {
                      handlePropertyChange('dataSource', '');
                    }
                  }}
                >
                  <MenuItem value="static">Static Array</MenuItem>
                  <MenuItem value="function">Function (Data Provider)</MenuItem>
                  <MenuItem value="computed">Computed Property</MenuItem>
                  <MenuItem value="dataKey">Data Key (from Form Data)</MenuItem>
                </Select>
              </FormControl>
              
              {(() => {
                const sourceType = 
                  typeof componentWithProps.props?.dataSource === 'function' ? 'function' :
                  typeof componentWithProps.props?.dataSource === 'object' && componentWithProps.props?.dataSource?.computeType ? 'computed' :
                  typeof componentWithProps.props?.dataSource === 'string' && !Array.isArray(componentWithProps.props?.items) && !Array.isArray(componentWithProps.props?.data) ? 'dataKey' :
                  'static';
                
                if (sourceType === 'static') {
                  return (
                    <>
                      <Typography variant="caption">Items (JSON array)</Typography>
                      <TextField
                        value={JSON.stringify(componentWithProps.props?.items || componentWithProps.props?.data || [], null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            handlePropertyChange('items', parsed);
                            handlePropertyChange('data', parsed);
                          } catch {}
                        }}
                        size="small"
                        fullWidth
                        multiline
                        rows={6}
                        sx={{ mt: 0.5 }}
                        helperText="Array of items, e.g., ['Item 1', 'Item 2'] or [{label: 'Item 1', secondary: 'Description'}]"
                      />
                    </>
                  );
                } else if (sourceType === 'function') {
                  return (
                    <TextField
                      label="Function Source Code"
                      value={
                        typeof componentWithProps.props?.dataSource === 'function'
                          ? componentWithProps.props.dataSource.toString()
                          : String(componentWithProps.props?.dataSource || '')
                      }
                      onChange={(e) => {
                        try {
                          const fn = new Function('data', 'component', `return ${e.target.value}`);
                          handlePropertyChange('dataSource', fn);
                        } catch {
                          handlePropertyChange('dataSource', e.target.value);
                        }
                      }}
                      size="small"
                      fullWidth
                      multiline
                      rows={4}
                      sx={{ mt: 0.5 }}
                      placeholder="(data, component) => { return ['Item 1', 'Item 2']; }"
                      helperText="JavaScript function that returns an array of items"
                    />
                  );
                } else if (sourceType === 'computed') {
                  return (
                    <Box sx={{ mt: 0.5 }}>
                      <ComputedPropertyEditor
                        propertyKey="dataSource"
                        property={componentWithProps.props?.dataSource as any}
                        formData={{}}
                        onChange={(property) => handlePropertyChange('dataSource', property)}
                      />
                    </Box>
                  );
                } else if (sourceType === 'dataKey') {
                  return (
                    <TextField
                      label="Data Key"
                      value={String(componentWithProps.props?.dataSource || '')}
                      onChange={(e) => handlePropertyChange('dataSource', e.target.value)}
                      size="small"
                      fullWidth
                      sx={{ mt: 0.5 }}
                      helperText="Key in form data store that contains the items array"
                    />
                  );
                }
                return null;
              })()}
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.dense || false}
                  onChange={(e) => handlePropertyChange('dense', e.target.checked)}
                  size="small"
                />
              }
              label="Dense"
              sx={{ mt: 0.75 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.showAvatar !== false}
                  onChange={(e) => handlePropertyChange('showAvatar', e.target.checked)}
                  size="small"
                />
              }
              label="Show Avatar"
              sx={{ mt: 0.75 }}
            />
          </>
        );

      case 'Tree':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                Tree Data Source
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Source Type</InputLabel>
                <Select
                  value={
                    typeof componentWithProps.props?.dataSource === 'function' ? 'function' :
                    typeof componentWithProps.props?.dataSource === 'object' && componentWithProps.props?.dataSource?.computeType ? 'computed' :
                    typeof componentWithProps.props?.dataSource === 'string' && !Array.isArray(componentWithProps.props?.data) && !Array.isArray(componentWithProps.props?.treeData) ? 'dataKey' :
                    'static'
                  }
                  label="Source Type"
                  onChange={(e) => {
                    if (e.target.value === 'static') {
                      handlePropertyChange('dataSource', []);
                    } else if (e.target.value === 'function') {
                      handlePropertyChange('dataSource', '(data, component) => { return []; }');
                    } else if (e.target.value === 'computed') {
                      handlePropertyChange('dataSource', { computeType: 'function', fnSource: 'return [];' });
                    } else if (e.target.value === 'dataKey') {
                      handlePropertyChange('dataSource', '');
                    }
                  }}
                >
                  <MenuItem value="static">Static Array</MenuItem>
                  <MenuItem value="function">Function (Data Provider)</MenuItem>
                  <MenuItem value="computed">Computed Property</MenuItem>
                  <MenuItem value="dataKey">Data Key (from Form Data)</MenuItem>
                </Select>
              </FormControl>
              
              {(() => {
                const sourceType = 
                  typeof componentWithProps.props?.dataSource === 'function' ? 'function' :
                  typeof componentWithProps.props?.dataSource === 'object' && componentWithProps.props?.dataSource?.computeType ? 'computed' :
                  typeof componentWithProps.props?.dataSource === 'string' && !Array.isArray(componentWithProps.props?.data) && !Array.isArray(componentWithProps.props?.treeData) ? 'dataKey' :
                  'static';
                
                if (sourceType === 'static') {
                  return (
                    <>
                      <Typography variant="caption">Tree Data (JSON array)</Typography>
                      <TextField
                        value={JSON.stringify(componentWithProps.props?.data || componentWithProps.props?.treeData || [], null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            handlePropertyChange('data', parsed);
                            handlePropertyChange('treeData', parsed);
                          } catch {}
                        }}
                        size="small"
                        fullWidth
                        multiline
                        rows={6}
                        sx={{ mt: 0.5 }}
                        helperText="Array of tree nodes, e.g., [{id: '1', label: 'Node 1', children: [{id: '1-1', label: 'Child 1'}]}]"
                      />
                    </>
                  );
                } else if (sourceType === 'function') {
                  return (
                    <TextField
                      label="Function Source Code"
                      value={
                        typeof componentWithProps.props?.dataSource === 'function'
                          ? componentWithProps.props.dataSource.toString()
                          : String(componentWithProps.props?.dataSource || '')
                      }
                      onChange={(e) => {
                        try {
                          const fn = new Function('data', 'component', `return ${e.target.value}`);
                          handlePropertyChange('dataSource', fn);
                        } catch {
                          handlePropertyChange('dataSource', e.target.value);
                        }
                      }}
                      size="small"
                      fullWidth
                      multiline
                      rows={4}
                      sx={{ mt: 0.5 }}
                      placeholder="(data, component) => { return [{id: '1', label: 'Node 1'}]; }"
                      helperText="JavaScript function that returns an array of tree nodes"
                    />
                  );
                } else if (sourceType === 'computed') {
                  return (
                    <Box sx={{ mt: 0.5 }}>
                      <ComputedPropertyEditor
                        propertyKey="dataSource"
                        property={componentWithProps.props?.dataSource as any}
                        formData={{}}
                        onChange={(property) => handlePropertyChange('dataSource', property)}
                      />
                    </Box>
                  );
                } else if (sourceType === 'dataKey') {
                  return (
                    <TextField
                      label="Data Key"
                      value={String(componentWithProps.props?.dataSource || '')}
                      onChange={(e) => handlePropertyChange('dataSource', e.target.value)}
                      size="small"
                      fullWidth
                      sx={{ mt: 0.5 }}
                      helperText="Key in form data store that contains the tree data array"
                    />
                  );
                }
                return null;
              })()}
            </Box>
          </>
        );

      case 'DataBrowse':
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                Data Source
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Source Type</InputLabel>
                <Select
                  value={
                    typeof componentWithProps.props?.dataSource === 'function' ? 'function' :
                    typeof componentWithProps.props?.dataSource === 'object' && componentWithProps.props?.dataSource?.computeType ? 'computed' :
                    typeof componentWithProps.props?.dataSource === 'string' && !Array.isArray(componentWithProps.props?.rows) && !Array.isArray(componentWithProps.props?.data) ? 'dataKey' :
                    'static'
                  }
                  label="Source Type"
                  onChange={(e) => {
                    if (e.target.value === 'static') {
                      handlePropertyChange('dataSource', []);
                    } else if (e.target.value === 'function') {
                      handlePropertyChange('dataSource', '(data, component) => { return []; }');
                    } else if (e.target.value === 'computed') {
                      handlePropertyChange('dataSource', { computeType: 'function', fnSource: 'return [];' });
                    } else if (e.target.value === 'dataKey') {
                      handlePropertyChange('dataSource', '');
                    }
                  }}
                >
                  <MenuItem value="static">Static Array</MenuItem>
                  <MenuItem value="function">Function (Data Provider)</MenuItem>
                  <MenuItem value="computed">Computed Property</MenuItem>
                  <MenuItem value="dataKey">Data Key (from Form Data)</MenuItem>
                </Select>
              </FormControl>
              
              {(() => {
                const sourceType = 
                  typeof componentWithProps.props?.dataSource === 'function' ? 'function' :
                  typeof componentWithProps.props?.dataSource === 'object' && componentWithProps.props?.dataSource?.computeType ? 'computed' :
                  typeof componentWithProps.props?.dataSource === 'string' && !Array.isArray(componentWithProps.props?.rows) && !Array.isArray(componentWithProps.props?.data) ? 'dataKey' :
                  'static';
                
                if (sourceType === 'static') {
                  return (
                    <>
                      <Typography variant="caption">Rows Data (JSON array)</Typography>
                      <TextField
                        value={JSON.stringify(componentWithProps.props?.data || componentWithProps.props?.rows || [], null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            handlePropertyChange('rows', parsed);
                            handlePropertyChange('data', parsed);
                          } catch {}
                        }}
                        size="small"
                        fullWidth
                        multiline
                        rows={6}
                        sx={{ mt: 0.5 }}
                        helperText="Array of objects, e.g., [{id: 1, name: 'John'}, {id: 2, name: 'Jane'}]"
                      />
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, mb: 0.5 }}>Columns</Typography>
                      <TextField
                        value={JSON.stringify(componentWithProps.props?.columns || [], null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            handlePropertyChange('columns', parsed);
                          } catch {}
                        }}
                        size="small"
                        fullWidth
                        multiline
                        rows={4}
                        helperText="Array of column definitions, e.g., [{field: 'id', headerName: 'ID'}, {field: 'name', headerName: 'Name'}]"
                      />
                    </>
                  );
                } else if (sourceType === 'function') {
                  return (
                    <TextField
                      label="Function Source Code"
                      value={
                        typeof componentWithProps.props?.dataSource === 'function'
                          ? componentWithProps.props.dataSource.toString()
                          : String(componentWithProps.props?.dataSource || '')
                      }
                      onChange={(e) => {
                        try {
                          const fn = new Function('data', 'component', `return ${e.target.value}`);
                          handlePropertyChange('dataSource', fn);
                        } catch {
                          handlePropertyChange('dataSource', e.target.value);
                        }
                      }}
                      size="small"
                      fullWidth
                      multiline
                      rows={4}
                      sx={{ mt: 0.5 }}
                      placeholder="(data, component) => { return [{id: 1, name: 'John'}]; }"
                      helperText="JavaScript function that returns an array of row objects"
                    />
                  );
                } else if (sourceType === 'computed') {
                  return (
                    <Box sx={{ mt: 0.5 }}>
                      <ComputedPropertyEditor
                        propertyKey="dataSource"
                        property={componentWithProps.props?.dataSource as any}
                        formData={{}}
                        onChange={(property) => handlePropertyChange('dataSource', property)}
                      />
                    </Box>
                  );
                } else if (sourceType === 'dataKey') {
                  return (
                    <TextField
                      label="Data Key"
                      value={String(componentWithProps.props?.dataSource || '')}
                      onChange={(e) => handlePropertyChange('dataSource', e.target.value)}
                      size="small"
                      fullWidth
                      sx={{ mt: 0.5 }}
                      helperText="Key in form data store that contains the rows array"
                    />
                  );
                }
                return null;
              })()}
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.searchable !== false}
                  onChange={(e) => handlePropertyChange('searchable', e.target.checked)}
                  size="small"
                />
              }
              label="Searchable"
              sx={{ mt: 0.75 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.paginated !== false}
                  onChange={(e) => handlePropertyChange('paginated', e.target.checked)}
                  size="small"
                />
              }
              label="Paginated"
              sx={{ mt: 0.75 }}
            />
          </>
        );

      case 'AutoComplete':
        // Update existing AutoComplete case to include data source configuration
        return (
          <>
            <TextField
              label="Label"
              value={componentWithProps.props?.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
            />
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                Options Data Source
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Source Type</InputLabel>
                <Select
                  value={
                    typeof componentWithProps.props?.optionsSource === 'function' || typeof componentWithProps.props?.dataSource === 'function' ? 'function' :
                    (typeof componentWithProps.props?.optionsSource === 'object' && componentWithProps.props?.optionsSource?.computeType) || (typeof componentWithProps.props?.dataSource === 'object' && componentWithProps.props?.dataSource?.computeType) ? 'computed' :
                    (typeof componentWithProps.props?.optionsSource === 'string' || typeof componentWithProps.props?.dataSource === 'string') && !Array.isArray(componentWithProps.props?.options) ? 'dataKey' :
                    'static'
                  }
                  label="Source Type"
                  onChange={(e) => {
                    if (e.target.value === 'static') {
                      // Keep existing options
                    } else if (e.target.value === 'function') {
                      handlePropertyChange('optionsSource', '(data, component) => { return []; }');
                      handlePropertyChange('dataSource', '(data, component) => { return []; }');
                    } else if (e.target.value === 'computed') {
                      handlePropertyChange('optionsSource', { computeType: 'function', fnSource: 'return [];' });
                      handlePropertyChange('dataSource', { computeType: 'function', fnSource: 'return [];' });
                    } else if (e.target.value === 'dataKey') {
                      handlePropertyChange('optionsSource', '');
                      handlePropertyChange('dataSource', '');
                    }
                  }}
                >
                  <MenuItem value="static">Static Array</MenuItem>
                  <MenuItem value="function">Function (Data Provider)</MenuItem>
                  <MenuItem value="computed">Computed Property</MenuItem>
                  <MenuItem value="dataKey">Data Key (from Form Data)</MenuItem>
                </Select>
              </FormControl>
              
              {(() => {
                const sourceType = 
                  typeof componentWithProps.props?.optionsSource === 'function' || typeof componentWithProps.props?.dataSource === 'function' ? 'function' :
                  (typeof componentWithProps.props?.optionsSource === 'object' && componentWithProps.props?.optionsSource?.computeType) || (typeof componentWithProps.props?.dataSource === 'object' && componentWithProps.props?.dataSource?.computeType) ? 'computed' :
                  (typeof componentWithProps.props?.optionsSource === 'string' || typeof componentWithProps.props?.dataSource === 'string') && !Array.isArray(componentWithProps.props?.options) ? 'dataKey' :
                  'static';
                
                if (sourceType === 'static') {
                  return (
                    <>
                      <Typography variant="caption">Options (one per line)</Typography>
                      <TextField
                        value={(componentWithProps.props?.options || []).join('\n')}
                        onChange={(e) => {
                          const options = e.target.value.split('\n').filter((o) => o.trim());
                          handlePropertyChange('options', options);
                        }}
                        size="small"
                        fullWidth
                        multiline
                        rows={4}
                        sx={{ mt: 0.5 }}
                      />
                    </>
                  );
                } else if (sourceType === 'function') {
                  const source = componentWithProps.props?.optionsSource || componentWithProps.props?.dataSource;
                  return (
                    <TextField
                      label="Function Source Code"
                      value={
                        typeof source === 'function'
                          ? source.toString()
                          : String(source || '')
                      }
                      onChange={(e) => {
                        try {
                          const fn = new Function('data', 'component', `return ${e.target.value}`);
                          handlePropertyChange('optionsSource', fn);
                          handlePropertyChange('dataSource', fn);
                        } catch {
                          handlePropertyChange('optionsSource', e.target.value);
                          handlePropertyChange('dataSource', e.target.value);
                        }
                      }}
                      size="small"
                      fullWidth
                      multiline
                      rows={4}
                      sx={{ mt: 0.5 }}
                      placeholder="(data, component) => { return ['Option 1', 'Option 2']; }"
                      helperText="JavaScript function that returns an array of options"
                    />
                  );
                } else if (sourceType === 'computed') {
                  const source = componentWithProps.props?.optionsSource || componentWithProps.props?.dataSource;
                  return (
                    <Box sx={{ mt: 0.5 }}>
                      <ComputedPropertyEditor
                        propertyKey="options"
                        property={source as any}
                        formData={{}}
                        onChange={(property) => {
                          handlePropertyChange('optionsSource', property);
                          handlePropertyChange('dataSource', property);
                        }}
                      />
                    </Box>
                  );
                } else if (sourceType === 'dataKey') {
                  const source = componentWithProps.props?.optionsSource || componentWithProps.props?.dataSource;
                  return (
                    <TextField
                      label="Data Key"
                      value={String(source || '')}
                      onChange={(e) => {
                        handlePropertyChange('optionsSource', e.target.value);
                        handlePropertyChange('dataSource', e.target.value);
                      }}
                      size="small"
                      fullWidth
                      sx={{ mt: 0.5 }}
                      helperText="Key in form data store that contains the options array"
                    />
                  );
                }
                return null;
              })()}
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.multiple || false}
                  onChange={(e) => handlePropertyChange('multiple', e.target.checked)}
                  size="small"
                />
              }
              label="Multiple Selection"
              sx={{ mt: 0.75 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.freeSolo || false}
                  onChange={(e) => handlePropertyChange('freeSolo', e.target.checked)}
                  size="small"
                />
              }
              label="Free Solo (Allow Custom Input)"
              sx={{ mt: 0.75 }}
            />
          </>
        );

      default:
        // For other components, show all properties dynamically
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'primary.main' }}>
            {componentWithProps.type}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button
              size="small"
              onClick={handleDuplicate}
              startIcon={<DuplicateIcon />}
              variant="outlined"
              sx={{ 
                fontSize: '0.75rem',
                py: 0.5,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                },
              }}
            >
              Duplicate
            </Button>
            <Button
              size="small"
              onClick={handleDelete}
              startIcon={<DeleteIcon />}
              color="error"
              variant="outlined"
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Delete
            </Button>
          </Box>
        </Box>
        <TextField
          label="Component ID"
          value={componentWithProps.id}
          size="small"
          disabled
          fullWidth
          sx={{ mt: 1 }}
        />
      </Box>

      {/* Properties */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', p: 1.5, bgcolor: 'background.default', minHeight: 0 }}>
        <Typography variant="overline" sx={{ display: 'block', mb: 0.75, fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
          Properties
        </Typography>
        <Divider sx={{ mb: 1.5 }} />

        {/* Component-specific fields */}
        {renderComponentSpecificFields() && (
          <Box sx={{ mb: 2 }}>
            {renderComponentSpecificFields()}
          </Box>
        )}

        {/* Common properties for all components */}
        <CommonPropertiesEditor component={componentWithProps} onPropertyChange={handlePropertyChange} />
        
        {/* Validation Section - for form input components */}
        {['TextInput', 'TextArea', 'Select', 'DropDown', 'CheckBox', 'RadioGroup', 'Toggle', 'DateTime', 'DateTimeCb', 'Amount', 'AutoComplete'].includes(componentWithProps.type) && (
          <Box sx={{ mt: 2, p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" sx={{ display: 'block', mb: 1.5, fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
              Validation
            </Typography>
            <ValidationEditor
              schema={componentWithProps.props?.schema || componentWithProps.props?.validation}
              dataType={
                componentWithProps.type === 'Amount' ? 'number' :
                componentWithProps.type === 'CheckBox' || componentWithProps.type === 'Toggle' ? 'boolean' :
                componentWithProps.type === 'DateTime' || componentWithProps.type === 'DateTimeCb' ? 'date' :
                'string'
              }
              onChange={(schema) => {
                handlePropertyChange('schema', schema);
                handlePropertyChange('validation', schema); // Also set as validation for compatibility
              }}
            />
          </Box>
        )}

        {/* Event Handlers Section - for interactive components */}
        {['Button', 'TextInput', 'TextArea', 'Select', 'DropDown', 'CheckBox', 'RadioGroup', 'Toggle', 'DateTime', 'DateTimeCb', 'Amount', 'AutoComplete'].includes(componentWithProps.type) && (
          <Box sx={{ mt: 2, p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" sx={{ display: 'block', mb: 1.5, fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
              Event Handlers
            </Typography>
            <EventHandlerEditor
              events={componentWithProps.props?.events}
              onChange={(events) => handlePropertyChange('events', events)}
            />
          </Box>
        )}

        {/* Conditional Rendering Section - for all components */}
        <Box sx={{ mt: 2, p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ display: 'block', mb: 1.5, fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
            Conditional Rendering
          </Typography>
          <ConditionalRenderingEditor
            renderWhen={componentWithProps.props?.renderWhen}
            formData={{}}
            onChange={(renderWhen) => handlePropertyChange('renderWhen', renderWhen)}
          />
        </Box>

        {/* Responsive Styles Section - for all components */}
        {(componentWithProps.props?.css || componentWithProps.props?.style || componentWithProps.props?.wrapperCss || componentWithProps.props?.wrapperStyle) && (
          <Box sx={{ mt: 2, p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" sx={{ display: 'block', mb: 1.5, fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
              Responsive Styles
            </Typography>
            {componentWithProps.props?.css && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>CSS Styles</Typography>
                <ResponsiveStylesEditor
                  css={componentWithProps.props.css}
                  type="css"
                  onChange={(css) => handlePropertyChange('css', css)}
                />
              </Box>
            )}
            {componentWithProps.props?.style && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Inline Styles</Typography>
                <ResponsiveStylesEditor
                  style={componentWithProps.props.style}
                  type="style"
                  onChange={(style) => handlePropertyChange('style', style)}
                />
              </Box>
            )}
            {componentWithProps.props?.wrapperCss && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Wrapper CSS</Typography>
                <ResponsiveStylesEditor
                  css={componentWithProps.props.wrapperCss}
                  type="css"
                  onChange={(css) => handlePropertyChange('wrapperCss', css)}
                />
              </Box>
            )}
            {componentWithProps.props?.wrapperStyle && (
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Wrapper Styles</Typography>
                <ResponsiveStylesEditor
                  style={componentWithProps.props.wrapperStyle}
                  type="style"
                  onChange={(style) => handlePropertyChange('wrapperStyle', style)}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Data Binding Section */}
        {['TextInput', 'TextArea', 'Select', 'DropDown', 'CheckBox', 'RadioGroup', 'Toggle', 'DateTime', 'DateTimeCb', 'Amount', 'AutoComplete'].includes(componentWithProps.type) && (
          <Box sx={{ mt: 2, p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="overline" sx={{ display: 'block', mb: 1.5, fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
              Data Binding
            </Typography>
            <TextField
              label="Data Key"
              value={componentWithProps.props?.dataKey || ''}
              onChange={(e) => handlePropertyChange('dataKey', e.target.value)}
              size="small"
              fullWidth
              sx={{ mb: 1 }}
              helperText="Key for automatic data binding (e.g., 'user.name')"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={componentWithProps.props?.disableDataBinding || false}
                  onChange={(e) => handlePropertyChange('disableDataBinding', e.target.checked)}
                  size="small"
                />
              }
              label="Disable Data Binding"
            />
          </Box>
        )}

        {/* Dynamic properties for components without specific editors */}
        {!renderComponentSpecificFields() &&
          Object.keys(componentWithProps.props || {}).length > 0 && (
            <Box sx={{ mt: 2 }}>
              {Object.entries(componentWithProps.props || {}).map(([key, value]) => renderPropertyField(key, value))}
            </Box>
          )}

        {/* Additional properties section */}
        {Object.keys(componentWithProps.props || {}).length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="overline" sx={{ display: 'block', mb: 1 }}>
              All Properties
            </Typography>
            {Object.entries(componentWithProps.props || {}).map(([key, value]) => {
              // Skip if already rendered in component-specific section
              if (
                (componentWithProps.type === 'TextInput' || componentWithProps.type === 'TextArea') &&
                ['label', 'placeholder', 'variant', 'fullWidth'].includes(key)
              ) {
                return null;
              }
              if (componentWithProps.type === 'Button' && ['label', 'text', 'variant', 'color'].includes(key)) {
                return null;
              }
              if ((componentWithProps.type === 'Label' || componentWithProps.type === 'Heading') && ['text', 'label', 'variant'].includes(key)) {
                return null;
              }
              if (componentWithProps.type === 'Link' && ['text', 'href'].includes(key)) {
                return null;
              }
              if ((componentWithProps.type === 'Select' || componentWithProps.type === 'DropDown') && ['label', 'options'].includes(key)) {
                return null;
              }
              if (componentWithProps.type === 'Image' && ['src', 'alt'].includes(key)) {
                return null;
              }
              return renderPropertyField(key, value);
            })}
          </>
        )}
      </Box>
    </Box>
  );
};

export default PropertyEditor;
