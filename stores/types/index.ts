// Core types for the Form Builder

/**
 * Component Definition
 * Represents a component in the form builder
 * 
 * ID Structure:
 * - id: Internal unique ID for React keys (e.g., "sele-abc12345")
 * - guid: Persistent UUID for backend tracking (e.g., "b3ce9b08-75a3-4cb8-bc52-4889ea412ec4")
 * - name: Human-readable reference name, defaults to dataKey (e.g., "customer_type")
 * - dataKey: Data binding key in form data (e.g., "customerType")
 */
export interface ComponentDefinition {
  // Internal unique ID (auto-generated, used for React keys)
  id: string;
  
  // Persistent GUID for backend tracking (auto-generated UUID)
  guid?: string;
  
  // Human-readable component name for referencing in dependencies
  // Defaults to dataKey if not specified
  name?: string;
  
  // Component type
  type: ComponentType;
  
  // Component properties (including dataKey, label, dependencies, etc.)
  props: Record<string, any>;
  
  // Child components (for containers)
  children?: ComponentDefinition[];
  
  // Parent component ID
  parentId?: string;
}

// ============================================
// Dependency Types
// ============================================

/**
 * Dependency condition for computed properties
 * Used for: disabled, enabled, visible, required states
 */
export interface DependencyCondition {
  // Condition type
  type: 'expression' | 'fieldValue' | 'function';
  
  // JavaScript expression (e.g., "!data.state || data.state === ''")
  expression?: string;
  
  // Field reference by dataKey (e.g., "state")
  field?: string;
  
  // Comparison operator
  operator?: 'equals' | 'notEquals' | 'contains' | 'notContains' | 
             'gt' | 'gte' | 'lt' | 'lte' | 'empty' | 'notEmpty' |
             'in' | 'notIn';
  
  // Value to compare against
  value?: any;
  
  // Function source code for complex logic
  fnSource?: string;
  
  // Default value when condition can't be evaluated
  default?: any;
}

/**
 * Filter dependency for cascading dropdowns
 * Filters dataview/options based on another field's value
 */
export interface FilterDependency {
  // Source field dataKey to watch (e.g., "state")
  sourceField: string;
  
  // Target parameter name for API filter (e.g., "state_code")
  targetParam: string;
  
  // Optional value transformation function
  transform?: string;
}

/**
 * Computed property for dynamic values
 * Used for: label, placeholder, value, options
 */
export interface ComputedProperty {
  // Computation type
  type: 'expression' | 'function' | 'template';
  
  // JavaScript expression (e.g., "data.firstName + ' ' + data.lastName")
  expression?: string;
  
  // Function source code
  fnSource?: string;
  
  // Template string with placeholders (e.g., "{data.typeName} *")
  template?: string;
  
  // Default value
  default?: any;
}

/**
 * Validation dependency
 * Conditional validation based on other fields
 */
export interface ValidationDependency {
  // When validation should be enabled
  enabledWhen?: DependencyCondition;
  
  // Conditional validation rules
  rules?: Array<{
    type: string;
    params?: any;
    enabledWhen?: DependencyCondition;
  }>;
}

/**
 * Component dependencies configuration
 * All dependency-related settings for a component
 */
export interface ComponentDependencies {
  // Conditional disabled state (inverts to enabled)
  disabled?: DependencyCondition;
  
  // Conditional enabled state
  enabled?: DependencyCondition;
  
  // Conditional visibility
  visible?: DependencyCondition;
  
  // Data filtering for dropdowns/lists (cascading)
  filterBy?: FilterDependency | FilterDependency[];
  
  // Reset value when these fields change (by dataKey)
  resetOn?: string[];
  
  // Dynamic label
  label?: ComputedProperty;
  
  // Dynamic placeholder
  placeholder?: ComputedProperty;
  
  // Computed value from other fields
  value?: ComputedProperty;
  
  // Dynamic required state
  required?: DependencyCondition;
  
  // Dynamic options (for dropdowns)
  options?: ComputedProperty;
  
  // Validation dependencies
  validation?: ValidationDependency;
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
  | 'DataBrowse'
  | 'Grid';

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

