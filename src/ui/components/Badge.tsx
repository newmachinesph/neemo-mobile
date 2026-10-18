/**
 * Badge Component
 *
 * Small pill-shaped status indicators with semantic color variants.
 */

import React from 'react';
import { View } from 'react-native';

import { Text } from './Text';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BadgeProps {
  /** Badge text */
  children: string;
  /** Color variant */
  variant?: BadgeVariant;
  /** Additional NativeWind classes */
  className?: string;
}

const variantContainerClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-100 dark:bg-emerald-900/30',
  warning: 'bg-amber-100 dark:bg-amber-900/30',
  danger: 'bg-red-100 dark:bg-red-900/30',
  info: 'bg-blue-100 dark:bg-blue-900/30',
  neutral: 'bg-neutral-100 dark:bg-neutral-800',
};

const variantTextClasses: Record<BadgeVariant, string> = {
  success: 'text-emerald-700 dark:text-emerald-400',
  warning: 'text-amber-700 dark:text-amber-400',
  danger: 'text-red-700 dark:text-red-400',
  info: 'text-blue-700 dark:text-blue-400',
  neutral: 'text-neutral-700 dark:text-neutral-300',
};

export function Badge({
  children,
  variant = 'neutral',
  className = '',
}: BadgeProps) {
  return (
    <View
      className={`self-start rounded-full px-2.5 py-0.5 ${variantContainerClasses[variant]} ${className}`}
      accessibilityRole="text"
    >
      <Text
        variant="caption"
        className={`font-sans-medium text-xs ${variantTextClasses[variant]}`}
      >
        {children}
      </Text>
    </View>
  );
}
