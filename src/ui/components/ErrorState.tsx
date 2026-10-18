/**
 * ErrorState Component
 *
 * Error display with an icon, message, and retry button.
 */

import React from 'react';
import { View } from 'react-native';

import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';
import { useTheme } from '@theme/ThemeProvider';

export interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error description / message */
  message?: string;
  /** Retry handler */
  onRetry?: () => void;
  /** Retry button label */
  retryLabel?: string;
  /** Additional NativeWind classes */
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}: ErrorStateProps) {
  const { colors } = useTheme();

  return (
    <View className={`flex-1 items-center justify-center px-8 py-16 ${className}`}>
      <View className="mb-4 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 w-16 h-16">
        <Icon name="alert-circle-outline" size={32} color={colors.danger} />
      </View>

      <Text variant="h3" className="text-center mb-2">
        {title}
      </Text>

      <Text variant="caption" className="text-center mb-6 max-w-[280px]">
        {message}
      </Text>

      {onRetry ? (
        <Button variant="primary" size="md" onPress={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </View>
  );
}
