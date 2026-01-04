import React from 'react';
import FormCalendar from './FormCalendar';
import type { ComponentDefinition } from '../../stores/types';

interface FormCalendarMonthProps {
  component: ComponentDefinition;
}

const FormCalendarMonth: React.FC<FormCalendarMonthProps> = ({ component }) => {
  // CalendarMonth is essentially the same as Calendar with month view
  const monthComponent = {
    ...component,
    props: {
      ...component.props,
      view: 'month',
    },
  };
  return <FormCalendar component={monthComponent} />;
};

export default FormCalendarMonth;

