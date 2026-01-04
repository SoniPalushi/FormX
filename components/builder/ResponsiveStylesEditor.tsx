import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Tabs,
  Tab,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import type { ResponsiveCss, ResponsiveStyle } from '../../stores/types/formEngine';

interface ResponsiveStylesEditorProps {
  css?: ResponsiveCss;
  style?: ResponsiveStyle;
  type: 'css' | 'style';
  onChange: (value: ResponsiveCss | ResponsiveStyle) => void;
}

const ResponsiveStylesEditor: React.FC<ResponsiveStylesEditorProps> = ({
  css,
  style,
  type,
  onChange,
}) => {
  const [activeDevice, setActiveDevice] = useState<'any' | 'mobile' | 'tablet' | 'desktop'>('any');
  const isCss = type === 'css';

  const currentValue = isCss ? css : style;
  const deviceValue = currentValue?.[activeDevice] || {};

  const handleDeviceChange = (_: React.SyntheticEvent, newValue: 'any' | 'mobile' | 'tablet' | 'desktop') => {
    setActiveDevice(newValue);
  };

  const handlePropertyAdd = () => {
    const newValue = {
      ...currentValue,
      [activeDevice]: {
        ...deviceValue,
        '': '',
      },
    };
    onChange(newValue as ResponsiveCss | ResponsiveStyle);
  };

  const handlePropertyChange = (key: string, value: string) => {
    const updatedDeviceValue = { ...deviceValue };
    if (value === '') {
      delete updatedDeviceValue[key];
    } else {
      updatedDeviceValue[key] = value;
    }

    const newValue = {
      ...currentValue,
      [activeDevice]: updatedDeviceValue,
    };
    onChange(newValue as ResponsiveCss | ResponsiveStyle);
  };

  const handlePropertyRemove = (key: string) => {
    const updatedDeviceValue = { ...deviceValue };
    delete updatedDeviceValue[key];

    const newValue = {
      ...currentValue,
      [activeDevice]: updatedDeviceValue,
    };
    onChange(newValue as ResponsiveCss | ResponsiveStyle);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontSize: '0.8125rem', fontWeight: 600, mb: 1 }}>
        {isCss ? 'Responsive CSS' : 'Responsive Styles'}
      </Typography>

      <Tabs
        value={activeDevice}
        onChange={handleDeviceChange}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label="Any" value="any" />
        <Tab label="Mobile" value="mobile" />
        <Tab label="Tablet" value="tablet" />
        <Tab label="Desktop" value="desktop" />
      </Tabs>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {Object.entries(deviceValue).map(([key, value]) => (
          <Box key={key} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label="Property"
              value={key}
              onChange={(e) => {
                const oldValue = deviceValue[key];
                handlePropertyRemove(key);
                handlePropertyChange(e.target.value, oldValue);
              }}
              size="small"
              sx={{ flex: 1 }}
              placeholder={isCss ? 'color' : 'margin'}
            />
            <TextField
              label="Value"
              value={value}
              onChange={(e) => handlePropertyChange(key, e.target.value)}
              size="small"
              sx={{ flex: 2 }}
              placeholder={isCss ? '#1976d2' : '10px'}
            />
            <IconButton
              size="small"
              onClick={() => handlePropertyRemove(key)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}

        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handlePropertyAdd}
          variant="outlined"
          sx={{ mt: 1 }}
        >
          Add Property
        </Button>
      </Box>
    </Box>
  );
};

export default ResponsiveStylesEditor;

