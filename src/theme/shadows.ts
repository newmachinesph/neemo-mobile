/**
 * Neemo Finance App - Shadow Presets
 *
 * Platform-compatible shadow definitions for cards and elevated surfaces.
 * Uses React Native shadow properties (iOS) and elevation (Android).
 */

import { Platform } from 'react-native';

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } satisfies ShadowStyle,

  sm: {
    shadowColor: '#2A2220',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } satisfies ShadowStyle,

  md: {
    shadowColor: '#2A2220',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } satisfies ShadowStyle,

  lg: {
    shadowColor: '#2A2220',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  } satisfies ShadowStyle,
} as const;

/**
 * Returns the shadow style adjusted for the current platform.
 * On Android, only `elevation` is used; on iOS, the full shadow properties apply.
 */
export function getShadow(level: keyof typeof shadows): ShadowStyle {
  const shadow = shadows[level];

  if (Platform.OS === 'android') {
    return {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: shadow.elevation,
    };
  }

  return shadow;
}

export type ShadowLevel = keyof typeof shadows;
