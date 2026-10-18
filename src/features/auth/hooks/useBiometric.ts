import { useCallback, useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { isWeb } from '@lib/utils/platform';

export interface UseBiometricReturn {
  /** Whether the device supports biometric authentication. */
  isAvailable: boolean;
  /** The type of biometric (e.g. Face ID, Fingerprint). Null when unavailable. */
  biometricType: 'facial-recognition' | 'fingerprint' | 'iris' | null;
  /** Whether the check for biometric support is still loading. */
  isChecking: boolean;
  /** Prompt the user for biometric authentication. */
  authenticate: (promptMessage?: string) => Promise<boolean>;
}

/**
 * Hook for biometric (Face ID / fingerprint) authentication using expo-local-authentication.
 */
export function useBiometric(): UseBiometricReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<UseBiometricReturn['biometricType']>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isWeb) {
      setIsChecking(false);
      return;
    }

    let cancelled = false;

    async function checkBiometrics() {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();

        if (cancelled) return;

        const available = compatible && enrolled;
        setIsAvailable(available);

        if (available) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (cancelled) return;

          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('facial-recognition');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('fingerprint');
          } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            setBiometricType('iris');
          }
        }
      } catch (error) {
        if (__DEV__) console.warn('[useBiometric] Check failed:', error);
        if (!cancelled) {
          setIsAvailable(false);
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    }

    checkBiometrics();

    return () => {
      cancelled = true;
    };
  }, []);

  const authenticate = useCallback(
    async (promptMessage: string = 'Authenticate to continue'): Promise<boolean> => {
      if (!isAvailable || isWeb) return false;

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage,
          cancelLabel: 'Cancel',
          fallbackLabel: 'Use passcode',
          disableDeviceFallback: false,
        });

        return result.success;
      } catch (error) {
        if (__DEV__) console.error('[useBiometric] Authentication error:', error);
        return false;
      }
    },
    [isAvailable],
  );

  return {
    isAvailable,
    biometricType,
    isChecking,
    authenticate,
  };
}
