import { create } from 'zustand';
import type { ComponentDependencies } from './types';

interface DependencyEditorStore {
  // Modal state
  isOpen: boolean;
  componentId: string | null;
  
  // Actions
  openModal: (componentId: string) => void;
  closeModal: () => void;
  
  // Current dependencies being edited (temporary state)
  currentDependencies: ComponentDependencies | undefined;
  setCurrentDependencies: (dependencies: ComponentDependencies | undefined) => void;
  
  // Reset temporary state
  reset: () => void;
}

export const useDependencyEditorStore = create<DependencyEditorStore>((set) => ({
  isOpen: false,
  componentId: null,
  currentDependencies: undefined,
  
  openModal: (componentId: string) => {
    set({ 
      isOpen: true, 
      componentId,
      currentDependencies: undefined, // Will be initialized from component props
    });
  },
  
  closeModal: () => {
    set({ 
      isOpen: false, 
      componentId: null,
      currentDependencies: undefined,
    });
  },
  
  setCurrentDependencies: (dependencies: ComponentDependencies | undefined) => {
    set({ currentDependencies: dependencies });
  },
  
  reset: () => {
    set({
      isOpen: false,
      componentId: null,
      currentDependencies: undefined,
    });
  },
}));

