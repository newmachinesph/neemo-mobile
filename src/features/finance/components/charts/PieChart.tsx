import { View } from 'react-native';
import { Text } from '@ui/components/Text';
import { useTheme } from '@theme/ThemeProvider';

export type PieSlice = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  data: PieSlice[];
  size?: number;
};

/**
 * View-based donut chart. Each slice is drawn as a half-circle rotated into
 * position using transform. Works without any native chart library.
 */
export function PieChart({ data, size = 160 }: Props) {
  const { colors } = useTheme();
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <View className="items-center py-6">
        <Text variant="caption">No data</Text>
      </View>
    );
  }

  // Build cumulative angle slices
  const slices: { color: string; startDeg: number; sweepDeg: number }[] = [];
  let cumDeg = 0;
  for (const d of data) {
    const sweep = (d.value / total) * 360;
    slices.push({ color: d.color, startDeg: cumDeg, sweepDeg: sweep });
    cumDeg += sweep;
  }

  const half = size / 2;
  const ring = size * 0.18; // ring thickness
  const innerSize = size - ring * 2;

  return (
    <View className="items-center">
      {/* Chart */}
      <View style={{ width: size, height: size, borderRadius: half, overflow: 'hidden' }}>
        {/* Background */}
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: half,
            backgroundColor: colors.border,
          }}
        />
        {/* Slices – each rendered as two half-circles if sweep > 180 */}
        {slices.map((slice, idx) => {
          if (slice.sweepDeg <= 180) {
            return (
              <HalfSlice
                key={idx}
                size={size}
                color={slice.color}
                startDeg={slice.startDeg}
                sweepDeg={slice.sweepDeg}
              />
            );
          }
          // Split into two halves
          return (
            <View key={idx}>
              <HalfSlice size={size} color={slice.color} startDeg={slice.startDeg} sweepDeg={180} />
              <HalfSlice
                size={size}
                color={slice.color}
                startDeg={slice.startDeg + 180}
                sweepDeg={slice.sweepDeg - 180}
              />
            </View>
          );
        })}
        {/* Inner circle (donut hole) */}
        <View
          style={{
            position: 'absolute',
            top: ring,
            left: ring,
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: 'white',
          }}
          className="dark:bg-neutral-900"
        />
      </View>

      {/* Legend */}
      <View className="mt-3 flex-row flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((d) => (
          <View key={d.label} className="flex-row items-center gap-1.5">
            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <Text variant="caption" style={{ fontSize: 11 }}>
              {d.label} ({Math.round((d.value / total) * 100)}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function HalfSlice({
  size,
  color,
  startDeg,
  sweepDeg,
}: {
  size: number;
  color: string;
  startDeg: number;
  sweepDeg: number;
}) {
  const half = size / 2;
  return (
    <View
      style={{
        position: 'absolute',
        width: half,
        height: size,
        left: half,
        overflow: 'hidden',
        transformOrigin: `0px ${half}px`,
        transform: [{ rotate: `${startDeg}deg` }],
      }}
    >
      <View
        style={{
          width: half,
          height: size,
          borderTopRightRadius: half,
          borderBottomRightRadius: half,
          backgroundColor: color,
          transformOrigin: `0px ${half}px`,
          transform: [{ rotate: `${sweepDeg - 180}deg` }],
        }}
      />
    </View>
  );
}
