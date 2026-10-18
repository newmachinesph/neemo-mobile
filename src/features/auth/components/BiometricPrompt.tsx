import React, { useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@ui/components/Text';
import { useTheme } from '@theme/ThemeProvider';
import { useBiometric } from '../hooks/useBiometric';

interface BiometricPromptProps {
  /** Called with `true` when biometric auth succeeds, `false` when it fails. */
  onResult?: (success: boolean) => void;
  /** Custom prompt message shown by the OS biometric dialog. */
  promptMessage?: string;
}

export function BiometricPrompt({
  onResult,
  promptMessage = 'Sign in with biometrics',
}: BiometricPromptProps) {
  const { colors } = useTheme();
  const { isAvailable, biometricType, isChecking, authenticate } = useBiometric();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Don't render anything while checking or if biometrics are unavailable.
  if (isChecking) {
    return (
      <View className="items-center justify-center py-4">
        <ActivityIndicator size="small" color={colors.primary} accessibilityLabel="Checking biometric availability" />
      </View>
    );
  }

  if (!isAvailable) {
    return null;
  }

  const iconName: keyof typeof Ionicons.glyphMap =
    biometricType === 'facial-recognition' ? 'scan' : 'finger-print';

  const label =
    biometricType === 'facial-recognition'
      ? 'Sign in with Biometrics'
      : 'Sign in with Fingerprint';

  async function handlePress() {
    setIsAuthenticating(true);
    try {
      const success = await authenticate(promptMessage);
      onResult?.(success);
    } catch (error) {
      if (__DEV__) console.error('[BiometricPrompt] Error:', error);
      onResult?.(false);
    } finally {
      setIsAuthenticating(false);
    }
  }

  return (
    <View className="items-center gap-3 py-4">
      <Pressable
        className="h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-950 active:bg-primary-100 dark:active:bg-primary-900"
        onPress={handlePress}
        disabled={isAuthenticating}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {isAuthenticating ? (
          <ActivityIndicator size="small" color={colors.primary} accessibilityLabel="Authenticating" />
        ) : (
          <Ionicons name={iconName} size={32} color={colors.primary} />
        )}
      </Pressable>
      <Text variant="caption">{label}</Text>
    </View>
  );
}
