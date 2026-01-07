import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

interface SaveFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (metadata: {
    formName: string;
    description?: string;
    author?: string;
  }) => void;
  defaultFormName?: string;
}

const SaveFormDialog: React.FC<SaveFormDialogProps> = ({
  open,
  onClose,
  onSave,
  defaultFormName = 'My Form',
}) => {
  const [formName, setFormName] = useState(defaultFormName);
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');

  const handleSave = () => {
    if (!formName.trim()) {
      alert('Please enter a form name');
      return;
    }

    onSave({
      formName: formName.trim(),
      description: description.trim() || undefined,
      author: author.trim() || undefined,
    });

    // Reset form
    setFormName(defaultFormName);
    setDescription('');
    setAuthor('');
    onClose();
  };

  const handleCancel = () => {
    // Reset form
    setFormName(defaultFormName);
    setDescription('');
    setAuthor('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SaveIcon color="primary" />
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Save Form
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Form Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
            fullWidth
            size="small"
            autoFocus
            helperText="Required: A name to identify this form"
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={3}
            helperText="Optional: Describe what this form is used for"
          />

          <TextField
            label="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            fullWidth
            size="small"
            helperText="Optional: Your name or identifier"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary" startIcon={<SaveIcon />}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveFormDialog;

