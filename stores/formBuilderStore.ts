import { create } from 'zustand';
import { type ComponentDefinition, type FormBuilderState } from './types';
import { generateComponentId, generateGuid, generateComponentName } from '../utils/idGenerator';

// Work Area Layout types
export interface LayoutSection {
  id: string;
  name: string;
  type: 'header' | 'body' | 'footer' | 'sidebar' | 'main' | 'aside' | 'column';
  flex?: number;
  minHeight?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface WorkAreaLayout {
  id: string;
  name: string;
  description: string;
  sections: LayoutSection[];
  direction: 'row' | 'column';
}

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
  // Canvas mode: 'layout' (stacked) or 'free' (absolute positioning)
  canvasMode: 'layout' | 'free';
  setCanvasMode: (mode: 'layout' | 'free') => void;
  // Work Area Layout
  workAreaLayout: WorkAreaLayout | null;
  setWorkAreaLayout: (layout: WorkAreaLayout | null) => void;
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

// Helper function to collect all existing component names
const collectExistingNames = (components: ComponentDefinition[]): Set<string> => {
  const names = new Set<string>();
  const collect = (comps: ComponentDefinition[]) => {
    for (const comp of comps) {
      if (comp.name) names.add(comp.name);
      if (comp.props?.dataKey) names.add(comp.props.dataKey);
      if (comp.children) collect(comp.children);
    }
  };
  collect(components);
  return names;
};

// Helper function to recursively duplicate a component and its children
const duplicateComponentRecursive = (
  component: ComponentDefinition,
  existingNames: Set<string>
): ComponentDefinition => {
  // Generate new unique name for duplicate
  const baseName = component.name || component.props?.dataKey || component.type.toLowerCase();
  const newName = generateComponentName(baseName + '_copy', component.type, existingNames);
  existingNames.add(newName);
  
  return {
    ...component,
    id: generateComponentId(component.type),
    guid: generateGuid(),
    name: newName,
    children: component.children?.map((child) => duplicateComponentRecursive(child, existingNames)),
  };
};

export const useFormBuilderStore = create<FormBuilderStore>((set, get) => ({
  // Initial state
  components: [],
  selectedComponentId: null,
  activeContainerId: null,
  formMode: false, // false = builder mode (editing), true = form mode (viewing)
  previewMode: null,
  canvasMode: 'layout', // Default to layout mode (stacked components)
  workAreaLayout: null, // No predefined layout by default

  // Actions
  setComponents: (components) => set({ components }),
  
  addComponent: (component, parentId, index) =>
    set((state) => {
      // Collect existing names to avoid duplicates
      const existingNames = collectExistingNames(state.components);
      
      // Check if parent is a Grid to set default column span
      let gridColumnSpan: Record<string, number> | undefined;
      if (parentId) {
        const parent = findComponentRecursive(state.components, parentId);
        if (parent?.type === 'Grid') {
          // Grid columns limited to max 6
          const gridColumns = Math.min(parent.props?.columns || 2, 6);
          // Calculate default span: each child takes one "visual column"
          // E.g., 2 columns = span 6 (50%), 3 columns = span 4 (33%), etc.
          const defaultSpan = Math.floor(12 / gridColumns) || 6;
          
          // Set default column span based on grid configuration
          gridColumnSpan = {
            xs: 12, // Full width on mobile
            sm: Math.min(defaultSpan * 2, 12), // Double span on tablets (or full width)
            md: defaultSpan,
            lg: defaultSpan,
            xl: defaultSpan,
          };
        }
      }
      
      // Generate proper IDs if not provided
      // Note: dataKey should be set by user in Property Editor, not auto-generated
      const dataKey = component.props?.dataKey as string | undefined;
      // Generate name from dataKey if provided, otherwise from type
      // Name is used for dependency references and defaults to dataKey
      const componentName = component.name || (dataKey 
        ? generateComponentName(dataKey, component.type, existingNames)
        : generateComponentName(undefined, component.type, existingNames));
      
      const newComponent: ComponentDefinition = {
        ...component,
        id: component.id || generateComponentId(component.type),
        guid: component.guid || generateGuid(),
        name: componentName,
        parentId,
        // Merge grid column span with existing props if parent is Grid
        ...(gridColumnSpan && {
          props: {
            ...component.props,
            ...gridColumnSpan,
          },
        }),
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
      
      // Collect existing names to avoid duplicates
      const existingNames = collectExistingNames(state.components);
      const duplicated = duplicateComponentRecursive(component, existingNames);
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
        components: addComponentRecursive(withoutComponent, component, newParentId || undefined, newIndex),
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

  setCanvasMode: (mode) => set({ canvasMode: mode }),

  setWorkAreaLayout: (layout) => {
    if (layout) {
      // When setting a new layout, create container components for each section
      const sectionComponents: ComponentDefinition[] = layout.sections.map((section) => ({
        id: generateComponentId('Container'),
        guid: generateGuid(),
        name: `section_${section.id}`,
        type: 'Container' as const,
        props: {
          sectionId: section.id,
          sectionName: section.name,
          sectionType: section.type,
          flex: section.flex,
          minHeight: section.minHeight,
          isLayoutSection: true,
        },
        children: [],
      }));
      
      set({ 
        workAreaLayout: layout,
        components: sectionComponents,
      });
    } else {
      set({ workAreaLayout: null });
    }
  },
}));

