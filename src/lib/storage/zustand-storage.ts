import type { StateStorage } from 'zustand/middleware';
import { appStorage } from './mmkv';

/**
 * MMKV-backed StateStorage adapter for Zustand's persist middleware.
 *
 * Usage:
 * ```ts
 * create(
 *   persist(stateCreator, {
 *     name: 'store-key',
 *     storage: createJSONStorage(() => zustandStorage),
 *   })
 * );
 * ```
 */
export const zustandStorage: StateStorage = {
  getItem(name: string): string | null {
    const value = appStorage.getString(name);
    return value ?? null;
  },

  setItem(name: string, value: string): void {
    appStorage.set(name, value);
  },

  removeItem(name: string): void {
    appStorage.remove(name);
  },
};
