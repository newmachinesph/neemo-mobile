import { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { BottomSheetModal } from '@ui/components/BottomSheetModal';
import type { BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { Icon, type IconName } from '@ui/components/Icon';
import { CATEGORY_ICON_OPTIONS, CATEGORY_COLOR_OPTIONS } from '@lib/constants/finance';
import { useFinanceStore } from '../store/finance.store';
import type { CustomCategory } from '../types/finance.types';

interface AddCustomCategorySheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: CustomCategory | null;
  onDismiss?: () => void;
}

export function AddCustomCategorySheet({ sheetRef, editItem, onDismiss }: AddCustomCategorySheetProps) {
  const addCustomCategory = useFinanceStore((s) => s.addCustomCategory);
  const updateCustomCategory = useFinanceStore((s) => s.updateCustomCategory);

  const [label, setLabel] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const isEditing = !!editItem;

  useEffect(() => {
    if (editItem) {
      setLabel(editItem.label);
      setType(editItem.type);
      const iconIdx = (CATEGORY_ICON_OPTIONS as readonly string[]).indexOf(editItem.icon);
      setSelectedIcon(iconIdx >= 0 ? iconIdx : 0);
      const colorIdx = (CATEGORY_COLOR_OPTIONS as readonly string[]).indexOf(editItem.color);
      setSelectedColor(colorIdx >= 0 ? colorIdx : 0);
    }
  }, [editItem]);

  const reset = useCallback(() => {
    setLabel('');
    setSelectedIcon(0);
    setSelectedColor(0);
    setType('expense');
    onDismiss?.();
  }, [onDismiss]);

  const handleSave = useCallback(() => {
    if (!label.trim()) return;

    const icon = CATEGORY_ICON_OPTIONS[selectedIcon] ?? CATEGORY_ICON_OPTIONS[0];
    const color = CATEGORY_COLOR_OPTIONS[selectedColor] ?? CATEGORY_COLOR_OPTIONS[0];

    if (isEditing && editItem) {
      updateCustomCategory(editItem.id, { label: label.trim(), icon, color, type });
    } else {
      addCustomCategory({ label: label.trim(), icon, color, type });
    }
    reset();
    sheetRef.current?.dismiss();
  }, [label, selectedIcon, selectedColor, type, isEditing, editItem, addCustomCategory, updateCustomCategory, reset, sheetRef]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['85%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">
        {isEditing ? 'Edit Category' : 'Add Custom Category'}
      </Text>

      <Input
        label="Category Name"
        placeholder="e.g. Pet Expenses"
        value={label}
        onChangeText={setLabel}
        autoCapitalize="words"
        className="mb-3"
      />

      <Text variant="label" className="mb-2">Type</Text>
      <View className="mb-4 flex-row gap-2">
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

      <Text variant="label" className="mb-2">Icon</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
      >
        {CATEGORY_ICON_OPTIONS.map((icon, idx) => (
          <Pressable
            key={icon}
            onPress={() => setSelectedIcon(idx)}
            accessibilityRole="button"
            accessibilityLabel={`Select icon ${icon}`}
            accessibilityState={{ selected: selectedIcon === idx }}
            className={`items-center justify-center rounded-xl p-3 border ${
              selectedIcon === idx
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Icon name={icon as IconName} size={24} color={CATEGORY_COLOR_OPTIONS[selectedColor]} />
          </Pressable>
        ))}
      </ScrollView>

      <Text variant="label" className="mb-2">Color</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-6"
        contentContainerStyle={{ gap: 8 }}
      >
        {CATEGORY_COLOR_OPTIONS.map((color, idx) => (
          <Pressable
            key={color}
            onPress={() => setSelectedColor(idx)}
            accessibilityRole="button"
            accessibilityLabel={`Select color ${color}`}
            accessibilityState={{ selected: selectedColor === idx }}
            className={`items-center justify-center rounded-full border-2 ${
              selectedColor === idx ? 'border-primary-500' : 'border-transparent'
            }`}
            style={{ width: 40, height: 40 }}
          >
            <View className="rounded-full" style={{ width: 32, height: 32, backgroundColor: color }} />
          </Pressable>
        ))}
      </ScrollView>

      <Button onPress={handleSave} disabled={!label.trim()}>
        {isEditing ? 'Save Changes' : 'Add Category'}
      </Button>
    </BottomSheetModal>
  );
}
