import { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { Icon, type IconName } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { TRANSACTION_CATEGORIES, BUDGET_STYLES, BUDGET_STYLE_LABELS } from '@lib/constants/finance';
import type { BudgetStyle } from '@lib/constants/finance';
import { useFinanceStore } from '../store/finance.store';
import type { Budget } from '../types/finance.types';

interface AddBudgetSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: Budget | null;
  onDismiss?: () => void;
}

export function AddBudgetSheet({ sheetRef, editItem, onDismiss }: AddBudgetSheetProps) {
  const { colors } = useTheme();
  const addBudget = useFinanceStore((s) => s.addBudget);
  const updateBudget = useFinanceStore((s) => s.updateBudget);
  const deleteBudget = useFinanceStore((s) => s.deleteBudget);

  const [category, setCategory] = useState('groceries');
  const [limit, setLimit] = useState('');
  const [style, setStyle] = useState<BudgetStyle>('envelope');
  const [rollover, setRollover] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isEditing = !!editItem;

  useEffect(() => {
    if (editItem) {
      setCategory(editItem.category);
      setLimit(String(editItem.amount));
      setStyle(editItem.style ?? 'envelope');
      setRollover(editItem.rollover ?? false);
    }
  }, [editItem]);

  const selectedCat = TRANSACTION_CATEGORIES.find((c) => c.id === category);

  const reset = useCallback(() => {
    setCategory('groceries');
    setLimit('');
    setStyle('envelope');
    setRollover(false);
    setShowConfirmDelete(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleSave = useCallback(() => {
    const parsedLimit = parseFloat(limit);
    if (!parsedLimit) return;

    if (isEditing && editItem) {
      updateBudget(editItem.id, {
        name: selectedCat?.label ?? category,
        category,
        amount: parsedLimit,
        style,
        rollover,
      });
    } else {
      addBudget({
        name: selectedCat?.label ?? category,
        category,
        amount: parsedLimit,
        spent: 0,
        period: 'monthly',
        style,
        rollover,
      });
    }
    reset();
    sheetRef.current?.dismiss();
  }, [limit, category, selectedCat, style, rollover, isEditing, editItem, addBudget, updateBudget, reset, sheetRef]);

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    deleteBudget(editItem.id);
    reset();
    sheetRef.current?.dismiss();
  }, [editItem, deleteBudget, reset, sheetRef]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['75%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">
        {isEditing ? 'Edit Budget' : 'Add Budget'}
      </Text>

      {/* Budget Style */}
      <Text variant="label" className="mb-2">Budget Style</Text>
      <View className="mb-4 flex-row gap-2">
        {BUDGET_STYLES.map((s) => (
          <Pressable
            key={s}
            onPress={() => setStyle(s)}
            accessibilityRole="button"
            accessibilityLabel={`Budget style: ${BUDGET_STYLE_LABELS[s]}${style === s ? ', selected' : ''}`}
            className={`flex-1 items-center rounded-xl py-2.5 border ${
              style === s ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-semibold ${style === s ? 'text-white' : ''}`}>
              {BUDGET_STYLE_LABELS[s]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text variant="label" className="mb-2">
        Category
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
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
            <Icon
              name={cat.icon as IconName}
              size={14}
              color={category === cat.id ? '#FFFFFF' : cat.color}
            />
            <Text
              variant="caption"
              className={`font-sans-medium ml-1.5 ${category === cat.id ? 'text-white' : ''}`}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Input
        label="Monthly Limit"
        placeholder="0.00"
        value={limit}
        onChangeText={setLimit}
        keyboardType="decimal-pad"
        className="mb-3"
      />

      {/* Rollover toggle */}
      <Pressable
        onPress={() => setRollover(!rollover)}
        accessibilityRole="button"
        accessibilityLabel={`Rollover unused budget${rollover ? ', enabled' : ', disabled'}`}
        className="mb-6 flex-row items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-700"
      >
        <View className="flex-row items-center gap-2">
          <Icon name="refresh-outline" size={18} color={colors.primary} />
          <Text variant="body" className="font-sans-medium">Rollover unused budget</Text>
        </View>
        <Icon name={rollover ? 'checkbox' : 'square-outline'} size={20} color={colors.primary} />
      </Pressable>

      <Button onPress={handleSave} disabled={!parseFloat(limit)}>
        {isEditing ? 'Save Changes' : 'Save Budget'}
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
              Delete Budget
            </Button>
          )}
        </View>
      )}
    </BottomSheetModal>
  );
}
