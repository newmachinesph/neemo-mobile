import { useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '../../store/finance.store';
import { useFinanceSummary } from '../../hooks/useFinanceSummary';
import { convertToBase } from '@lib/utils/currency';
import type { ForecastStatus } from '../../hooks/useFinanceForecast';

const STATUS_COLORS: Record<ForecastStatus, string> = {
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
};

type Props = {
  height?: number;
  status: ForecastStatus;
};

/**
 * Spending Pace Chart (Copilot-inspired)
 * Dotted line = ideal budget pace (linear)
 * Solid line = actual cumulative spending
 */
export function SpendingPaceChart({ height = 80, status }: Props) {
  const { colors } = useTheme();
  const transactions = useFinanceStore((s) => s.transactions);
  const profileCurrency = useFinanceStore((s) => s.profile.currency);
  const { totalBudgeted } = useFinanceSummary();
  const [chartWidth, setChartWidth] = useState(0);
  const gridColor = colors.border;
  const labelColor = colors.textTertiary;

  const handleLayout = (e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width);
  };

  const { idealPoints, actualPoints, today, daysInMonth, paceTarget } = useMemo(() => {
    const now = new Date();
    const yr = now.getFullYear();
    const mo = now.getMonth();
    const dim = new Date(yr, mo + 1, 0).getDate();
    const td = now.getDate();
    const monthStart = `${yr}-${String(mo + 1).padStart(2, '0')}-01`;

    // Get this month's expense transactions
    const monthExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date.slice(0, 10) >= monthStart,
    );

    // Build cumulative spending per day
    const dailySpend: number[] = new Array(dim).fill(0);
    for (const txn of monthExpenses) {
      const day = new Date(txn.date).getDate();
      if (day >= 1 && day <= dim) {
        dailySpend[day - 1]! += convertToBase(txn.amount, txn.currency, profileCurrency);
      }
    }

    // Cumulative actual spending
    const cumulative: number[] = [];
    let running = 0;
    for (let i = 0; i < td; i++) {
      running += dailySpend[i]!;
      cumulative.push(running);
    }

    // Use totalBudgeted as pace target, fallback to projected if no budgets
    const target = totalBudgeted > 0 ? totalBudgeted : running > 0 ? (running / td) * dim : 1;

    // Ideal pace: linear from 0 to target over daysInMonth
    const ideal = Array.from({ length: dim }, (_, i) => ((i + 1) / dim) * target);

    return {
      idealPoints: ideal,
      actualPoints: cumulative,
      today: td,
      daysInMonth: dim,
      paceTarget: target,
    };
  }, [transactions, profileCurrency, totalBudgeted]);

  // Empty state — no spending data yet this month
  if (actualPoints.length === 0 || actualPoints.every((v) => v === 0)) {
    return (
      <View onLayout={handleLayout}>
        <View className="items-center justify-center py-3" style={{ height }}>
          <Icon name="analytics-outline" size={20} color={colors.textTertiary} />
          <Text variant="caption" className="text-neutral-400 dark:text-neutral-500 mt-1" style={{ fontSize: 10 }}>
            Start spending to see your pace
          </Text>
        </View>
      </View>
    );
  }

  // Wait for layout measurement
  if (chartWidth === 0) {
    return <View onLayout={handleLayout} style={{ height }} />;
  }

  const svgW = chartWidth;
  const svgH = height;
  const PAD = { top: 8, bottom: 16, left: 4, right: 4 };
  const cW = svgW - PAD.left - PAD.right;
  const cH = svgH - PAD.top - PAD.bottom;

  const maxVal = Math.max(paceTarget, ...actualPoints) * 1.1;

  const divisor = Math.max(daysInMonth - 1, 1);
  const toX = (day: number) => PAD.left + ((day - 1) / divisor) * cW;
  const toY = (val: number) => PAD.top + cH - (val / maxVal) * cH;

  // Build ideal pace polyline (full month)
  const idealStr = idealPoints
    .map((val, i) => `${toX(i + 1)},${toY(val)}`)
    .join(' ');

  // Build actual spending polyline (up to today)
  const actualStr = [`${toX(1)},${toY(0)}`, ...actualPoints.map((val, i) => `${toX(i + 1)},${toY(val)}`)].join(' ');

  const color = STATUS_COLORS[status];

  // Day labels
  const dayLabels = [1, Math.ceil(daysInMonth / 2), daysInMonth];

  const lastVal = actualPoints[actualPoints.length - 1]!;

  return (
    <View onLayout={handleLayout}>
      <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        {/* Ideal pace line (dotted) */}
        <Polyline
          points={idealStr}
          fill="none"
          stroke={gridColor}
          strokeWidth={1.5}
          strokeDasharray="4,4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Actual spending line (solid) */}
        <Polyline
          points={actualStr}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Today dot */}
        <Circle
          cx={toX(today)}
          cy={toY(lastVal)}
          r={7}
          fill={color}
          opacity={0.2}
        />
        <Circle
          cx={toX(today)}
          cy={toY(lastVal)}
          r={4}
          fill={color}
        />

        {/* Day labels */}
        {dayLabels.map((day) => (
          <SvgText
            key={day}
            x={toX(day)}
            y={svgH - 2}
            fontSize={9}
            fill={labelColor}
            textAnchor="middle"
          >
            {day}
          </SvgText>
        ))}

        {/* Today marker line */}
        <Line
          x1={toX(today)}
          y1={PAD.top}
          x2={toX(today)}
          y2={PAD.top + cH}
          stroke={color}
          strokeWidth={0.5}
          strokeDasharray="2,3"
          opacity={0.4}
        />
      </Svg>

      {/* Legend */}
      <View className="flex-row items-center justify-center mt-1" style={{ gap: 16 }}>
        <View className="flex-row items-center" style={{ gap: 4 }}>
          {/* Dashed legend indicator — two short segments with a gap */}
          <View className="flex-row items-center" style={{ gap: 2, width: 16 }}>
            <View className="h-0.5 flex-1 rounded-full" style={{ backgroundColor: gridColor }} />
            <View className="h-0.5 flex-1 rounded-full" style={{ backgroundColor: gridColor }} />
            <View className="h-0.5 flex-1 rounded-full" style={{ backgroundColor: gridColor }} />
          </View>
          <Text variant="caption" className="text-neutral-400 dark:text-neutral-500" style={{ fontSize: 9 }}>Budget pace</Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 4 }}>
          <View className="h-0.5 w-4 rounded-full" style={{ backgroundColor: color }} />
          <Text variant="caption" style={{ fontSize: 9, color }}>Your spending</Text>
        </View>
      </View>
    </View>
  );
}
