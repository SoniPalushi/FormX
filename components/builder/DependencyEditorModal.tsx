import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import DependencyEditor from './DependencyEditor';
import { useDependencyEditorStore } from '../../stores/dependencyEditorStore';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useHistoryStore } from '../../stores/historyStore';

const DependencyEditorModal: React.FC = () => {
  const { isOpen, componentId, currentDependencies, closeModal, setCurrentDependencies } = useDependencyEditorStore();
  const { findComponent, updateComponent } = useFormBuilderStore();
  const { addToHistory } = useHistoryStore();

  // Get component from store - subscribe to changes
  const { components } = useFormBuilderStore();
  const component = componentId ? findComponent(componentId) : null;

  // Initialize currentDependencies from component props when modal opens or component changes
  useEffect(() => {
    if (isOpen && component) {
      // Always sync with component props when modal opens or component changes
      setCurrentDependencies(component.props?.dependencies);
    }
  }, [isOpen, component?.id, component?.props?.dependencies, components, setCurrentDependencies]);

  const handleSave = () => {
    if (!componentId || !component) return;

    // Save dependencies to component
    const newProps = {
      ...(component.props || {}),
      dependencies: currentDependencies,
    };

    // Add to history before updating
    addToHistory({
      type: 'update',
      componentId,
      oldValue: component,
      newValue: { ...component, props: newProps },
    });

    // Update component
    updateComponent(componentId, {
      props: newProps,
    });

    // Close modal
    closeModal();
  };

  const handleCancel = () => {
    // Reset to original dependencies
    if (component) {
      setCurrentDependencies(component.props?.dependencies);
    }
    closeModal();
  };

  const handleDependenciesChange = (dependencies: any) => {
    setCurrentDependencies(dependencies);
  };

  if (!component) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Field Dependencies - {component.props?.dataKey || component.name || component.id}</span>
          <IconButton
            size="small"
            onClick={handleCancel}
            sx={{ ml: 2 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ pt: 2 }}>
          <DependencyEditor
            dependencies={currentDependencies}
            componentId={componentId || ''}
            onChange={handleDependenciesChange}
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleCancel} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Dependencies
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DependencyEditorModal;

