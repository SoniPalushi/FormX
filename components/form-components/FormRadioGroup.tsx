import React from 'react';
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
} from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormRadioGroupProps {
  component: ComponentDefinition;
}

const FormRadioGroup: React.FC<FormRadioGroupProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, components, findComponent } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get latest component from store to ensure real-time updates
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  const label = latestComponent.props?.label || '';
  const value = latestComponent.props?.value || '';
  const options = latestComponent.props?.options || [];
  const row = latestComponent.props?.row || false;
  
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
        display: 'block',
        width: width || 'auto',
        height: height || 'auto',
        margin: margin ? `${margin.top || 0}px ${margin.right || 0}px ${margin.bottom || 0}px ${margin.left || 0}px` : undefined,
        padding: padding ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px` : undefined,
        minWidth: width || '300px',
        minHeight: height || '60px',
      }}
      className={`form-builder-radio-group ${Array.isArray(classes) ? classes.join(' ') : classes || ''}`.trim()}
    >
      <FormControl disabled>
        {label && <FormLabel>{label}</FormLabel>}
        <RadioGroup value={value} row={row} onClick={(e) => e.stopPropagation()}>
          {options.map((option: any, index: number) => {
            const optionValue = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label || option.value;
            return (
              <FormControlLabel
                key={index}
                value={optionValue}
                control={<Radio />}
                label={optionLabel}
              />
            );
          })}
        </RadioGroup>
      </FormControl>
    </Box>
  );
};

export default FormRadioGroup;

