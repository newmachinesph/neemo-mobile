import React, { type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider, useTheme } from '@theme/ThemeProvider';
import { DatabaseProvider } from '@providers/DatabaseProvider';
import { ErrorBoundary } from '@ui/components/ErrorBoundary';
import { useAppLock } from '@/src/features/auth/hooks/useAppLock';
import { AppLockScreen } from '@/src/features/auth/components/AppLockScreen';

interface AppProvidersProps {
  children: ReactNode;
}

function AppLockGate({ children }: { children: ReactNode }) {
  const { isLocked, isPINSet, isHydrated } = useAppLock();

  // Wait for SecureStore hydration before deciding what to show
  // This prevents a flash of app content before the lock screen appears
  if (!isHydrated) return null;

  if (isLocked && isPINSet) {
    return <AppLockScreen />;
  }

  return <>{children}</>;
}

/** Reads the resolved color scheme from ThemeProvider and passes it to React Navigation */
function AppInner({ children }: { children: ReactNode }) {
  const { colorScheme } = useTheme();

  return (
    <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DatabaseProvider>
        <BottomSheetModalProvider>
          <AppLockGate>
            {children}
          </AppLockGate>
        </BottomSheetModalProvider>
      </DatabaseProvider>
    </NavThemeProvider>
  );
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <AppInner>
            {children}
          </AppInner>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
