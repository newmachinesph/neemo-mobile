import { useState, useCallback } from 'react';
import { View } from 'react-native';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { useFinanceStore } from '../store/finance.store';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';

interface AddUtangPaymentSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  utangId: string | null;
  remainingBalance: number;
  onDismiss?: () => void;
}

export function AddUtangPaymentSheet({ sheetRef, utangId, remainingBalance, onDismiss }: AddUtangPaymentSheetProps) {
  const addUtangPayment = useFinanceStore((s) => s.addUtangPayment);
  const hideBalances = useFinanceStore((s) => s.hideBalances);

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const reset = useCallback(() => {
    setAmount('');
    setNote('');
    onDismiss?.();
  }, [onDismiss]);

  const handleSave = useCallback(() => {
    const amt = parseFloat(amount);
    if (!utangId || !amt || amt <= 0) return;

    addUtangPayment(utangId, {
      amount: amt,
      date: new Date().toISOString(),
      note: note.trim() || undefined,
    });
    sheetRef.current?.dismiss();
    reset();
  }, [utangId, amount, note, addUtangPayment, sheetRef, reset]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['45%']} onDismiss={reset}>
      <Text variant="h3" className="mb-2">Add Payment</Text>
      <Text variant="caption" className="mb-4 text-neutral-500">
        Remaining: {hideBalances ? maskedCurrency() : formatCurrency(remainingBalance)}
      </Text>

      <Input
        label="Payment Amount"
        placeholder="e.g. 1000"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        className="mb-3"
      />

      <Input
        label="Note (optional)"
        placeholder="e.g. Partial bayad"
        value={note}
        onChangeText={setNote}
        className="mb-4"
      />

      <Button onPress={handleSave}>Record Payment</Button>
    </BottomSheetModal>
  );
}
