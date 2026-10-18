import { memo, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon, type IconName } from '@ui/components/Icon';
import { Badge } from '@ui/components/Badge';
import { ProgressBar } from '@ui/components/ProgressBar';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { CHALLENGE_LABELS } from '@lib/constants/finance';
import { useFinanceStore } from '../store/finance.store';
import type { Goal } from '../types/finance.types';

function formatTargetDate(yyyyMm: string | undefined): string {
  if (!yyyyMm || !yyyyMm.includes('-')) return 'No date';
  const [year, month] = yyyyMm.split('-');
  const y = Number(year);
  const m = Number(month);
  if (Number.isNaN(y) || Number.isNaN(m)) return 'No date';
  const date = new Date(y, m - 1);
  return date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
}

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
}

const MILESTONES = [0.25, 0.5, 0.75] as const;

export const GoalCard = memo(function GoalCard({ goal, onPress }: GoalCardProps) {
  const { colors } = useTheme();
  const updateGoal = useFinanceStore((s) => s.updateGoal);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);
  const progress = goal.targetAmount > 0 ? Math.min(goal.currentAmount / goal.targetAmount, 1) : 0;

  // Estimate projected completion based on target date and current progress
  const projection = useMemo(() => {
    if (progress >= 1) return { label: 'Completed!', monthsToGo: 0, status: 'completed' as const };
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return { label: 'Completed!', monthsToGo: 0, status: 'completed' as const };
    if (!goal.targetDate || !goal.targetDate.includes('-')) return null;

    const [tY, tM] = goal.targetDate.split('-').map(Number);
    if (Number.isNaN(tY!) || Number.isNaN(tM!)) return null;

    const now = new Date();
    const targetDate = new Date(tY!, tM! - 1);
    const monthsLeft = Math.max(
      0,
      (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth()),
    );

    if (monthsLeft <= 0) {
      return { label: 'Overdue', monthsToGo: 0, status: 'behind' as const };
    }

    const neededPerMonth = remaining / monthsLeft;
    const label = targetDate.toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });

    // Determine pace status based on progress vs expected progress
    const totalMonths = goal.targetAmount > 0 && neededPerMonth > 0
      ? Math.max(1, Math.ceil(goal.targetAmount / neededPerMonth))
      : monthsLeft;
    const elapsed = totalMonths - monthsLeft;
    const expectedProgress = elapsed > 0 ? elapsed / totalMonths : 0;

    let status: 'ahead' | 'behind' | 'on-track' = 'on-track';
    if (progress > expectedProgress + 0.1) status = 'ahead';
    else if (progress < expectedProgress - 0.1) status = 'behind';

    return { label, monthsToGo: monthsLeft, status, neededPerMonth };
  }, [goal, progress]);

  return (
    <Card pressable={!!onPress} onPress={onPress} className="mb-4">
      <View className="mb-2 flex-row items-center">
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${goal.color}20` }}
        >
          <Icon name={goal.icon as IconName} size={20} color={goal.color} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text variant="body" className="font-sans-semibold" numberOfLines={1}>
              {goal.name}
            </Text>
            <Pressable
              onPress={() => updateGoal(goal.id, { isLocked: !goal.isLocked })}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={goal.isLocked ? 'Unlock goal savings' : 'Lock goal savings'}
            >
              <Icon
                name={goal.isLocked ? 'lock-closed' : 'lock-open-outline'}
                size={14}
                color={goal.isLocked ? colors.primary : colors.textTertiary}
              />
            </Pressable>
          </View>
          <Text variant="caption" className="mt-0.5">
            {amt(goal.currentAmount)} of {amt(goal.targetAmount)}
          </Text>
        </View>
        <Badge variant="info">
          {formatTargetDate(goal.targetDate)}
        </Badge>
      </View>
      {goal.challengeType && (
        <View className="mb-2">
          <Badge variant="warning">
            {CHALLENGE_LABELS[goal.challengeType] ?? goal.challengeType}
          </Badge>
        </View>
      )}

      {/* Progress bar with milestone markers */}
      <View>
        <ProgressBar
          progress={progress}
          height="sm"
          useThresholdColors={false}
          color="primary"
        />
        {/* Milestone tick marks */}
        <View className="relative" style={{ height: 8, marginTop: 2 }}>
          {MILESTONES.map((m) => (
            <View
              key={m}
              className="absolute"
              style={{ left: `${m * 100}%`, transform: [{ translateX: -0.75 }] }}
            >
              <View
                style={{
                  width: 1.5,
                  height: 6,
                  borderRadius: 1,
                  backgroundColor: progress >= m ? colors.primary : colors.border,
                }}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Projection info */}
      {projection && (
        <View className="flex-row items-center justify-between mt-0.5">
          <View className="flex-row items-center" style={{ gap: 4 }}>
            {projection.monthsToGo > 0 ? (
              <Text variant="caption" className="text-neutral-500" style={{ fontSize: 11 }}>
                {projection.monthsToGo} mo left
                {'neededPerMonth' in projection && projection.neededPerMonth! > 0
                  ? ` · ${amt(projection.neededPerMonth!)}/mo`
                  : ''}
              </Text>
            ) : (
              <Text variant="caption" className="text-neutral-500" style={{ fontSize: 11 }}>
                {projection.label}
              </Text>
            )}
          </View>
          {projection.status === 'ahead' && (
            <View className="flex-row items-center" style={{ gap: 2 }}>
              <Icon name="trending-up" size={12} color={colors.success} />
              <Text variant="caption" style={{ fontSize: 10, color: colors.success }}>Ahead</Text>
            </View>
          )}
          {projection.status === 'behind' && (
            <View className="flex-row items-center" style={{ gap: 2 }}>
              <Icon name="trending-down" size={12} color={colors.danger} />
              <Text variant="caption" style={{ fontSize: 10, color: colors.danger }}>Behind</Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
});
