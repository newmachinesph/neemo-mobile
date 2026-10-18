import { useMemo, useCallback } from 'react';
import { View, Pressable, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { hapticLight } from '@lib/utils/haptics';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '@/src/features/finance';
import { useFinanceSummary } from '@/src/features/finance/hooks/useFinanceSummary';
import { useKuripotScore } from '@/src/features/finance/hooks/useKuripotScore';

type AttentionItem = {
  id: string;
  priority: number;
  icon: React.ComponentProps<typeof Icon>['name'];
  iconColor: string;
  iconBg: string;
  iconBgDark: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  action?: () => void;
};

interface HomeAttentionSectionProps {
  scoreSheetRef?: React.RefObject<GorhomBottomSheetModal | null>;
}

export function HomeAttentionSection({ scoreSheetRef }: HomeAttentionSectionProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const budgets = useFinanceStore((s) => s.budgets);
  const transactions = useFinanceStore((s) => s.transactions);
  const recurringBills = useFinanceStore((s) => s.recurringBills);
  const { budgetUtilization } = useFinanceSummary();
  const { kuripotScore, anomaly, hasEnoughData } = useKuripotScore();
  const isDark = useColorScheme() === 'dark';

  const overspentBudgets = useMemo(
    () => budgets.filter((b) => b.spent > b.amount),
    [budgets],
  );

  // Recent transactions from last 2 days
  const recentCount = useMemo(() => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const cutoff = twoDaysAgo.toISOString().slice(0, 10);
    return transactions.filter((t) => t.date.slice(0, 10) >= cutoff).length;
  }, [transactions]);

  const urgentBills = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Get the actual due date for this month (clamp day 31 to shorter months)
    function getDueDate(dueDay: number) {
      const clampedDay = Math.min(dueDay, daysInMonth);
      return new Date(currentYear, currentMonth, clampedDay);
    }

    const todayStart = new Date(currentYear, currentMonth, now.getDate());

    return recurringBills.filter((b) => {
      if (!b.isActive || b.frequency !== 'monthly') return false;
      if (b.lastPaidDate) {
        const paid = new Date(b.lastPaidDate);
        if (paid.getMonth() === currentMonth && paid.getFullYear() === currentYear) return false;
      }
      const due = getDueDate(b.dueDay);
      const diffMs = due.getTime() - todayStart.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return diffDays >= -1 && diffDays <= 3;
    }).sort((a, b) => a.dueDay - b.dueDay);
  }, [recurringBills]);

  const handleScorePress = useCallback(() => {
    hapticLight();
    scoreSheetRef?.current?.present();
  }, [scoreSheetRef]);

  const items = useMemo(() => {
    const result: AttentionItem[] = [];

    // Priority 0: To Review (engagement hook)
    if (recentCount > 0) {
      result.push({
        id: 'review',
        priority: 0,
        icon: 'document-text-outline',
        iconColor: '#3B82F6',
        iconBg: '#DBEAFE',
        iconBgDark: '#1E3A5F',
        title: `${recentCount} recent transaction${recentCount !== 1 ? 's' : ''}`,
        subtitle: 'Tap to see details',
        badge: `${recentCount}`,
        badgeColor: '#3B82F6',
        action: () => router.navigate({ pathname: '/(app)/finance', params: { tab: 'transactions' } }),
      });
    }

    // Priority 1: Budget overspend
    if (overspentBudgets.length > 0) {
      result.push({
        id: 'overspend',
        priority: 1,
        icon: 'warning',
        iconColor: '#EF4444',
        iconBg: '#FEE2E2',
        iconBgDark: '#5C1E1E',
        title: `${overspentBudgets.length} budget${overspentBudgets.length > 1 ? 's' : ''} over limit`,
        subtitle: overspentBudgets.length <= 2
          ? overspentBudgets.map((b) => b.category).join(', ')
          : `${overspentBudgets.slice(0, 2).map((b) => b.category).join(', ')} +${overspentBudgets.length - 2} more`,
        action: () => router.push('/(app)/insights'),
      });
    }

    // Priority 2: Urgent bills (due within 3 days)
    if (urgentBills.length > 0) {
      const bill = urgentBills[0]!;
      const now = new Date();
      const dIM = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const clampedDay = Math.min(bill.dueDay, dIM);
      const dueDate = new Date(now.getFullYear(), now.getMonth(), clampedDay);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diff = Math.round((dueDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
      const dueLabel = diff === 0 ? 'due today' : diff < 0 ? 'overdue' : diff === 1 ? 'due tomorrow' : `due in ${diff} days`;
      result.push({
        id: 'bill',
        priority: 2,
        icon: 'receipt-outline',
        iconColor: '#F59E0B',
        iconBg: '#FEF3C7',
        iconBgDark: '#5C4B1E',
        title: `${bill.name} ${dueLabel}`,
        subtitle: urgentBills.length > 1 ? `+${urgentBills.length - 1} more` : undefined,
        action: () => router.push({ pathname: '/(app)/insights', params: { tab: 'subs' } }),
      });
    }

    // Priority 3: Anomaly
    if (anomaly.detected) {
      result.push({
        id: 'anomaly',
        priority: 3,
        icon: 'trending-up-outline',
        iconColor: '#EF4444',
        iconBg: '#FEE2E2',
        iconBgDark: '#5C1E1E',
        title: `Unusual ${anomaly.categoryLabel} spending`,
        subtitle: `${anomaly.ratio}x your average`,
        action: () => router.push('/(app)/insights'),
      });
    }

    // Priority 4: Budget nearing limit
    if (budgetUtilization > 0.85 && overspentBudgets.length === 0) {
      result.push({
        id: 'budget-warning',
        priority: 4,
        icon: 'pie-chart-outline',
        iconColor: '#F59E0B',
        iconBg: '#FEF3C7',
        iconBgDark: '#5C4B1E',
        title: 'Budget nearing limit',
        subtitle: `${Math.round(budgetUtilization * 100)}% used`,
        action: () => router.push('/(app)/insights'),
      });
    }

    // Priority 5: Kuripot Score
    if (hasEnoughData) {
      const { score, grade, gradeColor } = kuripotScore;
      result.push({
        id: 'score',
        priority: 5,
        icon: 'shield-checkmark-outline',
        iconColor: gradeColor,
        iconBg: `${gradeColor}20`,
        iconBgDark: `${gradeColor}30`,
        title: `Kuripot Score: ${score}`,
        subtitle: `Grade ${grade}`,
        action: handleScorePress,
      });
    }

    return result.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [recentCount, overspentBudgets, urgentBills, anomaly, budgetUtilization, hasEnoughData, kuripotScore, handleScorePress, router]);

  // Nothing needs attention — positive reinforcement
  if (items.length === 0) {
    return (
      <Card className="mb-3 flex-row items-center" style={{ gap: 10 }}>
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: `${colors.success}20` }}
        >
          <Icon name="checkmark-circle" size={20} color={colors.success} />
        </View>
        <View className="flex-1">
          <Text variant="body" className="font-sans-medium" style={{ fontSize: 13 }}>
            All clear!
          </Text>
          <Text variant="caption" className="text-neutral-500 dark:text-neutral-400" style={{ fontSize: 11 }}>
            You're on track this month. Keep it up!
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card className="mb-3 px-0 py-1">
      {items.map((item, idx) => (
        <Pressable
          key={item.id}
          onPress={() => {
            hapticLight();
            item.action?.();
          }}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          className="flex-row items-center px-4 py-2.5 active:bg-neutral-50 dark:active:bg-neutral-800"
          style={idx < items.length - 1 ? { borderBottomWidth: 0.5, borderBottomColor: colors.borderLight } : undefined}
        >
          <View
            className="h-8 w-8 items-center justify-center rounded-full mr-3"
            style={{ backgroundColor: isDark ? item.iconBgDark : item.iconBg }}
          >
            <Icon name={item.icon} size={16} color={item.iconColor} />
          </View>
          <View className="flex-1">
            <Text variant="body" className="font-sans-medium" style={{ fontSize: 13 }} numberOfLines={1}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text variant="caption" className="text-neutral-500 dark:text-neutral-400" style={{ fontSize: 11 }} numberOfLines={1}>
                {item.subtitle}
              </Text>
            )}
          </View>
          {item.badge ? (
            <View
              className="h-5 min-w-5 items-center justify-center rounded-full mr-2 px-1.5"
              style={{ backgroundColor: item.badgeColor }}
            >
              <Text variant="caption" className="font-sans-bold" style={{ fontSize: 10, color: '#FFFFFF' }}>
                {item.badge}
              </Text>
            </View>
          ) : null}
          <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
        </Pressable>
      ))}
    </Card>
  );
}
