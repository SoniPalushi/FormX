import React, { useMemo } from 'react';
import { Autocomplete, TextField, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormDataStore } from '../../stores/formDataStore';
import { resolveArrayDataSourceSync } from '../../utils/data/dataSourceResolver';

interface FormAutoCompleteProps {
  component: ComponentDefinition;
}

const FormAutoComplete: React.FC<FormAutoCompleteProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, findComponent } = useFormBuilderStore();
  const { data, getAllData, getData } = useFormDataStore();
  const isSelected = selectedComponentId === component.id;

  // Get latest component
  const latestComponent = useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, findComponent]);

  const label = latestComponent.props?.label || 'AutoComplete';
  const value = latestComponent.props?.value || null;
  
  // Support multiple data source types: options, optionsSource, dataSource
  const optionsSource = latestComponent.props?.optionsSource || 
                        latestComponent.props?.dataSource ||
                        latestComponent.props?.options || 
                        [];
  
  // Resolve data from various sources (sync version for useMemo)
  // Note: For async sources like dataview references, use useEffect instead
  const options = useMemo(() => {
    return resolveArrayDataSourceSync({
      source: optionsSource,
      formData: data,
      component: latestComponent,
      getAllData,
      getData,
    });
  }, [optionsSource, data, latestComponent, getAllData, getData]);
  
  const placeholder = latestComponent.props?.placeholder || 'Type to search...';
  const variant = latestComponent.props?.variant || 'outlined';
  const fullWidth = latestComponent.props?.fullWidth !== false;
  const multiple = latestComponent.props?.multiple || false;
  const freeSolo = latestComponent.props?.freeSolo || false;
  
  // Get dynamic properties
  const margin = latestComponent.props?.margin;
  const padding = latestComponent.props?.padding;
  const width = latestComponent.props?.width;
  const height = latestComponent.props?.height;
  const classes = latestComponent.props?.classes || latestComponent.props?.className || [];

  // Convert options to proper format if needed
  const formattedOptions = options.map((option: any) => {
    if (typeof option === 'string') {
      return option;
    }
    return option.label || option.value || option;
  });

  return (
    <Box
      onClick={(e) => {
        e.stopPropagation();
        selectComponent(component.id);
      }}
      sx={{
        border: isSelected ? '2px solid #1976d2' : '2px solid transparent',
        borderRadius: 1,
        p: 0.5,
        cursor: 'pointer',
        width: width || (fullWidth ? '100%' : 'auto'),
        height: height || 'auto',
        margin: margin ? `${margin.top || 0}px ${margin.right || 0}px ${margin.bottom || 0}px ${margin.left || 0}px` : undefined,
        padding: padding ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px` : undefined,
        minWidth: width || '300px',
        minHeight: height || '56px',
      }}
      className={`form-builder-autocomplete ${Array.isArray(classes) ? classes.join(' ') : classes || ''}`.trim()}
    >
      <Autocomplete
        value={value}
        options={formattedOptions}
        multiple={multiple}
        freeSolo={freeSolo}
        disabled
        fullWidth={fullWidth}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            variant={variant as any}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        sx={{ pointerEvents: 'none' }}
      />
    </Box>
  );
};

export default FormAutoComplete;

