import { View, Pressable } from 'react-native';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { getCurrencySymbol } from '@lib/utils/currency';
import { CURRENCY_CODES } from '@lib/constants/finance';
import type { CurrencyCode } from '@lib/constants/finance';
import { useFinanceStore } from '../store/finance.store';

interface CurrencyPickerSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
}

const CURRENCY_NAMES: Record<string, string> = {
  PHP: 'Philippine Peso',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan',
  INR: 'Indian Rupee',
  BRL: 'Brazilian Real',
  MXN: 'Mexican Peso',
  KRW: 'Korean Won',
  SGD: 'Singapore Dollar',
  HKD: 'Hong Kong Dollar',
  NOK: 'Norwegian Krone',
  SEK: 'Swedish Krona',
  DKK: 'Danish Krone',
  NZD: 'New Zealand Dollar',
  ZAR: 'South African Rand',
  TRY: 'Turkish Lira',
};

export function CurrencyPickerSheet({ sheetRef }: CurrencyPickerSheetProps) {
  const { colors } = useTheme();
  const profileCurrency = useFinanceStore((s) => s.profile.currency);
  const updateProfile = useFinanceStore((s) => s.updateProfile);

  function handleSelect(currency: CurrencyCode) {
    updateProfile({ currency });
    sheetRef.current?.dismiss();
  }

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['60%']}>
      <Text variant="h3" className="mb-4">Select Currency</Text>
      <View>
        {(CURRENCY_CODES as readonly CurrencyCode[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => handleSelect(item)}
            accessibilityRole="button"
            accessibilityLabel={`Select ${CURRENCY_NAMES[item] ?? item}`}
            className="flex-row items-center border-b border-neutral-100 py-3 active:opacity-80 dark:border-neutral-800"
          >
            <Text variant="body" className="font-sans-semibold w-10">
              {getCurrencySymbol(item)}
            </Text>
            <Text variant="body" className="font-sans-medium flex-1">
              {item}
            </Text>
            <Text variant="caption" className="flex-1">
              {CURRENCY_NAMES[item] ?? item}
            </Text>
            {profileCurrency === item && (
              <Icon name="checkmark-circle" size={20} color={colors.primary} />
            )}
          </Pressable>
        ))}
      </View>
    </BottomSheetModal>
  );
}
