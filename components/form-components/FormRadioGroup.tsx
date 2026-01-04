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
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const label = component.props?.label || '';
  const value = component.props?.value || '';
  const options = component.props?.options || [];
  const row = component.props?.row || false;

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
      }}
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

