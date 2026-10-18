import { View, ScrollView } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '../store/finance.store';
import { useReports } from '../hooks/useReports';
import { PieChart } from './charts/PieChart';
import { LineChart } from './charts/LineChart';

export function ReportsTab() {
  const { colors } = useTheme();
  const { spendingByCategory, incomeVsExpenses, monthlyTrend, topMerchants } = useReports();
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);

  const maxBarAmount = Math.max(incomeVsExpenses.income, incomeVsExpenses.expenses, 1);

  return (
    <ScrollView contentContainerClassName="pb-24" showsVerticalScrollIndicator={false}>
      {/* Income vs Expenses */}
      <Card className="mb-4">
        <Text variant="label" className="mb-1">Income vs Expenses</Text>
        <Text variant="caption" className="mb-1">This month</Text>
        <View className="mt-3 gap-3">
          {/* Income bar */}
          <View>
            <View className="mb-1 flex-row items-center justify-between">
              <Text variant="caption" className="font-sans-medium">Income</Text>
              <Text variant="caption" className="font-sans-semibold" style={{ color: colors.income }}>
                {amt(incomeVsExpenses.income)}
              </Text>
            </View>
            <View className="h-3 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <View
                className="h-full rounded-full"
                style={{
                  backgroundColor: colors.income,
                  width: `${Math.round((incomeVsExpenses.income / maxBarAmount) * 100)}%`,
                }}
              />
            </View>
          </View>
          {/* Expenses bar */}
          <View>
            <View className="mb-1 flex-row items-center justify-between">
              <Text variant="caption" className="font-sans-medium">Expenses</Text>
              <Text variant="caption" className="font-sans-semibold" style={{ color: colors.expense }}>
                {amt(incomeVsExpenses.expenses)}
              </Text>
            </View>
            <View className="h-3 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <View
                className="h-full rounded-full"
                style={{
                  backgroundColor: colors.expense,
                  width: `${Math.round((incomeVsExpenses.expenses / maxBarAmount) * 100)}%`,
                }}
              />
            </View>
          </View>
        </View>
        {/* Net */}
        <View className="mt-3 flex-row items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <Text variant="caption" className="font-sans-medium">Net</Text>
          <Text
            variant="body"
            className="font-sans-bold"
            style={{ color: incomeVsExpenses.net >= 0 ? colors.income : colors.expense }}
          >
            {incomeVsExpenses.net >= 0 ? '+' : ''}
            {amt(incomeVsExpenses.net)}
          </Text>
        </View>
      </Card>

      {/* Spending by Category */}
      <Card className="mb-4">
        <Text variant="label" className="mb-1">Spending by Category</Text>
        <Text variant="caption" className="mb-3">This month</Text>
        {spendingByCategory.length === 0 ? (
          <Text variant="caption" className="py-4 text-center">No expenses this month</Text>
        ) : (
          <PieChart
            data={spendingByCategory.map((cat) => ({
              label: cat.label,
              value: cat.total,
              color: cat.color,
            }))}
          />
        )}
      </Card>

      {/* Monthly Trend */}
      <Card className="mb-4">
        <Text variant="label" className="mb-1">Monthly Trend</Text>
        <Text variant="caption" className="mb-3">Last 6 months</Text>
        <LineChart
          data={monthlyTrend.map((m) => ({ label: m.month, value: m.income }))}
          color={colors.income}
          secondaryData={monthlyTrend.map((m) => ({ label: m.month, value: m.expenses }))}
          secondaryColor={colors.expense}
        />
        <View className="mt-2 flex-row justify-center gap-4">
          <View className="flex-row items-center gap-1">
            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.income }} />
            <Text variant="caption" style={{ fontSize: 10 }}>Income</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.expense }} />
            <Text variant="caption" style={{ fontSize: 10 }}>Expenses</Text>
          </View>
        </View>
      </Card>

      {/* Top Merchants */}
      <Card className="mb-4">
        <Text variant="label" className="mb-1">Top Merchants</Text>
        <Text variant="caption" className="mb-1">This month</Text>
        <View className="mt-3 gap-2">
          {topMerchants.length === 0 && (
            <Text variant="caption" className="py-4 text-center">No expenses this month</Text>
          )}
          {topMerchants.map((merchant, idx) => (
            <View key={merchant.name} className="flex-row items-center py-1">
              <View className="mr-3 h-7 w-7 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <Text variant="caption" className="font-sans-bold" style={{ fontSize: 11 }}>
                  {idx + 1}
                </Text>
              </View>
              <View className="flex-1">
                <Text variant="body" className="font-sans-medium" numberOfLines={1}>
                  {merchant.name}
                </Text>
                <Text variant="caption">{merchant.count} transaction{merchant.count > 1 ? 's' : ''}</Text>
              </View>
              <Text variant="body" className="font-sans-semibold">
                {amt(merchant.total)}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}
