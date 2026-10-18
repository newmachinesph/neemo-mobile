import '../global.css';
import 'react-native-reanimated';

import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AppProviders } from '@/src/providers/AppProviders';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// ── Stable option objects (avoids re-creating on every render) ─────────────
const SCREEN_OPTIONS = { headerShown: false, headerBackVisible: false } as const;
const FADE_IN = { headerShown: false, animation: 'fade' } as const;
const NOT_FOUND_OPTS = { headerShown: true, title: 'Not Found' } as const;

function RootNavigator() {
  return (
    <>
      <Stack screenOptions={SCREEN_OPTIONS}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="govt-calculator" options={FADE_IN} />
        <Stack.Screen name="tax-tools" options={FADE_IN} />
        <Stack.Screen name="loan-calculator" options={FADE_IN} />
        <Stack.Screen name="credit-card-optimizer" options={FADE_IN} />
        <Stack.Screen name="thirteenth-month" options={FADE_IN} />
        <Stack.Screen name="fiesta-planner" options={FADE_IN} />
        <Stack.Screen name="aguinaldo-tracker" options={FADE_IN} />
        <Stack.Screen name="balikbayan-tracker" options={FADE_IN} />
        <Stack.Screen name="noche-buena" options={FADE_IN} />
        <Stack.Screen name="savings-challenges" options={FADE_IN} />
        <Stack.Screen name="lifestyle-inflation" options={FADE_IN} />
        <Stack.Screen name="year-review" options={FADE_IN} />
        <Stack.Screen name="transaction-templates" options={FADE_IN} />
        <Stack.Screen name="what-if-scenarios" options={FADE_IN} />

        <Stack.Screen name="manage-assets" options={FADE_IN} />
        <Stack.Screen name="manage-categories" options={FADE_IN} />
        <Stack.Screen name="wishlist" options={FADE_IN} />
        <Stack.Screen name="+not-found" options={NOT_FOUND_OPTS} />
      </Stack>

      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
