import { useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { useFinanceStore } from '@features/finance/store/finance.store';

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (Platform.OS === 'web') return; // op-sqlite is native-only

    try {
      // Dynamic requires so the native module isn't bundled on web
      const { initDatabase } = require('@db/index');
      const { migrateFromMMKV } = require('@db/migrate-from-mmkv');

      initDatabase();
      migrateFromMMKV(); // one-time: MMKV → SQLite (no-op if already migrated)
      useFinanceStore.getState()._hydrate();
      setReady(true);
    } catch (error) {
      if (__DEV__) console.error('[DatabaseProvider] Failed to initialize:', error);
      setReady(true); // still render children so the app isn't stuck
    }
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
