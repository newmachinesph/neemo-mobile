import { useEffect } from 'react';
import { View, Pressable, AppState } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { hapticMedium } from '@lib/utils/haptics';
import { palette } from '@theme/colors';

interface HomeActionBarProps {
  onAddPress: () => void;
}

// Subtle pulse ring around the primary "Add" button
function PulseRing({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    function startPulse() {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 1200, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 0 }),
        ),
        -1,
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) }),
          withTiming(0.4, { duration: 0 }),
        ),
        -1,
      );
    }

    startPulse();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        startPulse();
      } else {
        cancelAnimation(scale);
        cancelAnimation(opacity);
      }
    });

    return () => {
      sub.remove();
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — shared values are stable refs

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

export function HomeActionBar({ onAddPress }: HomeActionBarProps) {
  const color = palette.primary[600];

  return (
    <View className="flex-row justify-center py-3 mb-2">
      <Pressable
        onPress={() => {
          hapticMedium();
          onAddPress();
        }}
        className="items-center active:scale-90"
        accessibilityRole="button"
        accessibilityLabel="Add transaction"
      >
        <View
          className="items-center justify-center mb-1.5"
          style={{ width: 44, height: 44 }}
        >
          <PulseRing color={`${color}20`} />
          <View
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: color }}
          >
            <Icon name="add-outline" size={20} color="#FFFFFF" />
          </View>
        </View>
        <Text
          variant="caption"
          className="font-sans-medium"
          style={{ fontSize: 11, color }}
        >
          Add
        </Text>
      </Pressable>
    </View>
  );
}
