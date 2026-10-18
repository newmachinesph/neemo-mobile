/**
 * StaggeredFadeIn Component
 *
 * Reusable entrance animation wrapper that fades in children with a
 * subtle upward translation. Supports index-based stagger for lists
 * and explicit delay for manual control.
 */

import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

export interface StaggeredFadeInProps {
  children: React.ReactNode;
  /** Fixed delay in ms. If `index` is also provided, index wins. */
  delay?: number;
  /** Item index for automatic stagger (delay = index * staggerMs) */
  index?: number;
  /** Ms between each item when using index-based stagger (default 60) */
  staggerMs?: number;
  /** Animation duration in ms (default 350) */
  duration?: number;
  /** Vertical translation distance in px (default 12) */
  distance?: number;
  /** Set false to render children immediately without animation */
  enabled?: boolean;
  /** NativeWind className forwarded to the wrapper */
  className?: string;
  /** Extra styles forwarded to the wrapper */
  style?: StyleProp<ViewStyle>;
}

export function StaggeredFadeIn({
  children,
  delay = 0,
  index,
  staggerMs = 60,
  duration = 350,
  distance = 12,
  enabled = true,
  className,
  style,
}: StaggeredFadeInProps) {
  const computedDelay = index != null ? index * staggerMs : delay;
  const opacity = useSharedValue(enabled ? 0 : 1);
  const translateY = useSharedValue(enabled ? distance : 0);

  useEffect(() => {
    if (!enabled) return;
    const timing = { duration, easing: Easing.out(Easing.cubic) };
    opacity.value = withDelay(computedDelay, withTiming(1, timing));
    translateY.value = withDelay(computedDelay, withTiming(0, timing));
  }, [computedDelay, duration, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!enabled) {
    return <>{children}</>;
  }

  return <Animated.View className={className} style={[animatedStyle, style]}>{children}</Animated.View>;
}
