/**
 * SectionHeader Component
 *
 * Section title with an optional "See all" action link.
 * Used to introduce grouped content sections on screens.
 */

import React from 'react';
import { View, Pressable } from 'react-native';

import { Text } from './Text';

export interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Action label (e.g., "See all", "View more") */
  actionLabel?: string;
  /** Action press handler */
  onAction?: () => void;
  /** Additional NativeWind classes */
  className?: string;
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  className = '',
}: SectionHeaderProps) {
  return (
    <View className={`flex-row items-center justify-between py-2 ${className}`}>
      <Text variant="h3">{title}</Text>

      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          className="active:opacity-70"
        >
          <Text
            variant="caption"
            className="font-sans-medium text-accent dark:text-accent-light underline"
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
