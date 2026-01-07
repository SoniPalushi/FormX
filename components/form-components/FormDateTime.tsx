import React from 'react';
import { TextField, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormDateTimeProps {
  component: ComponentDefinition;
}

const FormDateTime: React.FC<FormDateTimeProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, components, findComponent } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get latest component from store to ensure real-time updates
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  const label = latestComponent.props?.label || '';
  const value = latestComponent.props?.value || '';
  const variant = latestComponent.props?.variant || 'outlined';
  const fullWidth = latestComponent.props?.fullWidth !== false;
  const type = latestComponent.props?.type || 'datetime-local'; // datetime-local, date, time
  
  // Get dynamic properties
  const margin = latestComponent.props?.margin;
  const padding = latestComponent.props?.padding;
  const width = latestComponent.props?.width;
  const height = latestComponent.props?.height;
  const classes = latestComponent.props?.classes || latestComponent.props?.className || [];

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
      className={`form-builder-datetime ${Array.isArray(classes) ? classes.join(' ') : classes || ''}`.trim()}
    >
      <TextField
        label={label}
        type={type}
        value={value}
        variant={variant as any}
        fullWidth={fullWidth}
        disabled
        InputLabelProps={{ shrink: true }}
        onClick={(e) => e.stopPropagation()}
      />
    </Box>
  );
};

export default FormDateTime;

