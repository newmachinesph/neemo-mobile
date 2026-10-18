/**
 * Persistent key-value storage using react-native-mmkv.
 * Data persists across app restarts.
 */

import { createMMKV } from 'react-native-mmkv';

/** Main application storage instance. */
export const appStorage = createMMKV({ id: 'neemo-app-storage' });

/** Isolated storage for mini app data. */
export const miniAppStorage = createMMKV({ id: 'neemo-miniapp-storage' });
