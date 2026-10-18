import { useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '@/src/features/finance';
import { PlannerScreenLayout } from '@/src/features/finance/components/PlannerScreenLayout';

const STATUS_OPTIONS = ['Planned', 'Saving', 'Upcoming', 'Done'];

export default function FiestaPlannerScreen() {
  const { colors } = useTheme();
  const plannerItems = useFinanceStore((s) => s.plannerItems);
  const items = useMemo(() => plannerItems.filter((p) => p.plannerType === 'fiesta'), [plannerItems]);
  const addPlannerItem = useFinanceStore((s) => s.addPlannerItem);
  const updatePlannerItem = useFinanceStore((s) => s.updatePlannerItem);
  const deletePlannerItem = useFinanceStore((s) => s.deletePlannerItem);

  const totalBudget = items.reduce((s, f) => s + f.amount, 0);

  const summaryCard = useMemo(() => (
    <Card className="mb-4">
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${colors.warning}20` }}
        >
          <Icon name="balloon-outline" size={22} color={colors.warning} />
        </View>
        <View className="flex-1">
          <Text variant="caption" className="text-neutral-500">Total Fiesta Budget</Text>
          <Text variant="h3">{formatCurrency(totalBudget)}</Text>
        </View>
        <View className="items-center rounded-full px-3 py-1" style={{ backgroundColor: `${colors.success}15` }}>
          <Text variant="caption" style={{ color: colors.success, fontSize: 11 }}>
            {items.length} events
          </Text>
        </View>
      </View>
    </Card>
  ), [totalBudget, items.length, colors.warning, colors.success]);

  const onUpdateStatus = useCallback((id: string, status: string) => updatePlannerItem(id, { status }), [updatePlannerItem]);
  const onAddItem = useCallback(({ label, amount }: { label: string; amount: number }) => {
    addPlannerItem({
      plannerType: 'fiesta',
      label,
      amount,
      status: 'Planned',
      icon: 'calendar-outline',
      color: '#F59E0B',
    });
  }, [addPlannerItem]);

  return (
    <PlannerScreenLayout
      title="Fiesta Planner"
      subtitle="Budget for Filipino celebrations and fiestas throughout the year."
      summaryCard={summaryCard}
      items={items}
      formatAmount={formatCurrency}
      addItemLabel="Add Fiesta"
      statusOptions={STATUS_OPTIONS}
      onUpdateStatus={onUpdateStatus}
      onDeleteItem={deletePlannerItem}
      onAddItem={onAddItem}
    />
  );
}
