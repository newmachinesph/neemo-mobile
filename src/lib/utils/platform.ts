import { Platform } from 'react-native';

/** True when running on iOS (iPhone / iPad). */
export const isIOS: boolean = Platform.OS === 'ios';

/** True when running on Android. */
export const isAndroid: boolean = Platform.OS === 'android';

/** True when running in a web browser. */
export const isWeb: boolean = Platform.OS === 'web';

/**
 * Returns the current platform as a typed literal.
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Platform.OS as 'ios' | 'android' | 'web';
}

/**
 * Select a value based on the current platform.
 * Falls back to `defaultValue` if the platform key is not present.
 */
export function platformSelect<T>(options: {
  ios?: T;
  android?: T;
  web?: T;
  default: T;
}): T {
  return Platform.select({
    ios: options.ios,
    android: options.android,
    web: options.web,
    default: options.default,
  }) as T;
}
