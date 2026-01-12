/**
 * FormTooltip Component
 * Wrapper component that adds tooltip to any child component
 */

import React from 'react';
import { Tooltip as MuiTooltip, Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormDataStore } from '../../stores/formDataStore';
import FormComponentRenderer from './FormComponentRenderer';

interface FormTooltipProps {
  component: ComponentDefinition;
  children?: React.ReactNode;
}

const FormTooltip: React.FC<FormTooltipProps> = ({ component, children }) => {
  const { formMode, findComponent, components } = useFormBuilderStore();
  const { evaluateProperty } = useFormDataStore();
  
  // Get latest component - subscribe to components array for real-time updates
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, components, findComponent]);

  const tooltipProps = latestComponent.props?.tooltipProps;
  const tooltipType = latestComponent.props?.tooltipType || 'default';

  // Evaluate tooltip properties
  const title = tooltipProps?.title 
    ? (typeof tooltipProps.title === 'object' 
        ? evaluateProperty(tooltipProps.title as any)
        : tooltipProps.title)
    : latestComponent.props?.label || '';

  const placement = tooltipProps?.placement || 'top';
  const arrow = tooltipProps?.arrow !== false;

  // In builder mode, show without tooltip
  if (!formMode) {
    return (
      <Box>
        {children || (latestComponent.children && latestComponent.children.length > 0 ? (
          latestComponent.children.map((child) => (
            <FormComponentRenderer key={child.id} component={child} />
          ))
        ) : (
          <FormComponentRenderer component={latestComponent} />
        ))}
      </Box>
    );
  }

  // In form mode, wrap with tooltip
  if (!title) {
    // No tooltip, just render children
    return (
      <>
        {children || (latestComponent.children && latestComponent.children.length > 0 ? (
          latestComponent.children.map((child) => (
            <FormComponentRenderer key={child.id} component={child} />
          ))
        ) : (
          <FormComponentRenderer component={latestComponent} />
        ))}
      </>
    );
  }

  return (
    <MuiTooltip
      title={title}
      placement={placement as any}
      arrow={arrow}
    >
      <Box component="span" sx={{ display: 'inline-block' }}>
        {children || (latestComponent.children && latestComponent.children.length > 0 ? (
          latestComponent.children.map((child) => (
            <FormComponentRenderer key={child.id} component={child} />
          ))
        ) : (
          <FormComponentRenderer component={latestComponent} />
        ))}
      </Box>
    </MuiTooltip>
  );
};

export default FormTooltip;

