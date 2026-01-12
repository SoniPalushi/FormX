import type { ComponentLibraryItem, ComponentType } from '../stores/types';

// Component library definitions - mapping from Obvia to MUI equivalents
export const componentLibrary: ComponentLibraryItem[] = [
  // Basic Components
  { componentNameLabel: 'Label', type: 'Label', category: 'Basic' },
  { componentNameLabel: 'Heading', type: 'Heading', category: 'Basic' },
  { componentNameLabel: 'Link', type: 'Link', category: 'Basic' },
  { componentNameLabel: 'HRule', type: 'HRule', category: 'Basic' },
  
  // Input Components
  { componentNameLabel: 'Button', type: 'Button', category: 'Inputs' },
  { componentNameLabel: 'Text Input', type: 'TextInput', category: 'Inputs' },
  { componentNameLabel: 'Text Area', type: 'TextArea', category: 'Inputs' },
  { componentNameLabel: 'Select', type: 'Select', category: 'Inputs' },
  { componentNameLabel: 'DropDown', type: 'DropDown', category: 'Inputs' },
  { componentNameLabel: 'Checkbox', type: 'CheckBox', category: 'Inputs' },
  { componentNameLabel: 'CheckBox Group', type: 'CheckBoxGroup', category: 'Inputs' },
  { componentNameLabel: 'Radio Group', type: 'RadioGroup', category: 'Inputs' },
  { componentNameLabel: 'Toggle', type: 'Toggle', category: 'Inputs' },
  { componentNameLabel: 'DateTime', type: 'DateTime', category: 'Inputs' },
  { componentNameLabel: 'DateTimeCb', type: 'DateTimeCb', category: 'Inputs' },
  { componentNameLabel: 'Amount', type: 'Amount', category: 'Inputs' },
  { componentNameLabel: 'AutoComplete', type: 'AutoComplete', category: 'Inputs' },
  { componentNameLabel: 'CreditCard', type: 'CreditCard', category: 'Inputs' },
  
  // Layout Components
  { componentNameLabel: 'Container', type: 'Container', category: 'Layout' },
  { componentNameLabel: 'Grid', type: 'Grid', category: 'Layout' },
  { componentNameLabel: 'Form', type: 'Form', category: 'Layout' },
  { componentNameLabel: 'Header', type: 'Header', category: 'Layout' },
  { componentNameLabel: 'Footer', type: 'Footer', category: 'Layout' },
  { componentNameLabel: 'SideNav', type: 'SideNav', category: 'Layout' },
  { componentNameLabel: 'ViewStack', type: 'ViewStack', category: 'Layout' },
  
  // Media Components
  { componentNameLabel: 'Image', type: 'Image', category: 'Media' },
  { componentNameLabel: 'Upload', type: 'Upload', category: 'Media' },
  { componentNameLabel: 'MultiUpload', type: 'MultiUpload', category: 'Media' },
  
  // Data Components
  { componentNameLabel: 'DataGrid', type: 'DataGrid', category: 'Data' },
  { componentNameLabel: 'List', type: 'List', category: 'Data' },
  { componentNameLabel: 'Tree', type: 'Tree', category: 'Data' },
  { componentNameLabel: 'Repeater', type: 'Repeater', category: 'Data' },
  { componentNameLabel: 'RepeaterEx', type: 'RepeaterEx', category: 'Data' },
  { componentNameLabel: 'DataBrowse', type: 'DataBrowse', category: 'Data' },
  { componentNameLabel: 'AutoBrowse', type: 'AutoBrowse', category: 'Data' },
  
  // Calendar Components
  { componentNameLabel: 'Calendar', type: 'Calendar', category: 'Calendar' },
  { componentNameLabel: 'CalendarDay', type: 'CalendarDay', category: 'Calendar' },
  { componentNameLabel: 'CalendarWeek', type: 'CalendarWeek', category: 'Calendar' },
  { componentNameLabel: 'CalendarMonth', type: 'CalendarMonth', category: 'Calendar' },
  
  // Special Components
  { componentNameLabel: 'Wizard', type: 'Wizard', category: 'Special' },
  { componentNameLabel: 'CurrencyExRate', type: 'CurrencyExRate', category: 'Special' },
  { componentNameLabel: 'MapLocationPicker', type: 'MapLocationPicker', category: 'Special' },
  
  // Validators
  { componentNameLabel: 'Required Validator', type: 'RequiredFieldValidator', category: 'Validation' },
  { componentNameLabel: 'Range Validator', type: 'RangeValidator', category: 'Validation' },
  { componentNameLabel: 'RegEx Validator', type: 'RegExValidator', category: 'Validation' },
];

export const getComponentByType = (type: ComponentType): ComponentLibraryItem | undefined => {
  return componentLibrary.find((item) => item.type === type);
};

export const getComponentsByCategory = (category: string): ComponentLibraryItem[] => {
  return componentLibrary.filter((item) => item.category === category);
};

export const getAllCategories = (): string[] => {
  const categories = new Set(componentLibrary.map((item) => item.category || 'Other'));
  return Array.from(categories);
};

