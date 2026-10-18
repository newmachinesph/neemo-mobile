import { useCallback } from 'react';
import { useAuthStore } from '../store/auth.store';

/**
 * Convenience hook that wraps the auth Zustand store.
 * Provides stable callbacks and a clean public API.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  const storeSignOut = useAuthStore((s) => s.signOut);
  const signOut = useCallback(() => storeSignOut(), [storeSignOut]);

  return {
    user,
    isAuthenticated,
    isLoading,
    signOut,
  } as const;
}

export type UseAuthReturn = ReturnType<typeof useAuth>;
