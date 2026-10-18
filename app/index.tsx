import { Redirect } from 'expo-router';
import { appStorage } from '@lib/storage/mmkv';
import { STORAGE_KEYS } from '@lib/constants/app';

export default function Index() {
  const hasOnboarded = appStorage.getBoolean(STORAGE_KEYS.ONBOARDING_COMPLETE);

  if (!hasOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(app)/home" />;
}
