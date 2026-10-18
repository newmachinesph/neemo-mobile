import { View, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Text } from '@ui/components/Text';
import { Card } from '@ui/components/Card';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { get52WeekSchedule, CHALLENGE_LABELS } from '@lib/constants/finance';
import { useFinanceStore } from '../store/finance.store';
import type { Goal } from '../types/finance.types';

interface ChallengeProgressGridProps {
  goal: Goal;
  onToggleWeek?: (weekIndex: number) => void;
}

function get52WeekProgress(goal: Goal): boolean[] {
  const schedule = get52WeekSchedule();
  const totalSaved = goal.currentAmount;
  let running = 0;
  return schedule.map((amount) => {
    running += amount;
    return totalSaved >= running;
  });
}

function getDailyProgress(goal: Goal, dailyAmount: number): { completed: number; total: number } {
  const completed = dailyAmount > 0 ? Math.floor(goal.currentAmount / dailyAmount) : 0;
  return { completed, total: 365 };
}

export function ChallengeProgressGrid({ goal }: ChallengeProgressGridProps) {
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);
  if (!goal.challengeType) return null;

  const label = CHALLENGE_LABELS[goal.challengeType] ?? goal.challengeType;

  if (goal.challengeType === '52-week') {
    const progress = get52WeekProgress(goal);
    const schedule = get52WeekSchedule();
    const completedWeeks = progress.filter(Boolean).length;

    return (
      <Card className="mb-3">
        <Text variant="label" className="mb-2">{label}</Text>
        <Text variant="caption" className="mb-3">
          {completedWeeks} of 52 weeks completed
        </Text>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
          <View className="flex-row flex-wrap gap-1.5">
            {schedule.map((amount, idx) => (
              <View
                key={idx}
                className={`items-center justify-center rounded-lg ${
                  progress[idx] ? 'bg-emerald-500' : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
                style={{ width: 42, height: 42 }}
              >
                <Text
                  variant="caption"
                  className={`font-sans-semibold ${progress[idx] ? 'text-white' : ''}`}
                  style={{ fontSize: 9 }}
                >
                  W{idx + 1}
                </Text>
                <Text
                  variant="caption"
                  className={progress[idx] ? 'text-white' : ''}
                  style={{ fontSize: 8 }}
                >
                  {amt(amount)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Card>
    );
  }

  // Daily challenges (50-peso, 100-daily)
  const dailyAmount = goal.challengeType === '50-peso' ? 50 : 100;
  const { completed, total } = getDailyProgress(goal, dailyAmount);
  const progressPct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <Card className="mb-3">
      <Text variant="label" className="mb-1">{label}</Text>
      <Text variant="caption" className="mb-2">
        {completed} of {total} days ({progressPct.toFixed(0)}%)
      </Text>
      <View className="h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
        <View
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${Math.min(progressPct, 100)}%` }}
        />
      </View>
      <Text variant="caption" className="mt-2">
        Total saved: {amt(goal.currentAmount)} of {amt(dailyAmount * total)}
      </Text>
    </Card>
  );
}
