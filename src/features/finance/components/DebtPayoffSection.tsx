import { useRef, useState, useCallback } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { Button } from '@ui/components/Button';
import { Divider } from '@ui/components/Divider';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '../store/finance.store';
import { useDebtPayoff } from '../hooks/useDebtPayoff';
import { AddDebtInfoSheet } from './AddDebtInfoSheet';
import { palette } from '@theme/colors';
import type { DebtInfo } from '../types/finance.types';

export function DebtPayoffSection() {
  const { colors } = useTheme();
  const { debtAccounts, snowball, avalanche } = useDebtPayoff();
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);
  const addDebtRef = useRef<GorhomBottomSheetModal>(null);
  const [selectedDebt, setSelectedDebt] = useState<DebtInfo | null>(null);

  const handleDebtPress = useCallback((debt: { accountId: string; interestRate: number; minimumPayment: number; extraPayment: number }) => {
    setSelectedDebt({
      accountId: debt.accountId,
      interestRate: debt.interestRate,
      minimumPayment: debt.minimumPayment,
      extraPayment: debt.extraPayment || undefined,
    });
    addDebtRef.current?.present();
  }, []);

  const handleDismiss = useCallback(() => {
    setSelectedDebt(null);
  }, []);

  const totalDebt = debtAccounts.reduce((sum, d) => sum + d.balance, 0);

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="pb-24">
      {/* Total Debt Overview */}
      <Card className="mb-4">
        <Text variant="caption" className="mb-1">Total Debt</Text>
        <Text variant="h2" style={{ color: totalDebt > 0 ? colors.danger : colors.success }}>
          {amt(totalDebt)}
        </Text>
        <Text variant="caption" className="mt-1">
          {debtAccounts.length} account{debtAccounts.length !== 1 ? 's' : ''} tracked
        </Text>
      </Card>

      {/* Debt List */}
      {debtAccounts.length > 0 && (
        <Card className="mb-4">
          {debtAccounts.map((debt, idx) => (
            <View key={debt.accountId}>
              {idx > 0 && <Divider className="mx-0" />}
              <Pressable
                className="flex-row items-center py-3 active:opacity-80"
                onPress={() => handleDebtPress(debt)}
                accessibilityRole="button"
                accessibilityLabel={`Debt: ${debt.name}, Balance: ${amt(debt.balance)}`}
              >
                <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                  <Icon name="card-outline" size={18} color={colors.danger} />
                </View>
                <View className="flex-1">
                  <Text variant="body" className="font-sans-medium" numberOfLines={1}>
                    {debt.name}
                  </Text>
                  <Text variant="caption">
                    {debt.interestRate}% APR · Min {amt(debt.minimumPayment)}/mo
                  </Text>
                </View>
                <Text variant="body" className="font-sans-semibold" style={{ color: colors.danger }}>
                  {amt(debt.balance)}
                </Text>
              </Pressable>
            </View>
          ))}
        </Card>
      )}

      {/* Strategy Comparison */}
      {debtAccounts.length > 0 && (
        <View className="mb-4 flex-row gap-3">
          {[snowball, avalanche].map((strategy) => {
            const years = Math.floor(strategy.totalMonths / 12);
            const months = strategy.totalMonths % 12;
            const timeLabel = years > 0
              ? `${years}y ${months}m`
              : `${months} months`;

            return (
              <Card key={strategy.name} className="flex-1">
                <Text variant="label" className="mb-2" style={{ color: colors.primary }}>
                  {strategy.name}
                </Text>
                <Text variant="caption" className="mb-2" numberOfLines={2}>
                  {strategy.description}
                </Text>
                <View className="gap-1">
                  <View className="flex-row justify-between">
                    <Text variant="caption">Time</Text>
                    <Text variant="caption" className="font-sans-bold">{timeLabel}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text variant="caption">Interest</Text>
                    <Text variant="caption" className="font-sans-bold" style={{ color: colors.danger }}>
                      {amt(strategy.totalInterestPaid)}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Payoff Timeline */}
      {debtAccounts.length > 0 && (() => {
        const estMonthsList = debtAccounts.map((d) => {
          const mp = d.minimumPayment + d.extraPayment;
          return mp > 0 ? Math.ceil(d.balance / mp) : 0;
        });
        const maxMonths = Math.max(...estMonthsList, 1);
        const COLORS = [palette.primary[600], '#f58560', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'];

        return (
          <Card className="mb-4">
            <Text variant="label" className="mb-3">Payoff Timeline</Text>
            <View className="gap-2">
              {debtAccounts.map((debt, idx) => {
                const estMonths = estMonthsList[idx]!;
                const widthPct = Math.max((estMonths / maxMonths) * 100, 8);
                const years = Math.floor(estMonths / 12);
                const months = estMonths % 12;
                const timeLabel = estMonths === 0 && debt.balance > 0
                  ? 'No payments'
                  : years > 0 ? `${years}y ${months}m` : `${months}m`;
                const color = COLORS[idx % COLORS.length]!;

                return (
                  <View key={debt.accountId}>
                    <Text variant="caption" className="font-sans-medium mb-0.5" numberOfLines={1}>
                      {debt.name}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <View
                        className="h-4 rounded"
                        style={{ width: `${widthPct}%`, backgroundColor: color }}
                      />
                      <Text variant="caption" style={{ fontSize: 10 }}>{timeLabel}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        );
      })()}

      {/* Add Debt CTA */}
      <Button
        onPress={() => {
          setSelectedDebt(null);
          addDebtRef.current?.present();
        }}
        variant="outline"
      >
        Add Debt Info
      </Button>

      <AddDebtInfoSheet sheetRef={addDebtRef} editItem={selectedDebt} onDismiss={handleDismiss} />
    </ScrollView>
  );
}
