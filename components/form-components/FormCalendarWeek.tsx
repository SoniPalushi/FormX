import React from 'react';
import { Box, Paper, Typography, Grid, Button } from '@mui/material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormCalendarWeekProps {
  component: ComponentDefinition;
}

const FormCalendarWeek: React.FC<FormCalendarWeekProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;

  const label = component.props?.label || 'Week View';
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
      <Paper sx={{ p: 2, minHeight: 500 }}>
        {label && (
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {label}
          </Typography>
        )}
        <Grid container spacing={0.5}>
          <Grid item xs={1}>
            <Box sx={{ p: 1 }} />
          </Grid>
          {days.map((day) => (
            <Grid item xs={11 / 7} key={day}>
              <Box
                sx={{
                  p: 1,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  bgcolor: 'action.hover',
                  mb: 0.5,
                }}
              >
                <Typography variant="caption">{day}</Typography>
              </Box>
            </Grid>
          ))}
          {hours.map((hour) => (
            <React.Fragment key={hour}>
              <Grid item xs={1}>
                <Typography variant="caption" sx={{ p: 1 }}>
                  {hour}:00
                </Typography>
              </Grid>
              {days.map((day) => (
                <Grid item xs={11 / 7} key={`${day}-${hour}`}>
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled
                    sx={{
                      minHeight: 30,
                      p: 0.5,
                      fontSize: '0.75rem',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Grid>
              ))}
            </React.Fragment>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default FormCalendarWeek;

