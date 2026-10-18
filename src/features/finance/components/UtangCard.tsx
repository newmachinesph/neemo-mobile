import { View, Pressable } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { Badge } from '@ui/components/Badge';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '../store/finance.store';
import type { Utang } from '../types/finance.types';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F59E0B' },
  partial: { label: 'Partial', color: '#3B82F6' },
  settled: { label: 'Settled', color: '#22C55E' },
} as const;

interface UtangCardProps {
  utang: Utang;
  onPress?: () => void;
  onAddPayment?: () => void;
}

export function UtangCard({ utang, onPress, onAddPayment }: UtangCardProps) {
  const { colors } = useTheme();
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);
  const statusCfg = STATUS_CONFIG[utang.status];
  const isLent = utang.type === 'lent';

  return (
    <Card pressable={!!onPress} onPress={onPress} className="mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: isLent ? `${colors.info}15` : `${colors.danger}15` }}
          >
            <Icon
              name={isLent ? 'arrow-up-outline' : 'arrow-down-outline'}
              size={20}
              color={isLent ? colors.info : colors.danger}
            />
          </View>
          <View className="flex-1">
            <Text variant="body" className="font-sans-semibold">{utang.personName}</Text>
            {utang.description ? (
              <Text variant="caption" className="text-neutral-500" numberOfLines={1}>{utang.description}</Text>
            ) : null}
          </View>
        </View>
        <Badge variant={utang.status === 'settled' ? 'success' : utang.status === 'partial' ? 'info' : 'warning'}>{statusCfg.label}</Badge>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View>
          <Text variant="caption" className="text-neutral-500">
            {isLent ? 'Pinahiram' : 'Hiniram'}
          </Text>
          <Text variant="body" className="font-sans-bold">{amt(utang.amount)}</Text>
        </View>
        <View className="items-end">
          <Text variant="caption" className="text-neutral-500">Remaining</Text>
          <Text variant="body" className="font-sans-bold" style={{ color: utang.remainingBalance > 0 ? colors.danger : colors.success }}>
            {amt(utang.remainingBalance)}
          </Text>
        </View>
      </View>

      {utang.payments.length > 0 && (
        <View className="mt-2 border-t border-neutral-100 pt-2 dark:border-neutral-800">
          <Text variant="caption" className="text-neutral-400 mb-1">
            {utang.payments.length} payment{utang.payments.length > 1 ? 's' : ''} made
          </Text>
        </View>
      )}

      {utang.status !== 'settled' && onAddPayment && (
        <Pressable
          onPress={onAddPayment}
          accessibilityRole="button"
          accessibilityLabel={`Add payment for ${utang.personName}`}
          className="mt-2 flex-row items-center justify-center gap-1 rounded-lg border border-primary-200 py-2 dark:border-primary-800"
        >
          <Icon name="add-circle-outline" size={16} color={colors.primary} />
          <Text variant="caption" className="font-sans-semibold" style={{ color: colors.primary }}>
            Add Payment
          </Text>
        </Pressable>
      )}
    </Card>
  );
}
