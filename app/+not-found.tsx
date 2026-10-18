import { View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@ui/components/Text';
import { useTheme } from '@theme/ThemeProvider';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found', headerShown: true }} />
      <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark">
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <Ionicons name="alert-circle-outline" size={40} color={colors.textTertiary} />
          </View>

          <Text variant="h2" className="mb-2 text-center">
            Page Not Found
          </Text>

          <Text variant="body" className="mb-8 text-center text-neutral-500 dark:text-neutral-400">
            The page you are looking for does not exist or has been moved.
          </Text>

          <Link href="/(app)/home" asChild>
            <Text variant="body" className="font-sans-semibold text-primary-500">
              Go Home
            </Text>
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}
