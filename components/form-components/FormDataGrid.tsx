import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormDataStore } from '../../stores/formDataStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';
import { resolveArrayDataSourceSync } from '../../utils/data/dataSourceResolver';
import { useBuilderDataStore } from '../../stores/builderDataStore';

interface FormDataGridProps {
  component: ComponentDefinition;
}

const FormDataGrid: React.FC<FormDataGridProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const { data, getAllData, getData } = useFormDataStore();
  const { getDataviewData } = useBuilderDataStore();
  const isSelected = selectedComponentId === component.id;

  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode });
  
  // Use the form component hook for conditional rendering and computed properties
  const {
    computedLabel,
    responsiveSx,
    wrapperResponsiveSx,
    shouldRender,
    handleClick,
    htmlAttributes,
  } = useFormComponent({ component: latestComponent, formMode });

  const columns = latestComponent.props?.columns || [];
  
  // Support multiple data source types: dataSource, rows, data
  // Priority: dataSource > rows > data
  const dataSource = useMemo(() => {
    const ds = latestComponent.props?.dataSource;
    const r = latestComponent.props?.rows;
    const d = latestComponent.props?.data;
    
    // If dataSource exists, use it (even if empty array - user might have cleared it intentionally)
    if (ds !== undefined && ds !== null) {
      // If it's an array, use it (even if empty)
      // If it's not an array (function, computed property, string), use it
      return ds;
    }
    // Otherwise fall back to rows or data
    if (r !== undefined && r !== null) {
      return r;
    }
    if (d !== undefined && d !== null) {
      return d;
    }
    return [];
  }, [latestComponent.props?.dataSource, latestComponent.props?.rows, latestComponent.props?.data]);
  
  // Resolve data from various sources (sync version for useMemo)
  // In builder mode, if dataSource is a dataview reference (string), get data from builder store
  const rows = useMemo(() => {
    // In builder mode, check dataview reference (string dataview ID)
    if (!formMode && typeof dataSource === 'string' && dataSource && dataSource !== '__DATAVIEW_PENDING__') {
      const builderData = getDataviewData(dataSource);
      if (builderData && Array.isArray(builderData) && builderData.length > 0) {
        // Display actual data for preview in builder
        return builderData;
      }
      // If data is not yet loaded, return empty array (will show "No data available")
      // The data should be loaded when dataview is selected in PropertyEditor
      if (!builderData) {
        console.log('DataGrid: Dataview data not yet loaded for:', dataSource);
      }
    }
    
    // Form mode or static data - existing logic
    // For form mode, string dataview references will be resolved at runtime
    const resolved = resolveArrayDataSourceSync({
      source: dataSource,
      formData: data,
      component: latestComponent,
      getAllData,
      getData,
    });
    
    // Ensure we return an array
    return Array.isArray(resolved) ? resolved : [];
  }, [dataSource, data, latestComponent, getAllData, getData, formMode, getDataviewData]);
  
  const label = computedLabel || latestComponent.props?.label || 'Data Grid';
  const size = latestComponent.props?.size || 'small';
  const stickyHeader = latestComponent.props?.stickyHeader !== false;

  // Filter columns by visibility and prepare for display
  const visibleColumns = useMemo(() => {
    if (columns.length === 0) {
      // If no columns defined, infer from first row
      if (rows.length > 0) {
        return Object.keys(rows[0]).map((key) => ({ field: key, headerName: key, visible: true }));
      }
      return [];
    }
    
    // Filter columns based on visibility property
    return columns.filter((col: any) => {
      if (typeof col === 'string') {
        return true; // String columns are always visible
      }
      // Object columns: check visible property (default to true if not specified)
      return col.visible !== false;
    });
  }, [columns, rows]);

  // Don't render if conditional rendering says no
  if (!shouldRender) {
    return null;
  }

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
        ...getSxStyles({
          includeMinDimensions: !formMode,
          defaultMinHeight: '200px',
          additionalSx: wrapperResponsiveSx,
        }),
      }}
      className={`${formMode ? '' : 'form-builder-datagrid'} ${className}`.trim()}
      style={htmlAttributes}
    >
      <Paper sx={{ p: 2, minHeight: 200, ...responsiveSx }}>
        {label && (
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {label}
          </Typography>
        )}
        {rows && rows.length > 0 ? (
          <TableContainer>
            <Table size={size as any} stickyHeader={stickyHeader}>
              <TableHead>
                <TableRow>
                  {visibleColumns.map((col: any, index: number) => (
                    <TableCell key={index}>
                      {typeof col === 'string' ? col : col.headerName || col.field}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row: any, rowIndex: number) => (
                  <TableRow key={rowIndex} hover>
                    {visibleColumns.map((col: any, colIndex: number) => {
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
        ) : (
          <Typography variant="body2" color="text.secondary">
            No data available
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default FormDataGrid;
