import { View } from 'react-native';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';
import { Text } from '@ui/components/Text';
import { formatCurrency } from '@lib/utils/currency';
import { palette } from '@theme/colors';

export type LinePoint = {
  label: string;
  value: number;
};

type Props = {
  data: LinePoint[];
  color?: string;
  secondaryData?: LinePoint[];
  secondaryColor?: string;
  height?: number;
  showValues?: boolean;
};

const PAD = { top: 6, bottom: 6, left: 4, right: 4 };

/**
 * SVG-based line chart. Supports optional dual-line via secondaryData.
 */
export function LineChart({
  data,
  color = palette.primary[600],
  secondaryData,
  secondaryColor = '#ef4444',
  height = 120,
  showValues = false,
}: Props) {
  if (data.length === 0) {
    return (
      <View className="items-center py-6">
        <Text variant="caption">No data</Text>
      </View>
    );
  }

  const allValues = [
    ...data.map((d) => d.value),
    ...(secondaryData?.map((d) => d.value) ?? []),
  ];
  const dataMax = Math.max(...allValues);
  const dataMin = Math.min(...allValues);
  const dataRange = dataMax - dataMin || 1;
  const padding = dataRange * 0.1;
  const maxVal = dataMax + padding;
  const minVal = dataMin - padding;
  const range = maxVal - minVal || 1;

  const svgW = 300;
  const chartW = svgW - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  const toX = (i: number, count: number) =>
    PAD.left + (count > 1 ? (i / (count - 1)) * chartW : chartW / 2);
  const toY = (val: number) =>
    PAD.top + chartH - ((val - minVal) / range) * chartH;

  const buildPoints = (pts: LinePoint[]) =>
    pts.map((p, i) => `${toX(i, pts.length)},${toY(p.value)}`).join(' ');

  // Grid line positions
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((pct) => PAD.top + pct * chartH);

  return (
    <View>
      {/* Y-axis labels */}
      <View className="flex-row justify-between mb-1">
        <Text variant="caption" style={{ fontSize: 10 }}>{formatCurrency(maxVal)}</Text>
        <Text variant="caption" style={{ fontSize: 10 }}>{formatCurrency(minVal)}</Text>
      </View>

      <Svg width="100%" height={height} viewBox={`0 0 ${svgW} ${height}`}>
        {/* Grid lines */}
        {gridYs.map((y) => (
          <Line
            key={y}
            x1={PAD.left}
            y1={y}
            x2={PAD.left + chartW}
            y2={y}
            stroke="#e5e5e5"
            strokeWidth={0.5}
          />
        ))}

        {/* Primary line */}
        <Polyline
          points={buildPoints(data)}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Primary dots */}
        {data.map((p, i) => (
          <Circle
            key={`p-${i}`}
            cx={toX(i, data.length)}
            cy={toY(p.value)}
            r={3.5}
            fill={color}
          />
        ))}

        {/* Secondary line */}
        {secondaryData && (
          <>
            <Polyline
              points={buildPoints(secondaryData)}
              fill="none"
              stroke={secondaryColor}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {secondaryData.map((p, i) => (
              <Circle
                key={`s-${i}`}
                cx={toX(i, secondaryData.length)}
                cy={toY(p.value)}
                r={3.5}
                fill={secondaryColor}
              />
            ))}
          </>
        )}
      </Svg>

      {/* X-axis labels */}
      <View className="flex-row justify-between mt-1.5">
        {data.map((d, i) => (
          <View key={i} className="flex-1 items-center">
            <Text variant="caption" style={{ fontSize: 10 }} numberOfLines={1}>
              {d.label}
            </Text>
            {showValues && (
              <Text variant="caption" style={{ fontSize: 9, color }}>
                {formatCurrency(d.value)}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
