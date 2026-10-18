import { View } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '../store/finance.store';
import type { Remittance } from '../types/finance.types';

interface RemittanceCardProps {
  remittance: Remittance;
  onPress?: () => void;
}

export function RemittanceCard({ remittance, onPress }: RemittanceCardProps) {
  const { colors } = useTheme();
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const dateStr = new Date(remittance.date).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card pressable={!!onPress} onPress={onPress} className="mb-3">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-teal-100">
          <Icon name="send-outline" size={20} color="#14B8A6" />
        </View>
        <View className="flex-1">
          <Text variant="body" className="font-sans-semibold">{remittance.senderName}</Text>
          <Text variant="caption" className="text-neutral-500">
            {remittance.channel} · {dateStr}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View>
          <Text variant="caption" className="text-neutral-500">Sent</Text>
          <Text variant="body" className="font-sans-semibold">
            {hideBalances ? maskedCurrency(remittance.foreignCurrency) : `${remittance.foreignCurrency} ${remittance.amountForeign.toLocaleString()}`}
          </Text>
        </View>
        <Icon name="arrow-forward" size={16} color={colors.textTertiary} />
        <View className="items-end">
          <Text variant="caption" className="text-neutral-500">Received</Text>
          <Text variant="body" className="font-sans-bold" style={{ color: colors.success }}>
            {hideBalances ? maskedCurrency() : formatCurrency(remittance.amountPHP)}
          </Text>
        </View>
      </View>

      <Text variant="caption" className="mt-1 text-neutral-400" style={{ fontSize: 11 }}>
        Rate: 1 {remittance.foreignCurrency} = ₱{remittance.exchangeRate.toFixed(2)}
      </Text>

      {remittance.note ? (
        <Text variant="caption" className="mt-1 text-neutral-400 italic">{remittance.note}</Text>
      ) : null}
    </Card>
  );
}
