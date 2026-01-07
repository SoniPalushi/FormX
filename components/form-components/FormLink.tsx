import React from 'react';
import { Link as MuiLink, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';

interface FormLinkProps {
  component: ComponentDefinition;
}

const FormLink: React.FC<FormLinkProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  
  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode });
  
  // Use form component hook for computed properties
  const { computedLabel } = useFormComponent({ component: latestComponent, formMode });
  
  // Get text value - PropertyEditor saves it as 'text', but also check 'label' for compatibility
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
        display: 'inline-flex',
        alignItems: 'center',
        ...getSxStyles({
          includeMinDimensions: !formMode,
          defaultMinWidth: '300px',
          defaultMinHeight: '32px',
        }),
      }}
      className={`${formMode ? '' : 'form-builder-link'} ${className}`.trim()}
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

