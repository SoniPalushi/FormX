import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormDataStore } from '../../stores/formDataStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';
import { ComputedPropertyEvaluator } from '../../utils/properties/computedProperties';
import { useBuilderDataStore } from '../../stores/builderDataStore';
import { getDataviewManager } from '../../utils/dataviews/dataviewManager';

interface FormSelectProps {
  component: ComponentDefinition;
}

const FormSelect: React.FC<FormSelectProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode });
  
  const {
    computedLabel,
    computedValue,
    computedHelperText,
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
  
  // Support multiple data source types for options
  const optionsSource = latestComponent.props?.optionsSource || latestComponent.props?.options;
  // Subscribe to form data for reactive updates
  const formData = useFormDataStore((state) => state.data);
  const { getAllData, getData } = useFormDataStore();
  const { getDataviewData } = useBuilderDataStore();
  
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
  
  const options = React.useMemo(() => {
    if (!optionsSource) return [];
    
    // Në builder mode, nëse optionsSource është dataview reference (string), merr të dhënat nga builder store
    if (!formMode && typeof optionsSource === 'string' && optionsSource) {
      const builderData = getDataviewData(optionsSource);
      if (builderData && Array.isArray(builderData)) {
        // Shfaq të dhënat aktuale për preview në builder
        const valueField = latestComponent.props?.valueField || 'id';
        const labelField = latestComponent.props?.labelField || 'name';
        
        return builderData.map((item: any) => {
          const value = item[valueField] !== undefined ? item[valueField] : item.id;
          const label = item[labelField] !== undefined ? item[labelField] : item.name || value || String(item);
          
          return typeof item === 'string' 
            ? item 
            : { value, label };
        });
      }
    }
    
    // Form mode - use filtered dataview data if available
    if (formMode && typeof optionsSource === 'string') {
      // Check if we have filtered data loaded
      if (filteredDataviewData.length > 0 || isLoadingDataview) {
        const valueField = latestComponent.props?.valueField || 'id';
        const labelField = latestComponent.props?.labelField || 'name';
        
        return filteredDataviewData.map((item: any) => {
          const value = item[valueField] !== undefined ? item[valueField] : item.id;
          const label = item[labelField] !== undefined ? item[labelField] : item.name || value || String(item);
          
          return typeof item === 'string' 
            ? item 
            : { value, label };
        });
      }
      
      // Fallback to builder store data if no filters
      const builderData = getDataviewData(optionsSource);
      if (builderData && Array.isArray(builderData)) {
        const valueField = latestComponent.props?.valueField || 'id';
        const labelField = latestComponent.props?.labelField || 'name';
        
        return builderData.map((item: any) => {
          const value = item[valueField] !== undefined ? item[valueField] : item.id;
          const label = item[labelField] !== undefined ? item[labelField] : item.name || value || String(item);
          
          return typeof item === 'string' 
            ? item 
            : { value, label };
        });
      }
    }
    
    // Static data - logjika ekzistuese
    // If it's already an array, use it directly
    if (Array.isArray(optionsSource)) {
      return optionsSource;
    }
    
    // If it's a computed property (object with computeType)
    if (typeof optionsSource === 'object' && optionsSource !== null && 'computeType' in optionsSource) {
      try {
        const evaluated = ComputedPropertyEvaluator.evaluate(
          optionsSource as any,
          formData
        );
        return Array.isArray(evaluated) ? evaluated : [];
      } catch (error) {
        console.error('Error evaluating computed options:', error);
        return [];
      }
    }
    
    // If it's a function (data provider)
    if (typeof optionsSource === 'function') {
      try {
        const result = optionsSource(formData, latestComponent);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error executing optionsSource function:', error);
        return [];
      }
    }
    
    // If it's a string (could be JSON, dataKey, or dataview reference)
    if (typeof optionsSource === 'string') {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(optionsSource);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // If not JSON, try as dataKey
        const data = getData(optionsSource);
        return Array.isArray(data) ? data : [];
      }
    }
    
    return [];
  }, [optionsSource, latestComponent, formData, getData, formMode, getDataviewData, filteredDataviewData, isLoadingDataview]);
  
  const variant = latestComponent.props?.variant || 'outlined';
  const fullWidth = latestComponent.props?.fullWidth !== false;
  // Use dependency-computed required and disabled, fallback to props
  const required = computedRequired !== undefined ? computedRequired : (latestComponent.props?.required || false);
  const disabled = computedDisabled !== undefined ? computedDisabled : (latestComponent.props?.disabled || false);
  const multiple = latestComponent.props?.multiple || false;
  const size = latestComponent.props?.size || 'medium';
  const width = latestComponent.props?.width;

  // Default to fullWidth if not explicitly set and no width specified
  const calculatedWidth = width || (fullWidth ? '100%' : (formMode ? '100%' : '300px'));
  const displayValue = formMode ? boundValue : computedValue;
  const displayHelperText = validationError || computedHelperText || '';
  const hasError = !!validationError || !isValid;

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
        width: calculatedWidth,
        ...getSxStyles({
          includeMinDimensions: !formMode,
          defaultMinWidth: '300px',
          defaultMinHeight: '56px',
          additionalSx: wrapperResponsiveSx,
        }),
      }}
      className={`${formMode ? '' : 'form-builder-select'} ${className}`.trim()}
      style={htmlAttributes}
    >
      <FormControl 
        variant={variant as any} 
        fullWidth={!width && fullWidth} 
        disabled={disabled}
        required={required}
        error={hasError}
        size={size as any}
        sx={{
          ...(width ? { width } : undefined),
          minWidth: !width && !fullWidth ? '200px' : undefined,
          ...responsiveSx,
        }}
      >
        <InputLabel>{computedLabel}</InputLabel>
        <Select 
          value={displayValue || ''} 
          label={computedLabel}
          multiple={multiple}
          onChange={(e) => {
            if (formMode) {
              handleChange(e.target.value);
            }
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={(e) => {
            if (!formMode) {
              e.stopPropagation();
            }
          }}
          {...htmlAttributes}
        >
          {options.map((option: any, index: number) => (
            <MenuItem key={index} value={typeof option === 'string' ? option : option.value}>
              {typeof option === 'string' ? option : option.label || option.value}
            </MenuItem>
          ))}
        </Select>
        {displayHelperText && (
          <Box component="span" sx={{ fontSize: '0.75rem', mt: 0.5, color: hasError ? 'error.main' : 'text.secondary' }}>
            {displayHelperText}
          </Box>
        )}
      </FormControl>
    </Box>
  );
};

export default FormSelect;

