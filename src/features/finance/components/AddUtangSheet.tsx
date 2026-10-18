import { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useFinanceStore } from '../store/finance.store';
import type { Utang } from '../types/finance.types';

interface AddUtangSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: Utang | null;
  onDismiss?: () => void;
}

export function AddUtangSheet({ sheetRef, editItem, onDismiss }: AddUtangSheetProps) {
  const addUtang = useFinanceStore((s) => s.addUtang);
  const updateUtang = useFinanceStore((s) => s.updateUtang);
  const deleteUtang = useFinanceStore((s) => s.deleteUtang);

  const [personName, setPersonName] = useState('');
  const [type, setType] = useState<'lent' | 'borrowed'>('lent');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (editItem) {
      setPersonName(editItem.personName);
      setType(editItem.type);
      setAmount(String(editItem.amount));
      setDescription(editItem.description || '');
      setExpectedReturnDate(editItem.expectedReturnDate || '');
    }
  }, [editItem]);

  const reset = useCallback(() => {
    setPersonName('');
    setType('lent');
    setAmount('');
    setDescription('');
    setExpectedReturnDate('');
    setShowConfirmDelete(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleSave = useCallback(() => {
    const name = personName.trim();
    const amt = parseFloat(amount);
    if (!name || !amt || amt <= 0) return;

    if (editItem) {
      updateUtang(editItem.id, {
        personName: name,
        type,
        amount: amt,
        description: description.trim() || undefined,
        date: editItem.date,
        expectedReturnDate: expectedReturnDate.trim() || undefined,
      });
    } else {
      addUtang({
        personName: name,
        type,
        amount: amt,
        description: description.trim() || undefined,
        date: new Date().toISOString(),
        expectedReturnDate: expectedReturnDate.trim() || undefined,
      });
    }
    sheetRef.current?.dismiss();
    reset();
  }, [personName, type, amount, description, expectedReturnDate, editItem, addUtang, updateUtang, sheetRef, reset]);

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }
    deleteUtang(editItem.id);
    sheetRef.current?.dismiss();
    reset();
  }, [editItem, showConfirmDelete, deleteUtang, sheetRef, reset]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['70%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">{editItem ? 'Edit Utang' : 'New Utang'}</Text>

      {/* Type Toggle */}
      <Text variant="caption" className="mb-1 text-neutral-500">Type</Text>
      <View className="mb-3 flex-row gap-2">
        {(['lent', 'borrowed'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            accessibilityRole="button"
            accessibilityLabel={`Type: ${t === 'lent' ? 'Pinahiram (Lent)' : 'Hiniram (Borrowed)'}${type === t ? ', selected' : ''}`}
            className={`flex-1 items-center rounded-xl py-2.5 border ${
              type === t ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-semibold ${type === t ? 'text-white' : ''}`}>
              {t === 'lent' ? 'Pinahiram (Lent)' : 'Hiniram (Borrowed)'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input
        label="Person Name"
        placeholder="e.g. Maria Santos"
        value={personName}
        onChangeText={setPersonName}
        className="mb-3"
      />

      <Input
        label="Amount"
        placeholder="e.g. 5000"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        className="mb-3"
      />

      <Input
        label="Description (optional)"
        placeholder="e.g. Pang-tuition"
        value={description}
        onChangeText={setDescription}
        className="mb-3"
      />

      <Input
        label="Expected Return Date (optional)"
        placeholder="e.g. 2026-03-15"
        value={expectedReturnDate}
        onChangeText={setExpectedReturnDate}
        className="mb-4"
      />

      <Button onPress={handleSave} disabled={!personName.trim() || !parseFloat(amount)} className="mb-2">{editItem ? 'Update' : 'Add Utang'}</Button>

      {editItem && (
        <Button onPress={handleDelete} variant="outline" className="mb-2">{showConfirmDelete ? 'Confirm Delete' : 'Delete'}</Button>
      )}
    </BottomSheetModal>
  );
}
