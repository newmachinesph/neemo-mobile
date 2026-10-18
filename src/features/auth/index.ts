// ── Hooks ──────────────────────────────────────────────────────────────────
export { useAuth } from './hooks/useAuth';
export { useBiometric } from './hooks/useBiometric';
export type { UseBiometricReturn } from './hooks/useBiometric';

// ── Components ─────────────────────────────────────────────────────────────
export { BiometricPrompt } from './components/BiometricPrompt';

// ── Store ──────────────────────────────────────────────────────────────────
export { useAuthStore } from './store/auth.store';

// ── Types ──────────────────────────────────────────────────────────────────
export type {
  User,
  AuthState,
  AuthActions,
  AuthStore,
} from './types/auth.types';
