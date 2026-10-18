/**
 * ListItem Component
 *
 * Pressable row with optional left icon, title, subtitle, and right value/chevron.
 * Commonly used in settings screens, transaction lists, and navigation menus.
 */

import React from 'react';
import { View, Pressable } from 'react-native';

import { Text } from './Text';
import { Icon } from './Icon';
import { useTheme } from '@theme/ThemeProvider';

export interface ListItemProps {
  /** Main title text */
  title: string;
  /** Subtitle text below the title */
  subtitle?: string;
  /** Left icon element */
  leftIcon?: React.ReactNode;
  /** Right value text (e.g., amount, count) */
  rightValue?: string;
  /** Additional NativeWind classes for right value text */
  rightValueClassName?: string;
  /** Right element override (replaces chevron and rightValue) */
  rightElement?: React.ReactNode;
  /** Show right chevron indicator */
  showChevron?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional NativeWind classes */
  className?: string;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightValue,
  rightValueClassName = '',
  rightElement,
  showChevron = true,
  onPress,
  disabled = false,
  className = '',
}: ListItemProps) {
  const { colors } = useTheme();

  const content = (
    <>
      {leftIcon ? (
        <View className="mr-3 items-center justify-center">{leftIcon}</View>
      ) : null}

      <View className="flex-1 justify-center">
        <Text variant="body" className="font-sans-medium" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" numberOfLines={1} className="mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightElement ? (
        <View className="ml-3">{rightElement}</View>
      ) : (
        <>
          {rightValue ? (
            <Text
              variant="body"
              className={`font-sans-semibold ml-3 ${rightValueClassName}`}
              numberOfLines={1}
            >
              {rightValue}
            </Text>
          ) : null}

          {showChevron && onPress ? (
            <Icon
              name="chevron-forward"
              size={20}
              color={colors.textTertiary}
              className="ml-1"
            />
          ) : null}
        </>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        className={`flex-row items-center px-4 py-3 active:bg-neutral-50 dark:active:bg-neutral-800 ${
          disabled ? 'opacity-50' : ''
        } ${className}`}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled }}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      className={`flex-row items-center px-4 py-3 ${className}`}
      accessibilityRole="text"
    >
      {content}
    </View>
  );
}
