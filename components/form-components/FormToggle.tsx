import React from 'react';
import { FormControlLabel, Switch, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormToggleProps {
  component: ComponentDefinition;
}

const FormToggle: React.FC<FormToggleProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, components, findComponent } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get latest component from store to ensure real-time updates
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  const label = latestComponent.props?.label || '';
  const checked = latestComponent.props?.checked || false;
  const color = latestComponent.props?.color || 'primary';
  
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
        display: 'inline-flex',
        alignItems: 'center',
        width: width || 'auto',
        height: height || 'auto',
        margin: margin ? `${margin.top || 0}px ${margin.right || 0}px ${margin.bottom || 0}px ${margin.left || 0}px` : undefined,
        padding: padding ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px` : undefined,
        minWidth: width || '200px',
        minHeight: height || '42px',
      }}
      className={`form-builder-toggle ${Array.isArray(classes) ? classes.join(' ') : classes || ''}`.trim()}
    >
      <FormControlLabel
        control={<Switch checked={checked} disabled color={color as any} />}
        label={label}
        onClick={(e) => e.stopPropagation()}
      />
    </Box>
  );
};

export default FormToggle;

