import { useMemo } from 'react';
import { View } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '../store/finance.store';

interface GovtContributionSummaryProps {
  year: number;
}

export function GovtContributionSummary({ year }: GovtContributionSummaryProps) {
  const { colors } = useTheme();
  const contributions = useFinanceStore((s) => s.govtContributions);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);

  const summary = useMemo(() => {
    const yearContribs = contributions.filter((c) => c.year === year);
    const sssPaid = yearContribs.filter((c) => c.type === 'sss' && c.status === 'paid').reduce((s, c) => s + c.amount, 0);
    const philPaid = yearContribs.filter((c) => c.type === 'philhealth' && c.status === 'paid').reduce((s, c) => s + c.amount, 0);
    const pagibigPaid = yearContribs.filter((c) => c.type === 'pagibig' && c.status === 'paid').reduce((s, c) => s + c.amount, 0);
    const totalPaid = sssPaid + philPaid + pagibigPaid;

    // Next unpaid month
    const currentMonth = new Date().getMonth() + 1;
    const nextUnpaid = yearContribs
      .filter((c) => c.status === 'unpaid' && c.month <= currentMonth)
      .sort((a, b) => a.month - b.month);

    return { sssPaid, philPaid, pagibigPaid, totalPaid, nextUnpaid };
  }, [contributions, year]);

  return (
    <Card className="mb-3">
      <Text variant="label" className="mb-3">Annual Summary — {year}</Text>

      <View className="flex-row items-center justify-between py-1">
        <Text variant="body" className="text-neutral-600 dark:text-neutral-400">SSS</Text>
        <Text variant="body" className="font-sans-semibold">{amt(summary.sssPaid)}</Text>
      </View>
      <View className="flex-row items-center justify-between py-1">
        <Text variant="body" className="text-neutral-600 dark:text-neutral-400">PhilHealth</Text>
        <Text variant="body" className="font-sans-semibold">{amt(summary.philPaid)}</Text>
      </View>
      <View className="flex-row items-center justify-between py-1">
        <Text variant="body" className="text-neutral-600 dark:text-neutral-400">Pag-IBIG</Text>
        <Text variant="body" className="font-sans-semibold">{amt(summary.pagibigPaid)}</Text>
      </View>
      <View className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />
      <View className="flex-row items-center justify-between py-1">
        <Text variant="body" className="font-sans-bold">Total Paid</Text>
        <Text variant="body" className="font-sans-bold" style={{ color: colors.primary }}>
          {amt(summary.totalPaid)}
        </Text>
      </View>

      {summary.nextUnpaid.length > 0 && (
        <View className="mt-3 flex-row items-center gap-2 rounded-lg bg-red-50 p-2 dark:bg-red-900/20">
          <Icon name="alert-circle-outline" size={16} color={colors.danger} />
          <Text variant="caption" style={{ color: colors.danger }}>
            {summary.nextUnpaid.length} contribution{summary.nextUnpaid.length > 1 ? 's' : ''} overdue
          </Text>
        </View>
      )}
    </Card>
  );
}
