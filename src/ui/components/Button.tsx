/**
 * Button Component
 *
 * Multi-variant button with primary, secondary, outline, ghost, and danger styles.
 * Supports sm/md/lg sizes, loading state, and disabled state.
 */

import React from 'react';
import { Pressable, ActivityIndicator } from 'react-native';

import { Text } from './Text';
import { useTheme } from '@theme/ThemeProvider';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  /** Button text content */
  children: string;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Show loading spinner and disable interaction */
  loading?: boolean;
  /** Disable the button */
  disabled?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Left icon element */
  leftIcon?: React.ReactNode;
  /** Right icon element */
  rightIcon?: React.ReactNode;
  /** Additional NativeWind classes for the container */
  className?: string;
  /** Accessibility label override */
  accessibilityLabel?: string;
}

const containerVariantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-500 active:bg-primary-700',
  secondary: 'bg-primary-50 dark:bg-primary-950 active:bg-primary-100 dark:active:bg-primary-900',
  outline: 'border border-neutral-200 dark:border-neutral-700 bg-transparent active:bg-neutral-50 dark:active:bg-neutral-800',
  ghost: 'bg-transparent active:bg-neutral-100 dark:active:bg-neutral-800',
  danger: 'bg-danger active:bg-red-600',
};

const textVariantClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-primary-500 dark:text-primary-400',
  outline: 'text-neutral-900 dark:text-neutral-50',
  ghost: 'text-primary-500 dark:text-primary-400',
  danger: 'text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 rounded-lg',
  md: 'px-5 py-2.5 rounded-xl',
  lg: 'px-6 py-3.5 rounded-xl',
};

const textSizeClasses: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const spinnerSizes: Record<ButtonSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  leftIcon,
  rightIcon,
  className = '',
  accessibilityLabel,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const containerClasses = [
    'flex-row items-center justify-center',
    containerVariantClasses[variant],
    sizeClasses[size],
    isDisabled ? 'opacity-50' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const textClasses = [
    'font-sans-semibold',
    textVariantClasses[variant],
    textSizeClasses[size],
  ].join(' ');

  const spinnerColor = variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.primary;

  return (
    <Pressable
      className={containerClasses}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? children}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size={spinnerSizes[size]}
          color={spinnerColor}
          className="mr-2"
        />
      ) : leftIcon ? (
        <Pressable className="mr-2" pointerEvents="none">
          {leftIcon}
        </Pressable>
      ) : null}

      <Text variant="body" className={textClasses}>
        {children}
      </Text>

      {!loading && rightIcon ? (
        <Pressable className="ml-2" pointerEvents="none">
          {rightIcon}
        </Pressable>
      ) : null}
    </Pressable>
  );
}
