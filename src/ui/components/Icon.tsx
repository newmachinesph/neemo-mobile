/**
 * Icon Component
 *
 * Wrapper around @expo/vector-icons Ionicons with typed name, size, and color props.
 * Uses cssInterop so NativeWind className can be applied.
 */

import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { cssInterop } from 'nativewind';

// Enable NativeWind className support on Ionicons
cssInterop(Ionicons, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      color: true,
      fontSize: 'size',
    },
  },
});

/** Ionicons icon name type — use for icon name props in data and components */
export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface IconProps {
  /** Ionicons icon name */
  name: IconName;
  /** Icon size in pixels */
  size?: number;
  /** Icon color (overrides className color) */
  color?: string;
  /** Additional NativeWind classes */
  className?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export function Icon({
  name,
  size = 24,
  color,
  className = '',
  accessibilityLabel,
}: IconProps) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      className={className}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
