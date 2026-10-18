import { View } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { usePulseCheck, type PulseMetric, type MetricStatus } from '../hooks/useFinancialHealth';
import { useFinanceStore } from '../store/finance.store';

const STATUS_COLORS: Record<MetricStatus, string> = {
  good: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444',
};

function MetricCell({ metric, hideBalances }: { metric: PulseMetric; hideBalances: boolean }) {
  const color = STATUS_COLORS[metric.status];

  return (
    <View className="flex-1 py-3 px-3">
      <View className="flex-row items-center mb-1.5" style={{ gap: 6 }}>
        <Icon
          name={metric.icon as React.ComponentProps<typeof Icon>['name']}
          size={13}
          className="text-neutral-400"
        />
        <Text variant="caption" className="text-neutral-500" style={{ fontSize: 11 }}>
          {metric.label}
        </Text>
      </View>
      <View className="flex-row items-center mb-1" style={{ gap: 6 }}>
        <View
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <Text
          variant="body"
          className="font-sans-bold"
          style={{ fontSize: 14 }}
        >
          {hideBalances ? '••••' : metric.value}
        </Text>
      </View>
      {!hideBalances && (
        <Text variant="caption" className="text-neutral-400" style={{ fontSize: 10 }}>
          {metric.insight}
        </Text>
      )}
    </View>
  );
}

export function FinancialHealthCard() {
  const { metrics, overallStatus, hasData } = usePulseCheck();
  const hideBalances = useFinanceStore((s) => s.hideBalances);

  if (!hasData) return null;

  const overallColor = STATUS_COLORS[overallStatus];

  return (
    <Card className="mb-4 px-0 pb-0">
      {/* Header */}
      <View className="flex-row items-center px-4 pb-1" style={{ gap: 6 }}>
        <View
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: overallColor }}
        />
        <Text
          variant="caption"
          className="font-sans-semibold text-neutral-500"
          style={{ fontSize: 11, letterSpacing: 0.5 }}
        >
          PULSE CHECK
        </Text>
      </View>

      {/* 2x2 Grid */}
      <View>
        <View className="flex-row">
          <MetricCell metric={metrics[0]!} hideBalances={hideBalances} />
          <View className="w-px bg-neutral-100 my-2.5 dark:bg-neutral-700/50" />
          <MetricCell metric={metrics[1]!} hideBalances={hideBalances} />
        </View>
        <View className="h-px bg-neutral-100 mx-3 dark:bg-neutral-700/50" />
        <View className="flex-row">
          <MetricCell metric={metrics[2]!} hideBalances={hideBalances} />
          <View className="w-px bg-neutral-100 my-2.5 dark:bg-neutral-700/50" />
          <MetricCell metric={metrics[3]!} hideBalances={hideBalances} />
        </View>
      </View>
    </Card>
  );
}
