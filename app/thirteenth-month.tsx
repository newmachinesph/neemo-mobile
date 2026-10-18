import { useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { ProgressBar } from '@ui/components/ProgressBar';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '@/src/features/finance';
import { PlannerScreenLayout } from '@/src/features/finance/components/PlannerScreenLayout';
import type { PlannerItem } from '@/src/features/finance/components/PlannerScreenLayout';

const ALLOCATIONS = [
  { id: 'savings', label: 'Savings', pct: 0.4, icon: 'trending-up-outline', color: '#22C55E' },
  { id: 'debts', label: 'Debt Payments', pct: 0.2, icon: 'card-outline', color: '#EF4444' },
  { id: 'gifts', label: 'Gifts & Abuloy', pct: 0.2, icon: 'gift-outline', color: '#F59E0B' },
  { id: 'holiday', label: 'Holiday Fund', pct: 0.2, icon: 'snow-outline', color: '#3B82F6' },
];

export default function ThirteenthMonthScreen() {
  const { colors } = useTheme();
  const transactions = useFinanceStore((s) => s.transactions);
  const plannerItems = useFinanceStore((s) => s.plannerItems);
  const storedItems = useMemo(() => plannerItems.filter((p) => p.plannerType === 'thirteenth-month'), [plannerItems]);
  const addPlannerItem = useFinanceStore((s) => s.addPlannerItem);

  const lastSalary = useMemo(() => {
    const salaryTxns = transactions
      .filter((t) => t.type === 'income' && t.category === 'salary')
      .sort((a, b) => b.date.localeCompare(a.date));
    return salaryTxns[0]?.amount || 0;
  }, [transactions]);

  const defaultItems: PlannerItem[] = useMemo(() => ALLOCATIONS.map((a) => ({
    id: a.id,
    label: a.label,
    amount: Math.round(lastSalary * a.pct),
    status: `${Math.round(a.pct * 100)}% allocation`,
    icon: a.icon,
    color: a.color,
  })), [lastSalary]);

  const allItems = useMemo(() => [...defaultItems, ...storedItems], [defaultItems, storedItems]);

  const summaryCard = useMemo(() => (
    <Card className="mb-4">
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${colors.warning}15` }}
        >
          <Icon name="cash-outline" size={22} color={colors.warning} />
        </View>
        <View className="flex-1">
          <Text variant="caption" style={{ color: colors.textTertiary }}>Estimated 13th Month Pay</Text>
          <Text variant="h3">{formatCurrency(lastSalary)}</Text>
        </View>
      </View>
      <View className="mt-3" style={{ gap: 6 }}>
        {ALLOCATIONS.map((a) => (
          <View key={a.id}>
            <View className="flex-row items-center justify-between">
              <Text variant="caption" style={{ fontSize: 11, color: colors.textTertiary }}>{a.label}</Text>
              <Text variant="caption" style={{ fontSize: 11, color: colors.text }}>
                {formatCurrency(Math.round(lastSalary * a.pct))}
              </Text>
            </View>
            <ProgressBar progress={a.pct} height="sm" color="primary" />
          </View>
        ))}
      </View>
    </Card>
  ), [lastSalary, colors.warning]);

  const onAddItem = useCallback(({ label, amount }: { label: string; amount: number }) => {
    addPlannerItem({
      plannerType: 'thirteenth-month',
      label,
      amount,
      status: 'Custom',
      icon: 'cash-outline',
      color: '#8B5CF6',
    });
  }, [addPlannerItem]);

  return (
    <PlannerScreenLayout
      title="13th Month Planner"
      subtitle="Plan how to allocate your 13th month pay wisely."
      summaryCard={summaryCard}
      items={allItems}
      formatAmount={formatCurrency}
      addItemLabel="Add Allocation"
      onAddItem={onAddItem}
    />
  );
}
