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
import DraggableComponent from '../builder/DraggableComponent';

interface FormWizardProps {
  component: ComponentDefinition;
}

const FormWizard: React.FC<FormWizardProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const [activeStep, setActiveStep] = useState(0);
  const { setNodeRef, isOver } = useDroppable({
    id: component.id,
    data: {
      accepts: ['component'],
    },
  });

  const steps = component.props?.steps || ['Step 1', 'Step 2', 'Step 3'];
  const label = component.props?.label || 'Wizard';

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
        e.stopPropagation();
        selectComponent(component.id);
      }}
      sx={{
        border: isSelected
          ? '2px solid #1976d2'
          : isOver
          ? '2px dashed #1976d2'
          : '2px solid transparent',
        borderRadius: 1,
        p: 0.5,
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <Paper
        sx={{
          p: 3,
          bgcolor: isOver ? 'action.hover' : 'background.paper',
          minHeight: 300,
        }}
      >
        {label && (
          <Typography variant="h6" sx={{ mb: 3 }}>
            {label}
          </Typography>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step: string, index: number) => (
            <Step key={index}>
              <StepLabel>{step}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 200, mb: 3 }}>
          {component.children && component.children.length > 0 ? (
            component.children
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

