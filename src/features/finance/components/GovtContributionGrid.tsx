import { useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '../store/finance.store';
import type { GovtContribution } from '../types/finance.types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface GovtContributionGridProps {
  type: GovtContribution['type'];
  year: number;
}

export function GovtContributionGrid({ type, year }: GovtContributionGridProps) {
  const { colors } = useTheme();
  const contributions = useFinanceStore((s) => s.govtContributions);
  const markPaid = useFinanceStore((s) => s.markGovtContribPaid);
  const hideBalances = useFinanceStore((s) => s.hideBalances);

  const yearContribs = useMemo(
    () => contributions.filter((c) => c.type === type && c.year === year),
    [contributions, type, year],
  );

  const totalPaid = useMemo(
    () => yearContribs.filter((c) => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
    [yearContribs],
  );
  const paidCount = yearContribs.filter((c) => c.status === 'paid').length;

  const currentMonth = new Date().getMonth() + 1;

  return (
    <Card className="mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <Text variant="label" style={{ color: colors.primary }}>
          {type.toUpperCase()} — {year}
        </Text>
        <Text variant="caption" className="text-neutral-500">
          {paidCount}/12 paid
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {MONTHS.map((month, idx) => {
          const monthNum = idx + 1;
          const contrib = yearContribs.find((c) => c.month === monthNum);
          const isPaid = contrib?.status === 'paid';
          const isFuture = monthNum > currentMonth;

          return (
            <Pressable
              key={month}
              onPress={() => {
                if (!isFuture && !isPaid) markPaid(type, year, monthNum);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${month}: ${isPaid ? 'Paid' : isFuture ? 'Future' : 'Due, tap to mark paid'}`}
              className="items-center rounded-lg py-2"
              style={{
                width: '23%',
                backgroundColor: isPaid ? `${colors.success}15` : isFuture ? colors.surfaceSecondary : `${colors.danger}15`,
                borderWidth: 1,
                borderColor: isPaid ? colors.success : isFuture ? colors.border : `${colors.danger}60`,
              }}
            >
              <Text variant="caption" className="font-sans-semibold" style={{ fontSize: 11 }}>
                {month}
              </Text>
              <Text
                variant="caption"
                style={{
                  fontSize: 10,
                  color: isPaid ? colors.success : isFuture ? colors.textTertiary : colors.danger,
                  fontWeight: '600',
                }}
              >
                {isPaid ? 'Paid' : isFuture ? '—' : 'Due'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-3 border-t border-neutral-100 pt-2 dark:border-neutral-800">
        <View className="flex-row items-center justify-between">
          <Text variant="caption" className="text-neutral-500">Total Paid</Text>
          <Text variant="body" className="font-sans-bold" style={{ color: colors.success }}>
            {hideBalances ? maskedCurrency() : formatCurrency(totalPaid)}
          </Text>
        </View>
      </View>
    </Card>
  );
}
