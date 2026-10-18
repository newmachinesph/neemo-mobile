import React, { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface SkeletonProps {
  /** Width — number or DimensionValue like '100%' */
  width?: DimensionValue;
  /** Height in pixels */
  height?: number;
  /** Border radius — defaults to 8 */
  borderRadius?: number;
  /** Additional NativeWind classes */
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  className = '',
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius }, animatedStyle]}
      className={`bg-neutral-200 dark:bg-neutral-700 ${className}`}
    />
  );
}

/** Card-shaped skeleton placeholder */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <View className={`rounded-2xl border border-neutral-100 dark:border-neutral-700/50 bg-white dark:bg-surface-dark-secondary p-4 ${className}`}>
      <Skeleton width={100} height={12} className="mb-2" />
      <Skeleton width="60%" height={24} className="mb-3" />
      <Skeleton width="100%" height={8} borderRadius={4} />
    </View>
  );
}

/** Row-shaped skeleton for list items */
export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <View className={`flex-row items-center gap-3 rounded-2xl border border-neutral-100 dark:border-neutral-700/50 bg-white dark:bg-surface-dark-secondary p-4 ${className}`}>
      <Skeleton width={40} height={40} borderRadius={12} />
      <View className="flex-1">
        <Skeleton width="70%" height={14} className="mb-2" />
        <Skeleton width="40%" height={10} />
      </View>
      <Skeleton width={60} height={14} />
    </View>
  );
}
