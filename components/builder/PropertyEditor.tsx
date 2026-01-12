import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
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
import { ExpandMore as ExpandMoreIcon, Delete as DeleteIcon, ContentCopy as DuplicateIcon, Code as CodeIcon } from '@mui/icons-material';
import type { ComponentDefinition } from '../../stores/types';
import { useHistoryStore } from '../../stores/historyStore';
import { CommonPropertiesEditor } from './CommonPropertiesEditor';
import ValidationEditor from './ValidationEditor';
import EventHandlerEditor from './EventHandlerEditor';
import ComputedPropertyEditor from './ComputedPropertyEditor';
import ResponsiveStylesEditor from './ResponsiveStylesEditor';
import ConditionalRenderingEditor from './ConditionalRenderingEditor';
import AutoBrowse from './AutoBrowse';
// Import store directly for getState()
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { getDataviewManager } from '../../utils/dataviews/dataviewManager';
import { openAPIUtils } from '../../utils/api/openApiUtils';
import { useBuilderDataStore } from '../../stores/builderDataStore';
import { useModeStore } from '../../stores/modeStore';
import { DATA_SOURCE_TYPES_CLASSIFICATION, COMPONENT_PROPERTIES_CLASSIFICATION, SECTIONS_CLASSIFICATION, isFeatureAvailable } from '../../utils/modes/featureClassification';

interface PropertyEditorProps {
  component: ComponentDefinition;
}

const PropertyEditor: React.FC<PropertyEditorProps> = ({ component }) => {
  const { updateComponent, deleteComponent, duplicateComponent, components, findComponent } = useFormBuilderStore();
  const { addToHistory } = useHistoryStore();
  const updatingRef = useRef(false);
  
  // Advanced Mode from global store
  const advancedMode = useModeStore((state) => state.advancedMode);
  
  // Initialize DataviewManager
  const [dataviewManager] = useState(() => getDataviewManager());
  const [dataviewsLoading, setDataviewsLoading] = useState(false);
  const [dataviewFields, setDataviewFields] = useState<string[]>([]);
  const [dataviewsList, setDataviewsList] = useState<any[]>([]);
  const [selectedDataviewResponse, setSelectedDataviewResponse] = useState<any>(null);
  const { setDataviewData, getDataviewData } = useBuilderDataStore();
  
  // Load dataviews list on mount
  useEffect(() => {
    const loadDataviews = async () => {
      try {
        setDataviewsLoading(true);
        await dataviewManager.list.init();
        // Update state with loaded dataviews for reactivity
        const loadedData = dataviewManager.list.getAllLoadedData();
        setDataviewsList(loadedData);
        console.log('Loaded dataviews:', loadedData.length, loadedData);
      } catch (error) {
        // Log error for debugging
        console.error('Failed to load dataviews list:', error);
        setDataviewsList([]);
      } finally {
        setDataviewsLoading(false);
      }
    };
    loadDataviews();
  }, [dataviewManager]);
  
  // Subscribe to dataviews list changes (if RemoteArray emits events)
  useEffect(() => {
    // Refresh list periodically or when needed
    const interval = setInterval(() => {
      const currentData = dataviewManager.list.getAllLoadedData();
      if (currentData.length !== dataviewsList.length) {
        setDataviewsList(currentData);
      }
    }, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, [dataviewManager, dataviewsList.length]);

  // Get the latest component data from store to ensure we have updated props
  const latestComponent = useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);

  // Ensure component has props object
  const componentWithProps = useMemo(() => {
    const comp = latestComponent;
    if (!comp.props) {
      return { ...comp, props: {} };
    }
    return comp;
  }, [latestComponent]);

  const handlePropertyChange = useCallback((key: string, value: any) => {
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

  // Helper function to detect source type for optionsSource/dataSource
  const detectSourceType = useCallback((source: any, propertyKey: 'optionsSource' | 'dataSource' = 'optionsSource'): 'static' | 'function' | 'computed' | 'dataKey' | 'dataview' => {
    // Check if it's undefined or null - default to static
    if (source === undefined || source === null) {
      return 'static';
    }
    
    // Check if it's a dataview object
    if (typeof source === 'object' && !Array.isArray(source) && source !== null && 'dataview_id' in source) {
      return 'dataview';
    }
    
    // Check if it's a special marker for dataview pending selection
    if (source === '__DATAVIEW_PENDING__') {
      return 'dataview';
    }
    
    // Check if it's a string dataview reference (from builder store)
    if (typeof source === 'string' && source !== '' && 
        !source.includes('=>') && !source.includes('function') && 
        !source.startsWith('(') &&
        (getDataviewData(source) || dataviewsList.some((dv: any) => (dv.id || dv.dataview_id) === source))) {
      return 'dataview';
    }
    
    // Check if it's a function
    if (typeof source === 'function') {
      return 'function';
    }
    
    // Check if it's a computed property object
    if (typeof source === 'object' && !Array.isArray(source) && source !== null && 'computeType' in source) {
      return 'computed';
    }
    
    // Check if it's an array (static)
    if (Array.isArray(source)) {
      return 'static';
    }
    
    // Check if it's a string (could be function code, function name, dataKey, or empty string)
    if (typeof source === 'string') {
      // Empty string means it's being set up
      if (source === '') {
        // For dataSource, empty string could be dataKey being set up
        // For optionsSource, empty string could be dataKey being set up
        return 'dataKey';
      }
      
      // Try to parse as JSON to see if it's an array (for dataSource)
      if (propertyKey === 'dataSource') {
        try {
          const parsed = JSON.parse(source);
          if (Array.isArray(parsed)) {
            return 'static';
          }
        } catch {
          // Not valid JSON, continue checking
        }
      }
      
      // Check if it looks like a function name (simple identifier) - for dataSource
      if (propertyKey === 'dataSource' && source.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
        return 'function';
      }
      
      // If it looks like function code (contains => or function), it's a function
      if (source.includes('=>') || source.includes('function') || source.startsWith('(')) {
        return 'function';
      }
      
      // Otherwise it's a dataKey
      return 'dataKey';
    }
    
    // Default to static
    return 'static';
  }, [dataviewsList, getDataviewData]);

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
            {isFeatureAvailable('pattern', COMPONENT_PROPERTIES_CLASSIFICATION, advancedMode) && (
              <TextField
                label="Pattern (RegEx)"
                value={componentWithProps.props?.pattern || ''}
                onChange={(e) => handlePropertyChange('pattern', e.target.value)}
                size="small"
                fullWidth
                sx={{ mt: 0.75 }}
                helperText="HTML5 pattern attribute for validation"
              />
            )}
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
                  value={detectSourceType(componentWithProps.props?.optionsSource, 'optionsSource')}
                  label="Source Type"
                  onChange={(e) => {
                    e.stopPropagation();
                    const newValue = e.target.value;
                    const currentOptionsSource = componentWithProps.props?.optionsSource;
                    
                    // If switching to advanced type but advanced mode is off, reset to static
                    if ((newValue === 'function' || newValue === 'computed') && !advancedMode) {
                      handlePropertyChange('optionsSource', undefined);
                      return;
                    }
                    
                    if (newValue === 'static') {
                      // Clear optionsSource to use static options
                      handlePropertyChange('optionsSource', undefined);
                      setSelectedDataviewResponse(null);
                      setDataviewFields([]);
                    } else if (newValue === 'dataview') {
                      // Only set marker if not already a dataview
                      const currentType = detectSourceType(currentOptionsSource, 'optionsSource');
                      if (currentType !== 'dataview') {
                        handlePropertyChange('optionsSource', '__DATAVIEW_PENDING__');
                      }
                    } else if (newValue === 'function') {
                      // Set as string first, will be converted to function when user enters code
                      handlePropertyChange('optionsSource', '(data, component) => { return []; }');
                      setSelectedDataviewResponse(null);
                      setDataviewFields([]);
                    } else if (newValue === 'computed') {
                      handlePropertyChange('optionsSource', { computeType: 'function', fnSource: 'return [];' });
                      setSelectedDataviewResponse(null);
                      setDataviewFields([]);
                    } else if (newValue === 'dataKey') {
                      // Only set empty string if not already a dataKey
                      const currentType = detectSourceType(currentOptionsSource, 'optionsSource');
                      if (currentType !== 'dataKey') {
                        handlePropertyChange('optionsSource', '');
                      }
                      setSelectedDataviewResponse(null);
                      setDataviewFields([]);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <MenuItem value="static">Static Array</MenuItem>
                  <MenuItem value="dataview">Dataview</MenuItem>
                  {isFeatureAvailable('function', DATA_SOURCE_TYPES_CLASSIFICATION, advancedMode) && (
                    <MenuItem value="function">Function (Data Provider)</MenuItem>
                  )}
                  {isFeatureAvailable('computed', DATA_SOURCE_TYPES_CLASSIFICATION, advancedMode) && (
                    <MenuItem value="computed">Computed Property</MenuItem>
                  )}
                  <MenuItem value="dataKey">Data Key (from Form Data)</MenuItem>
                </Select>
              </FormControl>
              
              {(() => {
                const sourceType = detectSourceType(componentWithProps.props?.optionsSource, 'optionsSource');
                const optionsSource = componentWithProps.props?.optionsSource;
                
                // Show AutoBrowse when source type is dataview
                if (sourceType === 'dataview') {
                  return (
                    <Box sx={{ mt: 0.5 }}>
                      <AutoBrowse
                        value={
                          typeof optionsSource === 'string' && optionsSource !== '' && optionsSource !== '__DATAVIEW_PENDING__'
                            ? dataviewsList.filter(
                                (dv: any) => (dv.id || dv.dataview_id) === optionsSource
                              )
                            : []
                        }
                        valueField="dataview_id"
                        labelField="description"
                        dataProvider={dataviewsList}
                        loading={dataviewsLoading}
                        disabled={dataviewsLoading}
                        onChange={async (selected) => {
                          if (selected && selected.length > 0) {
                            const dataview = selected[0];
                            const dataviewId = dataview.id || dataview.dataview_id;
                            const dataviewUrl = dataview.url || dataview.openapi_url;
                            handlePropertyChange('optionsSource', dataviewId);
                            
                            try {
                              // Use the selected dataview's specific API URL
                              let data: any[] = [];
                              let fields: string[] = [];
                              
                              if (dataviewUrl) {
                                // Call the specific dataview's API endpoint
                                console.log('Calling dataview API:', dataviewUrl);
                                data = await openAPIUtils.generateAndLoadDataView(dataviewUrl);
                                
                                // Extract fields from the response
                                if (Array.isArray(data) && data.length > 0) {
                                  fields = Object.keys(data[0]);
                                } else if (dataview.fields && Array.isArray(dataview.fields)) {
                                  fields = dataview.fields;
                                }
                              } else {
                                // Fallback to generic endpoint if no URL
                                console.log('No dataview URL, using fallback');
                                fields = await dataviewManager.loadDataviewFields(dataviewId);
                                data = await dataviewManager.loadDataview(dataviewId);
                                
                                // If fields are empty but we have data, extract fields from first record
                                if ((!fields || fields.length === 0) && Array.isArray(data) && data.length > 0) {
                                  fields = Object.keys(data[0]);
                                }
                              }
                              
                              setDataviewFields(fields);
                              setDataviewData(dataviewId, data);
                              setSelectedDataviewResponse(data);
                              
                              // Auto-populate valueField and labelField if not already set
                              if (fields.length > 0) {
                                const currentValueField = componentWithProps.props?.valueField;
                                const currentLabelField = componentWithProps.props?.labelField;
                                
                                if (!currentValueField) {
                                  handlePropertyChange('valueField', fields[0]);
                                }
                                if (!currentLabelField) {
                                  // Try to find a good label field (name, title, description, etc.)
                                  const labelFieldCandidates = ['name', 'title', 'description', 'label', 'text'];
                                  const foundLabelField = labelFieldCandidates.find(f => fields.includes(f));
                                  handlePropertyChange('labelField', foundLabelField || (fields[1] || fields[0]));
                                }
                              }
                            } catch (error) {
                              console.error('Failed to load dataview:', error);
                              setDataviewFields([]);
                              setSelectedDataviewResponse(null);
                            }
                          } else {
                            handlePropertyChange('optionsSource', undefined);
                            setDataviewFields([]);
                            setSelectedDataviewResponse(null);
                          }
                        }}
                        onDataviewSelect={async (dataview) => {
                          const dataviewId = dataview.id || dataview.dataview_id;
                          const dataviewUrl = dataview.url || dataview.openapi_url;
                          try {
                            // Use the selected dataview's specific API URL
                            let data: any[] = [];
                            let fields: string[] = [];
                            
                            if (dataviewUrl) {
                              // Call the specific dataview's API endpoint
                              console.log('Calling dataview API:', dataviewUrl);
                              data = await openAPIUtils.generateAndLoadDataView(dataviewUrl);
                              
                              // Extract fields from the response
                              if (Array.isArray(data) && data.length > 0) {
                                fields = Object.keys(data[0]);
                              } else if (dataview.fields && Array.isArray(dataview.fields)) {
                                fields = dataview.fields;
                              }
                            } else {
                              // Fallback to generic endpoint if no URL
                              console.log('No dataview URL, using fallback');
                              fields = await dataviewManager.loadDataviewFields(dataviewId);
                              data = await dataviewManager.loadDataview(dataviewId);
                              
                              // If fields are empty but we have data, extract fields from first record
                              if ((!fields || fields.length === 0) && Array.isArray(data) && data.length > 0) {
                                fields = Object.keys(data[0]);
                              }
                            }
                            
                            setDataviewFields(fields);
                            setDataviewData(dataviewId, data);
                            setSelectedDataviewResponse(data);
                            
                            // Auto-populate valueField and labelField if not already set
                            if (fields.length > 0) {
                              const currentValueField = componentWithProps.props?.valueField;
                              const currentLabelField = componentWithProps.props?.labelField;
                              
                              if (!currentValueField) {
                                handlePropertyChange('valueField', fields[0]);
                              }
                              if (!currentLabelField) {
                                // Try to find a good label field (name, title, description, etc.)
                                const labelFieldCandidates = ['name', 'title', 'description', 'label', 'text'];
                                const foundLabelField = labelFieldCandidates.find(f => fields.includes(f));
                                handlePropertyChange('labelField', foundLabelField || (fields[1] || fields[0]));
                              }
                            }
                          } catch (error) {
                            console.error('Failed to load dataview:', error);
                            setDataviewFields([]);
                            setSelectedDataviewResponse(null);
                          }
                        }}
                      />
                      {/* Field Selection UI after dataview is selected */}
                      {dataviewFields.length > 0 && selectedDataviewResponse !== null && (
                        <Box sx={{ mt: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                            Configure Dropdown Fields
                          </Typography>
                          
                          {/* Field Selection Dropdowns */}
                          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Value Field</InputLabel>
                              <Select
                                value={componentWithProps.props?.valueField || dataviewFields[0] || ''}
                                label="Value Field"
                                onChange={(e) => handlePropertyChange('valueField', e.target.value)}
                              >
                                {dataviewFields.map((field) => (
                                  <MenuItem key={field} value={field}>
                                    {field}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            
                            <FormControl fullWidth size="small">
                              <InputLabel>Label Field</InputLabel>
                              <Select
                                value={componentWithProps.props?.labelField || (dataviewFields[1] || dataviewFields[0] || '')}
                                label="Label Field"
                                onChange={(e) => handlePropertyChange('labelField', e.target.value)}
                              >
                                {dataviewFields.map((field) => (
                                  <MenuItem key={field} value={field}>
                                    {field}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>

                          {/* Parsed Fields Display */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                              Available Fields ({dataviewFields.length}):
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {dataviewFields.map((field) => {
                                const isValueField = field === (componentWithProps.props?.valueField || dataviewFields[0]);
                                const isLabelField = field === (componentWithProps.props?.labelField || (dataviewFields[1] || dataviewFields[0]));
                                return (
                                  <Chip
                                    key={field}
                                    label={field}
                                    size="small"
                                    color={isValueField ? 'primary' : isLabelField ? 'secondary' : 'default'}
                                    variant={isValueField || isLabelField ? 'filled' : 'outlined'}
                                  />
                                );
                              })}
                            </Box>
                          </Box>

                          {/* Preview of Dropdown Options */}
                          {Array.isArray(selectedDataviewResponse) && selectedDataviewResponse.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                                Preview (first 5 records):
                              </Typography>
                              <Box
                                sx={{
                                  p: 1,
                                  bgcolor: 'grey.50',
                                  borderRadius: 1,
                                  maxHeight: 200,
                                  overflow: 'auto',
                                }}
                              >
                                {selectedDataviewResponse.slice(0, 5).map((item: any, index: number) => {
                                  const valueField = componentWithProps.props?.valueField || dataviewFields[0] || 'id';
                                  const labelField = componentWithProps.props?.labelField || (dataviewFields[1] || dataviewFields[0] || 'name');
                                  const value = item[valueField] !== undefined ? item[valueField] : item.id;
                                  const label = item[labelField] !== undefined ? item[labelField] : item.name || value || String(item);
                                  return (
                                    <Box key={index} sx={{ py: 0.5, borderBottom: index < 4 ? '1px solid' : 'none', borderColor: 'divider' }}>
                                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                        {label} <span style={{ color: '#666' }}>(value: {String(value)})</span>
                                      </Typography>
                                    </Box>
                                  );
                                })}
                              </Box>
                              {selectedDataviewResponse.length > 5 && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  ... and {selectedDataviewResponse.length - 5} more records
                                </Typography>
                              )}
                            </Box>
                          )}

                          {/* Raw API Response (Collapsible) */}
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CodeIcon />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  View Raw API Response
                                </Typography>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Box
                                sx={{
                                  p: 1,
                                  bgcolor: 'grey.100',
                                  borderRadius: 1,
                                  maxHeight: 300,
                                  overflow: 'auto',
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                }}
                              >
                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                  {JSON.stringify(selectedDataviewResponse, null, 2)}
                                </pre>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                Total Records: {Array.isArray(selectedDataviewResponse) ? selectedDataviewResponse.length : 'N/A'}
                              </Typography>
                            </AccordionDetails>
                          </Accordion>
                        </Box>
                      )}
                    </Box>
                  );
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
                } else if (sourceType === 'function' && advancedMode) {
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
                } else if (sourceType === 'computed' && advancedMode) {
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

      case 'Grid':
        // Handler to update Grid columns and also update children's column spans
        const handleGridColumnsChange = (newColumns: number) => {
          // Limit to max 6 columns
          const limitedNewColumns = Math.min(newColumns, 6);
          const oldColumns = Math.min(componentWithProps.props?.columns || 2, 6);
          
          // Update the Grid's columns property
          handlePropertyChange('columns', limitedNewColumns);
          
          // Update children's column spans proportionally
          if (componentWithProps.children && componentWithProps.children.length > 0) {
            // Calculate default span: each child takes one "visual column"
            const newDefaultSpan = Math.floor(12 / limitedNewColumns) || 6;
            
            componentWithProps.children.forEach((child) => {
              // Calculate old default span
              const oldDefaultSpan = Math.floor(12 / oldColumns) || 6;
              
              const oldSpan = child.props?.md || child.props?.columnSpan || oldDefaultSpan;
              
              // If child was using default span, update to new default
              const wasUsingDefault = oldSpan === oldDefaultSpan;
              
              const newSpan = wasUsingDefault ? newDefaultSpan : Math.min(oldSpan, 12);
              
              // Update child component with responsive column spans
              updateComponent(child.id, {
                props: {
                  ...child.props,
                  xs: 12, // Full width on mobile
                  sm: Math.min(newSpan * 2, 12), // Double span on tablets
                  md: newSpan,
                  lg: newSpan,
                  xl: newSpan,
                  columnSpan: newSpan,
                },
              });
            });
          }
        };
        
        return (
          <>
            <FormControl fullWidth size="small" sx={{ mt: 0.75 }}>
              <InputLabel>Columns</InputLabel>
              <Select
                value={componentWithProps.props?.columns || 2}
                onChange={(e) => handleGridColumnsChange(Number(e.target.value))}
                label="Columns"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <MenuItem key={num} value={num}>
                    {num} {num === 1 ? 'Column' : 'Columns'} ({Math.round(100/num)}% each)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" sx={{ mt: 0.75 }}>
              <InputLabel>Spacing</InputLabel>
              <Select
                value={componentWithProps.props?.spacing || 2}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  handlePropertyChange('spacing', value);
                }}
                label="Spacing"
              >
                {[0, 1, 2, 3, 4, 5, 6, 8].map((num) => (
                  <MenuItem key={num} value={num}>
                    {num === 0 ? 'None' : `${num} (${num * 8}px)`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Min Height"
              value={componentWithProps.props?.height || '150px'}
              onChange={(e) => handlePropertyChange('height', e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 0.75 }}
              helperText="e.g., 150px, 200px, auto"
            />
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
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Data Provider (Dataview or Static Data)
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={async () => {
                    try {
                      setDataviewsLoading(true);
                      await dataviewManager.list.init();
                      const loadedData = dataviewManager.list.getAllLoadedData();
                      setDataviewsList(loadedData);
                      console.log('Refreshed dataviews:', loadedData.length, loadedData);
                    } catch (error) {
                      console.error('Failed to refresh dataviews:', error);
                    } finally {
                      setDataviewsLoading(false);
                    }
                  }}
                  disabled={dataviewsLoading}
                  sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                >
                  {dataviewsLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </Box>
              {dataviewsList.length === 0 && !dataviewsLoading && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  No dataviews loaded. Click Refresh to load from API.
                </Typography>
              )}
              <AutoBrowse
                value={
                  componentWithProps.props?.dataProvider && 
                  typeof componentWithProps.props.dataProvider === 'string'
                    ? dataviewsList.filter(
                        (dv: any) => (dv.id || dv.dataview_id) === componentWithProps.props.dataProvider
                      )
                    : componentWithProps.props?.dataProvider && 
                      typeof componentWithProps.props.dataProvider === 'object' &&
                      'dataview_id' in componentWithProps.props.dataProvider
                    ? [componentWithProps.props.dataProvider]
                    : []
                }
                valueField="dataview_id"
                labelField="description"
                dataProvider={dataviewsList}
                loading={dataviewsLoading}
                disabled={dataviewsLoading}
                onChange={async (selected) => {
                  if (selected && selected.length > 0) {
                    const dataview = selected[0];
                    const dataviewId = dataview.id || dataview.dataview_id;
                    
                    // Ruaj vetëm string reference në JSON (si projekti i vjetër)
                    handlePropertyChange('dataProvider', dataviewId);
                    
                    try {
                      // Ngarko fields
                      const fields = await dataviewManager.loadDataviewFields(dataviewId);
                      setDataviewFields(fields);
                      
                      // Ngarko dhe cache-o të dhënat për builder preview
                      const data = await dataviewManager.loadDataview(dataviewId);
                      setDataviewData(dataviewId, data);
                      
                      // Auto-populate valueField/labelField nëse nuk janë set
                      if (fields.length > 0 && !componentWithProps.props?.valueField) {
                        handlePropertyChange('valueField', fields[0]);
                      }
                      if (fields.length > 1 && !componentWithProps.props?.labelField) {
                        handlePropertyChange('labelField', fields[1]);
                      } else if (fields.length > 0 && !componentWithProps.props?.labelField) {
                        // Nëse ka vetëm një field, përdor të njëjtin si label
                        handlePropertyChange('labelField', fields[0]);
                      }
                    } catch (error) {
                      console.error('Failed to load dataview:', error);
                      setDataviewFields([]);
                    }
                  } else {
                    handlePropertyChange('dataProvider', undefined);
                    setDataviewFields([]);
                  }
                }}
                onDataviewSelect={async (dataview) => {
                  const dataviewId = dataview.id || dataview.dataview_id;
                  try {
                    const fields = await dataviewManager.loadDataviewFields(dataviewId);
                    setDataviewFields(fields);
                    
                    // Ngarko dhe cache-o të dhënat për builder preview
                    const data = await dataviewManager.loadDataview(dataviewId);
                    setDataviewData(dataviewId, data);
                  } catch (error) {
                    console.error('Failed to load dataview:', error);
                    setDataviewFields([]);
                  }
                }}
              />
              {/* Fallback to text input for static data/function */}
              <TextField
                label="Or enter static data/function (JSON array or function)"
                value={
                  componentWithProps.props?.dataProvider &&
                  typeof componentWithProps.props.dataProvider === 'string' &&
                  (getDataviewData(componentWithProps.props.dataProvider) || 
                   dataviewsList.some((dv: any) => (dv.id || dv.dataview_id) === componentWithProps.props.dataProvider))
                    ? '' // Hide text input nëse është dataview reference
                    : componentWithProps.props?.dataProvider &&
                      typeof componentWithProps.props.dataProvider === 'object' &&
                      'dataview_id' in componentWithProps.props.dataProvider
                    ? ''
                    : typeof componentWithProps.props?.dataProvider === 'string'
                    ? componentWithProps.props.dataProvider
                    : Array.isArray(componentWithProps.props?.dataProvider)
                    ? JSON.stringify(componentWithProps.props.dataProvider, null, 2)
                    : ''
                }
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handlePropertyChange('dataProvider', parsed);
                    setDataviewFields([]);
                  } catch {
                    // If not valid JSON, treat as function string
                    handlePropertyChange('dataProvider', e.target.value);
                    setDataviewFields([]);
                  }
                }}
                size="small"
                fullWidth
                multiline
                rows={4}
                sx={{ mt: 1 }}
                helperText="Array of data objects or JavaScript function: (data, component) => []"
                disabled={
                  (componentWithProps.props?.dataProvider &&
                  typeof componentWithProps.props.dataProvider === 'object' &&
                  'dataview_id' in componentWithProps.props.dataProvider) ||
                  (componentWithProps.props?.dataProvider &&
                  typeof componentWithProps.props.dataProvider === 'string' &&
                  (getDataviewData(componentWithProps.props.dataProvider) || 
                   dataviewsList.some((dv: any) => (dv.id || dv.dataview_id) === componentWithProps.props.dataProvider)))
                }
              />
            </Box>
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
              {(() => {
                const currentSourceType = detectSourceType(componentWithProps.props?.dataSource, 'dataSource');
                
                return (
                  <>
                    <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                      <InputLabel>Source Type</InputLabel>
                      <Select
                        value={currentSourceType}
                        label="Source Type"
                        onChange={(e) => {
                          const newType = e.target.value as 'static' | 'function' | 'computed' | 'dataKey' | 'dataview';
                          const currentDataSource = componentWithProps.props?.dataSource;
                          const currentType = detectSourceType(currentDataSource, 'dataSource');
                          
                          // If switching to advanced type but advanced mode is off, reset to static
                          if ((newType === 'function' || newType === 'computed') && !advancedMode) {
                            const existingData = componentWithProps.props?.rows || componentWithProps.props?.data;
                            handlePropertyChange('dataSource', Array.isArray(existingData) ? existingData : []);
                            return;
                          }
                          
                          if (newType === 'static') {
                            // When switching to static, preserve existing array data if available
                            if (Array.isArray(currentDataSource)) {
                              // Already an array, keep it
                              handlePropertyChange('dataSource', currentDataSource);
                            } else {
                              // Try to get from rows or data props
                              const existingData = componentWithProps.props?.rows || componentWithProps.props?.data;
                              if (Array.isArray(existingData)) {
                                handlePropertyChange('dataSource', existingData);
                              } else {
                                // Set empty array as default
                                handlePropertyChange('dataSource', []);
                              }
                            }
                          } else if (newType === 'dataview') {
                            // Only set if not already a dataview
                            if (currentType !== 'dataview') {
                              // Check if it's a string dataview reference
                              if (typeof currentDataSource === 'string' && currentDataSource && 
                                  (getDataviewData(currentDataSource) || dataviewsList.some((dv: any) => (dv.id || dv.dataview_id) === currentDataSource))) {
                                // Already a dataview string reference, keep it
                                return;
                              }
                              // Otherwise set marker to let AutoBrowse handle it
                              handlePropertyChange('dataSource', '__DATAVIEW_PENDING__');
                            }
                          } else if (newType === 'function') {
                            // If current value is already a function, keep it
                            if (currentType === 'function') {
                              return;
                            }
                            // Otherwise set default function string
                            handlePropertyChange('dataSource', '(data, component) => { return []; }');
                          } else if (newType === 'computed') {
                            // If current value is already a computed property, keep it
                            if (currentType === 'computed') {
                              return;
                            }
                            // Otherwise set default computed property
                            handlePropertyChange('dataSource', { computeType: 'function', fnSource: 'return [];' });
                          } else if (newType === 'dataKey') {
                            // If current value is already a dataKey, keep it
                            if (currentType === 'dataKey' && typeof currentDataSource === 'string' && currentDataSource.trim() !== '') {
                              return;
                            }
                            // Otherwise set empty string
                            handlePropertyChange('dataSource', '');
                          }
                        }}
                      >
                        <MenuItem value="static">Static Array</MenuItem>
                        <MenuItem value="dataview">Dataview</MenuItem>
                        {isFeatureAvailable('function', DATA_SOURCE_TYPES_CLASSIFICATION, advancedMode) && (
                          <MenuItem value="function">Function (Data Provider)</MenuItem>
                        )}
                        {isFeatureAvailable('computed', DATA_SOURCE_TYPES_CLASSIFICATION, advancedMode) && (
                          <MenuItem value="computed">Computed Property</MenuItem>
                        )}
                        <MenuItem value="dataKey">Data Key (from Form Data)</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {(() => {
                      const sourceType = currentSourceType;
                
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
                } else if (sourceType === 'function' && advancedMode) {
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
                } else if (sourceType === 'computed' && advancedMode) {
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
                  </>
                );
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
              {(() => {
                const currentSourceType = detectSourceType(componentWithProps.props?.dataSource, 'dataSource');
                
                return (
                  <>
                    <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                      <InputLabel>Source Type</InputLabel>
                      <Select
                        value={currentSourceType}
                        label="Source Type"
                        onChange={(e) => {
                          const newType = e.target.value as 'static' | 'function' | 'computed' | 'dataKey' | 'dataview';
                          const currentDataSource = componentWithProps.props?.dataSource;
                          const currentType = detectSourceType(currentDataSource, 'dataSource');
                          
                          if (newType === 'static') {
                            if (Array.isArray(currentDataSource)) {
                              handlePropertyChange('dataSource', currentDataSource);
                            } else {
                              const existingData = componentWithProps.props?.items || componentWithProps.props?.data;
                              if (Array.isArray(existingData)) {
                                handlePropertyChange('dataSource', existingData);
                              } else {
                                handlePropertyChange('dataSource', []);
                              }
                            }
                          } else if (newType === 'dataview') {
                            // Only set if not already a dataview
                            if (currentType !== 'dataview') {
                              // Check if it's a string dataview reference
                              if (typeof currentDataSource === 'string' && currentDataSource && 
                                  (getDataviewData(currentDataSource) || dataviewsList.some((dv: any) => (dv.id || dv.dataview_id) === currentDataSource))) {
                                // Already a dataview string reference, keep it
                                return;
                              }
                              // Otherwise set marker to let AutoBrowse handle it
                              handlePropertyChange('dataSource', '__DATAVIEW_PENDING__');
                            }
                          } else if (newType === 'function') {
                            // If advanced mode is off, reset to static
                            if (!advancedMode) {
                              const existingData = componentWithProps.props?.items || componentWithProps.props?.data;
                              handlePropertyChange('dataSource', Array.isArray(existingData) ? existingData : []);
                              return;
                            }
                            if (currentType === 'function') return;
                            handlePropertyChange('dataSource', '(data, component) => { return []; }');
                          } else if (newType === 'computed') {
                            // If advanced mode is off, reset to static
                            if (!advancedMode) {
                              const existingData = componentWithProps.props?.items || componentWithProps.props?.data;
                              handlePropertyChange('dataSource', Array.isArray(existingData) ? existingData : []);
                              return;
                            }
                            if (currentType === 'computed') return;
                            handlePropertyChange('dataSource', { computeType: 'function', fnSource: 'return [];' });
                          } else if (newType === 'dataKey') {
                            if (currentType === 'dataKey' && typeof currentDataSource === 'string' && currentDataSource.trim() !== '') return;
                            handlePropertyChange('dataSource', '');
                          }
                        }}
                      >
                        <MenuItem value="static">Static Array</MenuItem>
                        <MenuItem value="dataview">Dataview</MenuItem>
                        <MenuItem value="function">Function (Data Provider)</MenuItem>
                        <MenuItem value="computed">Computed Property</MenuItem>
                        <MenuItem value="dataKey">Data Key (from Form Data)</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {(() => {
                      const sourceType = currentSourceType;
                
                if (sourceType === 'dataview') {
                  return (
                    <Box sx={{ mt: 0.5 }}>
                      <AutoBrowse
                        value={
                          componentWithProps.props?.dataSource && 
                          typeof componentWithProps.props.dataSource === 'string' &&
                          componentWithProps.props.dataSource !== '__DATAVIEW_PENDING__'
                            ? dataviewsList.filter(
                                (dv: any) => (dv.id || dv.dataview_id) === componentWithProps.props.dataSource
                              )
                            : componentWithProps.props?.dataSource && 
                              typeof componentWithProps.props.dataSource === 'object' &&
                              'dataview_id' in componentWithProps.props.dataSource
                            ? [componentWithProps.props.dataSource]
                            : []
                        }
                        valueField="dataview_id"
                        labelField="description"
                        dataProvider={dataviewsList}
                        loading={dataviewsLoading}
                        disabled={dataviewsLoading || !dataviewManager.list.totalRecords}
                        onChange={async (selected) => {
                          if (selected && selected.length > 0) {
                            const dataview = selected[0];
                            const dataviewId = dataview.id || dataview.dataview_id;
                            
                            // Ruaj vetëm string reference në JSON (si projekti i vjetër)
                            handlePropertyChange('dataSource', dataviewId);
                            
                            try {
                              // Ngarko fields
                              const fields = await dataviewManager.loadDataviewFields(dataviewId);
                              setDataviewFields(fields);
                              
                              // Ngarko dhe cache-o të dhënat për builder preview
                              const data = await dataviewManager.loadDataview(dataviewId);
                              setDataviewData(dataviewId, data);
                            } catch (error) {
                              console.error('Failed to load dataview:', error);
                              setDataviewFields([]);
                            }
                          } else {
                            handlePropertyChange('dataSource', undefined);
                            setDataviewFields([]);
                          }
                        }}
                        onDataviewSelect={async (dataview) => {
                          const dataviewId = dataview.id || dataview.dataview_id;
                          try {
                            const fields = await dataviewManager.loadDataviewFields(dataviewId);
                            setDataviewFields(fields);
                            
                            // Ngarko dhe cache-o të dhënat për builder preview
                            const data = await dataviewManager.loadDataview(dataviewId);
                            setDataviewData(dataviewId, data);
                          } catch (error) {
                            console.error('Failed to load dataview:', error);
                            setDataviewFields([]);
                          }
                        }}
                      />
                    </Box>
                  );
                } else if (sourceType === 'static') {
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
                } else if (sourceType === 'function' && advancedMode) {
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
                } else if (sourceType === 'computed' && advancedMode) {
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
                  </>
                );
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
              {(() => {
                const currentSourceType = detectSourceType(componentWithProps.props?.dataSource, 'dataSource');
                
                return (
                  <>
                    <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                      <InputLabel>Source Type</InputLabel>
                      <Select
                        value={currentSourceType}
                        label="Source Type"
                        onChange={(e) => {
                          const newType = e.target.value as 'static' | 'function' | 'computed' | 'dataKey' | 'dataview';
                          const currentDataSource = componentWithProps.props?.dataSource;
                          const currentType = detectSourceType(currentDataSource, 'dataSource');
                          
                          // If switching to advanced type but advanced mode is off, reset to static
                          if ((newType === 'function' || newType === 'computed') && !advancedMode) {
                            const existingData = componentWithProps.props?.data || componentWithProps.props?.treeData;
                            handlePropertyChange('dataSource', Array.isArray(existingData) ? existingData : []);
                            return;
                          }
                          
                          if (newType === 'static') {
                            if (Array.isArray(currentDataSource)) {
                              handlePropertyChange('dataSource', currentDataSource);
                            } else {
                              const existingData = componentWithProps.props?.data || componentWithProps.props?.treeData;
                              if (Array.isArray(existingData)) {
                                handlePropertyChange('dataSource', existingData);
                              } else {
                                handlePropertyChange('dataSource', []);
                              }
                            }
                          } else if (newType === 'dataview') {
                            // Only set if not already a dataview
                            if (currentType !== 'dataview') {
                              // Check if it's a string dataview reference
                              if (typeof currentDataSource === 'string' && currentDataSource && 
                                  (getDataviewData(currentDataSource) || dataviewsList.some((dv: any) => (dv.id || dv.dataview_id) === currentDataSource))) {
                                // Already a dataview string reference, keep it
                                return;
                              }
                              // Otherwise set marker to let AutoBrowse handle it
                              handlePropertyChange('dataSource', '__DATAVIEW_PENDING__');
                            }
                          } else if (newType === 'function') {
                            if (currentType === 'function') return;
                            handlePropertyChange('dataSource', '(data, component) => { return []; }');
                          } else if (newType === 'computed') {
                            if (currentType === 'computed') return;
                            handlePropertyChange('dataSource', { computeType: 'function', fnSource: 'return [];' });
                          } else if (newType === 'dataKey') {
                            if (currentType === 'dataKey' && typeof currentDataSource === 'string' && currentDataSource.trim() !== '') return;
                            handlePropertyChange('dataSource', '');
                          }
                        }}
                      >
                        <MenuItem value="static">Static Array</MenuItem>
                        <MenuItem value="dataview">Dataview</MenuItem>
                        {isFeatureAvailable('function', DATA_SOURCE_TYPES_CLASSIFICATION, advancedMode) && (
                          <MenuItem value="function">Function (Data Provider)</MenuItem>
                        )}
                        {isFeatureAvailable('computed', DATA_SOURCE_TYPES_CLASSIFICATION, advancedMode) && (
                          <MenuItem value="computed">Computed Property</MenuItem>
                        )}
                        <MenuItem value="dataKey">Data Key (from Form Data)</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {(() => {
                      const sourceType = currentSourceType;
                
                if (sourceType === 'dataview') {
                  return (
                    <Box sx={{ mt: 0.5 }}>
                      <AutoBrowse
                        value={
                          componentWithProps.props?.dataSource && 
                          typeof componentWithProps.props.dataSource === 'string' &&
                          componentWithProps.props.dataSource !== '__DATAVIEW_PENDING__'
                            ? dataviewsList.filter(
                                (dv: any) => (dv.id || dv.dataview_id) === componentWithProps.props.dataSource
                              )
                            : componentWithProps.props?.dataSource && 
                              typeof componentWithProps.props.dataSource === 'object' &&
                              'dataview_id' in componentWithProps.props.dataSource
                            ? [componentWithProps.props.dataSource]
                            : []
                        }
                        valueField="dataview_id"
                        labelField="description"
                        dataProvider={dataviewsList}
                        loading={dataviewsLoading}
                        disabled={dataviewsLoading || !dataviewManager.list.totalRecords}
                        onChange={async (selected) => {
                          if (selected && selected.length > 0) {
                            const dataview = selected[0];
                            const dataviewId = dataview.id || dataview.dataview_id;
                            
                            // Ruaj vetëm string reference në JSON (si projekti i vjetër)
                            handlePropertyChange('dataSource', dataviewId);
                            
                            try {
                              // Ngarko fields
                              const fields = await dataviewManager.loadDataviewFields(dataviewId);
                              setDataviewFields(fields);
                              
                              // Ngarko dhe cache-o të dhënat për builder preview
                              const data = await dataviewManager.loadDataview(dataviewId);
                              setDataviewData(dataviewId, data);
                            } catch (error) {
                              console.error('Failed to load dataview:', error);
                              setDataviewFields([]);
                            }
                          } else {
                            handlePropertyChange('dataSource', undefined);
                            setDataviewFields([]);
                          }
                        }}
                        onDataviewSelect={async (dataview) => {
                          const dataviewId = dataview.id || dataview.dataview_id;
                          try {
                            const fields = await dataviewManager.loadDataviewFields(dataviewId);
                            setDataviewFields(fields);
                            
                            // Ngarko dhe cache-o të dhënat për builder preview
                            const data = await dataviewManager.loadDataview(dataviewId);
                            setDataviewData(dataviewId, data);
                          } catch (error) {
                            console.error('Failed to load dataview:', error);
                            setDataviewFields([]);
                          }
                        }}
                      />
                    </Box>
                  );
                } else if (sourceType === 'static') {
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
                } else if (sourceType === 'function' && advancedMode) {
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
                } else if (sourceType === 'computed' && advancedMode) {
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
                  </>
                );
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
              {(() => {
                const currentSourceType = detectSourceType(componentWithProps.props?.dataSource, 'dataSource');
                
                return (
                  <>
                    <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                      <InputLabel>Source Type</InputLabel>
                      <Select
                        value={currentSourceType}
                        label="Source Type"
                        onChange={(e) => {
                          const newType = e.target.value as 'static' | 'function' | 'computed' | 'dataKey' | 'dataview';
                          const currentDataSource = componentWithProps.props?.dataSource;
                          const currentType = detectSourceType(currentDataSource, 'dataSource');
                          
                          // If switching to advanced type but advanced mode is off, reset to static
                          if ((newType === 'function' || newType === 'computed') && !advancedMode) {
                            const existingData = componentWithProps.props?.rows || componentWithProps.props?.data;
                            handlePropertyChange('dataSource', Array.isArray(existingData) ? existingData : []);
                            return;
                          }
                          
                          if (newType === 'static') {
                            if (Array.isArray(currentDataSource)) {
                              handlePropertyChange('dataSource', currentDataSource);
                            } else {
                              const existingData = componentWithProps.props?.rows || componentWithProps.props?.data;
                              if (Array.isArray(existingData)) {
                                handlePropertyChange('dataSource', existingData);
                              } else {
                                handlePropertyChange('dataSource', []);
                              }
                            }
                          } else if (newType === 'dataview') {
                            // Only set if not already a dataview
                            if (currentType !== 'dataview') {
                              // Check if it's a string dataview reference
                              if (typeof currentDataSource === 'string' && currentDataSource && 
                                  (getDataviewData(currentDataSource) || dataviewsList.some((dv: any) => (dv.id || dv.dataview_id) === currentDataSource))) {
                                // Already a dataview string reference, keep it
                                return;
                              }
                              // Otherwise set marker to let AutoBrowse handle it
                              handlePropertyChange('dataSource', '__DATAVIEW_PENDING__');
                            }
                          } else if (newType === 'function') {
                            if (currentType === 'function') return;
                            handlePropertyChange('dataSource', '(data, component) => { return []; }');
                          } else if (newType === 'computed') {
                            if (currentType === 'computed') return;
                            handlePropertyChange('dataSource', { computeType: 'function', fnSource: 'return [];' });
                          } else if (newType === 'dataKey') {
                            if (currentType === 'dataKey' && typeof currentDataSource === 'string' && currentDataSource.trim() !== '') return;
                            handlePropertyChange('dataSource', '');
                          }
                        }}
                      >
                        <MenuItem value="static">Static Array</MenuItem>
                        <MenuItem value="dataview">Dataview</MenuItem>
                        {isFeatureAvailable('function', DATA_SOURCE_TYPES_CLASSIFICATION, advancedMode) && (
                          <MenuItem value="function">Function (Data Provider)</MenuItem>
                        )}
                        {isFeatureAvailable('computed', DATA_SOURCE_TYPES_CLASSIFICATION, advancedMode) && (
                          <MenuItem value="computed">Computed Property</MenuItem>
                        )}
                        <MenuItem value="dataKey">Data Key (from Form Data)</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {(() => {
                      const sourceType = currentSourceType;
                
                if (sourceType === 'dataview') {
                  return (
                    <Box sx={{ mt: 0.5 }}>
                      <AutoBrowse
                        value={
                          componentWithProps.props?.dataSource && 
                          typeof componentWithProps.props.dataSource === 'string' &&
                          componentWithProps.props.dataSource !== '__DATAVIEW_PENDING__'
                            ? dataviewsList.filter(
                                (dv: any) => (dv.id || dv.dataview_id) === componentWithProps.props.dataSource
                              )
                            : componentWithProps.props?.dataSource && 
                              typeof componentWithProps.props.dataSource === 'object' &&
                              'dataview_id' in componentWithProps.props.dataSource
                            ? [componentWithProps.props.dataSource]
                            : []
                        }
                        valueField="dataview_id"
                        labelField="description"
                        dataProvider={dataviewsList}
                        loading={dataviewsLoading}
                        disabled={dataviewsLoading || !dataviewManager.list.totalRecords}
                        onChange={async (selected) => {
                          if (selected && selected.length > 0) {
                            const dataview = selected[0];
                            const dataviewId = dataview.id || dataview.dataview_id;
                            
                            // Ruaj vetëm string reference në JSON (si projekti i vjetër)
                            handlePropertyChange('dataSource', dataviewId);
                            
                            try {
                              // Ngarko fields
                              const fields = await dataviewManager.loadDataviewFields(dataviewId);
                              setDataviewFields(fields);
                              
                              // Ngarko dhe cache-o të dhënat për builder preview
                              const data = await dataviewManager.loadDataview(dataviewId);
                              setDataviewData(dataviewId, data);
                            } catch (error) {
                              console.error('Failed to load dataview:', error);
                              setDataviewFields([]);
                            }
                          } else {
                            handlePropertyChange('dataSource', undefined);
                            setDataviewFields([]);
                          }
                        }}
                        onDataviewSelect={async (dataview) => {
                          const dataviewId = dataview.id || dataview.dataview_id;
                          try {
                            const fields = await dataviewManager.loadDataviewFields(dataviewId);
                            setDataviewFields(fields);
                            
                            // Ngarko dhe cache-o të dhënat për builder preview
                            const data = await dataviewManager.loadDataview(dataviewId);
                            setDataviewData(dataviewId, data);
                          } catch (error) {
                            console.error('Failed to load dataview:', error);
                            setDataviewFields([]);
                          }
                        }}
                      />
                    </Box>
                  );
                } else if (sourceType === 'static') {
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
                } else if (sourceType === 'function' && advancedMode) {
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
                } else if (sourceType === 'computed' && advancedMode) {
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
                  </>
                );
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
        // Enhanced AutoComplete case with data source configuration
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
                  {isFeatureAvailable('function', DATA_SOURCE_TYPES_CLASSIFICATION, advancedMode) && (
                    <MenuItem value="function">Function (Data Provider)</MenuItem>
                  )}
                  {isFeatureAvailable('computed', DATA_SOURCE_TYPES_CLASSIFICATION, advancedMode) && (
                    <MenuItem value="computed">Computed Property</MenuItem>
                  )}
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
                } else if (sourceType === 'function' && advancedMode) {
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
                } else if (sourceType === 'computed' && advancedMode) {
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

        {/* Conditional Rendering Section - for all components - Advanced Mode Only */}
        {advancedMode && (
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
        )}

        {/* Responsive Styles Section - for all components - Advanced Mode Only */}
        {advancedMode && (componentWithProps.props?.css || componentWithProps.props?.style || componentWithProps.props?.wrapperCss || componentWithProps.props?.wrapperStyle) && (
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
