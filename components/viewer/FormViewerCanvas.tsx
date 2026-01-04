/**
 * FormViewerCanvas
 * Simple canvas for FormViewer (no drag/drop, just rendering)
 */

import React from 'react';
import { Box } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import FormComponentRenderer from '../form-components/FormComponentRenderer';
import TooltipWrapper from './TooltipWrapper';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';

interface FormViewerCanvasProps {
  components: ComponentDefinition[];
}

// Component wrapper that adds tooltip support
const ComponentWithTooltip: React.FC<{ component: ComponentDefinition }> = ({ component }) => {
  const { formMode } = useFormBuilderStore();
  const { tooltipTitle, tooltipPlacement, tooltipArrow } = useFormComponent({
    component,
    formMode: true,
  });

  const rendered = <FormComponentRenderer component={component} />;

  if (tooltipTitle && formMode) {
    return (
      <TooltipWrapper
        title={tooltipTitle}
        placement={tooltipPlacement}
        arrow={tooltipArrow}
        formMode={formMode}
      >
        {rendered}
      </TooltipWrapper>
    );
  }

  return <>{rendered}</>;
};

const FormViewerCanvas: React.FC<FormViewerCanvasProps> = ({ components }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        flexWrap: 'wrap',
        alignItems: 'flex-start',
      }}
    >
      {components.map((component) => (
        <ComponentWithTooltip key={component.id} component={component} />
      ))}
    </Box>
  );
};

export default FormViewerCanvas;

