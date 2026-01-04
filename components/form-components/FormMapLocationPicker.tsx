import React, { useState } from 'react';
import { Box, TextField, Button, Paper, Typography } from '@mui/material';
import { LocationOn as LocationOnIcon } from '@mui/icons-material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormMapLocationPickerProps {
  component: ComponentDefinition;
}

const FormMapLocationPicker: React.FC<FormMapLocationPickerProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
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
    handleChange,
    handleClick,
    htmlAttributes,
  } = useFormComponent({ component, formMode });
  
  const variant = component.props?.variant || 'outlined';
  const fullWidth = component.props?.fullWidth !== false;
  const disabled = component.props?.disabled || false;
  const size = component.props?.size || 'medium';
  const margin = component.props?.margin;
  const padding = component.props?.padding;
  const width = component.props?.width;
  const classes = component.props?.classes || component.props?.className || [];
  const apiKey = component.props?.apiKey || component.props?.mapApiKey || '';
  
  const calculatedWidth = width || (fullWidth ? '100%' : 'auto');
  const displayValue = formMode ? boundValue : computedValue;
  const displayHelperText = validationError || computedHelperText || '';
  const hasError = !!validationError || !isValid;
  
  const [latitude, setLatitude] = useState(component.props?.latitude || component.props?.lat || '');
  const [longitude, setLongitude] = useState(component.props?.longitude || component.props?.lng || '');

  if (!shouldRender) return null;

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat.toString());
          setLongitude(lng.toString());
          if (formMode) {
            handleChange({ latitude: lat, longitude: lng });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

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
        margin: margin ? `${margin.top || 0}px ${margin.right || 0}px ${margin.bottom || 0}px ${margin.left || 0}px` : undefined,
        padding: padding ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px` : undefined,
        ...wrapperResponsiveSx,
      }}
      className={Array.isArray(classes) ? classes.join(' ') : classes}
      style={wrapperResponsiveCss ? { ...htmlAttributes, style: wrapperResponsiveCss } : htmlAttributes}
    >
      <Paper sx={{ p: 2 }}>
        {computedLabel && (
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {computedLabel}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Latitude"
              value={latitude}
              onChange={(e) => {
                if (formMode) {
                  setLatitude(e.target.value);
                  handleChange({ latitude: parseFloat(e.target.value) || 0, longitude: parseFloat(longitude) || 0 });
                }
              }}
              variant={variant as any}
              fullWidth
              disabled={disabled || !formMode}
              size={size as any}
              type="number"
              sx={responsiveSx}
              style={responsiveCss ? { style: responsiveCss } : undefined}
              {...htmlAttributes}
            />
            <TextField
              label="Longitude"
              value={longitude}
              onChange={(e) => {
                if (formMode) {
                  setLongitude(e.target.value);
                  handleChange({ latitude: parseFloat(latitude) || 0, longitude: parseFloat(e.target.value) || 0 });
                }
              }}
              variant={variant as any}
              fullWidth
              disabled={disabled || !formMode}
              size={size as any}
              type="number"
              sx={responsiveSx}
              style={responsiveCss ? { style: responsiveCss } : undefined}
              {...htmlAttributes}
            />
          </Box>
          
          {formMode && (
            <Button
              variant="outlined"
              startIcon={<LocationOnIcon />}
              onClick={(e) => {
                e.stopPropagation();
                handleGetCurrentLocation();
              }}
              disabled={disabled}
            >
              Get Current Location
            </Button>
          )}
          
          {/* Map placeholder - in a real implementation, you'd integrate Google Maps or similar */}
          <Box
            sx={{
              width: '100%',
              height: 300,
              bgcolor: 'grey.200',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Map View (Integrate Google Maps/Mapbox here)
              {latitude && longitude && ` - ${latitude}, ${longitude}`}
            </Typography>
          </Box>
          
          {displayHelperText && (
            <Typography variant="caption" color={hasError ? 'error.main' : 'text.secondary'}>
              {displayHelperText}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default FormMapLocationPicker;

