import { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { useFinanceStore } from '../store/finance.store';
import type { DebtInfo } from '../types/finance.types';

interface AddDebtInfoSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: DebtInfo | null;
  onDismiss?: () => void;
}

export function AddDebtInfoSheet({ sheetRef, editItem, onDismiss }: AddDebtInfoSheetProps) {
  const accounts = useFinanceStore((s) => s.accounts);
  const addDebtInfo = useFinanceStore((s) => s.addDebtInfo);
  const updateDebtInfo = useFinanceStore((s) => s.updateDebtInfo);
  const deleteDebtInfo = useFinanceStore((s) => s.deleteDebtInfo);

  const debtAccounts = accounts.filter((a) => a.type === 'loan' || a.type === 'credit_card');

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [extraPayment, setExtraPayment] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isEditing = !!editItem;

  useEffect(() => {
    if (editItem) {
      setSelectedAccountId(editItem.accountId);
      setInterestRate(String(editItem.interestRate));
      setMinimumPayment(String(editItem.minimumPayment));
      setExtraPayment(editItem.extraPayment ? String(editItem.extraPayment) : '');
    }
  }, [editItem]);

  const reset = useCallback(() => {
    setSelectedAccountId('');
    setInterestRate('');
    setMinimumPayment('');
    setExtraPayment('');
    setShowConfirmDelete(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleSave = useCallback(() => {
    const rate = parseFloat(interestRate);
    const minPay = parseFloat(minimumPayment);
    if (!selectedAccountId || isNaN(rate) || isNaN(minPay)) return;

    const extra = parseFloat(extraPayment) || 0;

    if (isEditing && editItem) {
      updateDebtInfo(editItem.accountId, {
        interestRate: rate,
        minimumPayment: minPay,
        extraPayment: extra || undefined,
      });
    } else {
      addDebtInfo({
        accountId: selectedAccountId,
        interestRate: rate,
        minimumPayment: minPay,
        extraPayment: extra || undefined,
      });
    }
    reset();
    sheetRef.current?.dismiss();
  }, [selectedAccountId, interestRate, minimumPayment, extraPayment, isEditing, editItem, addDebtInfo, updateDebtInfo, reset, sheetRef]);

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    deleteDebtInfo(editItem.accountId);
    reset();
    sheetRef.current?.dismiss();
  }, [editItem, deleteDebtInfo, reset, sheetRef]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['65%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">
        {isEditing ? 'Edit Debt Info' : 'Add Debt Info'}
      </Text>

      {!isEditing && (
        <>
          <Text variant="label" className="mb-2">Select Account</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
            contentContainerClassName="gap-2 pb-1"
          >
            {debtAccounts.length === 0 && (
              <Text variant="caption" className="py-2">No loan or credit card accounts. Add one first.</Text>
            )}
            {debtAccounts.map((acc) => (
              <Pressable
                key={acc.id}
                onPress={() => setSelectedAccountId(acc.id)}
                accessibilityRole="button"
                accessibilityLabel={`Account: ${acc.name}${selectedAccountId === acc.id ? ', selected' : ''}`}
                className={`rounded-full px-3 py-1.5 border ${
                  selectedAccountId === acc.id
                    ? 'bg-primary-500 border-primary-500'
                    : 'border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <Text variant="caption" className={`font-sans-medium ${selectedAccountId === acc.id ? 'text-white' : ''}`}>
                  {acc.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <Input
        label="Interest Rate (%)"
        placeholder="e.g. 24.0"
        value={interestRate}
        onChangeText={setInterestRate}
        keyboardType="decimal-pad"
        className="mb-3"
      />

      <Input
        label="Minimum Monthly Payment"
        placeholder="0.00"
        value={minimumPayment}
        onChangeText={setMinimumPayment}
        keyboardType="decimal-pad"
        className="mb-3"
      />

      <Input
        label="Extra Monthly Payment (optional)"
        placeholder="0.00"
        value={extraPayment}
        onChangeText={setExtraPayment}
        keyboardType="decimal-pad"
        className="mb-6"
      />

      <Button onPress={handleSave} disabled={!selectedAccountId || !parseFloat(interestRate) || !parseFloat(minimumPayment)}>
        {isEditing ? 'Save Changes' : 'Add Debt Info'}
      </Button>

      {isEditing && (
        <View className="mt-3">
          {showConfirmDelete ? (
            <View className="flex-row gap-2">
              <Button variant="ghost" onPress={() => setShowConfirmDelete(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="danger" onPress={handleDelete} className="flex-1">
                Confirm Delete
              </Button>
            </View>
          ) : (
            <Button variant="ghost" onPress={() => setShowConfirmDelete(true)}>
              Remove Debt Info
            </Button>
          )}
        </View>
      )}
    </BottomSheetModal>
  );
}
