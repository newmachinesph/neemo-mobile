import { useState, useCallback, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Button } from '@ui/components/Button';
import { Input } from '@ui/components/Input';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { ProgressBar } from '@ui/components/ProgressBar';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency } from '@lib/utils/currency';
import { STORAGE_KEYS } from '@lib/constants/app';
import { appStorage } from '@lib/storage/mmkv';
import { useFinanceStore } from '../store/finance.store';

interface MonthlyCheckInSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
}

type Step = 'mood' | 'accounts' | 'goals' | 'summary';

const MOODS = [
  { emoji: '🎉', label: 'Great', value: 'great' },
  { emoji: '😊', label: 'Good', value: 'good' },
  { emoji: '😐', label: 'Okay', value: 'okay' },
  { emoji: '😰', label: 'Stressed', value: 'stressed' },
] as const;

export function MonthlyCheckInSheet({ sheetRef }: MonthlyCheckInSheetProps) {
  const { colors } = useTheme();
  const accounts = useFinanceStore((s) => s.accounts);
  const goals = useFinanceStore((s) => s.goals);
  const updateAccountBalance = useFinanceStore((s) => s.updateAccountBalance);
  const updateGoalProgress = useFinanceStore((s) => s.updateGoalProgress);
  const takeNetWorthSnapshot = useFinanceStore((s) => s.takeNetWorthSnapshot);
  const netWorthSnapshots = useFinanceStore((s) => s.netWorthSnapshots);

  const [step, setStep] = useState<Step>('mood');
  const [mood, setMood] = useState('');
  const [balanceEdits, setBalanceEdits] = useState<Record<string, string>>({});
  const [goalEdits, setGoalEdits] = useState<Record<string, string>>({});

  const reset = useCallback(() => {
    setStep('mood');
    setMood('');
    setBalanceEdits({});
    setGoalEdits({});
  }, []);

  const handleNext = useCallback(() => {
    if (step === 'mood') {
      // Pre-fill balances
      const initial: Record<string, string> = {};
      for (const acc of accounts) initial[acc.id] = String(acc.balance);
      setBalanceEdits(initial);
      setStep('accounts');
    } else if (step === 'accounts') {
      // Apply balance updates
      for (const [id, val] of Object.entries(balanceEdits)) {
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) updateAccountBalance(id, parsed);
      }
      // Pre-fill goals
      const initial: Record<string, string> = {};
      for (const g of goals) initial[g.id] = String(g.currentAmount);
      setGoalEdits(initial);
      setStep('goals');
    } else if (step === 'goals') {
      // Apply goal updates
      for (const [id, val] of Object.entries(goalEdits)) {
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) updateGoalProgress(id, parsed);
      }
      // Take snapshot and record check-in
      takeNetWorthSnapshot();
      appStorage.set(STORAGE_KEYS.LAST_CHECKIN, new Date().toISOString());
      setStep('summary');
    } else {
      reset();
      sheetRef.current?.dismiss();
    }
  }, [step, accounts, goals, balanceEdits, goalEdits, updateAccountBalance, updateGoalProgress, takeNetWorthSnapshot, reset, sheetRef]);

  // Month-over-month comparison
  const monthComparison = useMemo(() => {
    if (netWorthSnapshots.length < 2) return null;
    const sorted = [...netWorthSnapshots].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const current = sorted[0]!;
    const previous = sorted[1]!;
    const change = current.netWorth - previous.netWorth;
    return { current: current.netWorth, previous: previous.netWorth, change };
  }, [netWorthSnapshots]);

  const stepIndex = step === 'mood' ? 0 : step === 'accounts' ? 1 : step === 'goals' ? 2 : 3;

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['80%']} onDismiss={reset}>
      {/* Progress indicator */}
      {step !== 'summary' && (
        <View className="mb-4 flex-row" style={{ gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              className="flex-1 rounded-full"
              style={{ height: 3, backgroundColor: i <= stepIndex ? colors.primary : colors.border }}
            />
          ))}
        </View>
      )}

      {/* Step 1: Mood */}
      {step === 'mood' && (
        <View>
          <Text variant="h3" className="mb-2">Monthly Check-In</Text>
          <Text variant="caption" className="text-neutral-500 mb-6">
            How do you feel about your finances this month?
          </Text>
          <View className="flex-row justify-between mb-6" style={{ gap: 8 }}>
            {MOODS.map((m) => (
              <Pressable
                key={m.value}
                onPress={() => setMood(m.value)}
                accessibilityRole="button"
                accessibilityLabel={`Mood: ${m.label}${mood === m.value ? ', selected' : ''}`}
                className={`flex-1 items-center rounded-xl py-6 border ${
                  mood === m.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' : 'border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <Text style={{ fontSize: 36, lineHeight: 48 }}>{m.emoji}</Text>
                <Text variant="caption" className="mt-2 font-sans-medium" style={{ fontSize: 12 }}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Button onPress={handleNext} disabled={!mood}>
            Next
          </Button>
        </View>
      )}

      {/* Step 2: Update Accounts */}
      {step === 'accounts' && (
        <View>
          <Text variant="h3" className="mb-2">Update Balances</Text>
          <Text variant="caption" className="text-neutral-500 mb-4">
            Quick-update your account balances to keep things accurate.
          </Text>
          <View style={{ gap: 12 }}>
            {accounts.map((acc) => (
              <View key={acc.id} className="flex-row items-center" style={{ gap: 12 }}>
                <View className="flex-1">
                  <Text variant="caption" className="font-sans-medium mb-1" numberOfLines={1}>
                    {acc.name}
                  </Text>
                  <Input
                    placeholder="0.00"
                    value={balanceEdits[acc.id] ?? String(acc.balance)}
                    onChangeText={(v) => setBalanceEdits((prev) => ({ ...prev, [acc.id]: v }))}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            ))}
          </View>
          <View className="mt-4 flex-row" style={{ gap: 8 }}>
            <Button variant="ghost" onPress={() => setStep('mood')} className="flex-1">
              Back
            </Button>
            <Button onPress={handleNext} className="flex-1">
              Next
            </Button>
          </View>
        </View>
      )}

      {/* Step 3: Review Goals */}
      {step === 'goals' && (
        <View>
          <Text variant="h3" className="mb-2">Review Goals</Text>
          <Text variant="caption" className="text-neutral-500 mb-4">
            Update your goal progress to see how you're tracking.
          </Text>
          {goals.length === 0 ? (
            <View className="items-center py-6">
              <Text variant="caption" className="text-neutral-400">No goals yet</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {goals.map((g) => {
                const current = parseFloat(goalEdits[g.id] ?? String(g.currentAmount)) || 0;
                const progress = g.targetAmount > 0 ? Math.min(current / g.targetAmount, 1) : 0;
                return (
                  <View key={g.id}>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text variant="caption" className="font-sans-medium" numberOfLines={1}>
                        {g.name}
                      </Text>
                      <Text variant="caption" className="text-neutral-400" style={{ fontSize: 10 }}>
                        {formatCurrency(g.targetAmount)}
                      </Text>
                    </View>
                    <ProgressBar progress={progress} height="sm" useThresholdColors={false} color="primary" />
                    <Input
                      placeholder="Current amount"
                      value={goalEdits[g.id] ?? String(g.currentAmount)}
                      onChangeText={(v) => setGoalEdits((prev) => ({ ...prev, [g.id]: v }))}
                      keyboardType="decimal-pad"
                      className="mt-1"
                    />
                  </View>
                );
              })}
            </View>
          )}
          <View className="mt-4 flex-row" style={{ gap: 8 }}>
            <Button variant="ghost" onPress={() => setStep('accounts')} className="flex-1">
              Back
            </Button>
            <Button onPress={handleNext} className="flex-1">
              Finish
            </Button>
          </View>
        </View>
      )}

      {/* Step 4: Summary */}
      {step === 'summary' && (
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900 mb-4">
            <Icon name="checkmark-circle" size={36} color={colors.primary} />
          </View>
          <Text variant="h3" className="mb-2">Check-In Complete!</Text>
          <Text variant="caption" className="text-neutral-500 text-center mb-4">
            Your balances and goals have been updated, and a net worth snapshot has been saved.
          </Text>

          {monthComparison && (
            <View className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 mb-4">
              <Text variant="caption" className="text-neutral-500 mb-2 text-center">Month-over-Month</Text>
              <Text
                variant="h3"
                className="text-center font-sans-bold"
                style={{ color: monthComparison.change >= 0 ? colors.success : colors.danger }}
              >
                {monthComparison.change >= 0 ? '+' : ''}{formatCurrency(monthComparison.change)}
              </Text>
              <Text variant="caption" className="text-neutral-400 text-center mt-1" style={{ fontSize: 10 }}>
                Net worth: {formatCurrency(monthComparison.current)}
              </Text>
            </View>
          )}

          <Button onPress={handleNext} className="w-full">
            Done
          </Button>
        </View>
      )}
    </BottomSheetModal>
  );
}
