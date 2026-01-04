import React from 'react';
import { Link as MuiLink, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormLinkProps {
  component: ComponentDefinition;
}

const FormLink: React.FC<FormLinkProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const text = component.props?.text || component.props?.label || 'Link';
  const href = component.props?.href || '#';
  const target = component.props?.target || '_self';

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
        display: 'inline-block',
      }}
    >
      <MuiLink href={href} target={target} onClick={(e) => e.stopPropagation()}>
        {text}
      </MuiLink>
    </Box>
  );
};

export default FormLink;

