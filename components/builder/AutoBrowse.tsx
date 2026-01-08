/**
 * AutoBrowse Component for Builder
 * Provides AutoComplete input with modal Table for browsing and selecting dataviews
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Button,
  Modal,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  FolderOpen as BrowseIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
// Note: @mui/x-data-grid needs to be installed: npm install @mui/x-data-grid
// For now, using MUI Table instead
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
} from '@mui/material';
import type { Dataview } from '../../stores/types';
import { getDataviewManager } from '../../utils/dataviews/dataviewManager';

export interface AutoBrowseProps {
  value?: any[];
  valueField: string; // e.g., "dataview_id"
  labelField: string; // e.g., "description"
  dataProvider: any[]; // List of dataviews
  onChange?: (value: any[]) => void;
  onDataviewSelect?: (dataview: any) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  loading?: boolean;
}

const AutoBrowse: React.FC<AutoBrowseProps> = ({
  value = [],
  valueField,
  labelField,
  dataProvider,
  onChange,
  onDataviewSelect,
  placeholder = 'Select dataview...',
  disabled = false,
  required = false,
  loading = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRows, setSelectedRows] = useState<any[]>(value);
  const [selectedDataviewResponse, setSelectedDataviewResponse] = useState<any>(null);
  const [selectedDataviewFields, setSelectedDataviewFields] = useState<string[]>([]);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [expandedResponse, setExpandedResponse] = useState(false);

  // Filter dataviews based on search text
  const filteredData = useMemo(() => {
    if (!searchText.trim()) {
      return dataProvider;
    }

    const searchLower = searchText.toLowerCase();
    return dataProvider.filter((item) => {
      const label = item[labelField] || item.name || '';
      const value = item[valueField] || item.id || '';
      return (
        String(label).toLowerCase().includes(searchLower) ||
        String(value).toLowerCase().includes(searchLower)
      );
    });
  }, [dataProvider, searchText, valueField, labelField]);

  // Prepare table columns
  const columns = useMemo(() => {
    const allKeys = new Set<string>();
    dataProvider.forEach((item) => {
      Object.keys(item).forEach((key) => allKeys.add(key));
    });

    return Array.from(allKeys)
      .filter((key) => key !== 'id')
      .slice(0, 5) // Limit to 5 columns for display
      .map((key) => ({
        field: key,
        headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      }));
  }, [dataProvider]);

  // Prepare table rows
  const rows = useMemo(() => {
    return filteredData.map((item, index) => ({
      id: item.id || item[valueField] || `row-${index}`,
      ...item,
    }));
  }, [filteredData, valueField]);

  const handleOpen = () => {
    setOpen(true);
    setSearchText('');
    setSelectedDataviewResponse(null);
    setSelectedDataviewFields([]);
    setExpandedResponse(false);
  };

  const handleClose = () => {
    setOpen(false);
    setSearchText('');
    setSelectedDataviewResponse(null);
    setSelectedDataviewFields([]);
    setExpandedResponse(false);
  };

  const handleSelect = () => {
    if (selectedRows.length > 0) {
      onChange?.(selectedRows);
      if (selectedRows.length === 1) {
        onDataviewSelect?.(selectedRows[0]);
      }
      handleClose();
    }
  };

  const handleRowSelection = (newSelection: any[]) => {
    const selectedItems = rows.filter((row) => newSelection.includes(row.id));
    setSelectedRows(selectedItems);
  };

  const handleRowClick = async (row: any) => {
    // Toggle selection
    const isSelected = selectedRows.some(
      (selected) => (selected.id || selected[valueField]) === row.id
    );
    if (isSelected) {
      setSelectedRows(selectedRows.filter((r) => r.id !== row.id));
      setSelectedDataviewResponse(null);
      setSelectedDataviewFields([]);
    } else {
      setSelectedRows([...selectedRows, row]);
      
      // Load response data for this dataview
      const dataviewId = row[valueField] || row.id;
      if (dataviewId) {
        setLoadingResponse(true);
        try {
          const dataviewManager = getDataviewManager();
          
          // Load fields
          const fields = await dataviewManager.loadDataviewFields(dataviewId);
          setSelectedDataviewFields(fields);
          
          // Load data (response)
          const data = await dataviewManager.loadDataview(dataviewId);
          setSelectedDataviewResponse(data);
          setExpandedResponse(true);
        } catch (error) {
          console.error('Failed to load dataview response:', error);
          setSelectedDataviewResponse(null);
          setSelectedDataviewFields([]);
        } finally {
          setLoadingResponse(false);
        }
      }
    }
  };

  // Get display value for Autocomplete
  const displayValue = useMemo(() => {
    if (value.length === 0) {
      return null;
    }
    if (value.length === 1) {
      return value[0];
    }
    return `${value.length} items selected`;
  }, [value]);

  // Debug: Log dataProvider
  React.useEffect(() => {
    console.log('AutoBrowse dataProvider:', dataProvider.length, dataProvider);
  }, [dataProvider]);

  return (
    <Box>
      <Autocomplete
        value={displayValue}
        options={dataProvider || []}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option[labelField] || option.name || option[valueField] || option.id || '';
        }}
        disabled={disabled}
        loading={loading}
        noOptionsText={loading ? 'Loading dataviews...' : 'No dataviews available'}
        onChange={(event, newValue) => {
          if (newValue) {
            onChange?.([newValue]);
            onDataviewSelect?.(newValue);
          } else {
            onChange?.([]);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            required={required}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : (
                    <>
                      {params.InputProps.endAdornment}
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleOpen}
                          edge="end"
                          disabled={disabled}
                          size="small"
                        >
                          <BrowseIcon />
                        </IconButton>
                      </InputAdornment>
                    </>
                  )}
                </>
              ),
            }}
          />
        )}
        sx={{ width: '100%' }}
      />

      {/* Browse Modal */}
      <Modal open={open} onClose={handleClose}>
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 800,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            p: 2,
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Browse Dataviews</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Search */}
          <TextField
            fullWidth
            placeholder="Search dataviews..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Data Table */}
          <Box sx={{ flex: 1, minHeight: 400, mb: 2, overflow: 'auto' }}>
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    {columns.map((col) => (
                      <TableCell key={col.field}>{col.headerName}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const isSelected = selectedRows.some(
                      (selected) => (selected.id || selected[valueField]) === row.id
                    );
                    return (
                      <TableRow
                        key={row.id}
                        hover
                        onClick={() => handleRowClick(row)}
                        selected={isSelected}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox checked={isSelected} />
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell key={col.field}>
                            {row[col.field] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            {rows.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body2">No dataviews found</Typography>
              </Box>
            )}
          </Box>

          {/* Response and Fields Section */}
          {selectedRows.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Accordion 
                expanded={expandedResponse} 
                onChange={(e, isExpanded) => setExpandedResponse(isExpanded)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CodeIcon />
                    <Typography variant="subtitle2">
                      API Response & Parsed Fields
                      {loadingResponse && <CircularProgress size={16} sx={{ ml: 1 }} />}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {loadingResponse ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <>
                      {/* Parsed Fields */}
                      {selectedDataviewFields.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                            Parsed Fields ({selectedDataviewFields.length}):
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selectedDataviewFields.map((field) => (
                              <Chip
                                key={field}
                                label={field}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Raw Response */}
                      {selectedDataviewResponse !== null && (
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                            Raw API Response:
                          </Typography>
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
                            Records: {Array.isArray(selectedDataviewResponse) ? selectedDataviewResponse.length : 'N/A'}
                          </Typography>
                        </Box>
                      )}

                      {!selectedDataviewResponse && !loadingResponse && (
                        <Typography variant="body2" color="text.secondary">
                          Click on a dataview row to load its response and fields
                        </Typography>
                      )}
                    </>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}

          {/* Footer Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={handleClose} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleSelect}
              variant="contained"
              disabled={selectedRows.length === 0}
            >
              Select ({selectedRows.length})
            </Button>
          </Box>
        </Paper>
      </Modal>
    </Box>
  );
};

export default AutoBrowse;

