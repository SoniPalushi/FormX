/**
 * Action System - Event handling with custom actions
 * Implements FormEngine's action system
 */

import type {
  ActionDefinition,
  ActionData,
  ActionEventArgs,
  ComponentStore,
} from '../../stores/types/formEngine';

// Common action handlers
export class ActionHandler {
  /**
   * Execute an action
   */
  static async execute(
    action: ActionData,
    eventArgs: ActionEventArgs,
    actions: Record<string, ActionDefinition> = {}
  ): Promise<any> {
    if (action.type === 'common') {
      return this.executeCommonAction(action.name, eventArgs, action.args);
    } else if (action.type === 'custom') {
      return this.executeCustomAction(action.name, eventArgs, actions[action.name], action.args);
    }
    return null;
  }

  /**
   * Execute multiple actions sequentially
   */
  static async executeActions(
    actions: ActionData[],
    eventArgs: ActionEventArgs,
    actionDefinitions: Record<string, ActionDefinition> = {}
  ): Promise<any[]> {
    const results: any[] = [];
    for (const action of actions) {
      try {
        const result = await this.execute(action, eventArgs, actionDefinitions);
        results.push(result);
      } catch (error) {
        console.error(`Error executing action ${action.name}:`, error);
        results.push(null);
      }
    }
    return results;
  }

  /**
   * Execute a common action
   */
  private static async executeCommonAction(
    name: string,
    eventArgs: ActionEventArgs,
    args?: Record<string, any>
  ): Promise<any> {
    switch (name) {
      case 'validate':
        return this.validateAction(eventArgs, args);
      
      case 'clear':
        return this.clearAction(eventArgs, args);
      
      case 'reset':
        return this.resetAction(eventArgs, args);
      
      case 'log':
        return this.logAction(eventArgs, args);
      
      case 'addRow':
        return this.addRowAction(eventArgs, args);
      
      case 'removeRow':
        return this.removeRowAction(eventArgs, args);
      
      case 'openModal':
        return this.openModalAction(eventArgs, args);
      
      case 'closeModal':
        return this.closeModalAction(eventArgs, args);
      
      default:
        console.warn(`Unknown common action: ${name}`);
        return null;
    }
  }

  /**
   * Execute a custom action
   */
  private static async executeCustomAction(
    name: string,
    eventArgs: ActionEventArgs,
    definition: ActionDefinition | undefined,
    args?: Record<string, any>
  ): Promise<any> {
    if (!definition || !definition.body) {
      console.warn(`Custom action ${name} not found or has no body`);
      return null;
    }

    try {
      // Create a safe execution context
      const context = {
        ...eventArgs,
        args: args || {},
        formData: eventArgs.data,
        parentData: eventArgs.parentData,
        rootData: eventArgs.rootData,
      };

      // Execute the function
      const fn = new Function(
        'context',
        `
        const { type, sender, store, args, renderedProps, event, value, data, parentData, rootData } = context;
        ${definition.body}
      `
      );

      return await fn(context);
    } catch (error) {
      console.error(`Error executing custom action ${name}:`, error);
      throw error;
    }
  }

  // Common action implementations
  private static async validateAction(eventArgs: ActionEventArgs, args?: Record<string, any>): Promise<boolean> {
    // Validation logic - would integrate with validation system
    console.log('Validate action', eventArgs, args);
    return true;
  }

  private static async clearAction(eventArgs: ActionEventArgs, args?: Record<string, any>): Promise<void> {
    // Clear component value
    if (eventArgs.sender.dataKey && eventArgs.store) {
      eventArgs.store.setData(eventArgs.sender.dataKey, '');
    }
  }

  private static async resetAction(eventArgs: ActionEventArgs, args?: Record<string, any>): Promise<void> {
    // Reset component to initial value
    if (eventArgs.sender.dataKey && eventArgs.store) {
      const initialValue = eventArgs.sender.props.value?.value;
      eventArgs.store.setData(eventArgs.sender.dataKey, initialValue);
    }
  }

  private static async logAction(eventArgs: ActionEventArgs, args?: Record<string, any>): Promise<void> {
    const message = args?.message || 'Action logged';
    const data = args?.data ? eventArgs.data[args.data] : eventArgs.value;
    console.log(message, data);
  }

  private static async addRowAction(eventArgs: ActionEventArgs, args?: Record<string, any>): Promise<void> {
    // Add row to repeater - would need repeater context
    console.log('Add row action', eventArgs, args);
  }

  private static async removeRowAction(eventArgs: ActionEventArgs, args?: Record<string, any>): Promise<void> {
    // Remove row from repeater - would need repeater context
    console.log('Remove row action', eventArgs, args);
  }

  private static async openModalAction(eventArgs: ActionEventArgs, args?: Record<string, any>): Promise<void> {
    // Dispatch custom event to open modal
    const modalId = args?.modalId || args?.componentId || eventArgs.sender?.key;
    const modalType = args?.modalType || (eventArgs.sender?.modal as any)?.type;
    
    window.dispatchEvent(
      new CustomEvent('formx:openModal', {
        detail: { modalId, modalType, args, eventArgs },
      })
    );
  }

  private static async closeModalAction(eventArgs: ActionEventArgs, args?: Record<string, any>): Promise<void> {
    // Dispatch custom event to close modal
    const modalId = args?.modalId || args?.componentId || eventArgs.sender?.key;
    const modalType = args?.modalType || (eventArgs.sender?.modal as any)?.type;
    
    window.dispatchEvent(
      new CustomEvent('formx:closeModal', {
        detail: { modalId, modalType, args, eventArgs },
      })
    );
  }
}

