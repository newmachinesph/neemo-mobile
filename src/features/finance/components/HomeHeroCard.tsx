import { useEffect, useRef, useState, useMemo } from 'react';
import { View, Pressable, useColorScheme } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceSummary } from '../hooks/useFinanceSummary';
import { useFinanceForecast, type ForecastStatus } from '../hooks/useFinanceForecast';
import { useFinanceStore } from '../store/finance.store';
import { NetWorthChart } from './NetWorthChart';
import { SpendingPaceChart } from './charts/SpendingPaceChart';

interface HomeHeroCardProps {
  todaySpending?: { total: number; count: number };
}

const STATUS_CONFIG: Record<ForecastStatus, { color: string; label: string; icon: React.ComponentProps<typeof Icon>['name'] }> = {
  green: { color: '#10B981', label: 'On track', icon: 'checkmark-circle' },
  yellow: { color: '#F59E0B', label: 'Watch out', icon: 'alert-circle' },
  red: { color: '#EF4444', label: 'Over budget', icon: 'close-circle' },
};

// ── Animated counter (animates from previous → new target) ─────────
function AnimatedAmount({
  target,
  hidden,
  color,
}: {
  target: number;
  hidden: boolean;
  color: string;
}) {
  const [display, setDisplay] = useState(target);
  const prevTarget = useRef(target);
  const wasHidden = useRef(hidden);

  useEffect(() => {
    // When unhiding, snap to current value — no count-up animation
    if (wasHidden.current && !hidden) {
      setDisplay(target);
      prevTarget.current = target;
      wasHidden.current = hidden;
      return;
    }
    wasHidden.current = hidden;
    if (hidden) return;

    const from = prevTarget.current;
    prevTarget.current = target;
    if (from === target) return;

    let frame: number;
    const duration = 700;
    const start = performance.now();

    function tick() {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, hidden]);

  return (
    <Text
      variant="h1"
      className="font-sans-bold"
      style={{ color, fontSize: 32, lineHeight: 38 }}
    >
      {hidden ? maskedCurrency() : formatCurrency(display)}
    </Text>
  );
}

// ── Compact metric pill ────────────────────────────────────────────
function MetricPill({
  icon,
  color,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  color: string;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1">
      <View className="flex-row items-center" style={{ gap: 4 }}>
        <Icon name={icon} size={14} color={color} />
        <Text variant="caption" className="text-neutral-500 dark:text-neutral-400" style={{ fontSize: 10 }}>
          {label}
        </Text>
      </View>
      <Text variant="body" className="font-sans-semibold mt-0.5" style={{ color }}>
        {value}
      </Text>
    </View>
  );
}

export function HomeHeroCard({ todaySpending }: HomeHeroCardProps) {
  const { colors } = useTheme();
  const { totalBalance, totalIncome, totalExpenses, totalBudgeted, budgetUtilization } = useFinanceSummary();
  const forecast = useFinanceForecast();
  const manualAssets = useFinanceStore((s) => s.manualAssets);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const [showNetWorthChart, setShowNetWorthChart] = useState(false);
  const isDark = useColorScheme() === 'dark';

  const totalManualAssets = useMemo(
    () => manualAssets.reduce((sum, a) => sum + a.value, 0),
    [manualAssets],
  );

  const netWorth = totalBalance + totalManualAssets;
  const amt = (v: number) => (hideBalances ? maskedCurrency() : formatCurrency(v));
  const statusCfg = STATUS_CONFIG[forecast.status];

  // Contextual micro-copy
  const insightText = useMemo(() => {
    const now = new Date();
    const day = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - day;
    const pctMonth = day / daysInMonth;

    if (totalBudgeted > 0) {
      const pctBudget = budgetUtilization;
      if (pctBudget > pctMonth + 0.15) {
        return `Spending ${Math.round((pctBudget - pctMonth) * 100)}% faster than budget pace`;
      }
      if (pctBudget < pctMonth - 0.1) {
        return `Under budget pace — ${daysLeft} days left this month`;
      }
    }
    if (forecast.status === 'red') {
      return `${daysLeft} days left — consider reducing spending`;
    }
    if (forecast.status === 'yellow') {
      return `Budget getting tight with ${daysLeft} days remaining`;
    }
    return `Day ${day} of ${daysInMonth} — ${daysLeft} days remaining`;
  }, [totalBudgeted, budgetUtilization, forecast.status]);

  return (
    <>
      <Card className="mb-2 overflow-hidden">
        {/* Gradient accent bar */}
        <View className="h-1 -mx-4 -mt-4 mb-3" style={{ backgroundColor: statusCfg.color }} />

        {/* Free to Spend header + status badge */}
        <View className="flex-row items-center justify-between mb-1">
          <Text variant="caption" className="text-neutral-500 dark:text-neutral-400">Free to Spend</Text>
          <View
            className="flex-row items-center rounded-full px-2 py-0.5"
            style={{ backgroundColor: isDark ? `${statusCfg.color}25` : `${statusCfg.color}15` }}
          >
            <Icon name={statusCfg.icon} size={12} color={statusCfg.color} />
            <Text variant="caption" className="ml-1 font-sans-medium" style={{ fontSize: 10, color: statusCfg.color }}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* Animated hero number */}
        <AnimatedAmount
          target={forecast.safeToSpend}
          hidden={hideBalances}
          color={statusCfg.color}
        />

        {/* Contextual insight */}
        <Text variant="caption" className="text-neutral-400 dark:text-neutral-500 mt-0.5" style={{ fontSize: 11 }}>
          {insightText}
        </Text>

        {/* Spending Pace Chart */}
        <View className="mt-3">
          <SpendingPaceChart height={80} status={forecast.status} />
        </View>

        {/* Net Worth row (secondary) */}
        <View className="mt-3 border-t border-neutral-100 dark:border-neutral-700/50 pt-2.5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Text variant="caption" className="text-neutral-500 dark:text-neutral-400">Net Worth</Text>
              <Text variant="body" className="font-sans-semibold">{amt(netWorth)}</Text>
            </View>
            <Pressable onPress={() => setShowNetWorthChart((p) => !p)} hitSlop={8} accessibilityRole="button" accessibilityLabel={showNetWorthChart ? 'Hide net worth chart' : 'Show net worth chart'}>
              <Icon
                name={showNetWorthChart ? 'chevron-up' : 'analytics-outline'}
                size={16}
                color={colors.primary}
              />
            </Pressable>
          </View>

          {/* Income / Expenses row */}
          <View className="mt-2.5 flex-row" style={{ gap: 12 }}>
            <MetricPill icon="arrow-up-circle" color={colors.income} label="Income" value={amt(totalIncome)} />
            <MetricPill icon="arrow-down-circle" color={colors.expense} label="Expenses" value={amt(totalExpenses)} />
          </View>

          {/* Today / Month row */}
          <View className="mt-2 flex-row" style={{ gap: 12 }}>
            {todaySpending && todaySpending.count > 0 && (
              <MetricPill icon="cart-outline" color={colors.primary} label="Today" value={amt(todaySpending.total)} />
            )}
            <MetricPill
              icon="pie-chart-outline"
              color={totalBudgeted - totalExpenses >= 0 ? colors.success : colors.danger}
              label="Budget Left"
              value={amt(totalBudgeted - totalExpenses)}
            />
          </View>
        </View>
      </Card>

      {showNetWorthChart && <NetWorthChart />}
    </>
  );
}
