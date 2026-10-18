import { View, Pressable } from 'react-native';
import { Text } from '@ui/components/Text';
import { Icon, type IconName } from '@ui/components/Icon';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { CATEGORY_MAP } from '@lib/constants/finance';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '../store/finance.store';
import type { RecurringBill } from '../types/finance.types';

interface BillRowProps {
  bill: RecurringBill;
  onPress?: () => void;
}

function getDueStatus(dueDay: number, lastPaidDate?: string): 'overdue' | 'due_soon' | 'normal' {
  const now = new Date();
  const today = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Check if already paid this month
  if (lastPaidDate) {
    const paid = new Date(lastPaidDate);
    if (paid.getMonth() === currentMonth && paid.getFullYear() === currentYear) {
      return 'normal';
    }
  }

  if (today > dueDay) return 'overdue';
  if (dueDay - today <= 3) return 'due_soon';
  return 'normal';
}

const STATUS_COLORS = {
  overdue: '#ef4444',
  due_soon: '#f59e0b',
  normal: undefined,
} as const;

export function BillRow({ bill, onPress }: BillRowProps) {
  const { colors } = useTheme();
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const category = CATEGORY_MAP.get(bill.category);
  const iconName = category?.icon ?? 'receipt-outline';
  const iconColor = category?.color ?? colors.textTertiary;
  const status = getDueStatus(bill.dueDay, bill.lastPaidDate);
  const statusColor = STATUS_COLORS[status];

  const ordinal = (n: number) => {
    if (n >= 11 && n <= 13) return `${n}th`;
    const s = ['th', 'st', 'nd', 'rd'];
    return `${n}${s[n % 10] ?? s[0]}`;
  };

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      className="flex-row items-center py-2.5 active:opacity-80"
      {...(onPress ? { onPress, accessibilityRole: 'button' as const, accessibilityLabel: `Bill: ${bill.name}, Due on the ${ordinal(bill.dueDay)}` } : {})}
    >
      <View
        className="mr-3 h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <Icon name={iconName as IconName} size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text variant="body" className="font-sans-medium" numberOfLines={1}>
          {bill.name}
        </Text>
        <Text variant="caption" style={statusColor ? { color: statusColor } : undefined}>
          Due on the {ordinal(bill.dueDay)}
          {status === 'overdue' ? ' — Overdue' : status === 'due_soon' ? ' — Due soon' : ''}
        </Text>
      </View>
      <View className="items-end">
        <Text variant="body" className="font-sans-semibold" style={statusColor ? { color: statusColor } : undefined}>
          {hideBalances ? maskedCurrency() : formatCurrency(bill.amount)}
        </Text>
        {!hideBalances && bill.paymentHistory && bill.paymentHistory.length >= 2 && bill.amount > 0 && (() => {
          const avg = bill.paymentHistory.reduce((s, p) => s + p.amount, 0) / bill.paymentHistory.length;
          const diff = Math.abs(avg - bill.amount) / bill.amount;
          return diff > 0.05 ? (
            <Text variant="caption" style={{ fontSize: 10, color: colors.textTertiary }}>
              Avg: {formatCurrency(Math.round(avg))}
            </Text>
          ) : null;
        })()}
      </View>
    </Wrapper>
  );
}
