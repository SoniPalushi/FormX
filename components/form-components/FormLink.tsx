import React from 'react';
import { Link as MuiLink, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormLinkProps {
  component: ComponentDefinition;
}

const FormLink: React.FC<FormLinkProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode, components, findComponent } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get latest component from store to ensure real-time updates
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);
  
  // Use form component hook for computed properties
  const { computedLabel } = useFormComponent({ component: latestComponent, formMode });
  
  const text = computedLabel || latestComponent.props?.text || latestComponent.props?.label || 'Link';
  const href = latestComponent.props?.href || '#';
  const target = latestComponent.props?.target || '_self';

  return (
    <Box
      onClick={(e) => {
        if (!formMode) {
          e.stopPropagation();
          selectComponent(component.id);
        }
      }}
      sx={{
        border: isSelected && !formMode ? '2px solid #1976d2' : '2px solid transparent',
        borderRadius: 1,
        p: formMode ? 0 : 0.5,
        cursor: formMode ? 'default' : 'pointer',
        display: 'inline-block',
      }}
    >
      <MuiLink href={href} target={target} onClick={(e) => {
        if (!formMode) {
          e.stopPropagation();
        }
      }}>
        {text}
      </MuiLink>
    </Box>
  );
};

export default FormLink;

