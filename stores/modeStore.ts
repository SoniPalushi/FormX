/**
 * Mode Store
 * 
 * Manages Advanced Mode state and persistence in localStorage.
 * Designed to be extensible for future role-based access control.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'form-builder-mode';

export interface ModeState {
  advancedMode: boolean;
  setAdvancedMode: (enabled: boolean) => void;
  toggleAdvancedMode: () => void;
  // For future role-based access
  userRoles?: string[];
  setUserRoles?: (roles: string[]) => void;
}

/**
 * Mode Store with localStorage persistence
 */
export const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      advancedMode: false, // Default: Simple Mode
      
      setAdvancedMode: (enabled: boolean) => {
        set({ advancedMode: enabled });
      },
      
      toggleAdvancedMode: () => {
        set((state) => ({ advancedMode: !state.advancedMode }));
      },
      
      // For future role-based access
      userRoles: undefined,
      setUserRoles: (roles: string[]) => {
        set({ userRoles: roles });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
    }
  )
);

/**
 * Hook to check if advanced mode is enabled
 */
export function useAdvancedMode(): boolean {
  return useModeStore((state) => state.advancedMode);
}

/**
 * Hook to get mode store actions
 */
export function useModeActions() {
  const setAdvancedMode = useModeStore((state) => state.setAdvancedMode);
  const toggleAdvancedMode = useModeStore((state) => state.toggleAdvancedMode);
  
  return {
    setAdvancedMode,
    toggleAdvancedMode,
  };
}

