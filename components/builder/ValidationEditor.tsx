import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import type { ValidationRule, ValidationSchema } from '../../stores/types/formEngine';
import { useModeStore } from '../../stores/modeStore';
import { VALIDATION_RULES_CLASSIFICATION, isFeatureAvailable } from '../../utils/modes/featureClassification';

interface ValidationEditorProps {
  schema?: ValidationSchema;
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  onChange: (schema: ValidationSchema) => void;
}

const VALIDATION_RULES: Record<string, { label: string; args: string[]; dataTypes: string[] }> = {
  required: { label: 'Required', args: [], dataTypes: ['string', 'number', 'boolean', 'date', 'array', 'object'] },
  min: { label: 'Minimum', args: ['limit'], dataTypes: ['string', 'number', 'array'] },
  max: { label: 'Maximum', args: ['limit'], dataTypes: ['string', 'number', 'array'] },
  length: { label: 'Exact Length', args: ['limit'], dataTypes: ['string', 'array'] },
  regex: { label: 'Regular Expression', args: ['pattern'], dataTypes: ['string'] },
  email: { label: 'Email', args: [], dataTypes: ['string'] },
  url: { label: 'URL', args: [], dataTypes: ['string'] },
  uuid: { label: 'UUID', args: [], dataTypes: ['string'] },
  ip: { label: 'IP Address', args: [], dataTypes: ['string'] },
  datetime: { label: 'Date/Time', args: [], dataTypes: ['string', 'date'] },
  includes: { label: 'Includes', args: ['value'], dataTypes: ['string', 'array'] },
  startsWith: { label: 'Starts With', args: ['value'], dataTypes: ['string'] },
  endsWith: { label: 'Ends With', args: ['value'], dataTypes: ['string'] },
  lessThan: { label: 'Less Than', args: ['limit'], dataTypes: ['number'] },
  moreThan: { label: 'More Than', args: ['limit'], dataTypes: ['number'] },
  integer: { label: 'Integer', args: [], dataTypes: ['number'] },
  multipleOf: { label: 'Multiple Of', args: ['value'], dataTypes: ['number'] },
};

const ValidationEditor: React.FC<ValidationEditorProps> = ({ schema, dataType = 'string', onChange }) => {
  const validations = schema?.validations || [];
  const [expandedRule, setExpandedRule] = useState<number | null>(null);
  const advancedMode = useModeStore((state) => state.advancedMode);

  // Filter rules based on mode using feature classification
  const availableRules = useMemo(() => {
    return Object.entries(VALIDATION_RULES).filter(([key, rule]) => {
      // Check if rule is available for this data type
      if (!rule.dataTypes.includes(dataType)) {
        return false;
      }
      // Check if rule is available in current mode
      return isFeatureAvailable(key, VALIDATION_RULES_CLASSIFICATION, advancedMode);
    });
  }, [dataType, advancedMode]);

  const handleAddRule = () => {
    const newRule: ValidationRule = {
      key: availableRules[0]?.[0] || 'required',
      args: {},
      message: '',
    };
    onChange({
      validations: [...validations, newRule],
    });
    setExpandedRule(validations.length);
  };

  const handleRemoveRule = (index: number) => {
    const newValidations = validations.filter((_, i) => i !== index);
    onChange({
      validations: newValidations,
    });
  };

  const handleUpdateRule = (index: number, updates: Partial<ValidationRule>) => {
    const newValidations = [...validations];
    newValidations[index] = { ...newValidations[index], ...updates };
    onChange({
      validations: newValidations,
    });
  };

  const handleUpdateRuleArg = (index: number, argKey: string, value: any) => {
    const rule = validations[index];
    const args = { ...(rule.args || {}), [argKey]: value };
    handleUpdateRule(index, { args });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          Validation Rules
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddRule}
          variant="outlined"
          sx={{ fontSize: '0.75rem', py: 0.5 }}
        >
          Add Rule
        </Button>
      </Box>

      {validations.length === 0 ? (
        <Box
          sx={{
            p: 2,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            textAlign: 'center',
            bgcolor: 'action.hover',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            No validation rules. Click "Add Rule" to add one.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {validations.map((rule, index) => {
            const ruleDef = VALIDATION_RULES[rule.key];
            const isExpanded = expandedRule === index;

            return (
              <Accordion
                key={index}
                expanded={isExpanded}
                onChange={() => setExpandedRule(isExpanded ? null : index)}
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Chip
                      label={ruleDef?.label || rule.key}
                      size="small"
                      color="primary"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                    {rule.message && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        {rule.message}
                      </Typography>
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveRule(index);
                      }}
                      sx={{ mr: 1 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Rule Type</InputLabel>
                      <Select
                        value={rule.key}
                        label="Rule Type"
                        onChange={(e) => handleUpdateRule(index, { key: e.target.value, args: {} })}
                      >
                        {availableRules.map(([key, def]) => (
                          <MenuItem key={key} value={key}>
                            {def.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {ruleDef?.args && ruleDef.args.length > 0 && (
                      <>
                        <Divider />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          Arguments
                        </Typography>
                        {ruleDef.args.map((argKey) => {
                          const argValue = rule.args?.[argKey];
                          return (
                            <TextField
                              key={argKey}
                              label={argKey.charAt(0).toUpperCase() + argKey.slice(1)}
                              value={argValue || ''}
                              onChange={(e) => {
                                const value = argKey === 'limit' || argKey === 'value' 
                                  ? (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))
                                  : e.target.value;
                                handleUpdateRuleArg(index, argKey, value);
                              }}
                              size="small"
                              fullWidth
                              type={argKey === 'limit' || argKey === 'value' ? 'number' : 'text'}
                              helperText={
                                argKey === 'pattern' ? 'Regular expression pattern (e.g., ^[A-Z]+$)' :
                                argKey === 'limit' ? 'Numeric limit value' :
                                argKey === 'value' ? 'Value to check against' : ''
                              }
                            />
                          );
                        })}
                      </>
                    )}

                    <Divider />
                    <TextField
                      label="Custom Error Message"
                      value={rule.message || ''}
                      onChange={(e) => handleUpdateRule(index, { message: e.target.value })}
                      size="small"
                      fullWidth
                      placeholder="Leave empty for default message"
                      helperText="Optional: Custom error message to display when validation fails"
                    />

                    {rule.validateWhen && (
                      <>
                        <Divider />
                        <TextField
                          label="Conditional Validation"
                          value={rule.validateWhen}
                          onChange={(e) => handleUpdateRule(index, { validateWhen: e.target.value })}
                          size="small"
                          fullWidth
                          multiline
                          rows={2}
                          helperText="Expression that must be true for this rule to apply (e.g., data.otherField === 'value')"
                        />
                      </>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default ValidationEditor;

