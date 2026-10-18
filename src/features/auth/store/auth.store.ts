import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@lib/storage/zustand-storage';
import { STORAGE_KEYS } from '@lib/constants/app';
import type { AuthStore, User } from '../types/auth.types';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // ── State ────────────────────────────────────────────────────────
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // ── Actions ──────────────────────────────────────────────────────

      setLoading(loading: boolean) {
        set({ isLoading: loading });
      },

      async signOut() {
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      async restoreSession() {
        // Offline-first: nothing to restore from a server.
        // Persisted state is automatically rehydrated by Zustand.
        set({ isLoading: false });
      },

      updateUser(partial: Partial<User>) {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...partial } });
        }
      },
    }),
    {
      name: STORAGE_KEYS.AUTH_STORE,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
