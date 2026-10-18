import { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SectionHeader } from '@ui/components/SectionHeader';
import { Card } from '@ui/components/Card';
import { ListItem } from '@ui/components/ListItem';
import { Icon } from '@ui/components/Icon';
import { Text } from '@ui/components/Text';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { getInstitutionById } from '@lib/constants/institutions';
import { useFinanceStore } from '../store/finance.store';

const ACCOUNT_ICONS: Record<string, React.ComponentProps<typeof Icon>['name']> = {
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

export function HomeAccountsSummary() {
  const { colors } = useTheme();
  const router = useRouter();
  const accounts = useFinanceStore((s) => s.accounts);
  const hideBalances = useFinanceStore((s) => s.hideBalances);

  const top3 = useMemo(() => accounts.slice(0, 3), [accounts]);
  const remaining = accounts.length - 3;

  if (accounts.length === 0) return null;

  return (
    <>
      <SectionHeader
        title="Accounts"
        actionLabel="See all"
        onAction={() => router.push('/(app)/finance')}
      />
      <Card className="mb-3 px-0 py-1">
        {top3.map((account) => {
          const inst = account.institution
            ? getInstitutionById(account.institution)
            : undefined;
          const brandColor = account.color ?? inst?.brandColor;
          const iconName =
            account.icon ?? inst?.icon ?? ACCOUNT_ICONS[account.type] ?? 'wallet-outline';

          return (
            <ListItem
              key={account.id}
              title={account.name}
              leftIcon={
                <View
                  className="h-8 w-8 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: brandColor ? brandColor + '18' : colors.primaryLight,
                  }}
                >
                  {inst ? (
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: '800',
                        color: brandColor ?? colors.primary,
                        letterSpacing: -0.3,
                      }}
                    >
                      {inst.shortName.length <= 4
                        ? inst.shortName
                        : inst.shortName.slice(0, 3)}
                    </Text>
                  ) : (
                    <Icon
                      name={iconName as React.ComponentProps<typeof Icon>['name']}
                      size={16}
                      color={brandColor ?? colors.primary}
                    />
                  )}
                </View>
              }
              rightValue={
                hideBalances
                  ? maskedCurrency(account.currency)
                  : formatCurrency(account.balance, account.currency)
              }
              showChevron={false}
              onPress={() => router.push('/(app)/finance')}
            />
          );
        })}
        {remaining > 0 && (
          <View className="px-4 py-2">
            <Text
              variant="caption"
              className="text-center text-neutral-400"
              style={{ fontSize: 11 }}
            >
              and {remaining} more account{remaining !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </Card>
    </>
  );
}
