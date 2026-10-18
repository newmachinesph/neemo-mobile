import { useRef, useState } from 'react';
import { View, Alert, Switch, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Avatar } from '@ui/components/Avatar';
import { ListItem } from '@ui/components/ListItem';
import { Icon } from '@ui/components/Icon';
import { Button } from '@ui/components/Button';
import { Divider } from '@ui/components/Divider';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { appStorage } from '@lib/storage/mmkv';
import { STORAGE_KEYS, APP_VERSION } from '@lib/constants/app';
import { EMPLOYMENT_TYPE_LABELS } from '@lib/constants/finance';
import { useFinanceStore } from '@/src/features/finance';
import { useAppLock } from '@/src/features/auth/hooks/useAppLock';
import { PINPad } from '@/src/features/auth/components/PINPad';
import { EditProfileSheet } from '@/src/features/finance/components/EditProfileSheet';
import { CurrencyPickerSheet } from '@/src/features/finance/components/CurrencyPickerSheet';
import { ExportDataSheet } from '@/src/features/finance/components/ExportDataSheet';
import { BottomSheetModal } from '@ui/components/BottomSheetModal';
import { useTheme } from '@theme/ThemeProvider';
import type { ThemePreference } from '@theme/ThemeProvider';

const THEME_CYCLE: ThemePreference[] = ['system', 'light', 'dark'];
const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

const LOCK_TIMEOUT_OPTIONS = [
  { value: 0, label: 'Immediately' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const profile = useFinanceStore((s) => s.profile);
  const resetStore = useFinanceStore((s) => s.resetStore);
  const firstName = profile?.name?.trim().split(' ')[0] || '';
  const { themePreference, setThemePreference } = useTheme();

  const {
    isPINSet,
    isBiometricEnabled,
    isBiometricAvailable,
    lockTimeout,
    setPIN,
    removePIN,
    lock,
    toggleBiometric,
    setLockTimeout,
  } = useAppLock();

  const [settingPIN, setSettingPIN] = useState(false);
  const notificationPreferences = useFinanceStore((s) => s.notificationPreferences);
  const updateNotificationPreference = useFinanceStore(
    (s) => s.updateNotificationPreference,
  );

  const editProfileRef = useRef<GorhomBottomSheetModal>(null);
  const currencyPickerRef = useRef<GorhomBottomSheetModal>(null);
  const exportDataRef = useRef<GorhomBottomSheetModal>(null);
  const faqRef = useRef<GorhomBottomSheetModal>(null);

  function cycleTheme() {
    const currentIdx = THEME_CYCLE.indexOf(themePreference);
    const nextIdx = (currentIdx + 1) % THEME_CYCLE.length;
    setThemePreference(THEME_CYCLE[nextIdx]!);
  }

  function cycleLockTimeout() {
    const currentIdx = LOCK_TIMEOUT_OPTIONS.findIndex((o) => o.value === lockTimeout);
    const nextIdx = (currentIdx + 1) % LOCK_TIMEOUT_OPTIONS.length;
    setLockTimeout(LOCK_TIMEOUT_OPTIONS[nextIdx]!.value);
  }

  function handleLockScreen() {
    lock();
  }

  function handleResetAccount() {
    Alert.alert(
      'Reset Account',
      'This will erase all your data and start fresh. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetStore();
            appStorage.remove(STORAGE_KEYS.ONBOARDING_COMPLETE);
            appStorage.remove(STORAGE_KEYS.THEME);
            setThemePreference('system');
            router.replace('/onboarding');
          },
        },
      ],
    );
  }

  // Show PIN setup screen
  if (settingPIN) {
    return (
      <ScreenContainer scrollable={false} edges={['top', 'left', 'right']}>
        <PINPad
          title="Set New PIN"
          subtitle="Choose a 6-digit PIN"
          onComplete={async (pin) => {
            await setPIN(pin);
            setSettingPIN(false);
            Alert.alert('PIN Set', 'Your app lock PIN has been set.');
          }}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      {/* Profile header */}
      <StaggeredFadeIn index={0}>
        <View className="mb-6 mt-2 items-center">
          <Avatar initials={firstName.slice(0, 1) || '?'} size="lg" className="mb-3" />
          <Text variant="h2">{profile.name || 'User'}</Text>
          {profile.email ? <Text variant="caption">{profile.email}</Text> : null}
          {profile.employmentType && (
            <Text variant="caption" className="mt-1 text-neutral-500">
              {EMPLOYMENT_TYPE_LABELS[profile.employmentType]}
            </Text>
          )}
        </View>
      </StaggeredFadeIn>

      {/* Account section */}
      <StaggeredFadeIn index={1}>
        <Card className="mb-3 px-0">
          <Text variant="label" className="mb-2 px-4">
            Account
          </Text>
          <ListItem
            title="Personal Info"
            leftIcon={<Icon name="person-outline" size={20} color={colors.primary} />}
            showChevron
            onPress={() => editProfileRef.current?.present()}
          />
          <Divider className="mx-4" />
          <ListItem
            title="Currency"
            leftIcon={<Icon name="cash-outline" size={20} color={colors.primary} />}
            rightValue={profile.currency}
            showChevron
            onPress={() => currencyPickerRef.current?.present()}
          />
        </Card>
      </StaggeredFadeIn>

      {/* Security */}
      <StaggeredFadeIn index={2}>
        <Card className="mb-3 px-0">
          <Text variant="label" className="mb-2 px-4">
            Security
          </Text>
          <ListItem
            title="PIN Lock"
            subtitle={isPINSet ? 'Enabled' : 'Not set'}
            leftIcon={<Icon name="lock-closed-outline" size={20} color={colors.primary} />}
            rightElement={
              <Switch
                value={isPINSet}
                onValueChange={(enabled) => {
                  if (enabled) {
                    setSettingPIN(true);
                  } else {
                    Alert.alert('Remove PIN', 'Are you sure you want to remove your PIN?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: removePIN },
                    ]);
                  }
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          {isPINSet && (
            <>
              <Divider className="mx-4" />
              {isBiometricAvailable && (
                <ListItem
                  title="Biometric Unlock"
                  subtitle="Use biometrics to unlock"
                  leftIcon={<Icon name="finger-print-outline" size={20} color={colors.primary} />}
                  rightElement={
                    <Switch
                      value={isBiometricEnabled}
                      onValueChange={toggleBiometric}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  }
                />
              )}
              <Divider className="mx-4" />
              <ListItem
                title="Auto-lock Timer"
                leftIcon={<Icon name="timer-outline" size={20} color={colors.primary} />}
                rightValue={
                  LOCK_TIMEOUT_OPTIONS.find((o) => o.value === lockTimeout)?.label ??
                  'Immediately'
                }
                onPress={cycleLockTimeout}
              />
            </>
          )}
        </Card>
      </StaggeredFadeIn>

      {/* Preferences */}
      <StaggeredFadeIn index={3}>
        <Card className="mb-3 px-0">
          <Text variant="label" className="mb-2 px-4">
            Preferences
          </Text>
          <ListItem
            title="Theme"
            leftIcon={<Icon name="moon-outline" size={20} color={colors.primary} />}
            rightValue={THEME_LABELS[themePreference]}
            onPress={cycleTheme}
          />
          <Divider className="mx-4" />
          <ListItem
            title="Manage Categories"
            subtitle="Categories, payees & tags"
            leftIcon={<Icon name="pricetags-outline" size={20} color={colors.primary} />}
            showChevron
            onPress={() => router.push('/manage-categories')}
          />
        </Card>
      </StaggeredFadeIn>

      {/* Notifications */}
      <StaggeredFadeIn index={4}>
        <Card className="mb-3 px-0">
          <Text variant="label" className="mb-2 px-4">
            Notifications
          </Text>
          <ListItem
            title="Bill Reminders"
            subtitle="3 days before, 1 day before, day of"
            leftIcon={<Icon name="receipt-outline" size={20} color={colors.primary} />}
            rightElement={
              <Switch
                value={notificationPreferences.billReminders}
                onValueChange={(v) => updateNotificationPreference('billReminders', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <Divider className="mx-4" />
          <ListItem
            title="Budget Alerts"
            subtitle="At 80% and 100% of budget"
            leftIcon={<Icon name="alert-circle-outline" size={20} color={colors.primary} />}
            rightElement={
              <Switch
                value={notificationPreferences.budgetAlerts}
                onValueChange={(v) => updateNotificationPreference('budgetAlerts', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <Divider className="mx-4" />
          <ListItem
            title="Recurring Reminders"
            subtitle="Upcoming recurring transactions"
            leftIcon={<Icon name="refresh-outline" size={20} color={colors.primary} />}
            rightElement={
              <Switch
                value={notificationPreferences.recurringReminders}
                onValueChange={(v) => updateNotificationPreference('recurringReminders', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </Card>
      </StaggeredFadeIn>

      {/* Data & Privacy */}
      <StaggeredFadeIn index={5}>
        <Card className="mb-3 px-0">
          <Text variant="label" className="mb-2 px-4">
            Data & Privacy
          </Text>
          <ListItem
            title="Data stays on your phone"
            subtitle="Your financial data is stored locally"
            leftIcon={<Icon name="shield-checkmark-outline" size={20} color={colors.success} />}
            showChevron={false}
          />
          <Divider className="mx-4" />
          <ListItem
            title="Export Data"
            leftIcon={<Icon name="download-outline" size={20} color={colors.primary} />}
            showChevron
            onPress={() => exportDataRef.current?.present()}
          />
          <Divider className="mx-4" />
          <ListItem
            title="Reset Account"
            subtitle="Erase all data and start fresh"
            leftIcon={<Icon name="trash-outline" size={20} color={colors.danger} />}
            onPress={handleResetAccount}
          />
        </Card>
      </StaggeredFadeIn>

      {/* Support */}
      <StaggeredFadeIn index={6}>
        <Card className="mb-6 px-0">
          <Text variant="label" className="mb-2 px-4">
            Support
          </Text>
          <ListItem
            title={`About Neemo v${APP_VERSION}`}
            leftIcon={<Icon name="information-circle-outline" size={20} color={colors.primary} />}
            showChevron={false}
          />
          <Divider className="mx-4" />
          <ListItem
            title="FAQ"
            subtitle="Common questions answered"
            leftIcon={<Icon name="help-circle-outline" size={20} color={colors.primary} />}
            showChevron
            onPress={() => faqRef.current?.present()}
          />
        </Card>
      </StaggeredFadeIn>

      {/* Lock screen */}
      {isPINSet && (
        <Button variant="outline" onPress={handleLockScreen} className="mb-4">
          Lock Screen
        </Button>
      )}

      <EditProfileSheet sheetRef={editProfileRef} />
      <CurrencyPickerSheet sheetRef={currencyPickerRef} />
      <ExportDataSheet sheetRef={exportDataRef} />

      {/* FAQ Sheet */}
      <BottomSheetModal sheetRef={faqRef} snapPoints={['70%']}>
        <View>
          <Text variant="h3" className="mb-4 text-center">
            Frequently Asked Questions
          </Text>
          <View style={{ gap: 16 }}>
            {[
              {
                q: 'Is my data safe?',
                a: 'Yes! All your financial data is stored locally on your device. Nothing is sent to any server.',
              },
              {
                q: 'How do I add an account?',
                a: 'Go to the Finance tab and tap the + button to add a bank account, e-wallet, or cash account.',
              },
              {
                q: 'What is Kuripot Score?',
                a: "It's your personal financial health score based on savings rate, budget adherence, emergency fund, and debt ratio.",
              },
              {
                q: 'Can I export my data?',
                a: 'Yes! Go to Profile > Export Data to download your transactions and accounts as a file.',
              },
              {
                q: 'How do budgets work?',
                a: "Create budgets per category in the Insights tab. Neemo tracks your spending and alerts you when you're close to your limit.",
              },
              {
                q: 'What is "Free to Spend"?',
                a: "It's your remaining budget for the month after accounting for bills and committed expenses.",
              },
              {
                q: 'How do recurring transactions work?',
                a: 'Mark any transaction as recurring when adding it. Neemo will automatically create future entries and send reminders.',
              },
              {
                q: 'Is Neemo really free?',
                a: 'Yes, Neemo is completely free with no ads.',
              },
            ].map((item, i) => (
              <View key={i}>
                <Text variant="body" className="font-sans-semibold mb-1">
                  {item.q}
                </Text>
                <Text
                  variant="caption"
                  className="text-neutral-500 dark:text-neutral-400"
                >
                  {item.a}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </BottomSheetModal>

    </ScreenContainer>
  );
}
