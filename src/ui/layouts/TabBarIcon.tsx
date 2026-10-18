/**
 * TabBarIcon Component
 *
 * Custom tab bar icon using Ionicons. Shows the filled variant when active
 * and the outline variant when inactive.
 */

import React from 'react';
import { View } from 'react-native';

import { Icon } from '../components/Icon';
import { useTheme } from '@theme/ThemeProvider';

import type { IconProps } from '../components/Icon';

export interface TabBarIconProps {
  /** Base icon name (outline variant, e.g., "home-outline") */
  name: IconProps['name'];
  /** Filled icon name for active state (e.g., "home") */
  activeName: IconProps['name'];
  /** Whether the tab is currently active */
  focused: boolean;
  /** Icon size */
  size?: number;
  /** Additional NativeWind classes */
  className?: string;
}

export function TabBarIcon({
  name,
  activeName,
  focused,
  size = 24,
  className = '',
}: TabBarIconProps) {
  const { colors } = useTheme();

  return (
    <View className={`items-center justify-center ${className}`}>
      <Icon
        name={focused ? activeName : name}
        size={size}
        color={focused ? colors.primary : colors.textTertiary}
      />
      {focused ? (
        <View className="mt-1 h-1 w-1 rounded-full bg-primary-500" />
      ) : null}
    </View>
  );
}
