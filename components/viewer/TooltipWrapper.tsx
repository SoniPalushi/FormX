/**
 * TooltipWrapper
 * Wraps any component with tooltip support
 */

import React from 'react';
import { Tooltip as MuiTooltip } from '@mui/material';

interface TooltipWrapperProps {
  title?: string;
  placement?: string;
  arrow?: boolean;
  children: React.ReactNode;
  formMode?: boolean;
}

const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  title,
  placement = 'top',
  arrow = true,
  children,
  formMode = true,
}) => {
  // Only show tooltip in form mode and if title exists
  if (!formMode || !title) {
    return <>{children}</>;
  }

  return (
    <MuiTooltip title={title} placement={placement as any} arrow={arrow}>
      <span style={{ display: 'inline-block', width: '100%' }}>{children}</span>
    </MuiTooltip>
  );
};

export default TooltipWrapper;

