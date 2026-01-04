import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  Button,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import type { ComponentDefinition } from '../../stores/types';
import { useFormBuilderStore } from '../../stores/formBuilderStore';

interface FormCalendarProps {
  component: ComponentDefinition;
}

const FormCalendar: React.FC<FormCalendarProps> = ({ component }) => {
  const { selectComponent, selectedComponentId } = useFormBuilderStore();
  const isSelected = selectedComponentId === component.id;
  const [currentDate, setCurrentDate] = useState(new Date());

  const label = component.props?.label || 'Calendar';
  const view = component.props?.view || 'month';

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const handlePreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

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
      <Paper sx={{ p: 2, minHeight: 300 }}>
        {label && (
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {label}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handlePreviousMonth();
            }}
            size="small"
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Typography>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleNextMonth();
            }}
            size="small"
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        <Grid container spacing={0.5}>
          {dayNames.map((day) => (
            <Grid item xs={12 / 7} key={day}>
              <Box
                sx={{
                  p: 1,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="caption">{day}</Typography>
              </Box>
            </Grid>
          ))}
          {days.map((day, index) => (
            <Grid item xs={12 / 7} key={index}>
              <Button
                fullWidth
                variant={day === new Date().getDate() ? 'contained' : 'outlined'}
                disabled
                sx={{
                  minHeight: 40,
                  p: 0.5,
                  fontSize: '0.875rem',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {day || ''}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default FormCalendar;

