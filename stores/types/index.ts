// Core types for the Form Builder

export interface ComponentDefinition {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  children?: ComponentDefinition[];
  parentId?: string;
}

export type ComponentType =
  | 'Label'
  | 'Heading'
  | 'Link'
  | 'HRule'
  | 'Button'
  | 'TextInput'
  | 'TextArea'
  | 'DateTime'
  | 'DateTimeCb'
  | 'Image'
  | 'Select'
  | 'DropDown'
  | 'Amount'
  | 'Tree'
  | 'AutoComplete'
  | 'CurrencyExRate'
  | 'AutoBrowse'
  | 'RadioGroup'
  | 'Toggle'
  | 'CheckBox'
  | 'CheckBoxGroup'
  | 'Form'
  | 'Header'
  | 'Footer'
  | 'SideNav'
  | 'Container'
  | 'ViewStack'
  | 'Upload'
  | 'MultiUpload'
  | 'MapLocationPicker'
  | 'Repeater'
  | 'RepeaterEx'
  | 'List'
  | 'DataGrid'
  | 'CalendarDay'
  | 'CalendarWeek'
  | 'CalendarMonth'
  | 'Calendar'
  | 'CreditCard'
  | 'Wizard'
  | 'RequiredFieldValidator'
  | 'RangeValidator'
  | 'RegExValidator'
  | 'DataBrowse';

export interface ComponentLibraryItem {
  componentNameLabel: string;
  type: ComponentType;
  icon?: string;
  category?: string;
}

export interface FormBuilderState {
  components: ComponentDefinition[];
  selectedComponentId: string | null;
  activeContainerId: string | null;
  formMode: boolean;
  previewMode: 'desktop' | 'tablet' | 'mobile' | null;
}

export interface HistoryState {
  past: ComponentDefinition[][];
  present: ComponentDefinition[];
  future: ComponentDefinition[][];
}

export interface PropertyEditorState {
  selectedComponent: ComponentDefinition | null;
  isOpen: boolean;
}

// RemoteArray types
export interface RemoteArrayOptions {
  recordsPerPage: number;
  fetchPromise: (params: {
    startPage: number;
    recordsPerPage: number;
    filterData?: any;
    sortData?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  }) => Promise<{
    data: any[];
    totalRecords: number;
    totalPages?: number;
  }>;
  threshold?: number; // Load next page when this many records from end
  autoInit?: boolean;
  filterData?: any;
  sortData?: Array<{ field: string; direction: 'asc' | 'desc' }>;
}

// Dataview types
export interface Dataview {
  id: string;
  name: string;
  description: string;
  url: string; // OpenAPI YAML URL
  fields?: string[]; // Cached field names
}

// API Config types
export interface APIConfig {
  baseUrl: string;
  endpoints: Record<string, string>;
  headers?: Record<string, string>;
  timeout?: number;
}

