import { useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '@/src/features/finance';
import { PlannerScreenLayout } from '@/src/features/finance/components/PlannerScreenLayout';

const STATUS_OPTIONS = ['To Buy', 'Bought', 'Prepared'];

export default function NocheBuenaScreen() {
  const { colors } = useTheme();
  const plannerItems = useFinanceStore((s) => s.plannerItems);
  const items = useMemo(() => plannerItems.filter((p) => p.plannerType === 'noche-buena'), [plannerItems]);
  const addPlannerItem = useFinanceStore((s) => s.addPlannerItem);
  const updatePlannerItem = useFinanceStore((s) => s.updatePlannerItem);
  const deletePlannerItem = useFinanceStore((s) => s.deletePlannerItem);

  const totalBudget = items.reduce((s, i) => s + i.amount, 0);
  const boughtCount = items.filter((i) => i.status === 'Bought').length;
  const preparedCount = items.filter((i) => i.status === 'Prepared').length;

  const summaryCard = useMemo(() => (
    <Card className="mb-4">
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${colors.danger}20` }}
        >
          <Icon name="sparkles-outline" size={22} color={colors.danger} />
        </View>
        <View className="flex-1">
          <Text variant="caption" className="text-neutral-500">Total Noche Buena Budget</Text>
          <Text variant="h3">{formatCurrency(totalBudget)}</Text>
        </View>
      </View>
      <View className="mt-2 flex-row" style={{ gap: 12 }}>
        <View className="flex-row items-center" style={{ gap: 4 }}>
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.success }} />
          <Text variant="caption" style={{ fontSize: 10 }} className="text-neutral-500">
            {preparedCount} prepared
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
            {items.length} items
          </Text>
        </View>
      </View>
    </Card>
  ), [totalBudget, preparedCount, boughtCount, items.length, colors.danger, colors.success, colors.warning, colors.border]);

  const onUpdateStatus = useCallback((id: string, status: string) => updatePlannerItem(id, { status }), [updatePlannerItem]);
  const onAddItem = useCallback(({ label, amount }: { label: string; amount: number }) => {
    addPlannerItem({
      plannerType: 'noche-buena',
      label,
      amount,
      status: 'To Buy',
      icon: 'restaurant-outline',
      color: '#EF4444',
    });
  }, [addPlannerItem]);

  return (
    <PlannerScreenLayout
      title="Noche Buena Planner"
      subtitle="Plan your Christmas Eve dinner shopping list and track your preparations."
      summaryCard={summaryCard}
      items={items}
      formatAmount={formatCurrency}
      addItemLabel="Add Dish"
      statusOptions={STATUS_OPTIONS}
      onUpdateStatus={onUpdateStatus}
      onDeleteItem={deletePlannerItem}
      onAddItem={onAddItem}
    />
  );
}
