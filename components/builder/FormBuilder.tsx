import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import BuilderHeader from './BuilderHeader';
import BuilderContent from './BuilderContent';
import DependencyEditorModal from './DependencyEditorModal';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import { useHistoryStore } from '../../stores/historyStore';

const FormBuilder: React.FC = () => {
  const { selectedComponentId, deleteComponent, components, setComponents } = useFormBuilderStore();
  const { undo, redo, canUndo, canRedo, addToHistory, present } = useHistoryStore();

  // Sync history store present state with form builder store
  useEffect(() => {
    if (present.length > 0 && JSON.stringify(present) !== JSON.stringify(components)) {
      // Only sync if present is different (to avoid loops)
      // This handles undo/redo state restoration
    }
  }, [present, components]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl+Z or Cmd+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) {
          undo((state) => {
            setComponents(state);
          });
        }
        return;
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl+Y for redo
      if (
        ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        if (canRedo) {
          redo((state) => {
            setComponents(state);
          });
        }
        return;
      }

      // Delete or Backspace to delete selected component
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedComponentId) {
        event.preventDefault();
        if (window.confirm('Are you sure you want to delete this component?')) {
          addToHistory(components);
          deleteComponent(selectedComponentId);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedComponentId, canUndo, canRedo, undo, redo, deleteComponent, components, addToHistory]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <BuilderHeader />
      <BuilderContent />
      <DependencyEditorModal />
    </Box>
  );
};

export default FormBuilder;

