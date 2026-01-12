/**
 * Dependency Editor
 * UI for configuring component dependencies
 * 
 * Supports:
 * - Conditional disabled/enabled states
 * - Conditional visibility
 * - Data filtering (cascading dropdowns)
 * - Field reset on dependency change
 * - Dynamic labels, placeholders, values
 * - Conditional required state
 */

import React, { useState, useMemo } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  IconButton,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Label as LabelIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import type { ComponentDependencies, DependencyCondition, FilterDependency, ComputedProperty } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormDataStore } from '../../stores/formDataStore';
import { DependencyEvaluator } from '../../utils/dependencies/dependencyEvaluator';
import { useModeStore } from '../../stores/modeStore';

interface DependencyEditorProps {
  dependencies?: ComponentDependencies;
  componentId: string;
  onChange: (dependencies: ComponentDependencies) => void;
}

/**
 * Editor for a single dependency condition
 */
const DependencyConditionEditor: React.FC<{
  condition?: DependencyCondition;
  label: string;
  onChange: (condition: DependencyCondition | undefined) => void;
  formData?: Record<string, any>;
}> = ({ condition, label, onChange, formData = {} }) => {
  const advancedMode = useModeStore((state) => state.advancedMode);
  const [mode, setMode] = useState<'none' | 'fieldValue' | 'expression' | 'function'>(
    !condition ? 'none' :
    condition.type === 'function' ? 'function' :
    condition.type === 'expression' ? 'expression' :
    'fieldValue'
  );

  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Get all components to list available dataKeys
  const { components } = useFormBuilderStore();
  const availableFields = useMemo(() => {
    const fields = new Set<string>();
    const extractFields = (comps: any[]) => {
      comps.forEach((comp) => {
        if (comp.props?.dataKey) {
          fields.add(comp.props.dataKey);
        }
        if (comp.children) {
          extractFields(comp.children);
        }
      });
    };
    extractFields(components);
    return Array.from(fields).sort();
  }, [components]);

  const handleModeChange = (newMode: 'none' | 'fieldValue' | 'expression' | 'function') => {
    setMode(newMode);
    
    if (newMode === 'none') {
      onChange(undefined);
    } else if (newMode === 'fieldValue') {
      onChange({
        type: 'fieldValue',
        field: condition?.field || '',
        operator: condition?.operator || 'notEmpty',
        value: condition?.value,
      });
    } else if (newMode === 'expression') {
      onChange({
        type: 'expression',
        expression: condition?.expression || '',
      });
    } else if (newMode === 'function') {
      onChange({
        type: 'function',
        fnSource: condition?.fnSource || 'return true;',
      });
    }
  };

  const handleFieldValueChange = (updates: Partial<DependencyCondition>) => {
    onChange({
      type: 'fieldValue',
      field: condition?.field || '',
      operator: condition?.operator || 'notEmpty',
      value: condition?.value,
      ...updates,
    });
  };

  const handleExpressionChange = (expression: string) => {
    try {
      const context = {
        data: formData,
        formData,
        parentData: {},
        rootData: formData,
      };
      const result = DependencyEvaluator.evaluateCondition(
        { type: 'expression', expression } as DependencyCondition,
        context
      );
      setPreviewResult(result);
      setPreviewError(null);
      onChange({
        type: 'expression',
        expression,
      });
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Evaluation error');
      setPreviewResult(null);
      onChange({
        type: 'expression',
        expression,
      });
    }
  };

  const handleFunctionChange = (fnSource: string) => {
    onChange({
      type: 'function',
      fnSource,
    });
    
    try {
      const context = {
        data: formData,
        formData,
        parentData: {},
        rootData: formData,
      };
      const result = DependencyEvaluator.evaluateCondition(
        { type: 'function', fnSource } as DependencyCondition,
        context
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
          {label}
        </Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, value) => value && handleModeChange(value)}
          size="small"
        >
          <ToggleButton value="none">None</ToggleButton>
          <ToggleButton value="fieldValue">Field Value</ToggleButton>
          {advancedMode && (
            <>
              <ToggleButton value="expression">Expression</ToggleButton>
              <ToggleButton value="function">Function</ToggleButton>
            </>
          )}
        </ToggleButtonGroup>
      </Box>

      {mode === 'none' && (
        <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
          No condition set - property will use default value
        </Alert>
      )}

      {mode === 'fieldValue' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Field (dataKey)</InputLabel>
            <Select
              value={condition?.field || ''}
              label="Field (dataKey)"
              onChange={(e) => handleFieldValueChange({ field: e.target.value })}
            >
              {availableFields.map((field) => (
                <MenuItem key={field} value={field}>
                  {field}
                </MenuItem>
              ))}
              {availableFields.length === 0 && (
                <MenuItem disabled>No fields available (set dataKey on components)</MenuItem>
              )}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Operator</InputLabel>
            <Select
              value={condition?.operator || 'notEmpty'}
              label="Operator"
              onChange={(e) => handleFieldValueChange({ operator: e.target.value as any })}
            >
              <MenuItem value="equals">Equals</MenuItem>
              <MenuItem value="notEquals">Not Equals</MenuItem>
              <MenuItem value="contains">Contains</MenuItem>
              <MenuItem value="notContains">Not Contains</MenuItem>
              <MenuItem value="gt">Greater Than</MenuItem>
              <MenuItem value="gte">Greater Than or Equal</MenuItem>
              <MenuItem value="lt">Less Than</MenuItem>
              <MenuItem value="lte">Less Than or Equal</MenuItem>
              <MenuItem value="empty">Is Empty</MenuItem>
              <MenuItem value="notEmpty">Is Not Empty</MenuItem>
              <MenuItem value="in">In Array</MenuItem>
              <MenuItem value="notIn">Not In Array</MenuItem>
            </Select>
          </FormControl>

          {condition?.operator && 
           !['empty', 'notEmpty'].includes(condition.operator) && (
            <TextField
              label="Compare Value"
              value={condition?.value !== undefined ? String(condition.value) : ''}
              onChange={(e) => {
                const value = e.target.value;
                // Try to parse as number or boolean
                let parsedValue: any = value;
                if (value === 'true') parsedValue = true;
                else if (value === 'false') parsedValue = false;
                else if (!isNaN(Number(value)) && value !== '') parsedValue = Number(value);
                handleFieldValueChange({ value: parsedValue });
              }}
              size="small"
              fullWidth
              helperText="Enter value to compare against (or true/false for boolean)"
            />
          )}

          {previewResult !== null && (
            <Alert severity={previewResult ? 'success' : 'warning'} sx={{ mt: 1 }}>
              Condition evaluates to: {String(previewResult)}
            </Alert>
          )}
        </Box>
      )}

      {mode === 'expression' && (
        <Box>
          <TextField
            label="JavaScript Expression"
            value={condition?.expression || ''}
            onChange={(e) => handleExpressionChange(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={3}
            placeholder="data.state !== null && data.state !== ''"
            helperText="Access form data via 'data' object (e.g., data.fieldName)"
          />
          {previewResult !== null && (
            <Alert severity={previewResult ? 'success' : 'warning'} sx={{ mt: 1 }}>
              Expression evaluates to: {String(previewResult)}
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
            value={condition?.fnSource || ''}
            onChange={(e) => handleFunctionChange(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={4}
            placeholder="return data.state !== null;"
            helperText="JavaScript function that returns boolean. Access form data via 'data' object."
          />
          {previewResult !== null && (
            <Alert severity={previewResult ? 'success' : 'warning'} sx={{ mt: 1 }}>
              Function evaluates to: {String(previewResult)}
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

/**
 * Editor for computed property (label, placeholder, value)
 */
const ComputedPropertyEditor: React.FC<{
  property?: ComputedProperty;
  label: string;
  onChange: (property: ComputedProperty | undefined) => void;
  formData?: Record<string, any>;
}> = ({ property, label, onChange, formData = {} }) => {
  const advancedMode = useModeStore((state) => state.advancedMode);
  const [mode, setMode] = useState<'none' | 'template' | 'expression' | 'function'>(
    !property ? 'none' :
    property.type === 'template' ? 'template' :
    property.type === 'function' ? 'function' :
    'expression'
  );

  const handleModeChange = (newMode: 'none' | 'template' | 'expression' | 'function') => {
    setMode(newMode);
    
    if (newMode === 'none') {
      onChange(undefined);
    } else if (newMode === 'template') {
      onChange({
        type: 'template',
        template: property?.template || '',
      });
    } else if (newMode === 'expression') {
      onChange({
        type: 'expression',
        expression: property?.expression || '',
      });
    } else if (newMode === 'function') {
      onChange({
        type: 'function',
        fnSource: property?.fnSource || 'return "";',
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          {label}
        </Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, value) => value && handleModeChange(value)}
          size="small"
        >
          <ToggleButton value="none">None</ToggleButton>
          <ToggleButton value="template">Template</ToggleButton>
          {advancedMode && (
            <>
              <ToggleButton value="expression">Expression</ToggleButton>
              <ToggleButton value="function">Function</ToggleButton>
            </>
          )}
        </ToggleButtonGroup>
      </Box>

      {mode === 'none' && (
        <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
          No computed property - will use static value
        </Alert>
      )}

      {mode === 'template' && (
        <TextField
          label="Template String"
          value={property?.template || ''}
          onChange={(e) => onChange({ type: 'template', template: e.target.value })}
          size="small"
          fullWidth
          placeholder='{data.typeName} *'
          helperText="Use {data.fieldName} for placeholders (e.g., '{data.firstName} {data.lastName}')"
        />
      )}

      {mode === 'expression' && (
        <TextField
          label="JavaScript Expression"
          value={property?.expression || ''}
          onChange={(e) => onChange({ type: 'expression', expression: e.target.value })}
          size="small"
          fullWidth
          multiline
          rows={3}
          placeholder="data.firstName + ' ' + data.lastName"
          helperText="Access form data via 'data' object"
        />
      )}

      {mode === 'function' && (
        <TextField
          label="Function Source Code"
          value={property?.fnSource || ''}
          onChange={(e) => onChange({ type: 'function', fnSource: e.target.value })}
          size="small"
          fullWidth
          multiline
          rows={4}
          placeholder="return data.firstName + ' ' + data.lastName;"
          helperText="JavaScript function. Access form data via 'data' object."
        />
      )}
    </Box>
  );
};

/**
 * Editor for filter dependency (cascading dropdowns)
 */
const FilterDependencyEditor: React.FC<{
  filterBy?: FilterDependency | FilterDependency[];
  onChange: (filterBy: FilterDependency | FilterDependency[] | undefined) => void;
  componentId: string;
}> = ({ filterBy, onChange, componentId }) => {
  const { components } = useFormBuilderStore();
  
  // Get all available dataKeys
  const availableFields = useMemo(() => {
    const fields = new Set<string>();
    const extractFields = (comps: any[]) => {
      comps.forEach((comp) => {
        if (comp.id !== componentId && comp.props?.dataKey) {
          fields.add(comp.props.dataKey);
        }
        if (comp.children) {
          extractFields(comp.children);
        }
      });
    };
    extractFields(components);
    return Array.from(fields).sort();
  }, [components, componentId]);

  const filters = Array.isArray(filterBy) ? filterBy : (filterBy ? [filterBy] : []);

  const handleAddFilter = () => {
    const newFilter: FilterDependency = {
      sourceField: availableFields[0] || '',
      targetParam: '',
    };
    onChange([...filters, newFilter]);
  };

  const handleUpdateFilter = (index: number, updates: Partial<FilterDependency>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    onChange(newFilters.length === 1 ? newFilters[0] : newFilters);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    onChange(newFilters.length === 0 ? undefined : (newFilters.length === 1 ? newFilters[0] : newFilters));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          Data Filtering (Cascading)
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddFilter}
          disabled={availableFields.length === 0}
        >
          Add Filter
        </Button>
      </Box>

      {filters.length === 0 && (
        <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
          No filters configured. Add a filter to enable cascading dropdowns.
        </Alert>
      )}

      {filters.map((filter, index) => (
        <Box
          key={index}
          sx={{
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            mb: 1.5,
            position: 'relative',
          }}
        >
          <IconButton
            size="small"
            onClick={() => handleRemoveFilter(index)}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>

          <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
            Filter {index + 1}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Source Field (dataKey)</InputLabel>
              <Select
                value={filter.sourceField || ''}
                label="Source Field (dataKey)"
                onChange={(e) => handleUpdateFilter(index, { sourceField: e.target.value })}
              >
                {availableFields.map((field) => (
                  <MenuItem key={field} value={field}>
                    {field}
                  </MenuItem>
                ))}
                {availableFields.length === 0 && (
                  <MenuItem disabled>No fields available</MenuItem>
                )}
              </Select>
            </FormControl>

            <TextField
              label="Target Parameter Name"
              value={filter.targetParam || ''}
              onChange={(e) => handleUpdateFilter(index, { targetParam: e.target.value })}
              size="small"
              fullWidth
              placeholder="e.g., state_code, country_id"
              helperText="API parameter name for filtering (e.g., 'state_code' for filtering cities by state)"
            />

            {advancedMode && (
              <TextField
                label="Transform Function (Optional)"
                value={filter.transform || ''}
                onChange={(e) => handleUpdateFilter(index, { transform: e.target.value })}
                size="small"
                fullWidth
                placeholder="return value.toUpperCase();"
                helperText="Optional: Transform source value before sending to API"
              />
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

/**
 * Main Dependency Editor Component
 */
const DependencyEditor: React.FC<DependencyEditorProps> = ({
  dependencies,
  componentId,
  onChange,
}) => {
  const formData = useFormDataStore((state) => state.data);
  const { components } = useFormBuilderStore();
  
  // Get all available dataKeys for resetOn
  const availableFields = useMemo(() => {
    const fields = new Set<string>();
    const extractFields = (comps: any[]) => {
      comps.forEach((comp) => {
        if (comp.id !== componentId && comp.props?.dataKey) {
          fields.add(comp.props.dataKey);
        }
        if (comp.children) {
          extractFields(comp.children);
        }
      });
    };
    extractFields(components);
    return Array.from(fields).sort();
  }, [components, componentId]);

  const handleDependencyChange = (key: keyof ComponentDependencies, value: any) => {
    onChange({
      ...dependencies,
      [key]: value,
    });
  };

  const handleRemoveDependency = (key: keyof ComponentDependencies) => {
    const newDeps = { ...dependencies };
    delete newDeps[key];
    onChange(Object.keys(newDeps).length > 0 ? newDeps : undefined);
  };

  const resetOnFields = dependencies?.resetOn || [];

  return (
    <Box>
      <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
        Configure how this component depends on other fields. Dependencies are evaluated in form mode only.
      </Typography>

      {/* Conditional States */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BlockIcon fontSize="small" color="action" />
            <Typography variant="subtitle2">Conditional States</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <DependencyConditionEditor
              condition={dependencies?.disabled}
              label="Disabled When"
              onChange={(condition) => handleDependencyChange('disabled', condition)}
              formData={formData}
            />
            <Divider />
            <DependencyConditionEditor
              condition={dependencies?.enabled}
              label="Enabled When"
              onChange={(condition) => handleDependencyChange('enabled', condition)}
              formData={formData}
            />
            <Divider />
            <DependencyConditionEditor
              condition={dependencies?.visible}
              label="Visible When"
              onChange={(condition) => handleDependencyChange('visible', condition)}
              formData={formData}
            />
            <Divider />
            <DependencyConditionEditor
              condition={dependencies?.required}
              label="Required When"
              onChange={(condition) => handleDependencyChange('required', condition)}
              formData={formData}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Data Filtering (Cascading Dropdowns) */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon fontSize="small" color="action" />
            <Typography variant="subtitle2">Data Filtering</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <FilterDependencyEditor
            filterBy={dependencies?.filterBy}
            onChange={(filterBy) => handleDependencyChange('filterBy', filterBy)}
            componentId={componentId}
          />
        </AccordionDetails>
      </Accordion>

      {/* Reset On Field Changes */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RefreshIcon fontSize="small" color="action" />
            <Typography variant="subtitle2">Reset On Changes</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: 'text.secondary' }}>
              Reset this field's value when any of these fields change
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Fields to Watch</InputLabel>
              <Select
                multiple
                value={resetOnFields}
                label="Fields to Watch"
                onChange={(e) => handleDependencyChange('resetOn', e.target.value)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {availableFields.map((field) => (
                  <MenuItem key={field} value={field}>
                    {field}
                  </MenuItem>
                ))}
                {availableFields.length === 0 && (
                  <MenuItem disabled>No fields available</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Dynamic Properties */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LabelIcon fontSize="small" color="action" />
            <Typography variant="subtitle2">Dynamic Properties</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ComputedPropertyEditor
              property={dependencies?.label}
              label="Dynamic Label"
              onChange={(property) => handleDependencyChange('label', property)}
              formData={formData}
            />
            <Divider />
            <ComputedPropertyEditor
              property={dependencies?.placeholder}
              label="Dynamic Placeholder"
              onChange={(property) => handleDependencyChange('placeholder', property)}
              formData={formData}
            />
            <Divider />
            <ComputedPropertyEditor
              property={dependencies?.value}
              label="Computed Value"
              onChange={(property) => handleDependencyChange('value', property)}
              formData={formData}
            />
            <Divider />
            <ComputedPropertyEditor
              property={dependencies?.options}
              label="Dynamic Options"
              onChange={(property) => handleDependencyChange('options', property)}
              formData={formData}
            />
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default DependencyEditor;

