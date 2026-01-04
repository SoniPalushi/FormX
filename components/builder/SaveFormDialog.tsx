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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Save as SaveIcon, Code as CodeIcon, Storage as StorageIcon } from '@mui/icons-material';

interface SaveFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (metadata: {
    formName: string;
    description?: string;
    author?: string;
    format: 'persisted' | 'react';
    reactFormat?: 'tsx' | 'jsx';
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
  const [format, setFormat] = useState<'persisted' | 'react'>('persisted');
  const [reactFormat, setReactFormat] = useState<'tsx' | 'jsx'>('tsx');

  const handleSave = () => {
    if (!formName.trim()) {
      alert('Please enter a form name');
      return;
    }

    onSave({
      formName: formName.trim(),
      description: description.trim() || undefined,
      author: author.trim() || undefined,
      format,
      reactFormat: format === 'react' ? reactFormat : undefined,
    });

    // Reset form
    setFormName(defaultFormName);
    setDescription('');
    setAuthor('');
    setFormat('persisted');
    setReactFormat('tsx');
    onClose();
  };

  const handleCancel = () => {
    // Reset form
    setFormName(defaultFormName);
    setDescription('');
    setAuthor('');
    setFormat('persisted');
    setReactFormat('tsx');
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

          <FormControl fullWidth size="small">
            <InputLabel>Save Format</InputLabel>
            <Select
              value={format}
              label="Save Format"
              onChange={(e) => setFormat(e.target.value as 'persisted' | 'react')}
            >
              <MenuItem value="persisted">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      JSON (Database Storage)
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      PersistedForm format - Save to database
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
              <MenuItem value="react">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CodeIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      React Component (TSX/JSX)
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Export as React component for use in other projects
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {format === 'react' && (
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
                React Format
              </Typography>
              <ToggleButtonGroup
                value={reactFormat}
                exclusive
                onChange={(_, value) => value && setReactFormat(value)}
                size="small"
                fullWidth
              >
                <ToggleButton value="tsx">TypeScript (TSX)</ToggleButton>
                <ToggleButton value="jsx">JavaScript (JSX)</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}
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

