/**
 * Neemo Finance App - Theme Provider
 *
 * Detects system color scheme and provides theme context to the app.
 * Supplies both the resolved color values and the current mode string.
 * Supports user-selectable theme preference (system / light / dark).
 */

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

import { lightColors, darkColors } from './colors';
import type { ThemeColors } from './colors';
import { appStorage } from '@lib/storage/mmkv';
import { STORAGE_KEYS } from '@lib/constants/app';

export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface ThemeContextValue {
  /** Current color mode */
  colorScheme: ColorScheme;
  /** Whether the app is currently in dark mode */
  isDark: boolean;
  /** Resolved theme color values */
  colors: ThemeColors;
  /** User's theme preference */
  themePreference: ThemePreference;
  /** Update the user's theme preference */
  setThemePreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredPreference(): ThemePreference {
  const stored = appStorage.getString(STORAGE_KEYS.THEME);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

export interface ThemeProviderProps {
  /** Force a specific color scheme instead of using the system preference */
  forcedColorScheme?: ColorScheme;
  children: React.ReactNode;
}

export function ThemeProvider({ forcedColorScheme, children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const [themePreference, setThemePrefState] = useState<ThemePreference>(readStoredPreference);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    setThemePrefState(pref);
    appStorage.set(STORAGE_KEYS.THEME, pref);
  }, []);

  const resolvedScheme = useMemo<ColorScheme>(() => {
    if (forcedColorScheme) return forcedColorScheme;
    if (themePreference === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themePreference;
  }, [forcedColorScheme, systemColorScheme, themePreference]);

  // Sync NativeWind's color scheme so dark: classes activate correctly
  useEffect(() => {
    setColorScheme(resolvedScheme);
  }, [resolvedScheme, setColorScheme]);

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = resolvedScheme === 'dark';

    return {
      colorScheme: resolvedScheme,
      isDark,
      colors: isDark ? darkColors : lightColors,
      themePreference,
      setThemePreference,
    };
  }, [resolvedScheme, themePreference, setThemePreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access the current theme context.
 * Must be used within a ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
