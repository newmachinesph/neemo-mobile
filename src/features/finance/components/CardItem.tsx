import { View, Pressable } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { Badge } from '@ui/components/Badge';
import { ProgressBar } from '@ui/components/ProgressBar';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { CARD_TYPE_LABELS } from '@lib/constants/finance';
import { useFinanceStore } from '../store/finance.store';
import type { Card as CardType } from '../types/finance.types';

const NETWORK_COLORS: Record<string, string> = {
  visa: '#1A1F71',
  mastercard: '#EB001B',
  jcb: '#0B7CB8',
  unionpay: '#DC1F2E',
  other: '#6B7280',
};

interface CardItemProps {
  card: CardType;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function CardItem({ card, onPress, onLongPress }: CardItemProps) {
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);
  const utilization = (card.creditLimit ?? 0) > 0
    ? (card.outstandingBalance ?? 0) / card.creditLimit!
    : 0;

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} accessibilityRole="button" accessibilityLabel={`Card: ${card.nickname}, ending ${card.last4}`} className="active:opacity-80">
    <Card
      className="mr-3 w-[220px] min-h-[148px]"
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text variant="body" className="font-sans-semibold" numberOfLines={1}>
          {card.nickname}
        </Text>
        <Badge variant="neutral">{CARD_TYPE_LABELS[card.type]}</Badge>
      </View>

      <Text variant="caption" className="text-neutral-400 mb-1" style={{ letterSpacing: 2 }}>
        •••• {card.last4}
      </Text>

      <Text variant="caption" className="text-neutral-400 capitalize" style={{ fontSize: 10 }}>
        {card.network}
      </Text>

      {card.type === 'credit' && card.creditLimit ? (
        <View className="mt-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text variant="caption" className="text-neutral-500">
              {amt(card.outstandingBalance || 0)}
            </Text>
            <Text variant="caption" className="text-neutral-400" style={{ fontSize: 10 }}>
              of {amt(card.creditLimit)}
            </Text>
          </View>
          <ProgressBar progress={utilization} height="sm" useThresholdColors />
        </View>
      ) : null}
    </Card>
    </Pressable>
  );
}
