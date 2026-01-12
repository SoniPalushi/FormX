import React, { useState } from 'react';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
} from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useComponentProperties } from '../../hooks/useComponentProperties';
import DraggableComponent from '../builder/DraggableComponent';

interface FormWizardProps {
  component: ComponentDefinition;
}

const FormWizard: React.FC<FormWizardProps> = ({ component }) => {
  const { selectComponent, selectedComponentId, formMode } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const [activeStep, setActiveStep] = useState(0);
  
  // Get dynamic properties using reusable hook
  const { latestComponent, className, getSxStyles } = useComponentProperties({ component, formMode });
  
  // Use the form component hook for conditional rendering and computed properties
  const {
    computedLabel,
    responsiveSx,
    wrapperResponsiveSx,
    shouldRender,
    handleClick,
    htmlAttributes,
  } = useFormComponent({ component: latestComponent, formMode });
  
  const { setNodeRef, isOver } = useDroppable({
    id: latestComponent.id,
    data: {
      accepts: ['component'],
    },
    disabled: formMode, // Disable droppable in form mode
  });

  const steps = latestComponent.props?.steps || ['Step 1', 'Step 2', 'Step 3'];
  const label = computedLabel || latestComponent.props?.label || 'Wizard';
  const orientation = latestComponent.props?.orientation || 'horizontal';
  const alternativeLabel = latestComponent.props?.alternativeLabel || false;

  // Don't render if conditional rendering says no
  if (!shouldRender) {
    return null;
  }

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <Box
      ref={setNodeRef}
      onClick={(e) => {
        if (!formMode) {
          e.stopPropagation();
          selectComponent(component.id);
        } else {
          handleClick(e);
        }
      }}
      sx={{
        border: isSelected && !formMode
          ? '2px solid #1976d2'
          : isOver && !formMode
          ? '2px dashed #1976d2'
          : '2px solid transparent',
        borderRadius: 1,
        p: formMode ? 0 : 0.5,
        cursor: formMode ? 'default' : 'pointer',
        position: 'relative',
        ...getSxStyles({
          includeMinDimensions: !formMode,
          additionalSx: wrapperResponsiveSx,
        }),
      }}
      className={`${formMode ? '' : 'form-builder-wizard'} ${className}`.trim()}
      style={htmlAttributes}
    >
      <Paper
        sx={{
          p: 3,
          bgcolor: isOver && !formMode ? 'action.hover' : 'background.paper',
          minHeight: 300,
          ...responsiveSx,
        }}
      >
        {label && (
          <Typography variant="h6" sx={{ mb: 3 }}>
            {label}
          </Typography>
        )}

        <Stepper 
          activeStep={activeStep} 
          orientation={orientation as any}
          alternativeLabel={alternativeLabel}
          sx={{ mb: 4 }}
        >
          {steps.map((step: string, index: number) => (
            <Step key={index}>
              <StepLabel>{step}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 200, mb: 3 }}>
          {latestComponent.children && latestComponent.children.length > 0 ? (
            latestComponent.children
              .filter((_, index) => index === activeStep)
              .map((child) => (
                <DraggableComponent key={child.id} component={child} />
              ))
          ) : (
            <Typography variant="body2" color="text.secondary" align="center">
              Drop components here for step {activeStep + 1}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={(e) => {
              e.stopPropagation();
              handleBack();
            }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            disabled={activeStep === steps.length - 1}
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          >
            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default FormWizard;
