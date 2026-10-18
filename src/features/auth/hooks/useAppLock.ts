import { useEffect, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';

const PIN_KEY = 'neemo_app_pin';
const PIN_SALT_KEY = 'neemo_app_pin_salt';
const LOCK_TIMEOUT_KEY = 'neemo_lock_timeout';
const BIOMETRIC_KEY = 'neemo_biometric_enabled';

// ── PIN hashing ───────────────────────────────────────────────────────────────

async function hashPIN(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salt + pin);
}

// ── Shared store so all consumers see the same state ─────────────────────
interface AppLockState {
  isLocked: boolean;
  isPINSet: boolean;
  isBiometricEnabled: boolean;
  isBiometricAvailable: boolean;
  lockTimeout: number;
  _hydrated: boolean;
}

const useAppLockStore = create<AppLockState>()(() => ({
  isLocked: false,
  isPINSet: false,
  isBiometricEnabled: false,
  isBiometricAvailable: false,
  lockTimeout: 0,
  _hydrated: false,
}));

// ── Hook that hydrates on first mount and exposes actions ────────────────
export function useAppLock() {
  const isLocked = useAppLockStore((s) => s.isLocked);
  const isPINSet = useAppLockStore((s) => s.isPINSet);
  const isBiometricEnabled = useAppLockStore((s) => s.isBiometricEnabled);
  const isBiometricAvailable = useAppLockStore((s) => s.isBiometricAvailable);
  const lockTimeout = useAppLockStore((s) => s.lockTimeout);
  const isHydrated = useAppLockStore((s) => s._hydrated);

  // Hydrate from SecureStore once
  useEffect(() => {
    if (isHydrated) return;

    (async () => {
      const storedPin = await SecureStore.getItemAsync(PIN_KEY);
      const biometricPref = await SecureStore.getItemAsync(BIOMETRIC_KEY);
      const timeout = await SecureStore.getItemAsync(LOCK_TIMEOUT_KEY);
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      useAppLockStore.setState({
        isPINSet: !!storedPin,
        isBiometricEnabled: biometricPref === 'true',
        lockTimeout: timeout ? parseInt(timeout, 10) : 0,
        isBiometricAvailable: compatible && enrolled,
        isLocked: !!storedPin,
        _hydrated: true,
      });
    })();
  }, [isHydrated]);

  // Lock when app goes to background / inactive
  useEffect(() => {
    let leftActiveAt = 0;

    const handleAppState = (next: AppStateStatus) => {
      const { isPINSet, lockTimeout } = useAppLockStore.getState();
      if (!isPINSet) return;

      if (next === 'background' || next === 'inactive') {
        // Record when we first left the active state
        if (leftActiveAt === 0) {
          leftActiveAt = Date.now();
        }
      } else if (next === 'active') {
        if (leftActiveAt > 0) {
          const elapsed = Date.now() - leftActiveAt;
          if (elapsed >= lockTimeout * 1000) {
            useAppLockStore.setState({ isLocked: true });
          }
        }
        leftActiveAt = 0;
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  const setPIN = useCallback(async (pin: string) => {
    // Generate a random 16-byte salt and encode it as hex
    const saltBytes = Crypto.getRandomBytes(16);
    const salt = Array.from(saltBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const hash = await hashPIN(pin, salt);
    await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
    await SecureStore.setItemAsync(PIN_KEY, hash);
    useAppLockStore.setState({ isPINSet: true });
  }, []);

  const removePIN = useCallback(async () => {
    await SecureStore.deleteItemAsync(PIN_KEY);
    await SecureStore.deleteItemAsync(PIN_SALT_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
    useAppLockStore.setState({
      isPINSet: false,
      isBiometricEnabled: false,
      isLocked: false,
    });
  }, []);

  const verifyPIN = useCallback(async (pin: string): Promise<boolean> => {
    const salt = await SecureStore.getItemAsync(PIN_SALT_KEY);
    const storedHash = await SecureStore.getItemAsync(PIN_KEY);
    if (!salt || !storedHash) return false;
    const inputHash = await hashPIN(pin, salt);
    return inputHash === storedHash;
  }, []);

  const lock = useCallback(() => {
    if (useAppLockStore.getState().isPINSet) {
      useAppLockStore.setState({ isLocked: true });
    }
  }, []);

  const unlock = useCallback(() => {
    useAppLockStore.setState({ isLocked: false });
  }, []);

  const attemptBiometricUnlock = useCallback(async (): Promise<boolean> => {
    const { isBiometricEnabled, isBiometricAvailable } = useAppLockStore.getState();
    if (!isBiometricEnabled || !isBiometricAvailable) return false;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Neemo',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        useAppLockStore.setState({ isLocked: false });
        return true;
      }
    } catch {
      // Biometric hardware error — fall through to PIN
    }
    return false;
  }, []);

  const toggleBiometric = useCallback(async (enabled: boolean) => {
    await SecureStore.setItemAsync(BIOMETRIC_KEY, String(enabled));
    useAppLockStore.setState({ isBiometricEnabled: enabled });
  }, []);

  const setLockTimeout = useCallback(async (seconds: number) => {
    await SecureStore.setItemAsync(LOCK_TIMEOUT_KEY, String(seconds));
    useAppLockStore.setState({ lockTimeout: seconds });
  }, []);

  return {
    isLocked,
    isPINSet,
    isBiometricEnabled,
    isBiometricAvailable,
    lockTimeout,
    isHydrated,
    setPIN,
    removePIN,
    verifyPIN,
    lock,
    unlock,
    attemptBiometricUnlock,
    toggleBiometric,
    setLockTimeout,
  };
}
