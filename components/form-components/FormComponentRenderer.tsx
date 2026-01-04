import React from 'react';
import type { ComponentDefinition } from '../../stores/types';
import { useFormComponent } from '../../hooks/useFormComponent';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import FormLabel from './FormLabel';
import FormHeading from './FormHeading';
import FormLink from './FormLink';
import FormHRule from './FormHRule';
import FormButton from './FormButton';
import FormTextInput from './FormTextInput';
import FormTextArea from './FormTextArea';
import FormSelect from './FormSelect';
import FormCheckbox from './FormCheckbox';
import FormCheckBoxGroup from './FormCheckBoxGroup';
import FormRadioGroup from './FormRadioGroup';
import FormToggle from './FormToggle';
import FormDateTime from './FormDateTime';
import FormImage from './FormImage';
import FormUpload from './FormUpload';
import FormContainer from './FormContainer';
import FormForm from './FormForm';
import FormHeader from './FormHeader';
import FormFooter from './FormFooter';
import FormSideNav from './FormSideNav';
import FormViewStack from './FormViewStack';
import FormAmount from './FormAmount';
import FormAutoComplete from './FormAutoComplete';
import FormAutoBrowse from './FormAutoBrowse';
import FormTree from './FormTree';
import FormList from './FormList';
import FormDataGrid from './FormDataGrid';
import FormDataBrowse from './FormDataBrowse';
import FormCurrencyExRate from './FormCurrencyExRate';
import FormCreditCard from './FormCreditCard';
import FormMapLocationPicker from './FormMapLocationPicker';
import FormRequiredFieldValidator from './FormRequiredFieldValidator';
import FormRangeValidator from './FormRangeValidator';
import FormRegExValidator from './FormRegExValidator';
import FormRepeater from './FormRepeater';
import FormWizard from './FormWizard';
import FormCalendar from './FormCalendar';
import FormCalendarDay from './FormCalendarDay';
import FormCalendarWeek from './FormCalendarWeek';
import FormCalendarMonth from './FormCalendarMonth';

interface FormComponentRendererProps {
  component: ComponentDefinition;
}

const FormComponentRenderer: React.FC<FormComponentRendererProps> = ({ component }) => {
  const { formMode } = useFormBuilderStore();
  
  // Check conditional rendering in form mode (always call hook, but only use in form mode)
  const { shouldRender } = useFormComponent({ component, formMode });
  
  // Don't render if conditional rendering says no (only in form mode)
  if (formMode && !shouldRender) {
    return null;
  }
  
  switch (component.type) {
    case 'Label':
      return <FormLabel component={component} />;
    case 'Heading':
      return <FormHeading component={component} />;
    case 'Link':
      return <FormLink component={component} />;
    case 'HRule':
      return <FormHRule component={component} />;
    case 'Button':
      return <FormButton component={component} />;
    case 'TextInput':
      return <FormTextInput component={component} />;
    case 'TextArea':
      return <FormTextArea component={component} />;
    case 'Select':
    case 'DropDown':
      return <FormSelect component={component} />;
    case 'CheckBox':
      return <FormCheckbox component={component} />;
    case 'CheckBoxGroup':
      return <FormCheckBoxGroup component={component} />;
    case 'RadioGroup':
      return <FormRadioGroup component={component} />;
    case 'Toggle':
      return <FormToggle component={component} />;
    case 'DateTime':
    case 'DateTimeCb':
      return <FormDateTime component={component} />;
    case 'Image':
      return <FormImage component={component} />;
    case 'Upload':
    case 'MultiUpload':
      return <FormUpload component={component} />;
    case 'Container':
      return <FormContainer component={component} />;
    case 'Form':
      return <FormForm component={component} />;
    case 'Header':
      return <FormHeader component={component} />;
    case 'Footer':
      return <FormFooter component={component} />;
    case 'SideNav':
      return <FormSideNav component={component} />;
    case 'ViewStack':
      return <FormViewStack component={component} />;
    case 'Amount':
      return <FormAmount component={component} />;
    case 'AutoComplete':
      return <FormAutoComplete component={component} />;
    case 'AutoBrowse':
      return <FormAutoBrowse component={component} />;
    case 'CurrencyExRate':
      return <FormCurrencyExRate component={component} />;
    case 'CreditCard':
      return <FormCreditCard component={component} />;
    case 'DataBrowse':
      return <FormDataBrowse component={component} />;
    case 'MapLocationPicker':
      return <FormMapLocationPicker component={component} />;
    case 'Tree':
      return <FormTree component={component} />;
    case 'List':
      return <FormList component={component} />;
    case 'DataGrid':
      return <FormDataGrid component={component} />;
    case 'Repeater':
    case 'RepeaterEx':
      return <FormRepeater component={component} />;
    case 'Wizard':
      return <FormWizard component={component} />;
    case 'Calendar':
      return <FormCalendar component={component} />;
    case 'CalendarDay':
      return <FormCalendarDay component={component} />;
    case 'CalendarWeek':
      return <FormCalendarWeek component={component} />;
    case 'CalendarMonth':
      return <FormCalendarMonth component={component} />;
    case 'RequiredFieldValidator':
      return <FormRequiredFieldValidator component={component} />;
    case 'RangeValidator':
      return <FormRangeValidator component={component} />;
    case 'RegExValidator':
      return <FormRegExValidator component={component} />;
    case 'Modal':
      // Modal is rendered separately, but we can add it here if needed
      return null;
    default:
      return (
        <div style={{ padding: '8px', border: '1px dashed #ccc', color: '#999' }}>
          Component type "{component.type}" not yet implemented
        </div>
      );
  }
};

export default FormComponentRenderer;

