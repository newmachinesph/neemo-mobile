/**
 * ProgressBar Component
 *
 * Animated progress bar with percentage display.
 * Color transitions based on threshold: green (< 75%) -> yellow (75-90%) -> red (> 90%).
 * Ideal for budget tracking visualizations.
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { Text } from './Text';

export interface ProgressBarProps {
  /** Progress value between 0 and 1 */
  progress: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Custom label (overrides default percentage) */
  label?: string;
  /** Bar height in tailwind units */
  height?: 'sm' | 'md' | 'lg';
  /** Use threshold-based coloring (green->yellow->red) */
  useThresholdColors?: boolean;
  /** Fixed color override (ignores threshold coloring) */
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'income' | 'expense';
  /** Additional NativeWind classes */
  className?: string;
}

const heightClasses: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

function getThresholdColor(progress: number): string {
  if (progress < 0.75) return 'bg-success';
  if (progress < 0.9) return 'bg-warning';
  return 'bg-danger';
}

const fixedColorClasses: Record<string, string> = {
  primary: 'bg-primary-500',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  income: 'bg-income',
  expense: 'bg-expense',
};

export function ProgressBar({
  progress,
  showLabel = false,
  label,
  height = 'md',
  useThresholdColors = true,
  color,
  className = '',
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(clampedProgress, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- animatedWidth is a stable Reanimated shared value
  }, [clampedProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value * 100}%`,
  }));

  const barColorClass = color
    ? fixedColorClasses[color] ?? 'bg-primary-500'
    : useThresholdColors
      ? getThresholdColor(clampedProgress)
      : 'bg-primary-500';

  const displayLabel = label ?? `${Math.round(clampedProgress * 100)}%`;

  return (
    <View className={`gap-1.5 ${className}`}>
      {showLabel ? (
        <View className="flex-row justify-between">
          <Text variant="caption" className="font-sans-medium">
            {displayLabel}
          </Text>
        </View>
      ) : null}

      <View
        className={`w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden ${heightClasses[height]}`}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(clampedProgress * 100),
        }}
      >
        <Animated.View
          className={`h-full rounded-full ${barColorClass}`}
          style={animatedStyle}
        />
      </View>
    </View>
  );
}
