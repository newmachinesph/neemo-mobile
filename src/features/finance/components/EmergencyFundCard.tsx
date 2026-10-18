import { View } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { ProgressBar } from '@ui/components/ProgressBar';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '../store/finance.store';
import { useEmergencyFund } from '../hooks/useEmergencyFund';

const STATUS_COLORS = {
  red: '#EF4444',
  yellow: '#F59E0B',
  green: '#22C55E',
  excellent: '#10B981',
} as const;

const STATUS_LABELS = {
  red: 'Needs attention',
  yellow: 'Building up',
  green: 'Good shape',
  excellent: 'Excellent',
} as const;

export function EmergencyFundCard() {
  const { totalEmergencySaved, monthsCovered, targetMonths, status, monthlyExpenseAvg, emergencyGoals } =
    useEmergencyFund();
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);

  if (emergencyGoals.length === 0 || targetMonths <= 0) return null;

  const progress = Math.min(monthsCovered / targetMonths, 1);
  const targetTotal = monthlyExpenseAvg * targetMonths;
  const color = STATUS_COLORS[status];

  return (
    <Card className="mb-4">
      <View className="mb-2 flex-row items-center">
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon name="shield-checkmark-outline" size={20} color={color} />
        </View>
        <View className="flex-1">
          <Text variant="body" className="font-sans-semibold">Emergency Fund</Text>
          <Text variant="caption" className="mt-0.5">
            {amt(totalEmergencySaved)} of {amt(targetTotal)}
          </Text>
        </View>
        <View className="items-end">
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <Text variant="caption" className="mt-0.5" style={{ color, fontSize: 11 }}>
            {STATUS_LABELS[status]}
          </Text>
        </View>
      </View>

      <ProgressBar progress={progress} height="sm" color="primary" />

      <Text variant="caption" className="mt-1.5 text-neutral-500" style={{ fontSize: 11 }}>
        {monthsCovered.toFixed(1)} of {targetMonths} months of expenses covered
      </Text>
    </Card>
  );
}
