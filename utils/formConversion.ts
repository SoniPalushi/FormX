/**
 * Form Conversion Utilities
 * Convert between ComponentDefinition and ComponentStore formats
 */

import type { ComponentDefinition } from '../stores/types';
import type {
  ComponentStore,
  ComponentProperty,
  PersistedForm,
  Language,
  ResponsiveCss,
  ResponsiveStyle,
  ValidationSchema,
  ActionData,
  ModalComponentStore,
} from '../stores/types/formEngine';

export class FormConverter {
  /**
   * Convert ComponentDefinition to ComponentStore
   */
  static toComponentStore(
    component: ComponentDefinition,
    allComponents: ComponentDefinition[] = []
  ): ComponentStore {
    const children = component.children || [];
    const props = component.props || {};
    
    const componentStore: ComponentStore = {
      key: component.id,
      type: this.mapComponentType(component.type),
      props: this.convertProps(props),
      children: children.length > 0 
        ? children.map((child) => this.toComponentStore(child, allComponents))
        : undefined,
    };

    // Convert dataKey
    if (props.dataKey) {
      componentStore.dataKey = props.dataKey;
    }

    // Convert responsive CSS
    if (props.css) {
      componentStore.css = this.convertResponsiveCss(props.css);
    }
    if (props.wrapperCss) {
      componentStore.wrapperCss = this.convertResponsiveCss(props.wrapperCss);
    }

    // Convert responsive styles
    if (props.style) {
      componentStore.style = this.convertResponsiveStyle(props.style);
    }
    if (props.wrapperStyle) {
      componentStore.wrapperStyle = this.convertResponsiveStyle(props.wrapperStyle);
    }

    // Convert events
    if (props.events) {
      componentStore.events = this.convertEvents(props.events);
    }

    // Convert validation schema
    if (props.schema || props.validation) {
      componentStore.schema = this.convertValidationSchema(props.schema || props.validation);
    }

    // Convert HTML attributes
    if (props.htmlAttributes) {
      componentStore.htmlAttributes = Array.isArray(props.htmlAttributes)
        ? props.htmlAttributes
        : [props.htmlAttributes];
    }

    // Convert tooltip props
    if (props.tooltipProps) {
      componentStore.tooltipProps = this.convertProps(props.tooltipProps);
    }

    // Convert modal
    if (props.modal) {
      componentStore.modal = this.convertModal(props.modal);
    }

    // Convert slot properties
    if (props.slot) {
      componentStore.slot = props.slot;
    }
    if (props.slotCondition) {
      componentStore.slotCondition = props.slotCondition;
    }

    // Convert renderWhen
    if (props.renderWhen !== undefined) {
      componentStore.renderWhen = this.convertProperty(props.renderWhen);
    }

    // Convert disableDataBinding
    if (props.disableDataBinding !== undefined) {
      componentStore.disableDataBinding = this.convertProperty(props.disableDataBinding);
    }

    return componentStore;
  }

  /**
   * Convert ComponentStore to ComponentDefinition
   */
  static toComponentDefinition(
    component: ComponentStore,
    parentId?: string
  ): ComponentDefinition {
    const props = this.reverseConvertProps(component.props);

    // Restore dataKey
    if (component.dataKey) {
      props.dataKey = component.dataKey;
    }

    // Restore responsive CSS
    if (component.css) {
      props.css = this.reverseConvertResponsiveCss(component.css);
    }
    if (component.wrapperCss) {
      props.wrapperCss = this.reverseConvertResponsiveCss(component.wrapperCss);
    }

    // Restore responsive styles
    if (component.style) {
      props.style = this.reverseConvertResponsiveStyle(component.style);
    }
    if (component.wrapperStyle) {
      props.wrapperStyle = this.reverseConvertResponsiveStyle(component.wrapperStyle);
    }

    // Restore events
    if (component.events) {
      props.events = this.reverseConvertEvents(component.events);
    }

    // Restore validation schema
    if (component.schema) {
      props.schema = component.schema;
      props.validation = component.schema; // Also store as validation for compatibility
    }

    // Restore HTML attributes
    if (component.htmlAttributes) {
      props.htmlAttributes = component.htmlAttributes;
    }

    // Restore tooltip props
    if (component.tooltipProps) {
      props.tooltipProps = this.reverseConvertProps(component.tooltipProps);
    }

    // Restore modal
    if (component.modal) {
      props.modal = this.reverseConvertModal(component.modal);
    }

    // Restore slot properties
    if (component.slot) {
      props.slot = component.slot;
    }
    if (component.slotCondition) {
      props.slotCondition = component.slotCondition;
    }

    // Restore renderWhen
    if (component.renderWhen) {
      props.renderWhen = this.reverseConvertProperty(component.renderWhen);
    }

    // Restore disableDataBinding
    if (component.disableDataBinding) {
      props.disableDataBinding = this.reverseConvertProperty(component.disableDataBinding);
    }

    return {
      id: component.key,
      type: this.reverseMapComponentType(component.type),
      props,
      children: component.children
        ? component.children.map((child) => this.toComponentDefinition(child, component.key))
        : undefined,
      parentId,
    };
  }

  /**
   * Convert props to ComponentProperty format
   */
  private static convertProps(props: Record<string, any>): Record<string, ComponentProperty> {
    const converted: Record<string, ComponentProperty> = {};
    
    for (const [key, value] of Object.entries(props)) {
      // Check if it's already a ComponentProperty
      if (value && typeof value === 'object' && ('value' in value || 'fnSource' in value)) {
        converted[key] = value as ComponentProperty;
      } else {
        // Convert to static ComponentProperty
        converted[key] = { value };
      }
    }
    
    return converted;
  }

  /**
   * Reverse convert ComponentProperty to simple props
   */
  private static reverseConvertProps(
    props: Record<string, ComponentProperty>
  ): Record<string, any> {
    const converted: Record<string, any> = {};
    
    for (const [key, property] of Object.entries(props)) {
      if (property.value !== undefined) {
        converted[key] = property.value;
      } else if (property.fnSource) {
        // Store as computed property structure
        converted[key] = property;
      }
    }
    
    return converted;
  }

  /**
   * Map ComponentType to FormEngine component type
   */
  private static mapComponentType(type: string): string {
    const typeMap: Record<string, string> = {
      TextInput: 'MuiTextField',
      TextArea: 'MuiTextField',
      Select: 'MuiSelect',
      DropDown: 'MuiSelect',
      Button: 'MuiButton',
      CheckBox: 'MuiCheckbox',
      RadioGroup: 'MuiRadioGroup',
      Toggle: 'MuiSwitch',
      DateTime: 'MuiDateTimePicker',
      DateTimeCb: 'MuiDateTimePicker',
      Image: 'MuiImage',
      Container: 'MuiBox',
      Form: 'MuiForm',
      Header: 'MuiAppBar',
      Footer: 'MuiPaper',
      SideNav: 'MuiDrawer',
      ViewStack: 'MuiTabs',
      Amount: 'MuiTextField',
      AutoComplete: 'MuiAutocomplete',
      Repeater: 'MuiRepeater',
      List: 'MuiList',
      DataGrid: 'MuiDataGrid',
      Calendar: 'MuiCalendar',
      Wizard: 'MuiStepper',
    };
    
    return typeMap[type] || type;
  }

  /**
   * Reverse map FormEngine component type to ComponentType
   */
  private static reverseMapComponentType(type: string): string {
    const reverseMap: Record<string, string> = {
      MuiTextField: 'TextInput',
      MuiSelect: 'Select',
      MuiButton: 'Button',
      MuiCheckbox: 'CheckBox',
      MuiRadioGroup: 'RadioGroup',
      MuiSwitch: 'Toggle',
      MuiDateTimePicker: 'DateTime',
      MuiImage: 'Image',
      MuiBox: 'Container',
      MuiForm: 'Form',
      MuiAppBar: 'Header',
      MuiPaper: 'Footer',
      MuiDrawer: 'SideNav',
      MuiTabs: 'ViewStack',
      MuiAutocomplete: 'AutoComplete',
      MuiRepeater: 'Repeater',
      MuiList: 'List',
      MuiDataGrid: 'DataGrid',
      MuiCalendar: 'Calendar',
      MuiStepper: 'Wizard',
    };
    
    return reverseMap[type] || type;
  }

  /**
   * Convert form to PersistedForm format
   */
  static toPersistedForm(
    components: ComponentDefinition[],
    options: {
      version?: string;
      defaultLanguage?: string;
      languages?: Language[];
      formValidator?: string;
      actions?: Record<string, any>;
    } = {}
  ): PersistedForm {
    // Convert root components to a single form component
    const formComponent: ComponentStore = {
      key: 'root',
      type: 'Form',
      props: {},
      children: components.map((comp) => this.toComponentStore(comp, components)),
    };

    return {
      version: options.version || '1',
      form: formComponent,
      defaultLanguage: options.defaultLanguage || 'en-US',
      languages: options.languages || [
        { code: 'en-US', name: 'English (US)' },
        { code: 'es-ES', name: 'Spanish (ES)' },
      ],
      localization: {},
      actions: options.actions,
      formValidator: options.formValidator,
    };
  }

  /**
   * Convert PersistedForm to ComponentDefinition array
   */
  static fromPersistedForm(persistedForm: PersistedForm): ComponentDefinition[] {
    if (!persistedForm.form.children) {
      return [];
    }

    return persistedForm.form.children.map((child) => this.toComponentDefinition(child));
  }

  /**
   * Convert responsive CSS object
   */
  private static convertResponsiveCss(css: any): ResponsiveCss {
    if (!css || typeof css !== 'object') {
      return {};
    }

    const converted: ResponsiveCss = {};
    if (css.any) converted.any = css.any;
    if (css.mobile) converted.mobile = css.mobile;
    if (css.tablet) converted.tablet = css.tablet;
    if (css.desktop) converted.desktop = css.desktop;

    return converted;
  }

  /**
   * Reverse convert responsive CSS
   */
  private static reverseConvertResponsiveCss(css: ResponsiveCss): any {
    return css;
  }

  /**
   * Convert responsive style object
   */
  private static convertResponsiveStyle(style: any): ResponsiveStyle {
    if (!style || typeof style !== 'object') {
      return {};
    }

    const converted: ResponsiveStyle = {};
    if (style.any) converted.any = style.any;
    if (style.mobile) converted.mobile = style.mobile;
    if (style.tablet) converted.tablet = style.tablet;
    if (style.desktop) converted.desktop = style.desktop;

    return converted;
  }

  /**
   * Reverse convert responsive style
   */
  private static reverseConvertResponsiveStyle(style: ResponsiveStyle): any {
    return style;
  }

  /**
   * Convert events object
   */
  private static convertEvents(events: any): Record<string, ActionData[]> {
    if (!events || typeof events !== 'object') {
      return {};
    }

    const converted: Record<string, ActionData[]> = {};
    for (const [eventType, actions] of Object.entries(events)) {
      if (Array.isArray(actions)) {
        converted[eventType] = actions.map((action) => ({
          name: action.name || action,
          type: action.type || 'common',
          args: action.args || {},
        }));
      } else if (typeof actions === 'string') {
        converted[eventType] = [{ name: actions, type: 'common' }];
      }
    }

    return converted;
  }

  /**
   * Reverse convert events
   */
  private static reverseConvertEvents(events: Record<string, ActionData[]>): any {
    return events;
  }

  /**
   * Convert validation schema
   */
  private static convertValidationSchema(schema: any): ValidationSchema {
    if (!schema) {
      return { validations: [] };
    }

    if (schema.validations && Array.isArray(schema.validations)) {
      return schema as ValidationSchema;
    }

    // Convert from simple format
    if (Array.isArray(schema)) {
      return {
        validations: schema.map((rule) => ({
          key: rule.key || rule,
          args: rule.args || {},
          message: rule.message,
          validateWhen: rule.validateWhen,
        })),
      };
    }

    return { validations: [] };
  }

  /**
   * Convert modal object
   */
  private static convertModal(modal: any): ModalComponentStore {
    if (!modal || typeof modal !== 'object') {
      return { type: 'MuiDialog', props: {}, children: [] };
    }

    return {
      type: modal.type || 'MuiDialog',
      props: modal.props ? this.convertProps(modal.props) : {},
      children: modal.children
        ? modal.children.map((child: any) => {
            if (typeof child === 'string' || !child.key) {
              // Simple component definition
              return this.toComponentStore(child as ComponentDefinition);
            }
            return child as ComponentStore;
          })
        : [],
    };
  }

  /**
   * Reverse convert modal
   */
  private static reverseConvertModal(modal: ModalComponentStore): any {
    return {
      type: modal.type,
      props: this.reverseConvertProps(modal.props || {}),
      children: modal.children
        ? modal.children.map((child) => this.toComponentDefinition(child))
        : [],
    };
  }

  /**
   * Convert a property value to ComponentProperty
   */
  private static convertProperty(value: any): ComponentProperty {
    if (value && typeof value === 'object' && ('value' in value || 'fnSource' in value)) {
      return value as ComponentProperty;
    }
    return { value };
  }

  /**
   * Reverse convert ComponentProperty to value
   */
  private static reverseConvertProperty(property: ComponentProperty): any {
    if (property.value !== undefined) {
      return property.value;
    }
    if (property.fnSource) {
      return property; // Keep as computed property
    }
    return undefined;
  }
}

