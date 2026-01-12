import React, { useMemo } from 'react';
import { Autocomplete, TextField, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormDataStore } from '../../stores/formDataStore';
import { resolveArrayDataSourceSync } from '../../utils/data/dataSourceResolver';
import { useBuilderDataStore } from '../../stores/builderDataStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';
import { getDataviewManager } from '../../utils/dataviews/dataviewManager';

interface FormAutoCompleteProps {
  component: ComponentDefinition;
}

const FormAutoComplete: React.FC<FormAutoCompleteProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const { data, getAllData, getData } = useFormDataStore();
  const { getDataviewData } = useBuilderDataStore();
  const isSelected = selectedComponentId === component.id;

  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode });
  
  // Use the form component hook for all integrations
  const {
    computedLabel,
    computedValue,
    computedHelperText,
    computedPlaceholder,
    validationError,
    isValid,
    boundValue,
    setBoundValue,
    responsiveSx,
    responsiveCss,
    wrapperResponsiveSx,
    wrapperResponsiveCss,
    shouldRender,
    computedDisabled,
    computedRequired,
    filterParams,
    handleChange,
    handleClick,
    handleFocus,
    handleBlur,
    htmlAttributes,
  } = useFormComponent({ component: latestComponent, formMode });
  
  const label = computedLabel || 'AutoComplete';
  const displayValue = formMode ? boundValue : computedValue;
  
  // Support multiple data source types: options, optionsSource, dataSource
  const optionsSource = latestComponent.props?.optionsSource || 
                        latestComponent.props?.dataSource ||
                        latestComponent.props?.options || 
                        [];
  
  // State for loading dataview data with filters
  const [filteredDataviewData, setFilteredDataviewData] = React.useState<any[]>([]);
  const [isLoadingDataview, setIsLoadingDataview] = React.useState(false);
  
  // Load dataview data with filters when filterParams change
  React.useEffect(() => {
    if (!formMode || !optionsSource || typeof optionsSource !== 'string') {
      return;
    }
    
    // Check if it's a dataview reference and we have filter params
    const hasFilters = filterParams && Object.keys(filterParams).length > 0;
    if (!hasFilters) {
      // No filters, use cached data from builder store
      const builderData = getDataviewData(optionsSource);
      if (builderData && Array.isArray(builderData)) {
        setFilteredDataviewData(builderData);
      } else {
        setFilteredDataviewData([]);
      }
      return;
    }
    
    // Load dataview with filters
    const loadFilteredData = async () => {
      setIsLoadingDataview(true);
      try {
        const dataviewManager = getDataviewManager();
        const data = await dataviewManager.loadDataview(optionsSource, filterParams);
        setFilteredDataviewData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading filtered dataview data:', error);
        setFilteredDataviewData([]);
      } finally {
        setIsLoadingDataview(false);
      }
    };
    
    loadFilteredData();
  }, [formMode, optionsSource, filterParams, getDataviewData]);
  
  // Resolve data from various sources (sync version for useMemo)
  // Në builder mode, nëse optionsSource është dataview reference (string), merr të dhënat nga builder store
  const options = useMemo(() => {
    // Në builder mode, kontrollo dataview reference
    if (!formMode && typeof optionsSource === 'string' && optionsSource) {
      const builderData = getDataviewData(optionsSource);
      if (builderData && Array.isArray(builderData)) {
        // Shfaq të dhënat aktuale për preview në builder
        return builderData.map((item: any) => {
          return typeof item === 'string' ? item : item;
        });
      }
    }
    
    // Form mode - use filtered dataview data if available
    if (formMode && typeof optionsSource === 'string') {
      // Check if we have filtered data loaded
      if (filteredDataviewData.length > 0 || isLoadingDataview) {
        return filteredDataviewData;
      }
      
      // Fallback to builder store data if no filters
      const builderData = getDataviewData(optionsSource);
      if (builderData && Array.isArray(builderData)) {
        return builderData;
      }
    }
    
    // Form mode ose static data - logjika ekzistuese
    return resolveArrayDataSourceSync({
      source: optionsSource,
      formData: data,
      component: latestComponent,
      getAllData,
      getData,
    });
  }, [optionsSource, data, latestComponent, getAllData, getData, formMode, getDataviewData, filteredDataviewData, isLoadingDataview]);
  
  const placeholder = computedPlaceholder || 'Type to search...';
  const variant = latestComponent.props?.variant || 'outlined';
  const fullWidth = latestComponent.props?.fullWidth !== false;
  const multiple = latestComponent.props?.multiple || false;
  const freeSolo = latestComponent.props?.freeSolo || false;
  const required = computedRequired !== undefined ? computedRequired : (latestComponent.props?.required || false);
  const disabled = computedDisabled !== undefined ? computedDisabled : (latestComponent.props?.disabled || false);
  const width = latestComponent.props?.width;
  const size = latestComponent.props?.size || 'medium';
  
  // Don't render if conditional rendering says no
  if (!shouldRender) {
    return null;
  }

  // Convert options to proper format if needed
  const formattedOptions = options.map((option: any) => {
    if (typeof option === 'string') {
      return option;
    }
    return option.label || option.value || option;
  });
  
  const displayHelperText = validationError || computedHelperText || '';
  const hasError = !!validationError || !isValid;

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
        width: width || (fullWidth ? '100%' : 'auto'),
        ...getSxStyles({
          includeMinDimensions: !formMode,
          defaultMinWidth: '300px',
          defaultMinHeight: '56px',
          additionalSx: wrapperResponsiveSx,
        }),
      }}
      className={`${formMode ? '' : 'form-builder-autocomplete'} ${className}`.trim()}
      style={htmlAttributes}
    >
      <Autocomplete
        value={displayValue || null}
        options={formattedOptions}
        multiple={multiple}
        freeSolo={freeSolo}
        disabled={disabled}
        fullWidth={fullWidth}
        onChange={(_, newValue) => {
          if (formMode) {
            handleChange(newValue);
          }
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            variant={variant as any}
            required={required}
            error={hasError}
            helperText={displayHelperText}
            size={size as any}
            onClick={(e) => {
              if (!formMode) {
                e.stopPropagation();
              }
            }}
          />
        )}
        sx={{
          ...(width ? { width } : undefined),
          ...responsiveSx,
        }}
      />
    </Box>
  );
};

export default FormAutoComplete;

