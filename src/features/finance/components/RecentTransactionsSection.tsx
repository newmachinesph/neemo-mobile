import { useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { SectionHeader } from '@ui/components/SectionHeader';
import { Card } from '@ui/components/Card';
import { TransactionRow } from './TransactionRow';
import { AddTransactionSheet } from './AddTransactionSheet';
import { useFinanceStore } from '../store/finance.store';
import type { Transaction } from '../types/finance.types';

interface RecentTransactionsSectionProps {
  limit?: number;
}

export function RecentTransactionsSection({ limit = 5 }: RecentTransactionsSectionProps) {
  const router = useRouter();
  const transactions = useFinanceStore((s) => s.transactions);
  const editSheetRef = useRef<GorhomBottomSheetModal>(null);
  // H7 fix: Use state instead of ref so re-render passes editItem to sheet
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const recent = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit),
    [transactions, limit],
  );

  const handleTxnPress = useCallback((txn: Transaction) => {
    setSelectedTxn(txn);
    editSheetRef.current?.present();
  }, []);

  if (recent.length === 0) return null;

  return (
    <>
      <SectionHeader title="Recent" actionLabel="See all" onAction={() => router.push({ pathname: '/(app)/finance', params: { tab: 'transactions' } })} />
      <Card className="mb-4 px-0 py-1">
        {recent.map((txn) => (
          <TransactionRow key={txn.id} transaction={txn} onPress={() => handleTxnPress(txn)} />
        ))}
      </Card>
      <AddTransactionSheet
        sheetRef={editSheetRef}
        editItem={selectedTxn}
        onDismiss={() => { setSelectedTxn(null); }}
      />
    </>
  );
}
