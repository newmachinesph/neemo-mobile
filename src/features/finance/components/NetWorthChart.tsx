import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '../store/finance.store';

export function NetWorthChart() {
  const snapshots = useFinanceStore((s) => s.netWorthSnapshots);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);

  if (snapshots.length === 0) {
    return (
      <Card className="mb-3">
        <Text variant="caption" className="text-center text-neutral-500">
          No net worth history yet. Snapshots are taken automatically.
        </Text>
      </Card>
    );
  }

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const maxNetWorth = Math.max(...sorted.map((s) => Math.abs(s.netWorth)), 1);
  const barMaxHeight = 120;

  return (
    <Card className="mb-3">
      <Text variant="label" className="mb-3">Net Worth History</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row items-end gap-3" style={{ minHeight: barMaxHeight + 40 }}>
          {sorted.map((snap) => {
            const height = Math.max((Math.abs(snap.netWorth) / maxNetWorth) * barMaxHeight, 4);
            const isNegative = snap.netWorth < 0;
            const dateLabel = new Date(snap.date).toLocaleDateString('en-PH', {
              month: 'short',
              year: '2-digit',
            });

            return (
              <View key={snap.id} className="items-center" style={{ width: 50 }}>
                <Text variant="caption" style={{ fontSize: 9 }} className="mb-1">
                  {amt(snap.netWorth)}
                </Text>
                <View
                  className={`w-8 rounded-t-md ${isNegative ? 'bg-red-400' : 'bg-emerald-500'}`}
                  style={{ height }}
                />
                <Text variant="caption" style={{ fontSize: 9 }} className="mt-1">
                  {dateLabel}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {sorted.length >= 2 && (
        <View className="mt-3 flex-row justify-between border-t border-neutral-100 pt-2 dark:border-neutral-800">
          <View>
            <Text variant="caption" className="text-neutral-500">First</Text>
            <Text variant="caption" className="font-sans-semibold">
              {amt(sorted[0]!.netWorth)}
            </Text>
          </View>
          <View className="items-end">
            <Text variant="caption" className="text-neutral-500">Latest</Text>
            <Text variant="caption" className="font-sans-semibold">
              {amt(sorted[sorted.length - 1]!.netWorth)}
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
}
