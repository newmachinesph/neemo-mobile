/**
 * ScreenHeader Component
 *
 * Screen-level header with back button and title.
 * Designed for stack screens that need consistent navigation chrome.
 */

import React from 'react';
import { View, Pressable } from 'react-native';

import { Text } from '../components/Text';
import { Icon } from '../components/Icon';
import { useTheme } from '@theme/ThemeProvider';

export interface ScreenHeaderProps {
  /** Screen title */
  title: string;
  /** Back button handler; when provided, the back arrow is shown */
  onBack?: () => void;
  /** Right action element */
  rightAction?: React.ReactNode;
  /** Additional NativeWind classes */
  className?: string;
}

export function ScreenHeader({
  title,
  onBack,
  rightAction,
  className = '',
}: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <View
      className={`flex-row items-center px-4 py-3 bg-white dark:bg-surface-dark ${className}`}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          className="mr-3 rounded-full p-1 active:bg-neutral-100 dark:active:bg-neutral-800"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
      ) : (
        <View className="w-8" />
      )}

      <View className="flex-1">
        <Text variant="h3" numberOfLines={1}>
          {title}
        </Text>
      </View>

      {rightAction ? (
        <View className="ml-3">{rightAction}</View>
      ) : null}
    </View>
  );
}
