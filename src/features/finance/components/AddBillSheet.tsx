import { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { Icon, type IconName } from '@ui/components/Icon';
import { TRANSACTION_CATEGORIES } from '@lib/constants/finance';
import { useFinanceStore } from '../store/finance.store';
import type { RecurringBill } from '../types/finance.types';

const FREQUENCIES = ['weekly', 'monthly', 'yearly'] as const;
const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

interface AddBillSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: RecurringBill | null;
  onDismiss?: () => void;
}

export function AddBillSheet({ sheetRef, editItem, onDismiss }: AddBillSheetProps) {
  const addRecurringBill = useFinanceStore((s) => s.addRecurringBill);
  const updateRecurringBill = useFinanceStore((s) => s.updateRecurringBill);
  const deleteRecurringBill = useFinanceStore((s) => s.deleteRecurringBill);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('utilities');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [dueDay, setDueDay] = useState('1');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isEditing = !!editItem;

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setAmount(String(editItem.amount));
      setCategory(editItem.category);
      setFrequency(editItem.frequency);
      setDueDay(String(editItem.dueDay));
    }
  }, [editItem]);

  const reset = useCallback(() => {
    setName('');
    setAmount('');
    setCategory('utilities');
    setFrequency('monthly');
    setDueDay('1');
    setShowConfirmDelete(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleSave = useCallback(() => {
    const parsedAmount = parseFloat(amount);
    const parsedDay = parseInt(dueDay, 10);
    if (!name.trim() || !parsedAmount || !parsedDay || parsedDay < 1 || parsedDay > 31) return;

    if (isEditing && editItem) {
      updateRecurringBill(editItem.id, {
        name: name.trim(),
        amount: parsedAmount,
        category,
        frequency,
        dueDay: parsedDay,
      });
    } else {
      addRecurringBill({
        name: name.trim(),
        amount: parsedAmount,
        category,
        frequency,
        dueDay: parsedDay,
        isActive: true,
      });
    }
    reset();
    sheetRef.current?.dismiss();
  }, [name, amount, category, frequency, dueDay, isEditing, editItem, addRecurringBill, updateRecurringBill, reset, sheetRef]);

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    deleteRecurringBill(editItem.id);
    reset();
    sheetRef.current?.dismiss();
  }, [editItem, deleteRecurringBill, reset, sheetRef]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['70%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">
        {isEditing ? 'Edit Bill' : 'Add Recurring Bill'}
      </Text>

      <Input
        label="Bill Name"
        placeholder="e.g. MERALCO, Globe, Netflix"
        value={name}
        onChangeText={setName}
        className="mb-3"
      />

      <Input
        label="Amount"
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        className="mb-3"
      />

      <Text variant="label" className="mb-2">Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3"
        contentContainerClassName="gap-2 pb-1"
      >
        {TRANSACTION_CATEGORIES.filter((c) => !['salary', 'freelance', 'investment_income', 'transfer'].includes(c.id)).map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => setCategory(cat.id)}
            accessibilityRole="button"
            accessibilityLabel={`Category: ${cat.label}${category === cat.id ? ', selected' : ''}`}
            className={`flex-row items-center rounded-full px-3 py-1.5 border ${
              category === cat.id
                ? 'bg-primary-500 border-primary-500'
                : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Icon name={cat.icon as IconName} size={14} color={category === cat.id ? '#FFFFFF' : cat.color} />
            <Text variant="caption" className={`font-sans-medium ml-1.5 ${category === cat.id ? 'text-white' : ''}`}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text variant="label" className="mb-2">Frequency</Text>
      <View className="mb-3 flex-row gap-2">
        {FREQUENCIES.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFrequency(f)}
            accessibilityRole="button"
            accessibilityLabel={`Frequency: ${FREQUENCY_LABELS[f]}${frequency === f ? ', selected' : ''}`}
            className={`flex-1 items-center rounded-xl py-2 border ${
              frequency === f
                ? 'bg-primary-500 border-primary-500'
                : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-medium ${frequency === f ? 'text-white' : ''}`}>
              {FREQUENCY_LABELS[f]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input
        label="Due Day of Month"
        placeholder="1-31"
        value={dueDay}
        onChangeText={setDueDay}
        keyboardType="numeric"
        className="mb-6"
      />

      <Button onPress={handleSave} disabled={!name.trim() || !amount}>
        {isEditing ? 'Save Changes' : 'Add Bill'}
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
              Delete Bill
            </Button>
          )}
        </View>
      )}
    </BottomSheetModal>
  );
}
