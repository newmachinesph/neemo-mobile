import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Line, Rect, Circle, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { Text } from '@ui/components/Text';
import { formatCurrency } from '@lib/utils/currency';
import { palette } from '@theme/colors';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '../../store/finance.store';
import { useFinanceSummary } from '../../hooks/useFinanceSummary';

type Props = {
  days?: number;
  height?: number;
  compact?: boolean;
};

type ProjectionPoint = {
  label: string;
  value: number;
  event?: 'bill' | 'income';
  eventLabel?: string;
};

const PAD = { top: 8, bottom: 8, left: 4, right: 4 };

/**
 * Cash flow projection chart with income + expense modeling.
 * Detects recurring income days from transaction history and projects them forward.
 */
export function ForecastChart({ days = 30, height = 140, compact = false }: Props) {
  const { colors } = useTheme();
  const transactions = useFinanceStore((s) => s.transactions);
  const recurringBills = useFinanceStore((s) => s.recurringBills);
  const { totalBalance } = useFinanceSummary();

  const projections = useMemo(() => {
    const now = new Date();
    const nowStr = now.toISOString();

    // ── Daily average expense (excluding bills & known recurring) ──
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const recentExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date >= sixtyDaysAgo.toISOString() && t.date <= nowStr,
    );
    const totalRecentExpenses = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
    const dailyAvgExpense = totalRecentExpenses / 60;

    // ── Detect recurring income days from last 3 months ──
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const incomeTransactions = transactions.filter(
      (t) => t.type === 'income' && t.date >= threeMonthsAgo.toISOString() && t.date <= nowStr,
    );

    // Group income by day-of-month, find recurring patterns
    const incomeByDay = new Map<number, { total: number; count: number; label: string }>();
    for (const t of incomeTransactions) {
      const d = new Date(t.date).getDate();
      const existing = incomeByDay.get(d) ?? { total: 0, count: 0, label: '' };
      existing.total += t.amount;
      existing.count += 1;
      if (!existing.label) existing.label = t.description || t.merchantName || 'Income';
      incomeByDay.set(d, existing);
    }

    // Only count income days that appeared 2+ times (likely recurring)
    const recurringIncome = new Map<number, { amount: number; label: string }>();
    for (const [day, data] of incomeByDay) {
      if (data.count >= 2) {
        recurringIncome.set(day, {
          amount: Math.round(data.total / data.count),
          label: data.label,
        });
      }
    }

    // ── Bill due days ──
    const billsByDay = new Map<number, { amount: number; label: string }>();
    for (const bill of recurringBills) {
      if (!bill.isActive || bill.frequency !== 'monthly') continue;
      const existing = billsByDay.get(bill.dueDay);
      if (existing) {
        existing.amount += bill.amount;
        existing.label += `, ${bill.name}`;
      } else {
        billsByDay.set(bill.dueDay, { amount: bill.amount, label: bill.name });
      }
    }

    // ── Project each day ──
    const points: ProjectionPoint[] = [];
    let balance = totalBalance;

    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const dayOfMonth = d.getDate();

      let event: ProjectionPoint['event'];
      let eventLabel: string | undefined;

      // Apply daily spending
      if (i > 0) balance -= dailyAvgExpense;

      // Subtract bills
      const billInfo = billsByDay.get(dayOfMonth);
      if (i > 0 && billInfo) {
        balance -= billInfo.amount;
        event = 'bill';
        eventLabel = billInfo.label;
      }

      // Add projected income
      const incomeInfo = recurringIncome.get(dayOfMonth);
      if (i > 0 && incomeInfo) {
        balance += incomeInfo.amount;
        event = 'income';
        eventLabel = incomeInfo.label;
      }

      const label = compact
        ? (i === 0 ? 'Today' : i === days - 1 ? `D${i}` : '')
        : d.toLocaleDateString('en', { month: 'short', day: 'numeric' });

      points.push({ label, value: Math.round(balance), event, eventLabel });
    }

    return points;
  }, [transactions, recurringBills, totalBalance, days, compact]);

  if (projections.length === 0) {
    return (
      <View className="items-center py-4">
        <Text variant="caption">No forecast data</Text>
      </View>
    );
  }

  const dataMax = Math.max(...projections.map((p) => p.value));
  const dataMin = Math.min(...projections.map((p) => p.value));
  const dataRange = dataMax - dataMin || 1;
  const pad = dataRange * 0.12;
  const maxVal = dataMax + pad;
  const minVal = dataMin - pad;
  const range = maxVal - minVal || 1;

  const showZeroLine = minVal <= 0 && maxVal >= 0;

  const svgW = 300;
  const chartW = svgW - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  const toX = (i: number) =>
    PAD.left + (projections.length > 1 ? (i / (projections.length - 1)) * chartW : chartW / 2);
  const toY = (val: number) =>
    PAD.top + chartH - ((val - minVal) / range) * chartH;

  const zeroY = toY(0);
  const polylinePoints = projections.map((p, i) => `${toX(i)},${toY(p.value)}`).join(' ');

  // Filled area under the line
  const firstX = toX(0);
  const lastX = toX(projections.length - 1);
  const bottomY = PAD.top + chartH;
  const areaPath = `M${firstX},${bottomY} ` +
    projections.map((p, i) => `L${toX(i)},${toY(p.value)}`).join(' ') +
    ` L${lastX},${bottomY} Z`;

  // Event markers (bills & income)
  const events = projections
    .map((p, i) => ({ ...p, i }))
    .filter((p) => p.event);

  // X-axis labels
  const labelStep = compact ? Math.max(1, Math.floor(days / 3)) : Math.max(1, Math.floor(projections.length / 6));
  const labels = projections
    .map((p, i) => ({ ...p, i }))
    .filter((_, i) => i === 0 || i === projections.length - 1 || i % labelStep === 0);

  return (
    <View>
      {!compact && (
        <View className="flex-row justify-between mb-1">
          <Text variant="caption" style={{ fontSize: 10 }}>{formatCurrency(dataMax)}</Text>
          <Text variant="caption" style={{ fontSize: 10 }}>{formatCurrency(dataMin)}</Text>
        </View>
      )}

      <Svg width="100%" height={height} viewBox={`0 0 ${svgW} ${height}`}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.primary[600]} stopOpacity={0.15} />
            <Stop offset="1" stopColor={palette.primary[600]} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>

        {/* Danger zone below zero */}
        {showZeroLine && dataMin < 0 && (
          <Rect
            x={PAD.left}
            y={zeroY}
            width={chartW}
            height={bottomY - zeroY}
            fill={`${colors.danger}14`}
          />
        )}

        {/* Zero line */}
        {showZeroLine && (
          <Line
            x1={PAD.left} y1={zeroY}
            x2={PAD.left + chartW} y2={zeroY}
            stroke={colors.danger} strokeWidth={0.8} opacity={0.4}
          />
        )}

        {/* Filled area under the line */}
        <Path d={areaPath} fill="url(#areaGrad)" />

        {/* Projection line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={palette.primary[600]}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Event markers — vertical dashed lines + colored dots */}
        {events.map((ev) => (
          <Line
            key={`ev-line-${ev.i}`}
            x1={toX(ev.i)} y1={PAD.top}
            x2={toX(ev.i)} y2={bottomY}
            stroke={ev.event === 'income' ? colors.income : colors.warning}
            strokeWidth={0.8}
            strokeDasharray="3,3"
            opacity={0.5}
          />
        ))}

        {/* Regular dots (smaller) */}
        {projections.map((p, i) => {
          const isEvent = p.event;
          if (isEvent) return null;
          return (
            <Circle
              key={i}
              cx={toX(i)}
              cy={toY(p.value)}
              r={compact ? 1.5 : 2}
              fill={palette.primary[600]}
              opacity={0.6}
            />
          );
        })}

        {/* Event dots (larger, colored) */}
        {events.map((ev) => (
          <Circle
            key={`ev-dot-${ev.i}`}
            cx={toX(ev.i)}
            cy={toY(ev.value)}
            r={compact ? 3.5 : 4.5}
            fill={ev.event === 'income' ? colors.income : colors.warning}
            stroke="white"
            strokeWidth={1.5}
          />
        ))}
      </Svg>

      {/* X-axis labels */}
      {!compact && (
        <View className="flex-row justify-between mt-1.5">
          {labels.map((p, i) => (
            <Text key={i} variant="caption" style={{ fontSize: 9 }} numberOfLines={1}>
              {p.label}
            </Text>
          ))}
        </View>
      )}

      {/* Legend */}
      {!compact && (
        <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
          <View className="flex-row items-center gap-1">
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: palette.primary[600] }} />
            <Text variant="caption" style={{ fontSize: 10 }}>Balance</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.income }} />
            <Text variant="caption" style={{ fontSize: 10 }}>Income</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.warning }} />
            <Text variant="caption" style={{ fontSize: 10 }}>Bills</Text>
          </View>
        </View>
      )}
    </View>
  );
}
