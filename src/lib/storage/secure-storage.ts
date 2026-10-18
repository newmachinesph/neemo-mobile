import * as SecureStore from 'expo-secure-store';

const TOKEN_KEYS = ['access_token', 'refresh_token'] as const;

type TokenKey = (typeof TOKEN_KEYS)[number] | (string & {});

/**
 * Retrieve a value from secure storage.
 * Returns null if the key does not exist or if reading fails.
 */
export async function getToken(key: TokenKey): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    if (__DEV__) console.error(`[SecureStorage] Failed to get token for key "${key}":`, error);
    return null;
  }
}

/**
 * Persist a value in secure storage (encrypted on device).
 */
export async function setToken(key: TokenKey, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    if (__DEV__) console.error(`[SecureStorage] Failed to set token for key "${key}":`, error);
    throw error;
  }
}

/**
 * Delete a single entry from secure storage.
 */
export async function deleteToken(key: TokenKey): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    if (__DEV__) console.error(`[SecureStorage] Failed to delete token for key "${key}":`, error);
    throw error;
  }
}

/**
 * Remove all known auth tokens from secure storage.
 */
export async function clearTokens(): Promise<void> {
  try {
    await Promise.all(TOKEN_KEYS.map((key) => SecureStore.deleteItemAsync(key)));
  } catch (error) {
    if (__DEV__) console.error('[SecureStorage] Failed to clear tokens:', error);
    throw error;
  }
}
