/**
 * Form Data Store
 * Manages form data state and data binding
 */

import { create } from 'zustand';
import type { ComponentStore, ComponentProperty } from './types/formEngine';
import { ComputedPropertyEvaluator } from '../utils/properties/computedProperties';

interface FormDataStoreState {
  data: Record<string, any>;
  initialData: Record<string, any>;
  setData: (key: string, value: any) => void;
  getData: (key: string) => any;
  setInitialData: (data: Record<string, any>) => void;
  reset: () => void;
  clear: () => void;
  getAllData: () => Record<string, any>;
  evaluateProperty: (
    property: ComponentProperty | undefined,
    parentData?: Record<string, any>
  ) => any;
}

export const useFormDataStore = create<FormDataStoreState>((set, get) => ({
  data: {},
  initialData: {},

  setData: (key: string, value: any) =>
    set((state) => ({
      data: { ...state.data, [key]: value },
    })),

  getData: (key: string) => {
    const state = get();
    return state.data[key];
  },

  setInitialData: (data: Record<string, any>) =>
    set({ initialData: data, data: { ...data } }),

  reset: () =>
    set((state) => ({
      data: { ...state.initialData },
    })),

  clear: () =>
    set({
      data: {},
      initialData: {},
    }),

  getAllData: () => {
    const state = get();
    return state.data;
  },

  evaluateProperty: (
    property: ComponentProperty | undefined,
    parentData?: Record<string, any>
  ) => {
    const state = get();
    return ComputedPropertyEvaluator.evaluate(
      property,
      state.data,
      parentData,
      state.data
    );
  },
}));

