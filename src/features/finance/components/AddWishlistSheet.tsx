import { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { useFinanceStore } from '../store/finance.store';
import type { WishlistItem } from '../types/finance.types';

interface AddWishlistSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: WishlistItem | null;
  onDismiss?: () => void;
}

const PRIORITIES = [
  { value: 'high' as const, label: 'High', color: '#EF4444' },
  { value: 'medium' as const, label: 'Medium', color: '#F59E0B' },
  { value: 'low' as const, label: 'Low', color: '#3B82F6' },
];

export function AddWishlistSheet({ sheetRef, editItem, onDismiss }: AddWishlistSheetProps) {
  const addItem = useFinanceStore((s) => s.addWishlistItem);
  const updateItem = useFinanceStore((s) => s.updateWishlistItem);
  const deleteItem = useFinanceStore((s) => s.deleteWishlistItem);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isEditing = !!editItem;

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setTargetAmount(String(editItem.targetAmount));
      setPriority(editItem.priority);
      setLink(editItem.link ?? '');
      setNotes(editItem.notes ?? '');
    }
  }, [editItem]);

  const reset = useCallback(() => {
    setName('');
    setTargetAmount('');
    setPriority('medium');
    setLink('');
    setNotes('');
    setShowConfirmDelete(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleSave = useCallback(() => {
    const parsed = parseFloat(targetAmount);
    if (!parsed || !name.trim()) return;

    if (isEditing && editItem) {
      updateItem(editItem.id, {
        name: name.trim(),
        targetAmount: parsed,
        priority,
        link: link.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addItem({
        name: name.trim(),
        targetAmount: parsed,
        priority,
        link: link.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }
    reset();
    sheetRef.current?.dismiss();
  }, [name, targetAmount, priority, link, notes, isEditing, editItem, addItem, updateItem, reset, sheetRef]);

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    deleteItem(editItem.id);
    reset();
    sheetRef.current?.dismiss();
  }, [editItem, deleteItem, reset, sheetRef]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['70%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">
        {isEditing ? 'Edit Wishlist Item' : 'Add to Wishlist'}
      </Text>

      <Input
        label="Item Name"
        placeholder="e.g. iPhone 16, Nike Air Max"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        className="mb-3"
      />

      <Input
        label="Target Price"
        placeholder="0.00"
        value={targetAmount}
        onChangeText={setTargetAmount}
        keyboardType="decimal-pad"
        className="mb-3"
      />

      {/* Priority */}
      <Text variant="label" className="mb-2">Priority</Text>
      <View className="mb-4 flex-row gap-2">
        {PRIORITIES.map((p) => (
          <Pressable
            key={p.value}
            onPress={() => setPriority(p.value)}
            accessibilityRole="button"
            accessibilityLabel={`${p.label} priority`}
            accessibilityState={{ selected: priority === p.value }}
            className={`flex-1 items-center rounded-full border py-2 ${
              priority === p.value ? 'border-transparent' : 'border-neutral-200 dark:border-neutral-700'
            }`}
            style={priority === p.value ? { backgroundColor: p.color } : undefined}
          >
            <Text
              variant="caption"
              className="font-sans-medium"
              style={priority === p.value ? { color: '#FFFFFF' } : undefined}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input
        label="Link (optional)"
        placeholder="https://..."
        value={link}
        onChangeText={setLink}
        keyboardType="default"
        autoCapitalize="none"
        className="mb-3"
      />

      <Input
        label="Notes (optional)"
        placeholder="Color, size, store..."
        value={notes}
        onChangeText={setNotes}
        className="mb-6"
      />

      <Button onPress={handleSave} disabled={!name.trim() || !parseFloat(targetAmount)}>
        {isEditing ? 'Save Changes' : 'Add to Wishlist'}
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
              Delete Item
            </Button>
          )}
        </View>
      )}
    </BottomSheetModal>
  );
}
