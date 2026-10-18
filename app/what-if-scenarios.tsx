import { useState, useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Input } from '@ui/components/Input';
import { Icon } from '@ui/components/Icon';
import { ProgressBar } from '@ui/components/ProgressBar';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { formatCurrency } from '@lib/utils/currency';
import { hapticLight } from '@lib/utils/haptics';
import { useFinanceStore } from '@features/finance';
import { useTheme } from '@theme/ThemeProvider';

const PRESETS = [
  { label: 'Buy a motorcycle', amount: 120000, monthly: 4800, months: 36, icon: 'bicycle-outline' },
  { label: 'New iPhone', amount: 89990, monthly: 3750, months: 24, icon: 'phone-portrait-outline' },
  { label: 'Condo down payment', amount: 500000, monthly: 15000, months: 48, icon: 'home-outline' },
  { label: 'Start a side business', amount: 50000, monthly: 0, months: 0, icon: 'briefcase-outline' },
] as const;

export default function WhatIfScenariosScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const transactions = useFinanceStore((s) => s.transactions);
  const accounts = useFinanceStore((s) => s.accounts);

  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customMonthly, setCustomMonthly] = useState('');

  // Compute real financial defaults from store data
  const defaults = useMemo(() => {
    const now = new Date();
    // H3 fix: Use date-only comparison to avoid timezone issues with ISO strings
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const cutoff = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;

    // Filter transactions from the last 3 months
    const recentTxns = transactions.filter((t) => t.date.slice(0, 10) >= cutoff);

    // Determine how many distinct months are covered
    const monthsSet = new Set(
      recentTxns.map((t) => {
        const d = new Date(t.date);
        return `${d.getFullYear()}-${d.getMonth()}`;
      }),
    );
    const monthsCovered = Math.max(monthsSet.size, 1);

    const totalIncome3m = recentTxns
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses3m = recentTxns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyIncome = totalIncome3m / monthsCovered;
    const monthlyExpenses = totalExpenses3m / monthsCovered;
    const monthlySavingsRate = monthlyIncome - monthlyExpenses;

    // Current savings: sum of all account balances where balance > 0
    const currentSavings = accounts.reduce(
      (sum, a) => sum + (a.balance > 0 ? a.balance : 0),
      0,
    );

    const hasData = transactions.length > 0;

    return {
      monthlyIncome,
      monthlyExpenses,
      monthlySavingsRate,
      currentSavings,
      hasData,
    };
  }, [transactions, accounts]);

  const scenario = useMemo(() => {
    const lumpSum = selectedPreset !== null
      ? PRESETS[selectedPreset]!.amount
      : parseFloat(customAmount) || 0;
    const monthlyHit = selectedPreset !== null
      ? PRESETS[selectedPreset]!.monthly
      : parseFloat(customMonthly) || 0;

    if (lumpSum <= 0 && monthlyHit <= 0) return null;

    const { monthlyIncome, monthlyExpenses, monthlySavingsRate, currentSavings } = defaults;

    const currentMonthlySavings = Math.max(monthlySavingsRate, 1);
    const newMonthlySavings = Math.max(currentMonthlySavings - monthlyHit, 0);

    // Emergency fund: target = 6 months of expenses, current = savings on hand
    const efTarget = monthlyExpenses * 6;
    const efCurrent = currentSavings;
    const efRemaining = Math.max(efTarget - efCurrent, 0);
    const efMonthsBefore = efRemaining > 0
      ? Math.ceil(efRemaining / (currentMonthlySavings * 0.3))
      : 0;
    const efMonthsAfter = newMonthlySavings > 0 && efRemaining > 0
      ? Math.ceil(efRemaining / (newMonthlySavings * 0.3))
      : efRemaining > 0 ? Infinity : 0;
    const efDelay = efMonthsAfter === Infinity ? 99 : efMonthsAfter - efMonthsBefore;

    // Freedom timeline: target = 10 years of expenses, current = savings on hand
    const freedomTarget = monthlyExpenses * 12 * 10;
    const freedomCurrent = currentSavings;
    const freedomRemaining = freedomTarget - freedomCurrent - lumpSum;
    const freedomMonthsBefore = currentMonthlySavings > 0
      ? Math.ceil((freedomTarget - freedomCurrent) / currentMonthlySavings)
      : Infinity;
    const freedomMonthsAfter = newMonthlySavings > 0
      ? Math.ceil(Math.max(freedomRemaining, 0) / newMonthlySavings)
      : Infinity;
    const freedomDelay = freedomMonthsAfter === Infinity || freedomMonthsBefore === Infinity
      ? 99
      : freedomMonthsAfter - freedomMonthsBefore;

    const cashFlowImpact = monthlyHit > 0 ? -monthlyHit : 0;
    const savingsRateBefore = monthlyIncome > 0 ? (currentMonthlySavings / monthlyIncome) * 100 : 0;
    const savingsRateAfter = monthlyIncome > 0 ? (newMonthlySavings / monthlyIncome) * 100 : 0;

    return {
      lumpSum,
      monthlyHit,
      cashFlowImpact,
      efDelay,
      freedomDelay,
      savingsRateBefore: Math.round(savingsRateBefore),
      savingsRateAfter: Math.round(savingsRateAfter),
    };
  }, [selectedPreset, customAmount, customMonthly, defaults]);

  const headerLeft = useCallback(() => null, []);
  const headerRight = useCallback(() => (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      className="mr-2"
      accessibilityRole="button"
      accessibilityLabel="Close what-if scenarios"
    >
      <Icon name="close" size={24} color={colors.text} />
    </Pressable>
  ), [colors.text, router]);
  const headerTitleStyle = useMemo(() => ({ fontFamily: 'Inter-SemiBold' as const, fontSize: 17 }), []);
  const headerStyle = useMemo(() => ({ backgroundColor: colors.background }), [colors.background]);
  const screenOptions = useMemo(() => ({
    headerShown: true,
    title: 'What-If Scenarios',
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
            Test big financial decisions before you commit. See how they affect your goals.
          </Text>

          {/* No-data hint */}
          {!defaults.hasData && (
            <View
              className="mb-4 rounded-2xl p-3"
              style={{
                backgroundColor: `${colors.warning}20`,
                borderWidth: 1,
                borderColor: `${colors.warning}30`,
              }}
            >
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Icon name="information-circle-outline" size={16} color={colors.warning} />
                <Text variant="caption" style={{ color: colors.warning, fontSize: 12 }}>
                  Add transactions for personalized projections
                </Text>
              </View>
            </View>
          )}

          {/* Real data summary */}
          {defaults.hasData && (
            <Card className="mb-4">
              <Text variant="caption" className="mb-2 font-sans-semibold" style={{ color: colors.text }}>
                Your Financial Snapshot
              </Text>
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>Avg Monthly Income</Text>
                  <Text variant="body" className="font-sans-semibold" style={{ color: colors.success }}>
                    {formatCurrency(defaults.monthlyIncome)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>Avg Monthly Expenses</Text>
                  <Text variant="body" className="font-sans-semibold" style={{ color: colors.danger }}>
                    {formatCurrency(defaults.monthlyExpenses)}
                  </Text>
                </View>
              </View>
              <View className="mt-2 flex-row justify-between">
                <View className="flex-1">
                  <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>Monthly Savings</Text>
                  <Text variant="body" className="font-sans-semibold" style={{ color: colors.info }}>
                    {formatCurrency(defaults.monthlySavingsRate)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>Current Savings</Text>
                  <Text variant="body" className="font-sans-semibold" style={{ color: colors.text }}>
                    {formatCurrency(defaults.currentSavings)}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Presets */}
          <Text variant="body" className="mb-2 font-sans-semibold">Quick Scenarios</Text>
          <View className="mb-4 flex-row flex-wrap" style={{ gap: 8 }}>
            {PRESETS.map((p, i) => (
              <Pressable
                key={p.label}
                onPress={() => {
                  hapticLight();
                  setSelectedPreset(selectedPreset === i ? null : i);
                  setCustomAmount('');
                  setCustomMonthly('');
                }}
                className={`flex-row items-center rounded-xl border px-3 py-2 ${
                  selectedPreset === i ? 'border-primary-500 bg-primary-500/10' : 'border-neutral-200 dark:border-neutral-700'
                }`}
                accessibilityRole="button"
                accessibilityLabel={`Scenario: ${p.label}, ${formatCurrency(p.amount)}`}
                accessibilityState={{ selected: selectedPreset === i }}
              >
                <Icon
                  name={p.icon as React.ComponentProps<typeof Icon>['name']}
                  size={16}
                  color={selectedPreset === i ? colors.primary : colors.textTertiary}
                />
                <Text
                  variant="caption"
                  className="ml-1.5 font-sans-medium"
                  style={{ color: selectedPreset === i ? colors.primary : colors.text, fontSize: 12 }}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Custom input */}
          {selectedPreset === null && (
            <Card className="mb-4 gap-3">
              <Text variant="caption" className="font-sans-semibold" style={{ color: colors.text }}>
                Or enter custom values
              </Text>
              <Input
                label="One-time cost (₱)"
                placeholder="e.g. 120000"
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="numeric"
              />
              <Input
                label="Monthly installment (₱)"
                placeholder="e.g. 4800"
                value={customMonthly}
                onChangeText={setCustomMonthly}
                keyboardType="numeric"
              />
            </Card>
          )}
        </StaggeredFadeIn>

        {/* Results */}
        {scenario && (
          <StaggeredFadeIn index={1}>
            <Text variant="body" className="mb-2 font-sans-semibold">Impact Analysis</Text>

            {/* Impact Cards */}
            <View className="mb-3 flex-row" style={{ gap: 8 }}>
              <Card className="flex-1">
                <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>Monthly Cash Flow</Text>
                <Text variant="body" className="mt-1 font-sans-bold" style={{ color: colors.danger }}>
                  {scenario.cashFlowImpact < 0 ? formatCurrency(scenario.cashFlowImpact) : '₱0'}/mo
                </Text>
              </Card>
              <Card className="flex-1">
                <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>Emergency Fund</Text>
                <Text variant="body" className="mt-1 font-sans-bold" style={{ color: scenario.efDelay > 0 ? colors.danger : colors.success }}>
                  {scenario.efDelay > 12 ? '12+ months' : `+${scenario.efDelay} months`}
                </Text>
              </Card>
            </View>

            <View className="mb-4 flex-row" style={{ gap: 8 }}>
              <Card className="flex-1">
                <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>Freedom Timeline</Text>
                <Text variant="body" className="mt-1 font-sans-bold" style={{ color: scenario.freedomDelay > 0 ? colors.warning : colors.success }}>
                  {scenario.freedomDelay > 24 ? '2+ years' : `+${scenario.freedomDelay} months`}
                </Text>
              </Card>
              <Card className="flex-1">
                <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>Lump Sum Cost</Text>
                <Text variant="body" className="mt-1 font-sans-bold" style={{ color: colors.text }}>
                  {formatCurrency(scenario.lumpSum)}
                </Text>
              </Card>
            </View>

            {/* Savings Rate Comparison */}
            <Card className="mb-4">
              <Text variant="caption" className="mb-2 font-sans-semibold" style={{ color: colors.text }}>
                Savings Rate Impact
              </Text>
              <View className="flex-row items-center justify-between">
                <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 11 }}>Before</Text>
                <Text variant="caption" className="font-sans-bold" style={{ color: colors.success }}>
                  {scenario.savingsRateBefore}%
                </Text>
              </View>
              <ProgressBar progress={scenario.savingsRateBefore / 100} height="sm" color="success" />
              <View className="mt-2 flex-row items-center justify-between">
                <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 11 }}>After</Text>
                <Text
                  variant="caption"
                  className="font-sans-bold"
                  style={{ color: scenario.savingsRateAfter < 20 ? colors.danger : colors.warning }}
                >
                  {scenario.savingsRateAfter}%
                </Text>
              </View>
              <ProgressBar
                progress={scenario.savingsRateAfter / 100}
                height="sm"
                color={scenario.savingsRateAfter < 20 ? 'danger' : 'warning'}
              />
            </Card>

            {/* Verdict */}
            <View
              className="rounded-2xl p-4"
              style={{
                backgroundColor: scenario.efDelay > 6
                  ? `${colors.danger}15`
                  : `${colors.success}15`,
                borderWidth: 1,
                borderColor: scenario.efDelay > 6
                  ? `${colors.danger}30`
                  : `${colors.success}30`,
              }}
            >
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <Icon
                  name={scenario.efDelay > 6 ? 'warning-outline' : 'checkmark-circle-outline'}
                  size={20}
                  color={scenario.efDelay > 6 ? colors.danger : colors.success}
                />
                <Text variant="body" className="flex-1 font-sans-semibold" style={{ fontSize: 13 }}>
                  {scenario.efDelay > 6
                    ? 'Consider waiting — this significantly delays your safety net.'
                    : 'Manageable impact — you can still hit your key goals on time.'}
                </Text>
              </View>
            </View>
          </StaggeredFadeIn>
        )}
      </ScreenContainer>
    </>
  );
}
