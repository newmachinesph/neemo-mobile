/**
 * Divider Component
 *
 * Horizontal line separator for visually dividing content sections.
 */

import React from 'react';
import { View } from 'react-native';

export interface DividerProps {
  /** Additional NativeWind classes */
  className?: string;
}

export function Divider({ className = '' }: DividerProps) {
  return (
    <View
      className={`h-px bg-neutral-200 dark:bg-neutral-700 ${className}`}
      accessibilityRole="none"
    />
  );
}
