import { useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '@/src/features/finance';
import { PlannerScreenLayout } from '@/src/features/finance/components/PlannerScreenLayout';

const STATUS_OPTIONS = ['Packing', 'Shipped', 'Received'];

export default function BalikbayanTrackerScreen() {
  const { colors } = useTheme();
  const plannerItems = useFinanceStore((s) => s.plannerItems);
  const items = useMemo(() => plannerItems.filter((p) => p.plannerType === 'balikbayan'), [plannerItems]);
  const addPlannerItem = useFinanceStore((s) => s.addPlannerItem);
  const updatePlannerItem = useFinanceStore((s) => s.updatePlannerItem);
  const deletePlannerItem = useFinanceStore((s) => s.deletePlannerItem);

  const totalValue = items.reduce((s, i) => s + i.amount, 0);
  const receivedCount = items.filter((i) => i.status === 'Received').length;

  const summaryCard = useMemo(() => (
    <Card className="mb-4">
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${colors.info}20` }}
        >
          <Icon name="airplane-outline" size={22} color={colors.info} />
        </View>
        <View className="flex-1">
          <Text variant="caption" className="text-neutral-500">Total Estimated Value</Text>
          <Text variant="h3">{formatCurrency(totalValue)}</Text>
        </View>
      </View>
      <View className="mt-2 flex-row" style={{ gap: 12 }}>
        <Text variant="caption" style={{ fontSize: 10 }} className="text-neutral-500">
          {items.length} items
        </Text>
        <Text variant="caption" style={{ fontSize: 10 }} className="text-neutral-500">
          {receivedCount}/{items.length} received
        </Text>
      </View>
    </Card>
  ), [totalValue, receivedCount, items.length, colors.info]);

  const onUpdateStatus = useCallback((id: string, status: string) => updatePlannerItem(id, { status }), [updatePlannerItem]);
  const onAddItem = useCallback(({ label, amount }: { label: string; amount: number }) => {
    addPlannerItem({
      plannerType: 'balikbayan',
      label,
      amount,
      status: 'Packing',
      icon: 'cube-outline',
      color: '#F59E0B',
    });
  }, [addPlannerItem]);

  return (
    <PlannerScreenLayout
      title="Balikbayan Tracker"
      subtitle="Track incoming balikbayan boxes and their contents."
      summaryCard={summaryCard}
      items={items}
      formatAmount={formatCurrency}
      addItemLabel="Add Item"
      statusOptions={STATUS_OPTIONS}
      onUpdateStatus={onUpdateStatus}
      onDeleteItem={deletePlannerItem}
      onAddItem={onAddItem}
    />
  );
}
