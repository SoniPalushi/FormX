/**
 * FormViewerWithTooltip
 * Wraps FormViewer to add tooltip support to components
 */

import React from 'react';
import { Tooltip as MuiTooltip } from '@mui/material';
import FormViewerCanvas from './FormViewerCanvas';
import type { ComponentDefinition } from '../../stores/types';
import { useFormDataStore } from '../../stores/formDataStore';

interface FormViewerWithTooltipProps {
  components: ComponentDefinition[];
}

const FormViewerWithTooltip: React.FC<FormViewerWithTooltipProps> = ({ components }) => {
  const { evaluateProperty } = useFormDataStore();

  // Wrap components with tooltips if needed
  const wrapWithTooltip = (component: ComponentDefinition, children: React.ReactNode): React.ReactNode => {
    const tooltipProps = component.props?.tooltipProps;
    if (!tooltipProps || !formMode) {
      return children;
    }

    const title = tooltipProps.title
      ? (typeof tooltipProps.title === 'object'
          ? evaluateProperty(tooltipProps.title as any)
          : tooltipProps.title)
      : '';

    if (!title) {
      return children;
    }

    const placement = tooltipProps.placement || 'top';
    const arrow = tooltipProps.arrow !== false;

    return (
      <MuiTooltip title={title} placement={placement as any} arrow={arrow}>
        <span>{children}</span>
      </MuiTooltip>
    );
  };

  return <FormViewerCanvas components={components} />;
};

export default FormViewerWithTooltip;

