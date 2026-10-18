/**
 * Input Component
 *
 * TextInput with label, placeholder, error message, and icon slots.
 * Includes secure text toggle for password fields.
 */

import React, { useState, useCallback } from 'react';
import { View, TextInput, Pressable } from 'react-native';

import { Text } from './Text';
import { Icon } from './Icon';
import { useTheme } from '@theme/ThemeProvider';

export interface InputProps {
  /** Input label displayed above the field */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Current value */
  value?: string;
  /** Value change handler */
  onChangeText?: (text: string) => void;
  /** Error message displayed below the field */
  error?: string;
  /** Helper text displayed below the field (hidden when error is shown) */
  helperText?: string;
  /** Left icon element */
  leftIcon?: React.ReactNode;
  /** Right icon element (hidden when secureTextEntry toggle is active) */
  rightIcon?: React.ReactNode;
  /** Enable secure text entry with visibility toggle */
  secureTextEntry?: boolean;
  /** Keyboard type */
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'decimal-pad';
  /** Auto-capitalize behavior */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Auto-correct */
  autoCorrect?: boolean;
  /** Whether the input is editable */
  editable?: boolean;
  /** Maximum character length */
  maxLength?: number;
  /** Multi-line input */
  multiline?: boolean;
  /** Number of visible lines for multiline */
  numberOfLines?: number;
  /** Return key type */
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  /** Submit editing handler */
  onSubmitEditing?: () => void;
  /** Focus handler */
  onFocus?: () => void;
  /** Blur handler */
  onBlur?: () => void;
  /** Additional NativeWind classes for the outer container */
  className?: string;
  /** Test ID for testing */
  testID?: string;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  leftIcon,
  rightIcon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  editable = true,
  maxLength,
  multiline = false,
  numberOfLines,
  returnKeyType,
  onSubmitEditing,
  onFocus,
  onBlur,
  className = '',
  testID,
}: InputProps) {
  const { colors } = useTheme();
  const [isSecureVisible, setIsSecureVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const toggleSecureVisibility = useCallback(() => {
    setIsSecureVisible((prev) => !prev);
  }, []);

  const borderClasses = error
    ? 'border-danger'
    : isFocused
      ? 'border-primary-500'
      : 'border-neutral-200 dark:border-neutral-700';

  return (
    <View className={`gap-1.5 ${className}`}>
      {label ? (
        <Text variant="label">{label}</Text>
      ) : null}

      <View
        className={`flex-row items-center rounded-xl border bg-white dark:bg-surface-dark-secondary px-3 ${borderClasses} ${
          multiline ? 'items-start' : ''
        } ${!editable ? 'opacity-50' : ''}`}
      >
        {leftIcon ? (
          <View className="mr-2 justify-center">{leftIcon}</View>
        ) : null}

        <TextInput
          className={`flex-1 font-sans text-base text-neutral-900 dark:text-neutral-50 ${
            multiline ? 'py-3' : 'py-3'
          }`}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isSecureVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={handleFocus}
          onBlur={handleBlur}
          testID={testID}
          accessibilityLabel={label ?? placeholder}
          accessibilityState={{ disabled: !editable }}
        />

        {secureTextEntry ? (
          <Pressable
            onPress={toggleSecureVisibility}
            className="ml-2 justify-center p-1"
            accessibilityLabel={isSecureVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            <Icon
              name={isSecureVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : rightIcon ? (
          <View className="ml-2 justify-center">{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" className="text-danger">
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption">{helperText}</Text>
      ) : null}
    </View>
  );
}
