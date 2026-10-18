import React, { useEffect, useRef, type ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { isWeb } from '@lib/utils/platform';

// ────────────────────────────────────────────────────────────────────────────
// Configure how incoming notifications are shown when the app is foregrounded.
// ────────────────────────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

async function registerForPushNotifications(): Promise<string | null> {
  if (isWeb) return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      if (__DEV__) console.info('[Notifications] Permission not granted.');
      return null;
    }

    // Android needs a notification channel.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#b91c4a',
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch {
    // Firebase/FCM not configured yet — expected during development.
    if (__DEV__) console.warn('[Notifications] Push registration skipped (FCM not configured).');
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────────────────────────────────

interface NotificationProviderProps {
  children: ReactNode;
  /** Callback invoked when a push token is obtained. Use it to send the token to your backend. */
  onTokenReceived?: (token: string) => void;
  /** Callback invoked when the user interacts with a notification. */
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
}

export function NotificationProvider({
  children,
  onTokenReceived,
  onNotificationResponse,
}: NotificationProviderProps) {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const onTokenRef = useRef(onTokenReceived);
  const onResponseRef = useRef(onNotificationResponse);
  onTokenRef.current = onTokenReceived;
  onResponseRef.current = onNotificationResponse;

  useEffect(() => {
    // Register for push notifications and forward the token.
    registerForPushNotifications().then((token) => {
      if (token) {
        onTokenRef.current?.(token);
      }
    }).catch(() => {
      // Push notification registration may fail on simulators or restricted devices
    });

    // Listen for incoming notifications while the app is foregrounded.
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (__DEV__) console.info('[Notifications] Received:', notification.request.identifier);
      },
    );

    // Listen for user taps / interactions on notifications.
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        onResponseRef.current?.(response);
      },
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return <>{children}</>;
}
