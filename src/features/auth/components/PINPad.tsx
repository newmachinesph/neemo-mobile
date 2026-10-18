import { useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';

interface PINPadProps {
  title?: string;
  subtitle?: string;
  onComplete: (pin: string) => void;
  pinLength?: number;
  disabled?: boolean;
}

export function PINPad({ title = 'Enter PIN', subtitle, onComplete, pinLength = 6, disabled = false }: PINPadProps) {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');

  const handlePress = useCallback((digit: string) => {
    if (disabled || pin.length >= pinLength) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === pinLength) {
      onComplete(newPin);
      // Reset after brief delay for feedback
      setTimeout(() => setPin(''), 300);
    }
  }, [disabled, pin, pinLength, onComplete]);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const dots = Array.from({ length: pinLength }, (_, i) => i < pin.length);

  return (
    <View className="flex-1 items-center justify-center">
      <Text variant="h2" className="mb-2">{title}</Text>
      {subtitle && <Text variant="caption" className="mb-8 text-neutral-500">{subtitle}</Text>}

      {/* PIN dots */}
      <View className="mb-12 flex-row gap-4">
        {dots.map((filled, i) => (
          <View
            key={i}
            className={`h-4 w-4 rounded-full ${filled ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'}`}
          />
        ))}
      </View>

      {/* Number pad */}
      <View className="gap-4">
        {[[1, 2, 3], [4, 5, 6], [7, 8, 9], [null, 0, 'delete']].map((row, rowIdx) => (
          <View key={rowIdx} className="flex-row gap-6">
            {row.map((item, colIdx) => {
              if (item === null) {
                return <View key={`empty-${colIdx}`} style={{ width: 72, height: 72 }} />;
              }

              if (item === 'delete') {
                return (
                  <Pressable
                    key="delete"
                    onPress={handleDelete}
                    accessibilityRole="button"
                    accessibilityLabel="Delete"
                    className="h-[72px] w-[72px] items-center justify-center rounded-full active:bg-neutral-100 dark:active:bg-neutral-800"
                  >
                    <Icon name="backspace-outline" size={28} color={colors.textTertiary} />
                  </Pressable>
                );
              }

              return (
                <Pressable
                  key={item}
                  onPress={() => handlePress(String(item))}
                  accessibilityRole="button"
                  accessibilityLabel={`Enter ${item}`}
                  className="h-[72px] w-[72px] items-center justify-center rounded-full bg-neutral-50 active:bg-neutral-200 dark:bg-neutral-800 dark:active:bg-neutral-700"
                >
                  <Text variant="h2">{item}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
