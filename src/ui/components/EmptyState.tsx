/**
 * EmptyState Component
 *
 * Centered icon, title, and description for empty list/data states.
 * Optionally includes an action button.
 */

import React from 'react';
import { View } from 'react-native';

import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';
import { useTheme } from '@theme/ThemeProvider';

import type { IconProps } from './Icon';

export interface EmptyStateProps {
  /** Ionicons icon name */
  icon: IconProps['name'];
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Optional action button handler */
  onAction?: () => void;
  /** Additional NativeWind classes */
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View className={`flex-1 items-center justify-center px-8 py-16 ${className}`}>
      <View className="mb-4 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 w-16 h-16">
        <Icon name={icon} size={32} color={colors.textTertiary} />
      </View>

      <Text variant="h3" className="text-center mb-2">
        {title}
      </Text>

      {description ? (
        <Text variant="caption" className="text-center mb-6 max-w-[280px]">
          {description}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <Button variant="primary" size="md" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
