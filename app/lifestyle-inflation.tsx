import { useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { formatCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '@/src/features/finance';
import { CATEGORY_MAP } from '@lib/constants/finance';
import { useTheme } from '@theme/ThemeProvider';

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Returns "YYYY-MM" key for a Date. */
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Returns a human-readable short month name from a "YYYY-MM" key. */
function monthLabel(key: string): string {
  const [, m] = key.split('-');
  return MONTH_NAMES[parseInt(m!, 10) - 1]?.slice(0, 3) ?? key;
}

function getChangeColor(pctChange: number, colors: { danger: string; warning: string; success: string }): string {
  if (pctChange > 10) return colors.danger;
  if (pctChange > 0) return colors.warning;
  return colors.success;
}

// ── Types ──────────────────────────────────────────────────────────────────

type CategoryRow = {
  id: string;
  label: string;
  icon: string;
  color: string;
  amounts: number[]; // one per month, oldest first
  change: number; // % change first → last
};

// ── Screen ─────────────────────────────────────────────────────────────────

export default function LifestyleInflationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const transactions = useFinanceStore((s) => s.transactions);

  const { months, categories, totals, overallChange, hasEnoughData } = useMemo(() => {
    // Get the last 3 calendar months (including current)
    const now = new Date();
    const targetMonths: string[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      targetMonths.push(monthKey(d));
    }

    // Filter expense transactions that fall within those months
    const expenses = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const k = monthKey(new Date(t.date));
      return targetMonths.includes(k);
    });

    // Check if there are expenses in at least 2 distinct months
    const monthsWithData = new Set(expenses.map((t) => monthKey(new Date(t.date))));
    if (monthsWithData.size < 2) {
      return {
        months: targetMonths,
        categories: [] as CategoryRow[],
        totals: [0, 0, 0],
        overallChange: 0,
        hasEnoughData: false,
      };
    }

    // Group by category → month → sum
    const catMonthMap: Record<string, Record<string, number>> = {};
    for (const t of expenses) {
      const k = monthKey(new Date(t.date));
      if (!catMonthMap[t.category]) catMonthMap[t.category] = {};
      catMonthMap[t.category]![k] = (catMonthMap[t.category]![k] ?? 0) + t.amount;
    }

    // Build per-category rows
    const rows: CategoryRow[] = Object.entries(catMonthMap)
      .map(([catId, monthSums]) => {
        const meta = CATEGORY_MAP.get(catId);
        const amounts = targetMonths.map((m) => monthSums[m] ?? 0);
        // Find first non-zero month as baseline for % change
        const firstNonZero = amounts.find((a) => a > 0) ?? 0;
        const last = amounts[amounts.length - 1] ?? 0;
        const change = firstNonZero > 0
          ? Math.round(((last - firstNonZero) / firstNonZero) * 100)
          : 0;
        return {
          id: catId,
          label: meta?.label ?? catId,
          icon: meta?.icon ?? 'ellipsis-horizontal-outline',
          color: meta?.color ?? colors.textTertiary,
          amounts,
          change,
        };
      })
      // Sort by total spending (descending)
      .sort((a, b) => {
        const sumA = a.amounts.reduce((s, v) => s + v, 0);
        const sumB = b.amounts.reduce((s, v) => s + v, 0);
        return sumB - sumA;
      });

    // Compute totals per month
    const monthTotals = targetMonths.map((m) =>
      rows.reduce((sum, row) => sum + (row.amounts[targetMonths.indexOf(m)] ?? 0), 0),
    );

    const first = monthTotals[0] ?? 0;
    const last = monthTotals[monthTotals.length - 1] ?? 0;
    const overall = first > 0 ? Math.round(((last - first) / first) * 100) : 0;

    return {
      months: targetMonths,
      categories: rows,
      totals: monthTotals,
      overallChange: overall,
      hasEnoughData: true,
    };
  }, [transactions]);

  const headerLeft = useCallback(() => null, []);
  const headerRight = useCallback(() => (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      className="mr-2"
      accessibilityRole="button"
      accessibilityLabel="Close lifestyle inflation tracker"
    >
      <Icon name="close" size={24} color={colors.text} />
    </Pressable>
  ), [colors.text, router]);
  const headerTitleStyle = useMemo(() => ({ fontFamily: 'Inter-SemiBold' as const, fontSize: 17 }), []);
  const headerStyle = useMemo(() => ({ backgroundColor: colors.background }), [colors.background]);
  const screenOptions = useMemo(() => ({
    headerShown: true,
    title: 'Lifestyle Inflation',
    headerTitleStyle,
    headerLeft,
    headerRight,
    headerShadowVisible: false,
    headerStyle,
    headerTintColor: colors.text,
  }), [headerTitleStyle, headerLeft, headerRight, headerStyle, colors.text]);

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <ScreenContainer edges={['bottom', 'left', 'right']}>
        <StaggeredFadeIn index={0}>
          <Text variant="caption" className="mb-4" style={{ color: colors.textTertiary }}>
            Track how your spending habits change over time to avoid lifestyle creep.
          </Text>
        </StaggeredFadeIn>

        {!hasEnoughData ? (
          <StaggeredFadeIn index={1}>
            <Card className="items-center py-8">
              <Icon name="bar-chart-outline" size={40} color={colors.textTertiary} />
              <Text variant="body" className="mt-3 text-center font-sans-medium" style={{ color: colors.textTertiary }}>
                Need at least 2 months of transactions to show inflation trends.
              </Text>
            </Card>
          </StaggeredFadeIn>
        ) : (
          <>
            {/* Overall Summary */}
            <StaggeredFadeIn index={1}>
              <Card className="mb-4">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text variant="caption" style={{ color: colors.textTertiary }}>Overall Change</Text>
                    <Text
                      variant="h2"
                      style={{ color: overallChange > 0 ? colors.danger : colors.success }}
                    >
                      {overallChange > 0 ? '+' : ''}{overallChange}%
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text variant="caption" style={{ color: colors.textTertiary }}>
                      {monthLabel(months[0]!)} → {monthLabel(months[months.length - 1]!)}
                    </Text>
                    <Text variant="body" className="font-sans-medium">
                      {formatCurrency(totals[0]!)} → {formatCurrency(totals[totals.length - 1]!)}
                    </Text>
                  </View>
                </View>
              </Card>
            </StaggeredFadeIn>

            {/* Header Row */}
            <StaggeredFadeIn index={2}>
              <View className="mb-2 flex-row items-center px-1">
                <Text variant="caption" className="flex-1 font-sans-medium" style={{ fontSize: 10 }}>Category</Text>
                {months.map((m) => (
                  <Text key={m} variant="caption" className="w-20 text-right font-sans-medium" style={{ fontSize: 10 }}>
                    {monthLabel(m)}
                  </Text>
                ))}
                <Text variant="caption" className="w-14 text-right font-sans-medium" style={{ fontSize: 10 }}>Change</Text>
              </View>

              {/* Category Rows */}
              <View style={{ gap: 6 }}>
                {categories.map((cat) => (
                  <Card key={cat.id} className="flex-row items-center py-2.5">
                    <View className="flex-1 flex-row items-center" style={{ gap: 8 }}>
                      <Icon
                        name={cat.icon as React.ComponentProps<typeof Icon>['name']}
                        size={16}
                        color={cat.color}
                      />
                      <Text variant="caption" className="font-sans-medium" style={{ fontSize: 11 }}>
                        {cat.label}
                      </Text>
                    </View>
                    {cat.amounts.map((amt, i) => (
                      <Text key={i} variant="caption" className="w-20 text-right" style={{ fontSize: 10 }}>
                        {formatCurrency(amt)}
                      </Text>
                    ))}
                    <Text
                      variant="caption"
                      className="w-14 text-right font-sans-semibold"
                      style={{ fontSize: 10, color: getChangeColor(cat.change, colors) }}
                    >
                      {cat.change > 0 ? '+' : ''}{cat.change}%
                    </Text>
                  </Card>
                ))}
              </View>
            </StaggeredFadeIn>
          </>
        )}
      </ScreenContainer>
    </>
  );
}
