import React from 'react';
import { Box, Paper } from '@mui/material';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import FormCanvas from './FormCanvas';

const WorkArea: React.FC = () => {
  const { components, previewMode } = useFormBuilderStore();

  const getPreviewStyle = () => {
    switch (previewMode) {
      case 'desktop':
        return { maxWidth: '1000px', margin: '0 auto' };
      case 'tablet':
        return { maxWidth: '600px', margin: '0 auto' };
      case 'mobile':
        return { maxWidth: '400px', margin: '0 auto' };
      default:
        return {};
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 1.5,
        bgcolor: 'background.default',
        ...getPreviewStyle(),
      }}
    >
      <Paper
        elevation={0}
        sx={{
          minHeight: '100%',
          p: 2,
          bgcolor: 'background.paper',
          position: 'relative',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <FormCanvas components={components} />
      </Paper>
    </Box>
  );
};

export default WorkArea;
