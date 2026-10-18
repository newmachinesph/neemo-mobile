import { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { useFinanceStore } from '../store/finance.store';
import { TRANSACTION_CATEGORIES } from '@lib/constants/finance';
import type { RecurringTransaction, TransactionInsert } from '../types/finance.types';

interface AddRecurringTransactionSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: RecurringTransaction | null;
  onDismiss?: () => void;
}

type Freq = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
const FREQUENCIES: { key: Freq; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'biweekly', label: 'Bi-weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'yearly', label: 'Yearly' },
];

export function AddRecurringTransactionSheet({ sheetRef, editItem, onDismiss }: AddRecurringTransactionSheetProps) {
  const addRecurring = useFinanceStore((s) => s.addRecurringTransaction);
  const updateRecurring = useFinanceStore((s) => s.updateRecurringTransaction);
  const deleteRecurring = useFinanceStore((s) => s.deleteRecurringTransaction);
  const accounts = useFinanceStore((s) => s.accounts);

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [merchantName, setMerchantName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [frequency, setFrequency] = useState<Freq>('monthly');
  const [accountId, setAccountId] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (editItem) {
      setType(editItem.type === 'transfer' ? 'expense' : editItem.type);
      setMerchantName(editItem.merchantName);
      setAmount(String(editItem.amount));
      setCategory(editItem.category);
      setFrequency(editItem.frequency);
      setAccountId(editItem.accountId);
    }
  }, [editItem]);

  const reset = useCallback(() => {
    setType('expense');
    setMerchantName('');
    setAmount('');
    setCategory('food');
    setFrequency('monthly');
    setAccountId('');
    setShowConfirmDelete(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleSave = useCallback(() => {
    const name = merchantName.trim();
    const amt = parseFloat(amount);
    if (!name || !amt) return;

    const acct = accountId || accounts[0]?.id || '';

    const data = {
      type: type as 'income' | 'expense',
      amount: amt,
      currency: 'PHP' as const,
      category,
      merchantName: name,
      accountId: acct,
      frequency,
      nextDueDate: editItem?.nextDueDate ?? new Date().toISOString(),
      isActive: true,
    };

    if (editItem) {
      updateRecurring(editItem.id, data);
    } else {
      addRecurring(data);
    }
    sheetRef.current?.dismiss();
    reset();
  }, [merchantName, amount, type, category, frequency, accountId, accounts, editItem, addRecurring, updateRecurring, sheetRef, reset]);

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    if (!showConfirmDelete) { setShowConfirmDelete(true); return; }
    deleteRecurring(editItem.id);
    sheetRef.current?.dismiss();
    reset();
  }, [editItem, showConfirmDelete, deleteRecurring, sheetRef, reset]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['80%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">{editItem ? 'Edit Recurring' : 'Add Recurring Transaction'}</Text>

      {/* Type Toggle */}
      <View className="mb-3 flex-row gap-2">
        {(['expense', 'income'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            accessibilityRole="button"
            accessibilityLabel={t}
            accessibilityState={{ selected: type === t }}
            className={`flex-1 items-center rounded-xl py-2.5 border ${
              type === t ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-semibold capitalize ${type === t ? 'text-white' : ''}`}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input label="Merchant / Source" placeholder="e.g. MERALCO" value={merchantName} onChangeText={setMerchantName} className="mb-3" />
      <Input label="Amount" placeholder="e.g. 4500" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" className="mb-3" />

      {/* Category */}
      <Text variant="caption" className="mb-1 text-neutral-500">Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {TRANSACTION_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setCategory(cat.id)}
              accessibilityRole="button"
              accessibilityLabel={cat.label}
              accessibilityState={{ selected: category === cat.id }}
              className={`rounded-full px-3 py-1.5 border ${
                category === cat.id ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <Text variant="caption" className={`font-sans-semibold ${category === cat.id ? 'text-white' : ''}`} style={{ fontSize: 11 }}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Frequency */}
      <Text variant="caption" className="mb-1 text-neutral-500">Frequency</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {FREQUENCIES.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFrequency(f.key)}
              accessibilityRole="button"
              accessibilityLabel={f.label}
              accessibilityState={{ selected: frequency === f.key }}
              className={`rounded-full px-3 py-1.5 border ${
                frequency === f.key ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <Text variant="caption" className={`font-sans-semibold ${frequency === f.key ? 'text-white' : ''}`}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Button onPress={handleSave} disabled={!merchantName.trim() || !parseFloat(amount)} className="mb-2">{editItem ? 'Update' : 'Add Recurring'}</Button>

      {editItem && (
        <Button onPress={handleDelete} variant="outline">{showConfirmDelete ? 'Confirm Delete' : 'Delete'}</Button>
      )}
    </BottomSheetModal>
  );
}
