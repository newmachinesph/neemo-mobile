import { useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '@/src/features/finance';
import { PlannerScreenLayout } from '@/src/features/finance/components/PlannerScreenLayout';

const STATUS_OPTIONS = ['Planned', 'Bought', 'Given'];

export default function AguinaldoTrackerScreen() {
  const { colors } = useTheme();
  const plannerItems = useFinanceStore((s) => s.plannerItems);
  const items = useMemo(() => plannerItems.filter((p) => p.plannerType === 'aguinaldo'), [plannerItems]);
  const addPlannerItem = useFinanceStore((s) => s.addPlannerItem);
  const updatePlannerItem = useFinanceStore((s) => s.updatePlannerItem);
  const deletePlannerItem = useFinanceStore((s) => s.deletePlannerItem);

  const totalBudget = items.reduce((s, r) => s + r.amount, 0);
  const givenCount = items.filter((r) => r.status === 'Given').length;
  const boughtCount = items.filter((r) => r.status === 'Bought').length;

  const summaryCard = useMemo(() => (
    <Card className="mb-4">
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${colors.danger}20` }}
        >
          <Icon name="gift-outline" size={22} color={colors.danger} />
        </View>
        <View className="flex-1">
          <Text variant="caption" className="text-neutral-500">Total Aguinaldo Budget</Text>
          <Text variant="h3">{formatCurrency(totalBudget)}</Text>
        </View>
      </View>
      <View className="mt-2 flex-row" style={{ gap: 12 }}>
        <View className="flex-row items-center" style={{ gap: 4 }}>
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.success }} />
          <Text variant="caption" style={{ fontSize: 10 }} className="text-neutral-500">
            {givenCount} given
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 4 }}>
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.warning }} />
          <Text variant="caption" style={{ fontSize: 10 }} className="text-neutral-500">
            {boughtCount} bought
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 4 }}>
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.border }} />
          <Text variant="caption" style={{ fontSize: 10 }} className="text-neutral-500">
            {items.length - givenCount - boughtCount} planned
          </Text>
        </View>
      </View>
    </Card>
  ), [totalBudget, givenCount, boughtCount, items.length, colors.danger, colors.success, colors.warning, colors.border]);

  const onUpdateStatus = useCallback((id: string, status: string) => updatePlannerItem(id, { status }), [updatePlannerItem]);
  const onAddItem = useCallback(({ label, amount }: { label: string; amount: number }) => {
    addPlannerItem({
      plannerType: 'aguinaldo',
      label,
      amount,
      status: 'Planned',
      icon: 'gift-outline',
      color: '#8B5CF6',
    });
  }, [addPlannerItem]);

  return (
    <PlannerScreenLayout
      title="Aguinaldo Tracker"
      subtitle="Track your Christmas gift-giving for family and loved ones."
      summaryCard={summaryCard}
      items={items}
      formatAmount={formatCurrency}
      addItemLabel="Add Recipient"
      statusOptions={STATUS_OPTIONS}
      onUpdateStatus={onUpdateStatus}
      onDeleteItem={deletePlannerItem}
      onAddItem={onAddItem}
    />
  );
}
