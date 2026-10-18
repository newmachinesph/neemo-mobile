/**
 * HeaderBar Component
 *
 * Custom header component with a centered title and optional left/right action slots.
 * Designed for use at the top of screens or as a navigation header replacement.
 */

import React from 'react';
import { View } from 'react-native';

import { Text } from '../components/Text';

export interface HeaderBarProps {
  /** Header title */
  title: string;
  /** Left action element (e.g., back button, menu icon) */
  leftAction?: React.ReactNode;
  /** Right action element (e.g., settings icon, profile avatar) */
  rightAction?: React.ReactNode;
  /** Additional NativeWind classes */
  className?: string;
}

export function HeaderBar({
  title,
  leftAction,
  rightAction,
  className = '',
}: HeaderBarProps) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3 bg-white dark:bg-surface-dark ${className}`}
    >
      <View className="w-10 items-start">{leftAction ?? null}</View>

      <View className="flex-1 items-center">
        <Text variant="body" className="font-sans-semibold" numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View className="w-10 items-end">{rightAction ?? null}</View>
    </View>
  );
}
