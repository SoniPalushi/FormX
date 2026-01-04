import React from 'react';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import FormBuilder from './components/builder/FormBuilder';
import { theme } from './theme';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <FormBuilder />
      </Box>
    </ThemeProvider>
  );
}

export default App;

