import { memo } from 'react';
import { View } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon, type IconName } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency, convertToBase } from '@lib/utils/currency';
import { ACCOUNT_TYPE_LABELS } from '@lib/constants/finance';
import { getInstitutionById } from '@lib/constants/institutions';
import { useFinanceStore } from '../store/finance.store';
import type { Account } from '../types/finance.types';

const ACCOUNT_ICONS: Record<string, string> = {
  savings: 'wallet-outline',
  checking: 'card-outline',
  time_deposit: 'time-outline',
  e_wallet: 'phone-portrait-outline',
  digital_bank: 'globe-outline',
  investment: 'trending-up-outline',
  loan: 'cash-outline',
  credit_card: 'card-outline',
  government_fund: 'shield-outline',
  cooperative: 'people-outline',
  insurance: 'shield-checkmark-outline',
  cash: 'cash-outline',
  other: 'ellipsis-horizontal-outline',
};

interface AccountCardProps {
  account: Account;
  onPress?: () => void;
}

export const AccountCard = memo(function AccountCard({ account, onPress }: AccountCardProps) {
  const { colors } = useTheme();
  const profileCurrency = useFinanceStore((s) => s.profile.currency);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const isForeign = account.currency !== profileCurrency;

  // Resolve institution brand data
  const institution = account.institution ? getInstitutionById(account.institution) : undefined;
  const brandColor = account.color ?? institution?.brandColor;
  const iconName = (account.icon ?? institution?.icon ?? ACCOUNT_ICONS[account.type] ?? 'wallet-outline') as IconName;

  return (
    <Card pressable={!!onPress} onPress={onPress} className="mr-3 w-52 py-5">
      <View className="mb-3 flex-row items-center justify-between">
        {/* Institution-branded icon circle */}
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{
            backgroundColor: brandColor ? brandColor + '18' : colors.primaryLight,
          }}
        >
          {institution ? (
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: brandColor ?? colors.primary,
                letterSpacing: -0.3,
              }}
            >
              {institution.shortName.length <= 4
                ? institution.shortName
                : institution.shortName.slice(0, 3)}
            </Text>
          ) : (
            <Icon name={iconName} size={20} color={brandColor ?? colors.primary} />
          )}
        </View>
        <Text variant="caption" className="text-xs" numberOfLines={1}>
          {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
        </Text>
      </View>
      <Text variant="caption" className="mb-1" numberOfLines={1}>
        {account.name}
      </Text>
      <Text variant="body" className="font-sans-semibold text-right" style={{ fontSize: 16 }} numberOfLines={1}>
        {hideBalances ? maskedCurrency(account.currency) : formatCurrency(account.balance, account.currency)}
      </Text>
      {isForeign && (
        <Text variant="caption" className="mt-0.5 text-xs text-right" numberOfLines={1} style={{ color: colors.textTertiary }}>
          ~{hideBalances ? maskedCurrency(profileCurrency) : formatCurrency(convertToBase(account.balance, account.currency, profileCurrency), profileCurrency)}
        </Text>
      )}
    </Card>
  );
});
