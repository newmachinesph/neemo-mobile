import { View } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { Badge } from '@ui/components/Badge';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '../store/finance.store';
import type { RecurringTransaction } from '../types/finance.types';

const FREQ_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

interface RecurringTransactionRowProps {
  item: RecurringTransaction;
  onPress?: () => void;
}

export function RecurringTransactionRow({ item, onPress }: RecurringTransactionRowProps) {
  const { colors } = useTheme();
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const nextDue = new Date(item.nextDueDate).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card pressable={!!onPress} onPress={onPress} className="mb-2">
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: item.type === 'income' ? `${colors.success}15` : `${colors.danger}15` }}
        >
          <Icon
            name={item.type === 'income' ? 'arrow-down-outline' : 'arrow-up-outline'}
            size={20}
            color={item.type === 'income' ? colors.success : colors.danger}
          />
        </View>
        <View className="flex-1">
          <Text variant="body" className="font-sans-semibold">{item.merchantName}</Text>
          <Text variant="caption" className="text-neutral-500">
            Next: {nextDue}
          </Text>
        </View>
        <View className="items-end">
          <Text variant="body" className="font-sans-bold">
            {hideBalances ? maskedCurrency() : formatCurrency(item.amount)}
          </Text>
          <Badge variant="danger">{FREQ_LABELS[item.frequency] || item.frequency}</Badge>
        </View>
      </View>
    </Card>
  );
}
