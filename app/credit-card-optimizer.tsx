import { useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { ProgressBar } from '@ui/components/ProgressBar';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { formatCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '@/src/features/finance';
import { useTheme } from '@theme/ThemeProvider';

export default function CreditCardOptimizerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const cards = useFinanceStore((s) => s.cards);
  const debtInfos = useFinanceStore((s) => s.debtInfos);

  const creditCards = useMemo(() => {
    return cards
      .filter((c) => c.type === 'credit' && c.isActive)
      .map((c) => {
        const debt = debtInfos.find((d) => d.accountId === c.linkedAccountId);
        const balance = c.outstandingBalance || 0;
        const limit = c.creditLimit || 1;
        const utilization = balance / limit;
        const minPayment = Math.round(balance * 0.03);
        const interestRate = debt?.interestRate || 24;
        const monthlyInterest = Math.round(balance * (interestRate / 100 / 12));

        return {
          ...c,
          balance,
          limit,
          utilization,
          minPayment,
          interestRate,
          monthlyInterest,
        };
      })
      .sort((a, b) => b.interestRate - a.interestRate); // Avalanche order
  }, [cards, debtInfos]);

  const totalBalance = creditCards.reduce((s, c) => s + c.balance, 0);
  const totalLimit = creditCards.reduce((s, c) => s + c.limit, 0);
  const totalMinPayment = creditCards.reduce((s, c) => s + c.minPayment, 0);
  const totalMonthlyInterest = creditCards.reduce((s, c) => s + c.monthlyInterest, 0);

  const headerLeft = useCallback(() => null, []);
  const headerRight = useCallback(() => (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      className="mr-2"
      accessibilityRole="button"
      accessibilityLabel="Close credit card optimizer"
    >
      <Icon name="close" size={24} color={colors.text} />
    </Pressable>
  ), [colors.text, router]);
  const headerTitleStyle = useMemo(() => ({ fontFamily: 'Inter-SemiBold' as const, fontSize: 17 }), []);
  const headerStyle = useMemo(() => ({ backgroundColor: colors.background }), [colors.background]);
  const screenOptions = useMemo(() => ({
    headerShown: true,
    title: 'Credit Card Optimizer',
    headerTitleStyle,
    headerLeft,
    headerRight,
    headerShadowVisible: false,
    headerStyle,
    headerTintColor: colors.text,
  }), [headerTitleStyle, headerLeft, headerRight, headerStyle, colors.text]);

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <ScreenContainer edges={['bottom', 'left', 'right']}>
        {creditCards.length === 0 ? (
          <StaggeredFadeIn index={0}>
            <Card className="items-center py-10">
              <View
                className="mb-4 h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.surfaceSecondary }}
              >
                <Icon name="card-outline" size={32} color={colors.textTertiary} />
              </View>
              <Text variant="h3" className="mb-1 text-center">No Credit Cards</Text>
              <Text variant="caption" className="text-center" style={{ maxWidth: 240, color: colors.textTertiary }}>
                Add your credit cards in the Finance tab to see optimization strategies.
              </Text>
            </Card>
          </StaggeredFadeIn>
        ) : (
          <>
            {/* Summary */}
            <StaggeredFadeIn index={0}>
              <Card className="mb-4">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text variant="caption" style={{ color: colors.textTertiary }}>Total Outstanding</Text>
                    <Text variant="h2" style={{ color: colors.danger }}>{formatCurrency(totalBalance)}</Text>
                  </View>
                  <View className="items-end">
                    <Text variant="caption" style={{ color: colors.textTertiary }}>Credit Limit</Text>
                    <Text variant="h3">{formatCurrency(totalLimit)}</Text>
                  </View>
                </View>
                <View className="mt-2">
                  <ProgressBar
                    progress={totalLimit > 0 ? totalBalance / totalLimit : 0}
                    height="md"
                    useThresholdColors
                  />
                </View>
                <View className="mt-3 flex-row" style={{ gap: 16 }}>
                  <View>
                    <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>Min. Payment</Text>
                    <Text variant="body" className="font-sans-semibold">{formatCurrency(totalMinPayment)}</Text>
                  </View>
                  <View>
                    <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>Monthly Interest</Text>
                    <Text variant="body" className="font-sans-semibold" style={{ color: colors.danger }}>
                      {formatCurrency(totalMonthlyInterest)}
                    </Text>
                  </View>
                </View>
              </Card>
            </StaggeredFadeIn>

            {/* Strategy Cards */}
            <StaggeredFadeIn index={1}>
              <Text variant="body" className="mb-2 font-sans-semibold">Payoff Strategies</Text>

              <View
                className="mb-3 rounded-2xl border p-4 shadow-sm"
                style={{
                  borderWidth: 1.5,
                  borderColor: `${colors.success}30`,
                  backgroundColor: colors.surface,
                }}
              >
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${colors.success}20` }}>
                    <Icon name="trending-down-outline" size={18} color={colors.success} />
                  </View>
                  <View className="flex-1">
                    <Text variant="body" className="font-sans-semibold">Avalanche Method</Text>
                    <Text variant="caption" style={{ color: colors.success, fontSize: 11 }}>Recommended — saves most interest</Text>
                  </View>
                </View>
                <Text variant="caption" className="mt-2" style={{ color: colors.textTertiary, lineHeight: 18 }}>
                  Pay highest interest rate first. Focus extra payments on {creditCards[0]?.nickname} ({creditCards[0]?.interestRate}% APR) while paying minimums on others.
                </Text>
              </View>

              <Card className="mb-4">
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${colors.info}20` }}>
                    <Icon name="snow-outline" size={18} color={colors.info} />
                  </View>
                  <View className="flex-1">
                    <Text variant="body" className="font-sans-semibold">Snowball Method</Text>
                    <Text variant="caption" style={{ color: colors.info, fontSize: 11 }}>Quick wins — pay smallest balance first</Text>
                  </View>
                </View>
                <Text variant="caption" className="mt-2" style={{ color: colors.textTertiary, lineHeight: 18 }}>
                  Pay smallest balance first for psychological momentum. Start with the card that has the lowest outstanding balance.
                </Text>
              </Card>
            </StaggeredFadeIn>

            {/* Card List */}
            <StaggeredFadeIn index={2}>
              <Text variant="body" className="mb-2 font-sans-semibold">Your Cards</Text>
              <View style={{ gap: 8 }}>
                {creditCards.map((c) => (
                  <Card key={c.id} className="flex-row items-center gap-3">
                    <View
                      className="h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${colors.info}20` }}
                    >
                      <Icon name="card-outline" size={20} color={colors.info} />
                    </View>
                    <View className="flex-1">
                      <Text variant="body" className="font-sans-medium">{c.nickname}</Text>
                      <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>
                        ····{c.last4} · {c.interestRate}% APR
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text variant="body" className="font-sans-semibold">{formatCurrency(c.balance)}</Text>
                      <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>
                        of {formatCurrency(c.limit)}
                      </Text>
                    </View>
                  </Card>
                ))}
              </View>
            </StaggeredFadeIn>
          </>
        )}
      </ScreenContainer>
    </>
  );
}
