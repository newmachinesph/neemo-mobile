import { useMemo } from 'react';
import { View } from 'react-native';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Text } from '@ui/components/Text';
import { Badge } from '@ui/components/Badge';
import { ProgressBar } from '@ui/components/ProgressBar';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { CARD_TYPE_LABELS } from '@lib/constants/finance';
import { useFinanceStore } from '../store/finance.store';
import { TransactionRow } from './TransactionRow';
import type { Card } from '../types/finance.types';

interface CardDetailSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  card: Card | null;
}

export function CardDetailSheet({ sheetRef, card }: CardDetailSheetProps) {
  const transactions = useFinanceStore((s) => s.transactions);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);

  const cardTxns = useMemo(() => {
    if (!card) return [];
    return transactions.filter((t) => t.cardId === card.id).slice(0, 10);
  }, [transactions, card]);

  if (!card) return null;

  const utilization = card.creditLimit && card.outstandingBalance
    ? card.outstandingBalance / card.creditLimit
    : 0;

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['70%']}>
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text variant="h3">{card.nickname}</Text>
          <Text variant="caption" className="text-neutral-400 mt-0.5" style={{ letterSpacing: 2 }}>
            •••• {card.last4}
          </Text>
        </View>
        <Badge variant="neutral">{CARD_TYPE_LABELS[card.type]}</Badge>
      </View>

      {card.type === 'credit' && card.creditLimit && (
        <View className="mb-4">
          <View className="flex-row justify-between mb-1">
            <Text variant="caption">Outstanding</Text>
            <Text variant="caption">{amt(card.outstandingBalance || 0)} / {amt(card.creditLimit)}</Text>
          </View>
          <ProgressBar progress={utilization} height="md" useThresholdColors />
        </View>
      )}

      <Text variant="label" className="mb-2">Recent Transactions</Text>
      {cardTxns.length === 0 ? (
        <Text variant="caption" className="py-4 text-center text-neutral-400">
          No transactions for this card
        </Text>
      ) : (
        cardTxns.map((txn) => (
          <TransactionRow key={txn.id} transaction={txn} />
        ))
      )}
    </BottomSheetModal>
  );
}
