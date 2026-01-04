import { create } from 'zustand';
import { type ComponentDefinition, type FormBuilderState } from './types';

interface FormBuilderStore extends FormBuilderState {
  // Actions
  setComponents: (components: ComponentDefinition[]) => void;
  addComponent: (component: ComponentDefinition, parentId?: string, index?: number) => void;
  updateComponent: (id: string, updates: Partial<ComponentDefinition>) => void;
  deleteComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  setActiveContainer: (id: string | null) => void;
  toggleFormMode: () => void;
  setFormMode: (mode: boolean) => void;
  setPreviewMode: (mode: 'desktop' | 'tablet' | 'mobile' | null) => void;
  duplicateComponent: (id: string) => void;
  moveComponent: (id: string, newParentId: string | null, newIndex?: number) => void;
  findComponent: (id: string) => ComponentDefinition | null;
  findComponentParent: (id: string) => ComponentDefinition | null;
}

// Helper function to recursively find a component
const findComponentRecursive = (
  components: ComponentDefinition[],
  id: string
): ComponentDefinition | null => {
  for (const component of components) {
    if (component.id === id) {
      return component;
    }
    if (component.children) {
      const found = findComponentRecursive(component.children, id);
      if (found) return found;
    }
  }
  return null;
};

// Helper function to recursively find parent of a component
const findParentRecursive = (
  components: ComponentDefinition[],
  id: string,
  parent: ComponentDefinition | null = null
): ComponentDefinition | null => {
  for (const component of components) {
    if (component.id === id) {
      return parent;
    }
    if (component.children) {
      const found = findParentRecursive(component.children, id, component);
      if (found !== null) return found;
    }
  }
  return null;
};

// Helper function to recursively update a component
const updateComponentRecursive = (
  components: ComponentDefinition[],
  id: string,
  updates: Partial<ComponentDefinition>
): ComponentDefinition[] => {
  return components.map((component) => {
    if (component.id === id) {
      return { ...component, ...updates };
    }
    if (component.children) {
      return {
        ...component,
        children: updateComponentRecursive(component.children, id, updates),
      };
    }
    return component;
  });
};

// Helper function to recursively delete a component
const deleteComponentRecursive = (
  components: ComponentDefinition[],
  id: string
): ComponentDefinition[] => {
  return components
    .filter((component) => component.id !== id)
    .map((component) => {
      if (component.children) {
        return {
          ...component,
          children: deleteComponentRecursive(component.children, id),
        };
      }
      return component;
    });
};

// Helper function to recursively add a component
const addComponentRecursive = (
  components: ComponentDefinition[],
  newComponent: ComponentDefinition,
  parentId: string | undefined,
  index?: number
): ComponentDefinition[] => {
  if (!parentId) {
    // Add to root level
    if (index !== undefined) {
      const newComponents = [...components];
      newComponents.splice(index, 0, newComponent);
      return newComponents;
    }
    return [...components, newComponent];
  }

  // Find and update parent
  return components.map((component) => {
    if (component.id === parentId) {
      const children = component.children || [];
      const updatedChildren =
        index !== undefined
          ? [...children.slice(0, index), newComponent, ...children.slice(index)]
          : [...children, newComponent];
      return { ...component, children: updatedChildren };
    }
    if (component.children) {
      return {
        ...component,
        children: addComponentRecursive(component.children, newComponent, parentId, index),
      };
    }
    return component;
  });
};

// Helper function to recursively duplicate a component and its children
const duplicateComponentRecursive = (component: ComponentDefinition): ComponentDefinition => {
  return {
    ...component,
    id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    children: component.children?.map((child) => duplicateComponentRecursive(child)),
  };
};

export const useFormBuilderStore = create<FormBuilderStore>((set, get) => ({
  // Initial state
  components: [],
  selectedComponentId: null,
  activeContainerId: null,
  formMode: true,
  previewMode: null,

  // Actions
  setComponents: (components) => set({ components }),
  
  addComponent: (component, parentId, index) =>
    set((state) => {
      const newComponent = {
        ...component,
        id: component.id || `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        parentId,
      };
      return {
        components: addComponentRecursive(state.components, newComponent, parentId, index),
      };
    }),

  updateComponent: (id, updates) =>
    set((state) => ({
      components: updateComponentRecursive(state.components, id, updates),
    })),

  deleteComponent: (id) =>
    set((state) => ({
      components: deleteComponentRecursive(state.components, id),
      selectedComponentId:
        state.selectedComponentId === id ? null : state.selectedComponentId,
      activeContainerId:
        state.activeContainerId === id ? null : state.activeContainerId,
    })),

  selectComponent: (id) => set({ selectedComponentId: id }),
  
  setActiveContainer: (id) => set({ activeContainerId: id }),
  
  toggleFormMode: () =>
    set((state) => ({ formMode: !state.formMode })),
  
  setFormMode: (mode) => set({ formMode: mode }),
  
  setPreviewMode: (mode) => set({ previewMode: mode }),
  
  duplicateComponent: (id) =>
    set((state) => {
      const component = findComponentRecursive(state.components, id);
      if (!component) return state;
      
      const duplicated = duplicateComponentRecursive(component);
      const parentId = component.parentId;
      
      return {
        components: addComponentRecursive(state.components, duplicated, parentId),
      };
    }),

  moveComponent: (id, newParentId, newIndex) =>
    set((state) => {
      const component = findComponentRecursive(state.components, id);
      if (!component) return state;

      // Remove from old location
      const withoutComponent = deleteComponentRecursive(state.components, id);
      
      // Add to new location
      return {
        components: addComponentRecursive(withoutComponent, component, newParentId, newIndex),
      };
    }),

  findComponent: (id) => {
    const state = get();
    return findComponentRecursive(state.components, id);
  },

  findComponentParent: (id) => {
    const state = get();
    return findParentRecursive(state.components, id);
  },
}));

