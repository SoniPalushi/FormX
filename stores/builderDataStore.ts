/**
 * Builder Data Store
 * Stores cached dataview data for use in the builder (preview mode)
 * Similar to Builder.data in the old project
 */

import { create } from 'zustand';

interface BuilderDataStoreState {
  // Cache dataview data: { [dataviewId]: any[] }
  dataviewData: Record<string, any[]>;
  
  // Set dataview data
  setDataviewData: (dataviewId: string, data: any[]) => void;
  
  // Get dataview data
  getDataviewData: (dataviewId: string) => any[] | null;
  
  // Clear dataview data
  clearDataviewData: (dataviewId?: string) => void;
  
  // Clear all data
  clearAll: () => void;
}

export const useBuilderDataStore = create<BuilderDataStoreState>((set, get) => ({
  dataviewData: {},

  setDataviewData: (dataviewId: string, data: any[]) =>
    set((state) => ({
      dataviewData: {
        ...state.dataviewData,
        [dataviewId]: data,
      },
    })),

  getDataviewData: (dataviewId: string) => {
    const state = get();
    return state.dataviewData[dataviewId] || null;
  },

  clearDataviewData: (dataviewId?: string) =>
    set((state) => {
      if (dataviewId) {
        const { [dataviewId]: removed, ...rest } = state.dataviewData;
        return { dataviewData: rest };
      }
      return { dataviewData: {} };
    }),

  clearAll: () =>
    set({
      dataviewData: {},
    }),
}));

