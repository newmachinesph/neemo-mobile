/**
 * InsightCard Component
 *
 * KPI metric card showing a value with trend indicator.
 * Inspired by old-neemo-mobile's InsightCard but with animated entrance,
 * colored trend pills, and warm styling.
 */

import React, { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { useTheme } from '@theme/ThemeProvider';

export interface InsightCardProps {
  /** Ionicons icon name */
  icon: React.ComponentProps<typeof Icon>['name'];
  /** Metric title (e.g., "Income", "Expenses") */
  title: string;
  /** Formatted metric value (e.g., "PHP 45,230") */
  value: string;
  /** Trend change label (e.g., "+12%", "-5%") */
  change?: string;
  /** Whether the change is positive (green) or negative (red) */
  changePositive?: boolean;
  /** Icon container tint color */
  iconColor?: string;
  /** Press handler */
  onPress?: () => void;
  /** Animation stagger delay in ms */
  animationDelay?: number;
}

export function InsightCard({
  icon,
  title,
  value,
  change,
  changePositive,
  iconColor = '#f58560',
  onPress,
  animationDelay = 0,
}: InsightCardProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(
      animationDelay,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      animationDelay,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- opacity/translateY are stable Reanimated shared values
  }, [animationDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const trendColor = changePositive ? colors.success : colors.danger;
  const trendIcon = changePositive ? 'trending-up' : 'trending-down';

  const content = (
    <>
      <View className="flex-row items-center justify-between mb-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${iconColor}18` }}
        >
          <Icon name={icon} size={20} color={iconColor} />
        </View>
        {change != null && (
          <View
            className="flex-row items-center rounded-full px-2 py-0.5"
            style={{ backgroundColor: `${trendColor}14` }}
          >
            <Icon name={trendIcon as IconName} size={12} color={trendColor} />
            <Text
              variant="caption"
              className="ml-0.5 font-sans-medium"
              style={{ color: trendColor, fontSize: 11 }}
            >
              {change}
            </Text>
          </View>
        )}
      </View>

      <Text variant="h3" className="mb-0.5" numberOfLines={1}>
        {value}
      </Text>
      <Text variant="caption" numberOfLines={1}>
        {title}
      </Text>
    </>
  );

  const cardClasses =
    'flex-1 bg-white dark:bg-surface-dark-card rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700/50';

  return (
    <Animated.View style={animatedStyle}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          className={`${cardClasses} active:opacity-80 active:scale-[0.98]`}
          accessibilityRole="button"
          accessibilityLabel={`${title}: ${value}${change ? `, ${change}` : ''}`}
        >
          {content}
        </Pressable>
      ) : (
        <View
          className={cardClasses}
          accessibilityLabel={`${title}: ${value}${change ? `, ${change}` : ''}`}
        >
          {content}
        </View>
      )}
    </Animated.View>
  );
}
