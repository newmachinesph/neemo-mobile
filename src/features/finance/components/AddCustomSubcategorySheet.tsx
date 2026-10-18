import { useState, useCallback, useEffect, useMemo } from 'react';
import { Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { BottomSheetModal } from '@ui/components/BottomSheetModal';
import type { BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { Icon, type IconName } from '@ui/components/Icon';
import { TRANSACTION_CATEGORIES } from '@lib/constants/finance';
import { useFinanceStore } from '../store/finance.store';
import type { CustomSubcategory } from '../types/finance.types';

interface AddCustomSubcategorySheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: CustomSubcategory | null;
  onDismiss?: () => void;
}

export function AddCustomSubcategorySheet({ sheetRef, editItem, onDismiss }: AddCustomSubcategorySheetProps) {
  const addCustomSubcategory = useFinanceStore((s) => s.addCustomSubcategory);
  const updateCustomSubcategory = useFinanceStore((s) => s.updateCustomSubcategory);
  const customCategories = useFinanceStore((s) => s.customCategories);

  const [label, setLabel] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');

  const isEditing = !!editItem;

  const allCategories = useMemo(() => [
    ...TRANSACTION_CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: c.icon, color: c.color })),
    ...customCategories.map((c) => ({ id: c.id, label: c.label, icon: c.icon, color: c.color })),
  ], [customCategories]);

  useEffect(() => {
    if (editItem) {
      setLabel(editItem.label);
      setParentCategoryId(editItem.parentCategoryId);
    } else if (allCategories.length > 0 && !parentCategoryId) {
      setParentCategoryId(allCategories[0]!.id);
    }
  }, [editItem, allCategories, parentCategoryId]);

  const reset = useCallback(() => {
    setLabel('');
    setParentCategoryId(allCategories[0]?.id ?? '');
    onDismiss?.();
  }, [onDismiss, allCategories]);

  const handleSave = useCallback(() => {
    if (!label.trim() || !parentCategoryId) return;

    if (isEditing && editItem) {
      updateCustomSubcategory(editItem.id, { label: label.trim(), parentCategoryId });
    } else {
      addCustomSubcategory({ label: label.trim(), parentCategoryId });
    }
    reset();
    sheetRef.current?.dismiss();
  }, [label, parentCategoryId, isEditing, editItem, addCustomSubcategory, updateCustomSubcategory, reset, sheetRef]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['70%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">
        {isEditing ? 'Edit Subcategory' : 'Add Subcategory'}
      </Text>

      <Input
        label="Subcategory Name"
        placeholder="e.g. Dog Food"
        value={label}
        onChangeText={setLabel}
        autoCapitalize="words"
        className="mb-3"
      />

      <Text variant="label" className="mb-2">Parent Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-6"
        contentContainerStyle={{ gap: 8 }}
      >
        {allCategories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => setParentCategoryId(cat.id)}
            accessibilityRole="button"
            accessibilityLabel={cat.label}
            accessibilityState={{ selected: parentCategoryId === cat.id }}
            className={`flex-row items-center rounded-full px-3 py-1.5 border ${
              parentCategoryId === cat.id
                ? 'bg-primary-500 border-primary-500'
                : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Icon
              name={cat.icon as IconName}
              size={14}
              color={parentCategoryId === cat.id ? '#FFFFFF' : cat.color}
            />
            <Text
              variant="caption"
              className={`font-sans-medium ml-1.5 ${parentCategoryId === cat.id ? 'text-white' : ''}`}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Button onPress={handleSave} disabled={!label.trim() || !parentCategoryId}>
        {isEditing ? 'Save Changes' : 'Add Subcategory'}
      </Button>
    </BottomSheetModal>
  );
}
