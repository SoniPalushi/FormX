import React from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormCalendarDayProps {
  component: ComponentDefinition;
}

const FormCalendarDay: React.FC<FormCalendarDayProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;

  const label = component.props?.label || 'Day View';
  const events = component.props?.events || [];

  return (
    <Box
      onClick={(e) => {
        e.stopPropagation();
        selectComponent(component.id);
      }}
      sx={{
        border: isSelected ? '2px solid #1976d2' : '2px solid transparent',
        borderRadius: 1,
        p: 0.5,
        cursor: 'pointer',
      }}
    >
      <Paper sx={{ p: 2, minHeight: 400 }}>
        {label && (
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {label}
          </Typography>
        )}
        {events && events.length > 0 ? (
          <List>
            {events.map((event: any, index: number) => (
              <ListItem key={index} disabled>
                <ListItemText
                  primary={event.title || event.label || `Event ${index + 1}`}
                  secondary={event.time || event.description}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center">
            No events scheduled
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default FormCalendarDay;

