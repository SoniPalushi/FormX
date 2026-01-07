import React, { useState, useMemo, useCallback } from 'react';
import { Box, Paper, Typography, Button, IconButton, Alert } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useDroppable } from '@dnd-kit/core';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormDataStore } from '../../stores/formDataStore';
import { ActionHandler } from '../../utils/actions/actionSystem';
import { ConditionalRenderer } from '../../utils/rendering/conditionalRendering';
import { resolveArrayDataSourceSync } from '../../utils/data/dataSourceResolver';
import DraggableComponent from '../builder/DraggableComponent';

interface FormRepeaterProps {
  component: ComponentDefinition;
}

const FormRepeater: React.FC<FormRepeaterProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode, updateComponent, findComponent } = useFormBuilderStore();
  const { data, getAllData, getData } = useFormDataStore();
  const isSelected = selectedComponentId === component.id;
  const { setNodeRef, isOver } = useDroppable({
    id: component.id,
    data: {
      accepts: ['component'],
    },
  });

  // Get latest component
  const latestComponent = useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, findComponent]);

  const label = latestComponent.props?.label || 'Repeater';
  const minItems = latestComponent.props?.min || latestComponent.props?.minItems || 0;
  const maxItems = latestComponent.props?.max || latestComponent.props?.maxItems;
  
  // Support multiple data source types: dataProvider, dataSource, data
  const dataSource = latestComponent.props?.dataSource || 
                     latestComponent.props?.dataProvider || 
                     latestComponent.props?.data || 
                     null;
  
  const itemRenderWhen = latestComponent.props?.itemRenderWhen;
  
  // Get data provider items using resolver (supports array, function, computed property, dataKey, JSON string)
  // Note: For async sources like dataview references, use useEffect instead
  const dataProviderItems = useMemo(() => {
    if (!dataSource) return [];
    return resolveArrayDataSourceSync({
      source: dataSource,
      formData: data,
      component: latestComponent,
      getAllData,
      getData,
    });
  }, [dataSource, data, latestComponent, getAllData, getData]);

  // Use data provider items if available, otherwise use component children
  const items = useMemo(() => {
    if (dataProviderItems.length > 0) {
      return dataProviderItems.map((item: any, index: number) => ({
        id: `repeater-item-${index}`,
        data: item,
        index,
      }));
    }
    // In builder mode, use component children
    if (!formMode && latestComponent.children) {
      return latestComponent.children.map((child, index) => ({
        id: child.id,
        component: child,
        index,
      }));
    }
    return [];
  }, [dataProviderItems, latestComponent.children, formMode]);

  const itemCount = items.length;
  const canAdd = maxItems === undefined || itemCount < maxItems;
  const canRemove = itemCount > minItems;

  // Add row handler
  const handleAddRow = useCallback(async () => {
    if (!canAdd) return;
    
    if (formMode) {
      // In form mode, execute addRow action
      const events = latestComponent.props?.events as Record<string, any[]> | undefined;
      const addRowActions = events?.onAddRow || events?.onClick;
      
      if (addRowActions && addRowActions.length > 0) {
        const eventArgs = {
          component: latestComponent as any,
          data,
          event: { type: 'addRow' },
        };
        await ActionHandler.executeActions(addRowActions, eventArgs);
      } else {
        // Default: add empty item to data provider
        if (Array.isArray(dataProvider)) {
          const newItems = [...dataProvider, {}];
          updateComponent(component.id, {
            props: {
              ...latestComponent.props,
              dataProvider: newItems,
            },
          });
        }
      }
    } else {
      // In builder mode, add a new child component
      // This would need to be handled by the builder
    }
  }, [canAdd, formMode, latestComponent, data, dataProvider, component.id, updateComponent]);

  // Remove row handler
  const handleRemoveRow = useCallback(async (index: number) => {
    if (!canRemove) return;
    
    if (formMode) {
      // In form mode, execute removeRow action
      const events = latestComponent.props?.events as Record<string, any[]> | undefined;
      const removeRowActions = events?.onRemoveRow;
      
      if (removeRowActions && removeRowActions.length > 0) {
        const eventArgs = {
          component: latestComponent as any,
          data,
          parentData: items[index]?.data,
          rowIndex: index,
          event: { type: 'removeRow', index },
        };
        await ActionHandler.executeActions(removeRowActions, eventArgs);
      } else {
        // Default: remove item from data provider
        if (Array.isArray(dataProvider)) {
          const newItems = dataProvider.filter((_: any, i: number) => i !== index);
          updateComponent(component.id, {
            props: {
              ...latestComponent.props,
              dataProvider: newItems,
            },
          });
        }
      }
    } else {
      // In builder mode, remove child component
      if (latestComponent.children && latestComponent.children[index]) {
        // This would need to be handled by the builder's deleteComponent
      }
    }
  }, [canRemove, formMode, latestComponent, data, dataProvider, items, component.id, updateComponent]);

  // Check if item should render
  const shouldRenderItem = useCallback((item: any, index: number) => {
    if (!itemRenderWhen) return true;
    
    try {
      return ConditionalRenderer.shouldRender(
        itemRenderWhen as any,
        {
          ...data,
          item: item.data || item,
          index,
          parentData: data,
        }
      );
    } catch (error) {
      console.error('Error evaluating itemRenderWhen:', error);
      return true;
    }
  }, [itemRenderWhen, data]);

  // Validation errors
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (minItems > 0 && itemCount < minItems) {
      errors.push(`Minimum ${minItems} items required`);
    }
    if (maxItems !== undefined && itemCount > maxItems) {
      errors.push(`Maximum ${maxItems} items allowed`);
    }
    return errors;
  }, [itemCount, minItems, maxItems]);

  return (
    <Box
      ref={setNodeRef}
      onClick={(e) => {
        if (!formMode) {
          e.stopPropagation();
          selectComponent(component.id);
        }
      }}
      sx={{
        border: isSelected && !formMode
          ? '2px solid #1976d2'
          : isOver && !formMode
          ? '2px dashed #1976d2'
          : '2px solid transparent',
        borderRadius: 1,
        p: formMode ? 0 : 0.5,
        cursor: formMode ? 'default' : 'pointer',
        position: 'relative',
      }}
    >
      <Paper
        sx={{
          p: 2,
          bgcolor: isOver && !formMode ? 'action.hover' : 'background.paper',
          minHeight: 150,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2">{label}</Typography>
          {formMode && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              variant="outlined"
              disabled={!canAdd}
              onClick={(e) => {
                e.stopPropagation();
                handleAddRow();
              }}
            >
              Add Item
            </Button>
          )}
        </Box>

        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationErrors.join(', ')}
          </Alert>
        )}

        {items.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {items.map((item: any, index: number) => {
              // Check conditional rendering
              if (!shouldRenderItem(item, index)) {
                return null;
              }

              return (
                <Box
                  key={item.id || index}
                  sx={{
                    border: '1px dashed #ccc',
                    borderRadius: 1,
                    p: 2,
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      gap: 0.5,
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Item {index + 1}
                    </Typography>
                    {formMode && (
                      <IconButton
                        size="small"
                        disabled={!canRemove}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRow(index);
                        }}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  
                  {/* Render component or data-based content */}
                  {formMode && item.data ? (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {JSON.stringify(item.data, null, 2)}
                      </Typography>
                    </Box>
                  ) : item.component ? (
                    <DraggableComponent component={item.component} />
                  ) : latestComponent.children?.[index] ? (
                    <DraggableComponent component={latestComponent.children[index]} />
                  ) : null}
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box
            sx={{
              border: '1px dashed #ccc',
              borderRadius: 1,
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {formMode
                ? 'No items. Click "Add Item" to add one.'
                : 'Drop components here to create repeater items'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default FormRepeater;
