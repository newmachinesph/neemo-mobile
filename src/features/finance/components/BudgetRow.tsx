import { memo } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@ui/components/Text';
import { ProgressBar } from '@ui/components/ProgressBar';
import { Icon, type IconName } from '@ui/components/Icon';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { CATEGORY_MAP } from '@lib/constants/finance';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '../store/finance.store';
import type { Budget } from '../types/finance.types';

interface BudgetRowProps {
  budget: Budget;
  onPress?: () => void;
}

export const BudgetRow = memo(function BudgetRow({ budget, onPress }: BudgetRowProps) {
  const { colors } = useTheme();
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);
  const category = CATEGORY_MAP.get(budget.category);
  const iconName = category?.icon ?? 'ellipsis-horizontal-outline';
  const iconColor = category?.color ?? colors.textTertiary;
  const progress = budget.amount > 0 ? budget.spent / budget.amount : 0;

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper className="mb-3 rounded-lg active:opacity-80" {...(onPress ? { onPress, accessibilityRole: 'button' as const, accessibilityLabel: `Budget: ${budget.name}, ${amt(budget.spent)} of ${amt(budget.amount)}` } : {})}>
      <View className="mb-1.5 flex-row items-center">
        <View
          className="mr-2.5 h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon name={iconName as IconName} size={16} color={iconColor} />
        </View>
        <Text variant="body" className="font-sans-medium flex-1" numberOfLines={1}>
          {budget.name}
        </Text>
        <Text variant="caption">
          {amt(budget.spent)} / {amt(budget.amount)}
        </Text>
      </View>
      <ProgressBar progress={progress} height="sm" useThresholdColors />
    </Wrapper>
  );
});
