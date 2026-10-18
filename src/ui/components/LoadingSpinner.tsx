/**
 * LoadingSpinner Component
 *
 * Centered ActivityIndicator with an optional descriptive label.
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';

import { Text } from './Text';
import { useTheme } from '@theme/ThemeProvider';

export interface LoadingSpinnerProps {
  /** Optional label below the spinner */
  label?: string;
  /** Spinner size */
  size?: 'small' | 'large';
  /** Additional NativeWind classes */
  className?: string;
}

export function LoadingSpinner({
  label,
  size = 'large',
  className = '',
}: LoadingSpinnerProps) {
  const { colors } = useTheme();

  return (
    <View
      className={`flex-1 items-center justify-center py-12 ${className}`}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
    >
      <ActivityIndicator size={size} color={colors.primary} />
      {label ? (
        <Text variant="caption" className="mt-3">
          {label}
        </Text>
      ) : null}
    </View>
  );
}
