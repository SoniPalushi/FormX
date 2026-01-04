import React, { useState } from 'react';
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
import type { ActionData } from '../../stores/types/formEngine';

interface EventHandlerEditorProps {
  events?: Record<string, ActionData[]>;
  onChange: (events: Record<string, ActionData[]>) => void;
}

const COMMON_EVENTS = [
  { value: 'onClick', label: 'On Click' },
  { value: 'onChange', label: 'On Change' },
  { value: 'onFocus', label: 'On Focus' },
  { value: 'onBlur', label: 'On Blur' },
  { value: 'onSubmit', label: 'On Submit' },
];

const COMMON_ACTIONS = [
  { value: 'validate', label: 'Validate', type: 'common' },
  { value: 'clear', label: 'Clear', type: 'common' },
  { value: 'reset', label: 'Reset', type: 'common' },
  { value: 'log', label: 'Log', type: 'common' },
  { value: 'addRow', label: 'Add Row', type: 'common' },
  { value: 'removeRow', label: 'Remove Row', type: 'common' },
  { value: 'openModal', label: 'Open Modal', type: 'common' },
  { value: 'closeModal', label: 'Close Modal', type: 'common' },
  { value: 'custom', label: 'Custom Function', type: 'custom' },
];

const EventHandlerEditor: React.FC<EventHandlerEditorProps> = ({ events = {}, onChange }) => {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  const handleAddEvent = () => {
    const newEvent = COMMON_EVENTS[0].value;
    onChange({
      ...events,
      [newEvent]: [{ name: 'log', type: 'common', args: {} }],
    });
    setExpandedEvent(newEvent);
  };

  const handleRemoveEvent = (eventName: string) => {
    const newEvents = { ...events };
    delete newEvents[eventName];
    onChange(newEvents);
  };

  const handleAddAction = (eventName: string) => {
    const eventActions = events[eventName] || [];
    onChange({
      ...events,
      [eventName]: [...eventActions, { name: 'log', type: 'common', args: {} }],
    });
    setExpandedAction(`${eventName}-${eventActions.length}`);
  };

  const handleRemoveAction = (eventName: string, actionIndex: number) => {
    const eventActions = events[eventName] || [];
    const newActions = eventActions.filter((_, i) => i !== actionIndex);
    if (newActions.length === 0) {
      handleRemoveEvent(eventName);
    } else {
      onChange({
        ...events,
        [eventName]: newActions,
      });
    }
  };

  const handleUpdateAction = (eventName: string, actionIndex: number, updates: Partial<ActionData>) => {
    const eventActions = events[eventName] || [];
    const newActions = [...eventActions];
    newActions[actionIndex] = { ...newActions[actionIndex], ...updates };
    onChange({
      ...events,
      [eventName]: newActions,
    });
  };

  const handleUpdateActionArg = (eventName: string, actionIndex: number, argKey: string, value: any) => {
    const action = events[eventName]?.[actionIndex];
    if (!action) return;
    const args = { ...(action.args || {}), [argKey]: value };
    handleUpdateAction(eventName, actionIndex, { args });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          Event Handlers
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddEvent}
          variant="outlined"
          sx={{ fontSize: '0.75rem', py: 0.5 }}
        >
          Add Event
        </Button>
      </Box>

      {Object.keys(events).length === 0 ? (
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
            No event handlers. Click "Add Event" to add one.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Object.entries(events).map(([eventName, actions]) => {
            const eventLabel = COMMON_EVENTS.find((e) => e.value === eventName)?.label || eventName;
            const isExpanded = expandedEvent === eventName;

            return (
              <Accordion
                key={eventName}
                expanded={isExpanded}
                onChange={() => setExpandedEvent(isExpanded ? null : eventName)}
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Chip
                      label={eventLabel}
                      size="small"
                      color="secondary"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                    <Chip
                      label={`${actions.length} action${actions.length !== 1 ? 's' : ''}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveEvent(eventName);
                      }}
                      sx={{ mr: 1 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {actions.map((action, actionIndex) => {
                      const actionKey = `${eventName}-${actionIndex}`;
                      const isActionExpanded = expandedAction === actionKey;
                      const actionDef = COMMON_ACTIONS.find((a) => a.value === action.name);

                      return (
                        <Accordion
                          key={actionIndex}
                          expanded={isActionExpanded}
                          onChange={() => setExpandedAction(isActionExpanded ? null : actionKey)}
                          sx={{ border: '1px solid', borderColor: 'divider' }}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                              <Chip
                                label={actionDef?.label || action.name}
                                size="small"
                                color={action.type === 'custom' ? 'warning' : 'primary'}
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                              <Box sx={{ flexGrow: 1 }} />
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveAction(eventName, actionIndex);
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
                                <InputLabel>Action Type</InputLabel>
                                <Select
                                  value={action.type}
                                  label="Action Type"
                                  onChange={(e) =>
                                    handleUpdateAction(eventName, actionIndex, {
                                      type: e.target.value as 'common' | 'custom',
                                      name: e.target.value === 'custom' ? 'custom' : action.name,
                                    })
                                  }
                                >
                                  <MenuItem value="common">Common Action</MenuItem>
                                  <MenuItem value="custom">Custom Function</MenuItem>
                                </Select>
                              </FormControl>

                              {action.type === 'common' ? (
                                <FormControl fullWidth size="small">
                                  <InputLabel>Action</InputLabel>
                                  <Select
                                    value={action.name}
                                    label="Action"
                                    onChange={(e) =>
                                      handleUpdateAction(eventName, actionIndex, { name: e.target.value })
                                    }
                                  >
                                    {COMMON_ACTIONS.filter((a) => a.type === 'common').map((a) => (
                                      <MenuItem key={a.value} value={a.value}>
                                        {a.label}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              ) : (
                                <TextField
                                  label="Function Name"
                                  value={action.name}
                                  onChange={(e) =>
                                    handleUpdateAction(eventName, actionIndex, { name: e.target.value })
                                  }
                                  size="small"
                                  fullWidth
                                  helperText="Name of the custom function to execute"
                                />
                              )}

                              {action.type === 'custom' && (
                                <TextField
                                  label="Function Source Code"
                                  value={(action as any).body || ''}
                                  onChange={(e) =>
                                    handleUpdateAction(eventName, actionIndex, {
                                      body: e.target.value,
                                    } as any)
                                  }
                                  size="small"
                                  fullWidth
                                  multiline
                                  rows={4}
                                  placeholder="(data, event) => { /* your code */ }"
                                  helperText="JavaScript function code"
                                />
                              )}

                              {(action.name === 'log' || action.name === 'openModal' || action.name === 'custom') && (
                                <>
                                  <Divider />
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    Arguments
                                  </Typography>
                                  <TextField
                                    label="Message / Modal ID"
                                    value={action.args?.message || action.args?.modalId || ''}
                                    onChange={(e) =>
                                      handleUpdateActionArg(
                                        eventName,
                                        actionIndex,
                                        action.name === 'openModal' ? 'modalId' : 'message',
                                        e.target.value
                                      )
                                    }
                                    size="small"
                                    fullWidth
                                    helperText={
                                      action.name === 'openModal'
                                        ? 'ID of the modal component to open'
                                        : 'Message to log or display'
                                    }
                                  />
                                </>
                              )}
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      );
                    })}

                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddAction(eventName)}
                      variant="outlined"
                      sx={{ mt: 1 }}
                    >
                      Add Action
                    </Button>
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

export default EventHandlerEditor;

