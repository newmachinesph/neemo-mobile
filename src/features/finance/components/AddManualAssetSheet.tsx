import { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { ASSET_CATEGORIES, ASSET_CATEGORY_LABELS } from '@lib/constants/finance';
import type { AssetCategory } from '@lib/constants/finance';
import { useFinanceStore } from '../store/finance.store';
import type { ManualAsset } from '../types/finance.types';

interface AddManualAssetSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: ManualAsset | null;
  onDismiss?: () => void;
}

export function AddManualAssetSheet({ sheetRef, editItem, onDismiss }: AddManualAssetSheetProps) {
  const addManualAsset = useFinanceStore((s) => s.addManualAsset);
  const updateManualAsset = useFinanceStore((s) => s.updateManualAsset);
  const deleteManualAsset = useFinanceStore((s) => s.deleteManualAsset);

  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState<AssetCategory>('property');
  const [notes, setNotes] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setValue(String(editItem.value));
      setCategory(editItem.category);
      setNotes(editItem.notes ?? '');
    }
  }, [editItem]);

  const reset = useCallback(() => {
    setName('');
    setValue('');
    setCategory('property');
    setNotes('');
    setShowConfirmDelete(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleSave = useCallback(() => {
    const parsedValue = parseFloat(value);
    if (!parsedValue || !name.trim()) return;

    const data = {
      name: name.trim(),
      value: parsedValue,
      category,
      notes: notes.trim() || undefined,
    };

    if (editItem) {
      updateManualAsset(editItem.id, data);
    } else {
      addManualAsset(data);
    }
    sheetRef.current?.dismiss();
    reset();
  }, [name, value, category, notes, editItem, addManualAsset, updateManualAsset, sheetRef, reset]);

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    if (!showConfirmDelete) { setShowConfirmDelete(true); return; }
    deleteManualAsset(editItem.id);
    sheetRef.current?.dismiss();
    reset();
  }, [editItem, showConfirmDelete, deleteManualAsset, sheetRef, reset]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['60%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">{editItem ? 'Edit Asset' : 'Add Asset'}</Text>

      <Input label="Asset Name" placeholder="e.g. Condo in Makati" value={name} onChangeText={setName} className="mb-3" />
      <Input label="Value" placeholder="0.00" value={value} onChangeText={setValue} keyboardType="decimal-pad" className="mb-3" />

      <Text variant="caption" className="mb-1 text-neutral-500">Category</Text>
      <View className="mb-3 flex-row flex-wrap gap-2">
        {ASSET_CATEGORIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategory(c)}
            accessibilityRole="button"
            accessibilityLabel={ASSET_CATEGORY_LABELS[c]}
            accessibilityState={{ selected: category === c }}
            className={`rounded-full px-4 py-2 border ${
              category === c ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-semibold capitalize ${category === c ? 'text-white' : ''}`}>
              {ASSET_CATEGORY_LABELS[c]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input label="Notes (optional)" placeholder="Any details..." value={notes} onChangeText={setNotes} className="mb-4" />

      <Button onPress={handleSave} disabled={!name.trim() || !parseFloat(value)} className="mb-2">{editItem ? 'Update' : 'Add Asset'}</Button>

      {editItem && (
        <Button onPress={handleDelete} variant="outline">
          {showConfirmDelete ? 'Confirm Delete' : 'Delete'}
        </Button>
      )}
    </BottomSheetModal>
  );
}
