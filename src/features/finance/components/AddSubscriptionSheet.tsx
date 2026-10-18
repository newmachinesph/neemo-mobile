import { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { useFinanceStore } from '../store/finance.store';
import type { Subscription } from '../types/finance.types';

interface AddSubscriptionSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: Subscription | null;
  onDismiss?: () => void;
}

export function AddSubscriptionSheet({ sheetRef, editItem, onDismiss }: AddSubscriptionSheetProps) {
  const addSubscription = useFinanceStore((s) => s.addSubscription);
  const updateSubscription = useFinanceStore((s) => s.updateSubscription);
  const deleteSubscription = useFinanceStore((s) => s.deleteSubscription);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [renewalDay, setRenewalDay] = useState('');
  const [category, setCategory] = useState('entertainment');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setAmount(String(editItem.amount));
      setFrequency(editItem.frequency);
      setRenewalDay(String(editItem.renewalDay));
      setCategory(editItem.category);
    }
  }, [editItem]);

  const reset = useCallback(() => {
    setName('');
    setAmount('');
    setFrequency('monthly');
    setRenewalDay('');
    setCategory('entertainment');
    setShowConfirmDelete(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleSave = useCallback(() => {
    const n = name.trim();
    const amt = parseFloat(amount);
    const day = parseInt(renewalDay, 10);
    if (!n || !amt || !day || day < 1 || day > 31) return;

    const data = {
      name: n,
      amount: amt,
      currency: 'PHP',
      frequency,
      renewalDay: day,
      category,
      isActive: editItem?.isActive ?? true,
    };

    if (editItem) {
      updateSubscription(editItem.id, data);
    } else {
      addSubscription(data);
    }
    sheetRef.current?.dismiss();
    reset();
  }, [name, amount, frequency, renewalDay, category, editItem, addSubscription, updateSubscription, sheetRef, reset]);

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    if (!showConfirmDelete) { setShowConfirmDelete(true); return; }
    deleteSubscription(editItem.id);
    sheetRef.current?.dismiss();
    reset();
  }, [editItem, showConfirmDelete, deleteSubscription, sheetRef, reset]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['65%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">{editItem ? 'Edit Subscription' : 'Add Subscription'}</Text>

      <Input label="Name" placeholder="e.g. Netflix" value={name} onChangeText={setName} className="mb-3" />
      <Input label="Amount" placeholder="e.g. 549" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" className="mb-3" />

      {/* Frequency */}
      <Text variant="caption" className="mb-1 text-neutral-500">Frequency</Text>
      <View className="mb-3 flex-row gap-2">
        {(['monthly', 'yearly'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFrequency(f)}
            accessibilityRole="button"
            accessibilityLabel={`Frequency: ${f}${frequency === f ? ', selected' : ''}`}
            className={`flex-1 items-center rounded-xl py-2.5 border ${
              frequency === f ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-semibold capitalize ${frequency === f ? 'text-white' : ''}`}>
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input label="Renewal Day" placeholder="e.g. 4" value={renewalDay} onChangeText={setRenewalDay} keyboardType="numeric" className="mb-4" />

      <Button onPress={handleSave} disabled={!name.trim() || !parseFloat(amount)} className="mb-2">{editItem ? 'Update' : 'Add Subscription'}</Button>

      {editItem && (
        <Button onPress={handleDelete} variant="outline">{showConfirmDelete ? 'Confirm Delete' : 'Delete'}</Button>
      )}
    </BottomSheetModal>
  );
}
