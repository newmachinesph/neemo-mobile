import { useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { ProgressBar } from '@ui/components/ProgressBar';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { EmptyState } from '@ui/components/EmptyState';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '@/src/features/finance';
import { CATEGORY_MAP } from '@lib/constants/finance';

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Screen ─────────────────────────────────────────────────────────────────

export default function YearReviewScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const transactions = useFinanceStore((s) => s.transactions);
  const goals = useFinanceStore((s) => s.goals);

  const currentYear = new Date().getFullYear();

  const review = useMemo(() => {
    // Filter transactions for the current year
    const yearTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear;
    });

    if (yearTxns.length === 0) return null;

    // Total earned & spent
    const totalEarned = yearTxns
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpent = yearTxns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSaved = totalEarned - totalSpent;
    const savingsRate = totalEarned > 0 ? Math.round((totalSaved / totalEarned) * 100) : 0;

    // Top 5 expense categories
    const catMap: Record<string, number> = {};
    for (const t of yearTxns) {
      if (t.type !== 'expense') continue;
      catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
    }

    const topCategories = Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([catId, amount]) => {
        const meta = CATEGORY_MAP.get(catId);
        return {
          label: meta?.label ?? catId,
          amount,
          icon: meta?.icon ?? 'ellipsis-horizontal-outline',
          color: meta?.color ?? colors.textTertiary,
        };
      });

    // Goals achieved
    const goalsAchieved = goals.filter((g) => g.currentAmount >= g.targetAmount).length;
    const totalGoals = goals.length;

    // Best saving month (income - expenses per month)
    const monthNet: Record<number, number> = {};
    for (const t of yearTxns) {
      const month = new Date(t.date).getMonth();
      if (!monthNet[month]) monthNet[month] = 0;
      if (t.type === 'income') {
        monthNet[month]! += t.amount;
      } else if (t.type === 'expense') {
        monthNet[month]! -= t.amount;
      }
    }

    let bestMonth = '';
    let bestAmount = -Infinity;
    for (const [monthIdx, net] of Object.entries(monthNet)) {
      if (net > bestAmount) {
        bestAmount = net;
        bestMonth = MONTH_NAMES[parseInt(monthIdx, 10)] ?? '';
      }
    }

    // Biggest single expense
    const expenses = yearTxns.filter((t) => t.type === 'expense');
    let biggestExpense = '';
    let biggestExpenseAmount = 0;
    for (const t of expenses) {
      if (t.amount > biggestExpenseAmount) {
        biggestExpenseAmount = t.amount;
        biggestExpense = t.description || t.merchantName;
      }
    }

    return {
      totalEarned,
      totalSpent,
      totalSaved,
      savingsRate,
      topCategories,
      goalsAchieved,
      totalGoals,
      bestSavingMonth: bestMonth,
      bestSavingAmount: bestAmount === -Infinity ? 0 : bestAmount,
      biggestExpense,
      biggestExpenseAmount,
    };
  }, [transactions, goals, currentYear]);

  const headerLeft = useCallback(() => null, []);
  const headerRight = useCallback(() => (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      className="mr-2"
      accessibilityRole="button"
      accessibilityLabel="Close screen"
    >
      <Icon name="close" size={24} color={colors.text} />
    </Pressable>
  ), [colors.text, router]);
  const headerTitleStyle = useMemo(() => ({ fontFamily: 'Inter-SemiBold' as const, fontSize: 17 }), []);
  const headerStyle = useMemo(() => ({ backgroundColor: colors.background }), [colors.background]);
  const screenOptions = useMemo(() => ({
    headerShown: true,
    title: `${currentYear} Year in Review`,
    headerTitleStyle,
    headerLeft,
    headerRight,
    headerShadowVisible: false,
    headerStyle,
    headerTintColor: colors.text,
  }), [currentYear, headerTitleStyle, headerLeft, headerRight, headerStyle, colors.text]);

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <ScreenContainer edges={['bottom', 'left', 'right']}>
        {!review ? (
          <EmptyState
            icon="calendar-outline"
            title="No data yet"
            description="Start tracking your finances to see your year in review!"
          />
        ) : (
          <>
            {/* Hero */}
            <StaggeredFadeIn index={0}>
              <View
                className="mb-4 items-center rounded-2xl p-6"
                style={{ backgroundColor: colors.primary }}
              >
                <Text variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  YOUR YEAR IN NUMBERS
                </Text>
                <Text variant="h1" style={{ color: '#FFFFFF', fontSize: 42, lineHeight: 48 }}>
                  {currentYear}
                </Text>
                <View className="mt-4 flex-row" style={{ gap: 24 }}>
                  <View className="items-center">
                    <Text variant="caption" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>Earned</Text>
                    <Text variant="body" className="font-sans-bold" style={{ color: '#FFFFFF' }}>
                      {formatCurrency(review.totalEarned)}
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text variant="caption" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>Spent</Text>
                    <Text variant="body" className="font-sans-bold" style={{ color: '#FFFFFF' }}>
                      {formatCurrency(review.totalSpent)}
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text variant="caption" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>Saved</Text>
                    <Text variant="body" className="font-sans-bold" style={{ color: colors.success }}>
                      {formatCurrency(review.totalSaved)}
                    </Text>
                  </View>
                </View>
                <View className="mt-3 rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  <Text variant="caption" style={{ color: '#FFFFFF', fontSize: 11 }}>
                    {review.savingsRate}% savings rate
                  </Text>
                </View>
              </View>
            </StaggeredFadeIn>

            {/* Top Categories */}
            {review.topCategories.length > 0 && (
              <StaggeredFadeIn index={1}>
                <Text variant="body" className="mb-2 font-sans-semibold">Top 5 Spending Categories</Text>
                <Card className="mb-4">
                  <View style={{ gap: 10 }}>
                    {review.topCategories.map((cat, i) => (
                      <View key={cat.label}>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center" style={{ gap: 8 }}>
                            <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10, width: 14 }}>
                              {i + 1}
                            </Text>
                            <Icon
                              name={cat.icon as React.ComponentProps<typeof Icon>['name']}
                              size={16}
                              color={cat.color}
                            />
                            <Text variant="body" className="font-sans-medium" style={{ fontSize: 13 }}>
                              {cat.label}
                            </Text>
                          </View>
                          <Text variant="body" className="font-sans-semibold" style={{ fontSize: 13 }}>
                            {formatCurrency(cat.amount)}
                          </Text>
                        </View>
                        <ProgressBar
                          progress={cat.amount / (review.topCategories[0]?.amount || 1)}
                          height="sm"
                          color="primary"
                        />
                      </View>
                    ))}
                  </View>
                </Card>
              </StaggeredFadeIn>
            )}

            {/* Highlights */}
            <StaggeredFadeIn index={2}>
              <Text variant="body" className="mb-2 font-sans-semibold">Highlights</Text>
              <View className="flex-row" style={{ gap: 12 }}>
                <Card className="flex-1">
                  <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${colors.success}20` }}>
                    <Icon name="trophy-outline" size={18} color={colors.success} />
                  </View>
                  <Text variant="body" className="mt-2 font-sans-semibold" style={{ fontSize: 13 }}>
                    {review.goalsAchieved}/{review.totalGoals}
                  </Text>
                  <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>Goals Achieved</Text>
                </Card>
                <Card className="flex-1">
                  <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${colors.info}20` }}>
                    <Icon name="star-outline" size={18} color={colors.info} />
                  </View>
                  <Text variant="body" className="mt-2 font-sans-semibold" style={{ fontSize: 13 }}>
                    {review.bestSavingMonth || '—'}
                  </Text>
                  <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>
                    Best month ({formatCurrency(review.bestSavingAmount)} saved)
                  </Text>
                </Card>
              </View>
            </StaggeredFadeIn>

            {review.biggestExpense ? (
              <StaggeredFadeIn index={3}>
                <Card className="mt-3 mb-2">
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${colors.danger}20` }}>
                      <Icon name="flame-outline" size={18} color={colors.danger} />
                    </View>
                    <View className="flex-1">
                      <Text variant="body" className="font-sans-semibold" style={{ fontSize: 13 }}>Biggest Single Expense</Text>
                      <Text variant="caption" style={{ color: colors.textTertiary }}>
                        {review.biggestExpense} — {formatCurrency(review.biggestExpenseAmount)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </StaggeredFadeIn>
            ) : null}
          </>
        )}
      </ScreenContainer>
    </>
  );
}
