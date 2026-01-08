import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  IconButton,
  Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormDataStore } from '../../stores/formDataStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { resolveArrayDataSourceSync } from '../../utils/data/dataSourceResolver';
import { useBuilderDataStore } from '../../stores/builderDataStore';

interface FormDataBrowseProps {
  component: ComponentDefinition;
}

const FormDataBrowse: React.FC<FormDataBrowseProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode, findComponent } = useFormBuilderStore();
  const { data, getAllData, getData } = useFormDataStore();
  const { getDataviewData } = useBuilderDataStore();
  const isSelected = selectedComponentId === component.id;
  
  const {
    responsiveSx,
    responsiveCss,
    wrapperResponsiveSx,
    wrapperResponsiveCss,
    shouldRender,
    handleClick,
    htmlAttributes,
  } = useFormComponent({ component, formMode });
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get latest component
  const latestComponent = useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, findComponent]);

  // Support multiple data source types: data, rows, dataSource
  const dataSource = latestComponent.props?.dataSource || 
                     latestComponent.props?.data || 
                     latestComponent.props?.rows || 
                     [];
  
  // Resolve data from various sources (sync version for useMemo)
  // Në builder mode, nëse dataSource është dataview reference (string), merr të dhënat nga builder store
  const resolvedData = useMemo(() => {
    // Në builder mode, kontrollo dataview reference
    if (!formMode && typeof dataSource === 'string' && dataSource) {
      const builderData = getDataviewData(dataSource);
      if (builderData && Array.isArray(builderData)) {
        // Shfaq të dhënat aktuale për preview në builder
        return builderData;
      }
    }
    
    // Form mode ose static data - logjika ekzistuese
    return resolveArrayDataSourceSync({
      source: dataSource,
      formData: data,
      component: latestComponent,
      getAllData,
      getData,
    });
  }, [dataSource, data, latestComponent, getAllData, getData, formMode, getDataviewData]);
  
  const columns = latestComponent.props?.columns || [];
  const label = latestComponent.props?.label || 'Data Browse';
  const searchable = component.props?.searchable !== false;
  const paginated = component.props?.paginated !== false;
  const margin = component.props?.margin;
  const padding = component.props?.padding;
  const classes = component.props?.classes || component.props?.className || [];

  // Infer columns from data if not provided
  const inferredColumns =
    columns.length === 0 && resolvedData.length > 0
      ? Object.keys(resolvedData[0]).map((key) => ({ field: key, headerName: key }))
      : columns;

  // Filter data based on search term
  const filteredData = searchable && searchTerm
    ? resolvedData.filter((row: any) =>
        Object.values(row).some((value: any) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : resolvedData;

  // Paginate data
  const paginatedData = paginated
    ? filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : filteredData;

  if (!shouldRender) return null;

  return (
    <Box
      onClick={(e) => {
        if (!formMode) {
          e.stopPropagation();
          selectComponent(component.id);
        } else {
          handleClick(e);
        }
      }}
      sx={{
        border: isSelected && !formMode ? '2px solid #1976d2' : '2px solid transparent',
        borderRadius: 1,
        p: formMode ? 0 : 0.5,
        cursor: formMode ? 'default' : 'pointer',
        margin: margin ? `${margin.top || 0}px ${margin.right || 0}px ${margin.bottom || 0}px ${margin.left || 0}px` : undefined,
        padding: padding ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px` : undefined,
        ...wrapperResponsiveSx,
      }}
      className={Array.isArray(classes) ? classes.join(' ') : classes}
      style={wrapperResponsiveCss ? { ...htmlAttributes, style: wrapperResponsiveCss } : htmlAttributes}
    >
      <Paper sx={{ p: 2 }}>
        {label && (
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {label}
          </Typography>
        )}
        
        {searchable && (
          <TextField
            fullWidth
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              if (formMode) {
                setSearchTerm(e.target.value);
                setPage(0); // Reset to first page on search
              }
            }}
            InputProps={{
              startAdornment: (
                <IconButton size="small" edge="start">
                  <SearchIcon />
                </IconButton>
              ),
            }}
            sx={{ mb: 2 }}
            onClick={(e) => {
              if (!formMode) {
                e.stopPropagation();
              }
            }}
          />
        )}

        {paginatedData && paginatedData.length > 0 ? (
          <>
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {inferredColumns.map((col: any, index: number) => (
                      <TableCell key={index}>
                        {typeof col === 'string' ? col : col.headerName || col.field}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((row: any, rowIndex: number) => (
                    <TableRow key={rowIndex} hover={formMode}>
                      {inferredColumns.map((col: any, colIndex: number) => {
                        const field = typeof col === 'string' ? col : col.field;
                        return (
                          <TableCell key={colIndex}>
                            {row[field] !== undefined ? String(row[field]) : '-'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {paginated && (
              <TablePagination
                component="div"
                count={filteredData.length}
                page={page}
                onPageChange={(_, newPage) => {
                  if (formMode) {
                    setPage(newPage);
                  }
                }}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  if (formMode) {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
            No data available
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default FormDataBrowse;

