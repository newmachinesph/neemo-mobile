import { memo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { ListItem } from '@ui/components/ListItem';
import { Icon, type IconName } from '@ui/components/Icon';
import { Text } from '@ui/components/Text';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { CATEGORY_MAP, SUBCATEGORIES } from '@lib/constants/finance';
import { useFinanceStore } from '../store/finance.store';
import { ReceiptViewerModal } from './ReceiptViewerModal';
import type { Transaction } from '../types/finance.types';

interface TransactionRowProps {
  transaction: Transaction;
  onPress?: () => void;
}

export const TransactionRow = memo(function TransactionRow({ transaction, onPress }: TransactionRowProps) {
  const { colors } = useTheme();
  const [receiptVisible, setReceiptVisible] = useState(false);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const category = CATEGORY_MAP.get(transaction.category);
  const iconName = category?.icon ?? 'ellipsis-horizontal-outline';
  const iconColor = category?.color ?? colors.textTertiary;

  const isIncome = transaction.type === 'income';
  const sign = isIncome ? '+' : '-';
  const amountColor = isIncome ? 'text-income' : 'text-expense';

  const hasTags = transaction.tags && transaction.tags.length > 0;
  const hasSplits = transaction.splits && transaction.splits.length > 0;
  const hasReceipt = !!transaction.receiptUri;
  const hasExchangeRate = !!transaction.exchangeRate && transaction.currency !== 'PHP';
  const isBusiness = !!transaction.isBusiness;

  const subcategoryLabel = transaction.subcategory
    ? SUBCATEGORIES[transaction.category]?.find((s) => s.id === transaction.subcategory)?.label
    : undefined;

  return (
    <View>
      <ListItem
        title={transaction.merchantName}
        subtitle={subcategoryLabel ? `${transaction.description} · ${subcategoryLabel}` : transaction.description}
        leftIcon={
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: `${iconColor}15` }}
          >
            <Icon name={iconName as IconName} size={20} color={iconColor} />
          </View>
        }
        rightValue={hideBalances ? maskedCurrency(transaction.currency) : `${sign}${formatCurrency(transaction.amount, transaction.currency)}`}
        rightValueClassName={amountColor}
        showChevron={false}
        onPress={onPress}
        className="px-0"
      />
      {hasExchangeRate && (
        <View className="ml-12 -mt-1 mb-0.5">
          <Text variant="caption" style={{ fontSize: 10, color: colors.textTertiary }}>
            (≈ ₱{(transaction.amount * transaction.exchangeRate!).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
          </Text>
        </View>
      )}
      {(hasTags || hasSplits || hasReceipt || isBusiness) && (
        <View className="ml-12 -mt-1 mb-1 flex-row flex-wrap gap-1">
          {isBusiness && (
            <View className="rounded-full bg-purple-100 px-2 py-0.5 dark:bg-purple-900/30">
              <Text variant="caption" style={{ fontSize: 10, color: colors.info }}>
                Business
              </Text>
            </View>
          )}
          {hasReceipt && (
            <Pressable
              onPress={() => setReceiptVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="View receipt"
              className="rounded-full bg-blue-100 px-2 py-0.5 dark:bg-blue-900/30"
              hitSlop={4}
            >
              <Text variant="caption" style={{ fontSize: 10, color: colors.info }}>
                Receipt
              </Text>
            </Pressable>
          )}
          {hasTags &&
            transaction.tags?.map((tag) => (
              <View key={tag} className="rounded-full bg-primary-100 px-2 py-0.5 dark:bg-primary-900">
                <Text variant="caption" style={{ fontSize: 10, color: colors.primary }}>
                  {tag}
                </Text>
              </View>
            ))}
          {hasSplits && (
            <View className="rounded-full bg-amber-100 px-2 py-0.5 dark:bg-amber-900/30">
              <Text variant="caption" style={{ fontSize: 10, color: colors.warning }}>
                Split
              </Text>
            </View>
          )}
        </View>
      )}
      {hasReceipt && (
        <ReceiptViewerModal
          uri={transaction.receiptUri ?? ''}
          visible={receiptVisible}
          onClose={() => setReceiptVisible(false)}
        />
      )}
    </View>
  );
});
