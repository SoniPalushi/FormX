import { create } from 'zustand';
import { type ComponentDefinition, type HistoryState } from './types';

interface HistoryStore extends HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undo: (onStateChange?: (state: ComponentDefinition[]) => void) => void;
  redo: (onStateChange?: (state: ComponentDefinition[]) => void) => void;
  addToHistory: (state: ComponentDefinition[]) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  present: [],
  future: [],
  canUndo: false,
  canRedo: false,

  undo: (onStateChange) => {
    const { past, present } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set({
      past: newPast,
      present: previous,
      future: [present, ...get().future],
      canUndo: newPast.length > 0,
      canRedo: true,
    });

    // Notify listener of state change
    if (onStateChange) {
      onStateChange(previous);
    }
  },

  redo: (onStateChange) => {
    const { future, present } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      past: [...get().past, present],
      present: next,
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
    });

    // Notify listener of state change
    if (onStateChange) {
      onStateChange(next);
    }
  },

  addToHistory: (state) => {
    set((current) => {
      const newPast = [...current.past, current.present].slice(-50); // Keep last 50 states
      return {
        past: newPast,
        present: state,
        future: [], // Clear future when new action is performed
        canUndo: newPast.length > 0,
        canRedo: false,
      };
    });
  },

  clearHistory: () => {
    set({
      past: [],
      present: [],
      future: [],
      canUndo: false,
      canRedo: false,
    });
  },
}));

