import { useState, useMemo, useCallback } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Input } from '@ui/components/Input';
import { Icon } from '@ui/components/Icon';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { formatCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '@/src/features/finance';
import { hapticLight, hapticSuccess } from '@lib/utils/haptics';
import { useTheme } from '@theme/ThemeProvider';

function computeAmortization(principal: number, annualRate: number, months: number) {
  if (principal <= 0 || months <= 0) return { monthly: 0, totalInterest: 0, totalPayment: 0, schedule: [] };

  const r = annualRate / 100 / 12;
  let monthly: number;

  if (r === 0) {
    monthly = principal / months;
  } else {
    monthly = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  }

  const schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
  let balance = principal;

  for (let i = 1; i <= months; i++) {
    const interest = balance * r;
    const principalPart = monthly - interest;
    balance -= principalPart;
    schedule.push({
      month: i,
      payment: Math.round(monthly),
      principal: Math.round(principalPart),
      interest: Math.round(interest),
      balance: Math.max(0, Math.round(balance)),
    });
  }

  return {
    monthly: Math.round(monthly),
    totalInterest: Math.round(monthly * months - principal),
    totalPayment: Math.round(monthly * months),
    schedule,
  };
}

export default function LoanCalculatorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [amount, setAmount] = useState('500000');
  const [rate, setRate] = useState('12');
  const [term, setTerm] = useState('36');
  const [termUnit, setTermUnit] = useState<'months' | 'years'>('months');

  // Store integration for quick-fill
  const accounts = useFinanceStore((s) => s.accounts);
  const debtInfo = useFinanceStore((s) => s.debtInfos);
  const cards = useFinanceStore((s) => s.cards);

  // Find loan accounts and credit cards with outstanding balances for quick-fill
  const quickFillOptions = useMemo(() => {
    const options: { label: string; amount: number; rate?: number; icon: string; color: string }[] = [];

    // Loan accounts
    accounts
      .filter((a) => a.type === 'loan' && Math.abs(a.balance) > 0)
      .forEach((a) => {
        const debt = debtInfo.find((d) => d.accountId === a.id);
        options.push({
          label: a.name,
          amount: Math.abs(a.balance),
          rate: debt?.interestRate,
          icon: 'document-text-outline',
          color: colors.danger,
        });
      });

    // Credit cards with outstanding balance
    cards
      .filter((c) => c.isActive && (c.outstandingBalance ?? 0) > 0)
      .forEach((c) => {
        options.push({
          label: `${c.nickname} (****${c.last4})`,
          amount: c.outstandingBalance ?? 0,
          icon: 'card-outline',
          color: colors.warning,
        });
      });

    return options;
  }, [accounts, debtInfo, cards, colors.danger, colors.warning]);

  // Convert term to months for calculation
  const termInMonths = useMemo(() => {
    const raw = parseInt(term, 10) || 0;
    return termUnit === 'years' ? raw * 12 : raw;
  }, [term, termUnit]);

  const result = useMemo(() => {
    return computeAmortization(
      parseFloat(amount) || 0,
      parseFloat(rate) || 0,
      termInMonths,
    );
  }, [amount, rate, termInMonths]);

  // Validation
  const parsedAmount = parseFloat(amount) || 0;
  const parsedRate = parseFloat(rate) || 0;
  const parsedTerm = parseInt(term, 10) || 0;

  const amountError = amount.trim() !== '' && parsedAmount <= 0 ? 'Enter a positive loan amount' : '';
  const rateError = rate.trim() !== '' && parsedRate < 0 ? 'Rate cannot be negative' : '';
  const termError = term.trim() !== '' && parsedTerm <= 0 ? 'Enter a valid term' : '';
  const hasValidInputs = parsedAmount > 0 && parsedRate >= 0 && parsedTerm > 0;

  // M10 fix: Avoid duplicating last row when schedule has <= 3 entries
  const previewRows = useMemo(() => {
    if (result.schedule.length === 0) return [];
    const first3 = result.schedule.slice(0, 3);
    const last = result.schedule[result.schedule.length - 1]!;
    if (result.schedule.length <= 3) return first3;
    return [...first3, last];
  }, [result.schedule]);

  const handleQuickFill = (option: { amount: number; rate?: number }) => {
    hapticLight();
    setAmount(String(option.amount));
    if (option.rate !== undefined && option.rate > 0) {
      setRate(String(option.rate));
    }
    hapticSuccess();
  };

  const toggleTermUnit = () => {
    hapticLight();
    const raw = parseInt(term, 10) || 0;
    if (termUnit === 'months') {
      // Convert months to years (round to nearest)
      setTerm(raw > 0 ? String(Math.max(1, Math.round(raw / 12))) : '');
      setTermUnit('years');
    } else {
      // Convert years to months
      setTerm(raw > 0 ? String(raw * 12) : '');
      setTermUnit('months');
    }
  };

  const subtleText = colors.textTertiary;

  const headerLeft = useCallback(() => null, []);
  const headerRight = useCallback(() => (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      className="mr-2"
      accessibilityRole="button"
      accessibilityLabel="Close loan calculator"
    >
      <Icon name="close" size={24} color={colors.text} />
    </Pressable>
  ), [colors.text, router]);
  const headerTitleStyle = useMemo(() => ({ fontFamily: 'Inter-SemiBold' as const, fontSize: 17 }), []);
  const headerStyle = useMemo(() => ({ backgroundColor: colors.background }), [colors.background]);
  const screenOptions = useMemo(() => ({
    headerShown: true,
    title: 'Loan Calculator',
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
        <StaggeredFadeIn index={0}>
          <Text variant="caption" className="mb-3" style={{ color: subtleText }}>
            Calculate your monthly payments and total interest.
          </Text>

          {/* Quick Fill from store accounts */}
          {quickFillOptions.length > 0 && (
            <View className="mb-4">
              <Text variant="caption" className="mb-2 font-sans-medium" style={{ color: subtleText }}>
                Quick Fill from your accounts
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                <View className="flex-row" style={{ gap: 8, paddingHorizontal: 4 }}>
                  {quickFillOptions.map((opt, i) => (
                    <Pressable
                      key={i}
                      onPress={() => handleQuickFill(opt)}
                      className="flex-row items-center rounded-xl px-3 py-2.5"
                      style={{
                        backgroundColor: colors.surfaceSecondary,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Quick fill ${opt.label} ${formatCurrency(opt.amount)}`}
                    >
                      <View
                        className="mr-2 h-7 w-7 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${opt.color}18` }}
                      >
                        <Icon
                          name={opt.icon as React.ComponentProps<typeof Icon>['name']}
                          size={14}
                          color={opt.color}
                        />
                      </View>
                      <View>
                        <Text variant="caption" className="font-sans-medium" style={{ fontSize: 11 }}>
                          {opt.label}
                        </Text>
                        <Text variant="caption" style={{ fontSize: 10, color: opt.color }}>
                          {formatCurrency(opt.amount)}
                          {opt.rate ? ` @ ${opt.rate}%` : ''}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <Card className="mb-4 gap-3">
            <View>
              <Input
                label="Loan Amount (₱)"
                placeholder="500000"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              {amountError !== '' && (
                <Text variant="caption" style={{ color: colors.danger, fontSize: 11, marginTop: 4 }}>
                  {amountError}
                </Text>
              )}
            </View>
            <View>
              <Input
                label="Annual Interest Rate (%)"
                placeholder="12"
                value={rate}
                onChangeText={setRate}
                keyboardType="numeric"
              />
              {rateError !== '' && (
                <Text variant="caption" style={{ color: colors.danger, fontSize: 11, marginTop: 4 }}>
                  {rateError}
                </Text>
              )}
            </View>
            <View>
              <View className="flex-row items-end" style={{ gap: 8 }}>
                <View className="flex-1">
                  <Input
                    label={`Term (${termUnit})`}
                    placeholder={termUnit === 'months' ? '36' : '3'}
                    value={term}
                    onChangeText={setTerm}
                    keyboardType="numeric"
                  />
                </View>
                <Pressable
                  onPress={toggleTermUnit}
                  className="mb-0.5 flex-row items-center rounded-xl px-3 py-2.5"
                  style={{
                    backgroundColor: colors.surfaceTertiary,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch to ${termUnit === 'months' ? 'years' : 'months'}`}
                >
                  <View style={{ marginRight: 4 }}>
                    <Icon
                      name="swap-horizontal-outline"
                      size={14}
                      color={colors.textTertiary}
                    />
                  </View>
                  <Text variant="caption" className="font-sans-medium" style={{ fontSize: 11, color: colors.textTertiary }}>
                    {termUnit === 'months' ? 'yrs' : 'mos'}
                  </Text>
                </Pressable>
              </View>
              {termError !== '' && (
                <Text variant="caption" style={{ color: colors.danger, fontSize: 11, marginTop: 4 }}>
                  {termError}
                </Text>
              )}
            </View>
          </Card>

          {/* Validation hint when inputs are incomplete */}
          {!hasValidInputs && amount.trim() !== '' && (
            <Card className="mb-4 flex-row items-center" style={{ gap: 8 }}>
              <Icon name="information-circle-outline" size={18} color={colors.warning} />
              <Text variant="caption" style={{ color: subtleText, flex: 1 }}>
                Fill in all fields with valid values to see your loan breakdown.
              </Text>
            </Card>
          )}
        </StaggeredFadeIn>

        {/* Results */}
        {result.monthly > 0 && (
          <StaggeredFadeIn index={1}>
            <Card className="mb-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text variant="caption" style={{ color: subtleText }}>Monthly Payment</Text>
                  <Text variant="h2" style={{ color: colors.primary }}>{formatCurrency(result.monthly)}</Text>
                </View>
                <View className="items-end">
                  <Text variant="caption" style={{ color: subtleText }}>Total Interest</Text>
                  <Text variant="h3" style={{ color: colors.danger }}>{formatCurrency(result.totalInterest)}</Text>
                </View>
              </View>
              <View className="mt-3 flex-row items-center justify-between rounded-xl p-3" style={{ backgroundColor: colors.surfaceSecondary }}>
                <Text variant="caption" style={{ color: subtleText }}>Total Payment</Text>
                <Text variant="body" className="font-sans-semibold">{formatCurrency(result.totalPayment)}</Text>
              </View>
            </Card>

            {/* Schedule Preview */}
            <Text variant="body" className="mb-2 font-sans-semibold">Amortization Preview</Text>
            <Card>
              <View className="flex-row border-b pb-2" style={{ borderColor: colors.borderLight }}>
                <Text variant="caption" className="flex-1 font-sans-medium" style={{ fontSize: 10 }}>Month</Text>
                <Text variant="caption" className="flex-1 text-right font-sans-medium" style={{ fontSize: 10 }}>Payment</Text>
                <Text variant="caption" className="flex-1 text-right font-sans-medium" style={{ fontSize: 10 }}>Principal</Text>
                <Text variant="caption" className="flex-1 text-right font-sans-medium" style={{ fontSize: 10 }}>Interest</Text>
                <Text variant="caption" className="flex-1 text-right font-sans-medium" style={{ fontSize: 10 }}>Balance</Text>
              </View>
              {previewRows.map((row, i) => (
                <View key={row.month}>
                  {i === 3 && previewRows.length === 4 && result.schedule.length > 4 && (
                    <View className="items-center py-1">
                      <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>···</Text>
                    </View>
                  )}
                  <View className="flex-row py-1.5">
                    <Text variant="caption" className="flex-1" style={{ fontSize: 10 }}>{row.month}</Text>
                    <Text variant="caption" className="flex-1 text-right" style={{ fontSize: 10 }}>{formatCurrency(row.payment)}</Text>
                    <Text variant="caption" className="flex-1 text-right" style={{ fontSize: 10 }}>{formatCurrency(row.principal)}</Text>
                    <Text variant="caption" className="flex-1 text-right" style={{ fontSize: 10 }}>{formatCurrency(row.interest)}</Text>
                    <Text variant="caption" className="flex-1 text-right" style={{ fontSize: 10 }}>{formatCurrency(row.balance)}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </StaggeredFadeIn>
        )}
      </ScreenContainer>
    </>
  );
}
