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
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  FolderOpen as BrowseIcon,
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
  };

  const handleClose = () => {
    setOpen(false);
    setSearchText('');
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

  return (
    <Box>
      <Autocomplete
        value={displayValue}
        options={dataProvider}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option[labelField] || option.name || option[valueField] || '';
        }}
        disabled={disabled}
        loading={loading}
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
                        onClick={() => {
                          if (isSelected) {
                            setSelectedRows(selectedRows.filter((r) => r.id !== row.id));
                          } else {
                            setSelectedRows([...selectedRows, row]);
                          }
                        }}
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

