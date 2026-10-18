/**
 * Card Component
 *
 * Surface card with padding, border radius, and shadow.
 * Optionally pressable for interactive cards.
 */

import React from 'react';
import { View, Pressable, type ViewStyle } from 'react-native';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Make the card pressable */
  pressable?: boolean;
  /** Press handler (only works when pressable is true) */
  onPress?: () => void;
  /** Additional NativeWind classes */
  className?: string;
  /** Inline styles (e.g. dynamic border colors) */
  style?: ViewStyle;
  /** Accessibility label for pressable cards */
  accessibilityLabel?: string;
}

const baseClasses =
  'bg-white dark:bg-surface-dark-secondary rounded-2xl p-4 border border-neutral-100 dark:border-neutral-700/50 shadow-sm';

export function Card({
  children,
  pressable = false,
  onPress,
  className = '',
  style,
  accessibilityLabel,
}: CardProps) {
  const combinedClasses = `${baseClasses} ${className}`;

  if (pressable) {
    return (
      <Pressable
        className={`${combinedClasses} active:opacity-90 active:scale-[0.99]`}
        style={style}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={combinedClasses} style={style} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}
