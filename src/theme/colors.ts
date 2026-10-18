/**
 * Neemo Finance App - Color Palette
 *
 * Primary: Maroon (#9b1b3c)
 * Accent: Coral (#f58560)
 * Provides light and dark mode surface colors, semantic colors for
 * income/expense, and status indicators.
 */

export const palette = {
  primary: {
    50: '#fdf2f4',
    100: '#fce4e8',
    200: '#f9c9d1',
    300: '#f4a3b5',
    400: '#e86b87',
    500: '#b91c4a',
    600: '#9b1b3c',
    700: '#831530',
    800: '#6b1026',
    900: '#530c1e',
    950: '#2f0a18',
  },
  neutral: {
    50: '#FAF8F7',
    100: '#F5F1F0',
    200: '#E8E2E0',
    300: '#D4CBC8',
    400: '#A69895',
    500: '#78706D',
    600: '#574F4C',
    700: '#3D3533',
    800: '#2A2220',
    900: '#1A1412',
    950: '#0D0908',
  },
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  income: '#10B981',
  expense: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export interface ThemeColors {
  /** App background */
  background: string;
  /** Primary surface (cards, sheets) */
  surface: string;
  /** Secondary surface (grouped backgrounds) */
  surfaceSecondary: string;
  /** Tertiary surface (subtle differentiation) */
  surfaceTertiary: string;
  /** Primary text */
  text: string;
  /** Secondary text (subtitles, captions) */
  textSecondary: string;
  /** Tertiary / muted text */
  textTertiary: string;
  /** Inverted text (text on primary-colored backgrounds) */
  textInverse: string;
  /** Card border */
  border: string;
  /** Subtle border for dividers */
  borderLight: string;
  /** Primary brand color */
  primary: string;
  /** Lighter primary for backgrounds */
  primaryLight: string;
  /** Darker primary for pressed states */
  primaryDark: string;
  /** Income positive color */
  income: string;
  /** Expense negative color */
  expense: string;
  /** Success status */
  success: string;
  /** Warning status */
  warning: string;
  /** Danger / error status */
  danger: string;
  /** Informational status */
  info: string;
  /** Overlay / scrim for modals */
  overlay: string;
  /** Accent color (coral) for interactive highlights */
  accent: string;
  /** Light accent for backgrounds/tints */
  accentLight: string;
  /** Dark accent for pressed states */
  accentDark: string;
}

export const lightColors: ThemeColors = {
  background: palette.neutral[50],
  surface: palette.white,
  surfaceSecondary: '#FAF8F7',
  surfaceTertiary: '#F5F1F0',
  text: palette.neutral[900],
  textSecondary: palette.neutral[500],
  textTertiary: palette.neutral[400],
  textInverse: palette.white,
  border: palette.neutral[200],
  borderLight: palette.neutral[100],
  primary: palette.primary[600],
  primaryLight: palette.primary[50],
  primaryDark: palette.primary[700],
  income: palette.income,
  expense: palette.expense,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,
  overlay: 'rgba(0, 0, 0, 0.5)',
  accent: '#f58560',
  accentLight: '#fef0eb',
  accentDark: '#d96a40',
};

export const darkColors: ThemeColors = {
  background: '#2f0a18',
  surface: '#3d0a1e',
  surfaceSecondary: '#3d0a1e',
  surfaceTertiary: '#4a0d24',
  text: palette.neutral[50],
  textSecondary: palette.neutral[400],
  textTertiary: palette.neutral[500],
  textInverse: '#2f0a18',
  border: '#530c1e',
  borderLight: '#3d0a1e',
  primary: palette.primary[400],
  primaryLight: palette.primary[950],
  primaryDark: palette.primary[300],
  income: palette.income,
  expense: palette.expense,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,
  overlay: 'rgba(0, 0, 0, 0.7)',
  accent: '#f79b7a',
  accentLight: '#3d1a10',
  accentDark: '#f58560',
};
