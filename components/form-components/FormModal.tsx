/**
 * FormModal Component
 * Runtime implementation for modal dialogs
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useFormDataStore } from '../../stores/formDataStore';
import { ActionHandler } from '../../utils/actions/actionSystem';
import FormComponentRenderer from './FormComponentRenderer';

interface FormModalProps {
  component: ComponentDefinition;
}

const FormModal: React.FC<FormModalProps> = ({ component }) => {
  const { formMode, findComponent } = useFormBuilderStore();
  const { data } = useFormDataStore();
  
  const latestComponent = React.useMemo(() => {
    return findComponent(component.id) || component;
  }, [component.id, findComponent]);

  const modalConfig = latestComponent.props?.modal;
  const [open, setOpen] = useState(false);

  // Listen for openModal actions
  useEffect(() => {
    if (!formMode) return;

    const handleOpenModal = async (event: CustomEvent) => {
      const modalId = event.detail?.modalId || event.detail?.componentId;
      if (modalId === component.id || modalConfig?.type === event.detail?.modalType) {
        setOpen(true);
      }
    };

    const handleCloseModal = async (event: CustomEvent) => {
      const modalId = event.detail?.modalId || event.detail?.componentId;
      if (modalId === component.id || modalConfig?.type === event.detail?.modalType) {
        setOpen(false);
      }
    };

    window.addEventListener('formx:openModal' as any, handleOpenModal);
    window.addEventListener('formx:closeModal' as any, handleCloseModal);

    return () => {
      window.removeEventListener('formx:openModal' as any, handleOpenModal);
      window.removeEventListener('formx:closeModal' as any, handleCloseModal);
    };
  }, [formMode, component.id, modalConfig]);

  const handleClose = async () => {
    setOpen(false);
    
    // Execute onClose actions if any
    const events = latestComponent.props?.events as Record<string, any[]> | undefined;
    const onCloseActions = events?.onClose;
    if (onCloseActions && onCloseActions.length > 0) {
      const eventArgs = {
        component: latestComponent as any,
        data,
        event: { type: 'close' },
      };
      await ActionHandler.executeActions(onCloseActions, eventArgs);
    }
  };

  if (!formMode) {
    // In builder mode, show placeholder
    return (
      <Box
        sx={{
          p: 2,
          border: '2px dashed',
          borderColor: 'divider',
          borderRadius: 1,
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        Modal: {latestComponent.props?.label || component.id}
      </Box>
    );
  }

  if (!open) {
    return null; // Don't render modal when closed
  }

  const title = modalConfig?.props?.title || latestComponent.props?.label || 'Modal';
  const fullWidth = modalConfig?.props?.fullWidth !== false;
  const maxWidth = modalConfig?.props?.maxWidth || 'sm';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth as any}
    >
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent>
        {modalConfig?.children && modalConfig.children.length > 0 ? (
          modalConfig.children.map((child: any) => (
            <FormComponentRenderer key={child.id} component={child} />
          ))
        ) : latestComponent.children && latestComponent.children.length > 0 ? (
          latestComponent.children.map((child) => (
            <FormComponentRenderer key={child.id} component={child} />
          ))
        ) : (
          <Box sx={{ p: 2 }}>Modal Content</Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormModal;

