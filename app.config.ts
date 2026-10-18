import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Neemo',
  slug: 'neemo',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'neemo',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,

  ios: {
    supportsTablet: true,
    bundleIdentifier: 'one.neemo',
    buildNumber: '1',
    infoPlist: {
      NSFaceIDUsageDescription:
        'Authenticate with Face ID to access your financial data',
      NSCameraUsageDescription:
        'Take photos of receipts to automatically log transactions',
      NSPhotoLibraryUsageDescription:
        'Choose receipt photos from your library to log transactions',
      NSUserTrackingUsageDescription:
        'This helps us improve your experience with personalized features',
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: ['remote-notification'],
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType:
            'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType:
            'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
        {
          NSPrivacyAccessedAPIType:
            'NSPrivacyAccessedAPICategoryDiskSpace',
          NSPrivacyAccessedAPITypeReasons: ['E174.1'],
        },
      ],
    },
  },

  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
      backgroundColor: '#F8F4EF',
    },
    edgeToEdgeEnabled: true,
    package: 'one.neemo',
  },

  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#F8F4EF',
      },
    ],
    'expo-secure-store',
    'expo-local-authentication',
    [
      'expo-notifications',
      {
        color: '#9b1b3c',
      },
    ],
    './expoPlugins/withUseThirdPartySQLitePod',
    'expo-camera',
  ],

  updates: {
    url: 'https://u.expo.dev/8c2fd57c-5c7e-45a2-8cfb-ac10b2742ecb',
  },

  runtimeVersion: {
    policy: 'fingerprint' as const,
  },

  extra: {
    eas: {
      projectId: '8c2fd57c-5c7e-45a2-8cfb-ac10b2742ecb',
    },
  },

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
