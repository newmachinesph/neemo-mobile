import { useEffect, useState, useCallback } from 'react';
import { View, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { Text } from '@ui/components/Text';
import { PINPad } from './PINPad';
import { useAppLock } from '../hooks/useAppLock';

const LOCKOUT_KEY = 'neemo_pin_lockout';
const MAX_ATTEMPTS = 5;

// Exponential lockout durations in milliseconds: 30s, 60s, 120s, 300s, 600s...
function getLockoutDuration(attemptCount: number): number {
  const durations = [30, 60, 120, 300, 600] as const;
  const index = Math.max(0, Math.min(Math.floor(attemptCount / MAX_ATTEMPTS) - 1, durations.length - 1));
  return durations[index]! * 1000;
}

interface LockoutState {
  attempts: number;
  lockedUntil: number | null;
}

async function readLockoutState(): Promise<LockoutState> {
  try {
    const raw = await SecureStore.getItemAsync(LOCKOUT_KEY);
    if (raw) return JSON.parse(raw) as LockoutState;
  } catch {
    // Corrupted state — reset
  }
  return { attempts: 0, lockedUntil: null };
}

async function writeLockoutState(state: LockoutState): Promise<void> {
  await SecureStore.setItemAsync(LOCKOUT_KEY, JSON.stringify(state));
}

async function clearLockoutState(): Promise<void> {
  await SecureStore.deleteItemAsync(LOCKOUT_KEY);
}

export function AppLockScreen() {
  const insets = useSafeAreaInsets();
  const { verifyPIN, unlock, removePIN, attemptBiometricUnlock, isBiometricEnabled } = useAppLock();

  const [lockoutState, setLockoutState] = useState<LockoutState>({ attempts: 0, lockedUntil: null });
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // Load lockout state from SecureStore on mount
  useEffect(() => {
    readLockoutState().then((state) => {
      setLockoutState(state);
      if (state.lockedUntil !== null) {
        const remaining = Math.ceil((state.lockedUntil - Date.now()) / 1000);
        setSecondsRemaining(Math.max(0, remaining));
      }
    });
  }, []);

  // Countdown timer when locked
  useEffect(() => {
    if (lockoutState.lockedUntil === null) return;

    const remaining = Math.ceil((lockoutState.lockedUntil - Date.now()) / 1000);
    if (remaining <= 0) {
      // Lockout expired — clear lockedUntil but keep attempt count
      const updated: LockoutState = { attempts: lockoutState.attempts, lockedUntil: null };
      setLockoutState(updated);
      writeLockoutState(updated);
      setSecondsRemaining(0);
      return;
    }

    setSecondsRemaining(remaining);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          const updated: LockoutState = { attempts: lockoutState.attempts, lockedUntil: null };
          setLockoutState(updated);
          writeLockoutState(updated);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutState.lockedUntil, lockoutState.attempts]);

  // Attempt biometric on mount
  useEffect(() => {
    if (isBiometricEnabled) {
      attemptBiometricUnlock();
    }
  }, [isBiometricEnabled, attemptBiometricUnlock]);

  const handlePINComplete = useCallback(async (pin: string) => {
    // Block input while locked out
    if (lockoutState.lockedUntil !== null && Date.now() < lockoutState.lockedUntil) return;

    const valid = await verifyPIN(pin);
    if (valid) {
      await clearLockoutState();
      setLockoutState({ attempts: 0, lockedUntil: null });
      unlock();
    } else {
      const newAttempts = lockoutState.attempts + 1;
      let newLockedUntil: number | null = null;

      if (newAttempts >= MAX_ATTEMPTS) {
        const duration = getLockoutDuration(newAttempts);
        newLockedUntil = Date.now() + duration;
      }

      const updated: LockoutState = { attempts: newAttempts, lockedUntil: newLockedUntil };
      setLockoutState(updated);
      await writeLockoutState(updated);
    }
  }, [lockoutState, verifyPIN, unlock]);

  // Require biometric verification before allowing PIN reset
  const handleForgotPIN = useCallback(async () => {
    if (isBiometricEnabled) {
      const verified = await attemptBiometricUnlock();
      if (!verified) {
        Alert.alert(
          'Biometric Required',
          'You must verify your identity with biometrics to reset your PIN.',
        );
        return;
      }
      await clearLockoutState();
      await removePIN();
      return;
    }

    // No biometric enrolled — fall back to confirmation alert
    Alert.alert(
      'Reset PIN?',
      'This will remove your PIN lock. Your data will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset PIN',
          style: 'destructive',
          onPress: async () => {
            await clearLockoutState();
            await removePIN();
          },
        },
      ],
    );
  }, [isBiometricEnabled, attemptBiometricUnlock, removePIN]);

  const isLockedOut =
    lockoutState.lockedUntil !== null && Date.now() < lockoutState.lockedUntil;

  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - (lockoutState.attempts % MAX_ATTEMPTS || MAX_ATTEMPTS));

  const getSubtitle = (): string | undefined => {
    if (isLockedOut) {
      const mins = Math.floor(secondsRemaining / 60);
      const secs = secondsRemaining % 60;
      return mins > 0
        ? `Too many attempts. Try again in ${mins}m ${secs}s.`
        : `Too many attempts. Try again in ${secs}s.`;
    }
    if (lockoutState.attempts > 0) {
      return `Wrong PIN. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} left.`;
    }
    return undefined;
  };

  return (
    <View
      className="flex-1 bg-white dark:bg-neutral-950"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <PINPad
        title="Unlock Neemo"
        subtitle={getSubtitle()}
        onComplete={handlePINComplete}
        disabled={isLockedOut}
      />

      <View className="items-center gap-4 pb-8">
        {isBiometricEnabled && (
          <Pressable
            onPress={attemptBiometricUnlock}
            disabled={isLockedOut}
            accessibilityRole="button"
            accessibilityLabel="Use biometrics to unlock"
          >
            <Text variant="caption" className="text-primary-600">
              Use Biometrics
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleForgotPIN}
          accessibilityRole="button"
          accessibilityLabel="Forgot PIN"
        >
          <Text variant="caption" className="text-neutral-500">
            Forgot PIN?
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
