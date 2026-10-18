import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { SectionHeader } from '@ui/components/SectionHeader';
import { Text } from '@ui/components/Text';
import { Avatar } from '@ui/components/Avatar';
import { Icon } from '@ui/components/Icon';
import { SkeletonCard, SkeletonRow } from '@ui/components/Skeleton';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { Card } from '@ui/components/Card';
import { hapticLight, hapticMedium, hapticSuccess } from '@lib/utils/haptics';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '@/src/features/finance';
import { HomeHeroCard } from '@/src/features/finance/components/HomeHeroCard';
import { HomeAccountsSummary } from '@/src/features/finance/components/HomeAccountsSummary';
import { RecentTransactionsSection } from '@/src/features/finance/components/RecentTransactionsSection';
import { KuripotScoreSheet } from '@/src/features/finance/components/KuripotScoreSheet';
import { HomeAttentionSection } from '@/src/features/home/components/HomeAttentionSection';
import { AddTransactionSheet } from '@/src/features/finance/components/AddTransactionSheet';
import { ForecastChart } from '@/src/features/finance/components/charts/ForecastChart';
import { MonthlyCheckInSheet } from '@/src/features/finance/components/MonthlyCheckInSheet';
import { useRecurringEngine } from '@/src/features/finance/hooks/useRecurringEngine';
import { useNotificationScheduler } from '@/src/features/finance/hooks/useNotificationScheduler';
import { STORAGE_KEYS } from '@/src/lib/constants/app';
import { appStorage } from '@/src/lib/storage/mmkv';
import type { BottomSheetModalRef } from '@/src/ui/components/BottomSheetModal';

const QUICK_ACCESS = [
  { id: 'budgets', label: 'Budgets', icon: 'pie-chart-outline', color: '#F59E0B' },
  { id: 'goals', label: 'Goals', icon: 'flag-outline', color: '#10B981' },
  { id: 'wishlist', label: 'Wishlist', icon: 'heart-outline', color: '#EC4899' },
  { id: 'bills', label: 'Bills', icon: 'receipt-outline', color: '#EF4444' },
  { id: 'utang', label: 'Utang', icon: 'people-outline', color: '#8B5CF6' },
  {
    id: 'transactions',
    label: 'History',
    icon: 'swap-horizontal-outline',
    color: '#6366F1',
  },
  { id: 'savings', label: 'Savings', icon: 'trending-up-outline', color: '#0D9488' },
  { id: 'apps', label: 'Apps', icon: 'grid-outline', color: '#64748B' },
] as const;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// StaggerIn alias for backward-compat with existing JSX
const StaggerIn = StaggeredFadeIn;

export default function HomeScreen() {
  const router = useRouter();
  const profile = useFinanceStore((s) => s.profile);
  const accounts = useFinanceStore((s) => s.accounts);
  const appNotifications = useFinanceStore((s) => s.appNotifications);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const toggleHideBalances = useFinanceStore((s) => s.toggleHideBalances);
  const unreadCount = useMemo(
    () => appNotifications.filter((n) => !n.isRead).length,
    [appNotifications],
  );
  const hasData = accounts.length > 0;
  const transactions = useFinanceStore((s) => s.transactions);
  const { colors } = useTheme();
  useRecurringEngine();
  useNotificationScheduler();

  // C1 fix: Reset budget spent to match current period's transactions on app launch
  const resetBudgetPeriods = useFinanceStore((s) => s.resetBudgetPeriods);
  const budgetResetRan = useRef(false);
  useEffect(() => {
    if (budgetResetRan.current) return;
    budgetResetRan.current = true;
    resetBudgetPeriods();
  }, [resetBudgetPeriods]);

  const firstName = profile?.name?.trim().split(' ')[0] || 'there';
  const headerIconColor = colors.text;
  const greeting = useMemo(() => getGreeting(), []); // eslint-disable-line react-hooks/exhaustive-deps — compute once per mount

  // Today's spending
  const todaySpending = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayTxns = transactions.filter(
      (t) => t.type === 'expense' && t.date.slice(0, 10) === today,
    );
    const total = todayTxns.reduce((sum, t) => sum + t.amount, 0);
    return { total, count: todayTxns.length };
  }, [transactions]);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    hapticLight();
    refreshTimer.current = setTimeout(() => {
      setRefreshing(false);
      hapticSuccess();
    }, 800);
  }, []);
  useEffect(() => () => clearTimeout(refreshTimer.current), []);

  // Loading skeleton
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Bottom sheet refs
  const addTxnSheetRef = useRef<GorhomBottomSheetModal>(null);
  const scoreSheetRef = useRef<GorhomBottomSheetModal>(null);
  const checkInSheetRef = useRef<BottomSheetModalRef>(null);

  // Monthly check-in prompt — show if >30 days since last check-in
  const showCheckInPrompt = useMemo(() => {
    const lastStr = appStorage.getString(STORAGE_KEYS.LAST_CHECKIN);
    if (!lastStr) return hasData; // never done, show if user has data
    const last = new Date(lastStr).getTime();
    if (isNaN(last)) return hasData; // corrupted date — treat as never done
    const daysSince = (Date.now() - last) / (24 * 60 * 60 * 1000);
    return daysSince >= 30;
  }, [hasData]);

  // Quick access navigation handler
  const handleQuickAccess = useCallback(
    (id: string) => {
      hapticLight();
      switch (id) {
        case 'budgets':
          router.push('/(app)/insights');
          break;
        case 'goals':
          router.push({ pathname: '/(app)/insights', params: { tab: 'goals' } });
          break;
        case 'wishlist':
          router.push('/wishlist');
          break;
        case 'bills':
          router.push({ pathname: '/(app)/insights', params: { tab: 'subs' } });
          break;
        case 'utang':
          router.push({ pathname: '/(app)/finance', params: { tab: 'utang' } });
          break;
        case 'transactions':
          router.push({
            pathname: '/(app)/finance',
            params: { tab: 'transactions' },
          });
          break;
        case 'savings':
          router.push('/savings-challenges');
          break;
        case 'apps':
          router.push('/(app)/(apps)');
          break;
      }
    },
    [router],
  );

  return (
    <View style={{ flex: 1 }}>
    <ScreenContainer
      edges={['top', 'left', 'right']}
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      {/* ── Header ── */}
      <View className="mb-3 mt-2 flex-row items-center justify-between">
        <View className="shrink">
          <Text variant="caption" className="text-neutral-500">{greeting}</Text>
          <Text variant="h3" numberOfLines={1}>{firstName}</Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <Pressable
            onPress={() => {
              hapticLight();
              toggleHideBalances();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hideBalances ? 'Show balances' : 'Hide balances'}
          >
            <Icon
              name={hideBalances ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={headerIconColor}
            />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(app)/notifications')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
            }
          >
            <View>
              <Icon name="notifications-outline" size={24} color={headerIconColor} />
              {unreadCount > 0 && (
                <View
                  className="absolute -top-1 -right-1 items-center justify-center rounded-full bg-red-500"
                  style={{ minWidth: 16, height: 16, paddingHorizontal: 4 }}
                  importantForAccessibility="no-hide-descendants"
                >
                  <Text
                    variant="caption"
                    className="text-white font-sans-bold"
                    style={{ fontSize: 9, lineHeight: 12 }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(app)/profile')}
            accessibilityRole="button"
            accessibilityLabel="Go to profile"
          >
            <Avatar initials={firstName.slice(0, 1)} size="lg" />
          </Pressable>
        </View>
      </View>

      {/* ── Skeleton loading ── */}
      {!isLoaded && hasData && (
        <View style={{ gap: 12 }}>
          <SkeletonCard />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      )}

      {/* ── Empty State ── */}
      {isLoaded && !hasData && (
        <Card className="mb-4 items-center py-8">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary-50">
            <Icon name="wallet-outline" size={32} color={colors.primary} />
          </View>
          <Text variant="h3" className="mb-1 text-center">
            Welcome, {firstName}!
          </Text>
          <Text variant="caption" className="mb-4 text-center" style={{ maxWidth: 260 }}>
            Start by adding an account in the Finance tab to track your money.
          </Text>
          <Pressable
            onPress={() => {
              hapticLight();
              router.push('/(app)/finance');
            }}
            accessibilityRole="button"
            accessibilityLabel="Get started"
            className="flex-row items-center rounded-full bg-primary-600 px-6 py-2.5"
          >
            <Icon name="add-outline" size={18} color="#FFFFFF" />
            <Text
              variant="caption"
              className="ml-1 font-sans-semibold"
              style={{ color: '#FFFFFF' }}
            >
              Get Started
            </Text>
          </Pressable>
        </Card>
      )}

      {/* ── Main Content (staggered entrance) ── */}
      {isLoaded && hasData && (
        <>
          {/* Tier 1: Hero Card */}
          <StaggerIn delay={0}>
            <HomeHeroCard todaySpending={todaySpending} />
          </StaggerIn>

          {/* Tier 1.5: Cash Flow Forecast */}
          <StaggerIn delay={60}>
            <Card className="mb-2">
              <View className="flex-row items-center justify-between mb-2">
                <Text variant="caption" className="font-sans-semibold text-neutral-500">
                  30-Day Cash Flow
                </Text>
              </View>
              <ForecastChart days={30} height={120} compact />
            </Card>
          </StaggerIn>

          {/* Tier 2: Attention Section */}
          <StaggerIn delay={120}>
            <HomeAttentionSection scoreSheetRef={scoreSheetRef} />
          </StaggerIn>

          {/* Tier 2.5: Quick Access — 4 per row */}
          <StaggerIn delay={240}>
            <SectionHeader title="Quick Access" />
            <View
              className="mb-3 flex-row flex-wrap justify-between"
              style={{ rowGap: 16 }}
            >
              {QUICK_ACCESS.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleQuickAccess(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  className="items-center active:scale-90"
                  style={{ width: '23%' }}
                >
                  <View
                    className="mb-1.5 h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: item.color }}
                  >
                    <Icon
                      name={item.icon as React.ComponentProps<typeof Icon>['name']}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text
                    variant="caption"
                    className="text-center"
                    style={{ fontSize: 11 }}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </StaggerIn>

          {/* Tier 2.75: Monthly Check-In Prompt */}
          {showCheckInPrompt && (
            <StaggerIn delay={300}>
              <Pressable
                onPress={() => {
                  hapticLight();
                  checkInSheetRef.current?.present();
                }}
                accessibilityRole="button"
                accessibilityLabel="Monthly check-in"
                className="mb-3"
              >
                <Card className="flex-row items-center" style={{ gap: 12 }}>
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900">
                    <Icon name="calendar-outline" size={20} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text variant="body" className="font-sans-semibold">Monthly Check-In</Text>
                    <Text variant="caption" className="text-neutral-500" style={{ fontSize: 11 }}>
                      Update your balances and review your goals
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
                </Card>
              </Pressable>
            </StaggerIn>
          )}

          {/* Tier 3: Accounts + Recent */}
          <StaggerIn delay={showCheckInPrompt ? 360 : 300}>
            <HomeAccountsSummary />
            <RecentTransactionsSection limit={3} />
          </StaggerIn>
        </>
      )}

      {/* ── Bottom Sheets ── */}
      <AddTransactionSheet sheetRef={addTxnSheetRef} />
      <KuripotScoreSheet sheetRef={scoreSheetRef} />
      <MonthlyCheckInSheet sheetRef={checkInSheetRef} />
    </ScreenContainer>

    {/* FAB — outside ScreenContainer so it floats above scroll */}
    <Pressable
      onPress={() => {
        hapticMedium();
        addTxnSheetRef.current?.present();
      }}
      accessibilityRole="button"
      accessibilityLabel="Add transaction"
      className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary-500 shadow-lg active:scale-95"
      style={{ elevation: 8 }}
    >
      <Icon name="add" size={28} color="#FFFFFF" />
    </Pressable>
    </View>
  );
}
