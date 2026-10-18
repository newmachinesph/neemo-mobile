/**
 * Text Component
 *
 * Typography component with semantic variants mapped to Inter font weights.
 * Uses NativeWind className for styling with dark mode support.
 */

import React from 'react';
import { Text as RNText, type TextStyle } from 'react-native';

export type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';

export interface TextProps {
  /** Typography variant */
  variant?: TextVariant;
  /** Additional NativeWind classes */
  className?: string;
  /** Text content */
  children: React.ReactNode;
  /** Number of lines before truncation */
  numberOfLines?: number;
  /** Accessibility role */
  accessibilityRole?: 'header' | 'text' | 'link' | 'none';
  /** Inline styles (use sparingly — prefer className) */
  style?: TextStyle;
}

const variantClasses: Record<TextVariant, string> = {
  h1: 'font-sans-bold text-[30px] leading-[36px] tracking-tighter text-neutral-900 dark:text-neutral-50',
  h2: 'font-sans-bold text-2xl leading-8 tracking-tight text-neutral-900 dark:text-neutral-50',
  h3: 'font-sans-semibold text-xl leading-7 tracking-tight text-neutral-900 dark:text-neutral-50',
  body: 'font-sans text-base leading-6 text-neutral-900 dark:text-neutral-50',
  caption: 'font-sans text-sm leading-5 text-neutral-500 dark:text-neutral-400',
  label: 'font-sans-medium text-sm leading-5 tracking-wide text-neutral-700 dark:text-neutral-300',
};

export function Text({
  variant = 'body',
  className = '',
  children,
  numberOfLines,
  accessibilityRole,
  style,
}: TextProps) {
  const baseClasses = variantClasses[variant];

  return (
    <RNText
      className={`${baseClasses} ${className}`}
      numberOfLines={numberOfLines}
      accessibilityRole={accessibilityRole ?? (variant.startsWith('h') ? 'header' : 'text')}
      style={style}
    >
      {children}
    </RNText>
  );
}
