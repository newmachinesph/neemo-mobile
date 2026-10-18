import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { ProgressBar } from '@ui/components/ProgressBar';
import { useTheme } from '@theme/ThemeProvider';
import { useKuripotScore } from '../hooks/useKuripotScore';
import { useFinanceStore } from '../store/finance.store';
import { hapticSelection } from '@lib/utils/haptics';

// ── Animated counter that counts from 0 → target ──────────────────────
function AnimatedScore({ target, hidden }: { target: number; hidden: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (hidden) return;
    let frame: number;
    const duration = 800;
    const start = performance.now();

    function tick() {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, hidden]);

  return (
    <Text
      variant="h1"
      className="text-primary-600 dark:text-primary-300"
      style={{ fontSize: 48, lineHeight: 52, fontFamily: 'Inter-Bold' }}
    >
      {hidden ? '••' : display}
    </Text>
  );
}

// ── Factor row using shared ProgressBar ───────────────────────────────
interface FactorRowProps {
  label: string;
  value: number;
  icon: string;
  tip: string;
  expanded: boolean;
}

function FactorRow({ label, value, icon, tip, expanded }: FactorRowProps) {
  const { colors } = useTheme();
  const barColor: 'success' | 'warning' | 'danger' =
    value >= 70 ? 'success' : value >= 40 ? 'warning' : 'danger';

  return (
    <View>
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <Icon
          name={icon as React.ComponentProps<typeof Icon>['name']}
          size={14}
          color={colors.textTertiary}
        />
        <View className="flex-1">
          <View className="mb-0.5 flex-row items-center justify-between">
            <Text variant="caption" className="text-neutral-500" style={{ fontSize: 10 }}>
              {label}
            </Text>
            <Text variant="caption" className="text-neutral-700 dark:text-neutral-300" style={{ fontSize: 10 }}>
              {value}%
            </Text>
          </View>
          <ProgressBar
            progress={value / 100}
            height="sm"
            useThresholdColors={false}
            color={barColor}
          />
        </View>
      </View>
      {expanded && (
        <View className="ml-6 mt-1 mb-1 flex-row items-start" style={{ gap: 4 }}>
          <Icon name="bulb-outline" size={10} color={colors.textTertiary} />
          <Text variant="caption" className="text-neutral-400" style={{ fontSize: 9, flex: 1 }}>
            {tip}
          </Text>
        </View>
      )}
    </View>
  );
}

function getTip(factor: string, value: number): string {
  if (factor === 'savingsRate') {
    if (value >= 70) return 'Great job! You\'re saving well above the recommended 20%.';
    if (value >= 40) return 'Decent savings rate. Try to aim for saving at least 20% of income.';
    if (value >= 20) return 'You\'re saving, but try cutting discretionary spending to save more.';
    return 'Your expenses are close to or above your income. Review non-essential spending.';
  }
  if (factor === 'budgetAdherence') {
    if (value >= 70) return 'You\'re staying well within your budgets. Keep it up!';
    if (value >= 40) return 'Some budgets are getting tight. Check which categories are over.';
    return 'Multiple budgets are over limit. Consider adjusting limits or reducing spending.';
  }
  if (factor === 'emergencyFund') {
    if (value >= 80) return 'Excellent! Your emergency fund covers 5+ months of expenses.';
    if (value >= 50) return 'Good progress. Keep building toward 6 months of expenses.';
    if (value >= 20) return 'Your fund covers about 1-2 months. Aim for 3 months as a first milestone.';
    return 'Start building your emergency fund — even small regular contributions help.';
  }
  if (value >= 70) return 'Low credit utilization — great for your credit health.';
  if (value >= 40) return 'Moderate utilization. Try to keep it below 30% of your limit.';
  return 'High credit utilization. Focus on paying down balances.';
}

export function KuripotScoreCard() {
  const { colors } = useTheme();
  const { kuripotScore, hasEnoughData } = useKuripotScore();
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const [expanded, setExpanded] = useState(false);

  if (!hasEnoughData) return null;

  const { score, grade, gradeColor, factors } = kuripotScore;

  const summary =
    score >= 80
      ? 'You\'re managing your money excellently!'
      : score >= 65
        ? 'Solid financial habits — a few areas to improve.'
        : score >= 50
          ? 'Room for improvement in your spending habits.'
          : 'Your finances need attention. Check the tips below.';

  return (
    <Card
      pressable
      onPress={() => { hapticSelection(); setExpanded((p) => !p); }}
      className="mb-4 overflow-hidden"
    >
      {/* Accent bar */}
      <View className="h-1 bg-primary-600 -mx-4 -mt-4 mb-4" />

      {/* Header */}
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900">
            <Icon name="shield-checkmark-outline" size={18} color={colors.primary} />
          </View>
          <Text
            variant="caption"
            className="font-sans-semibold text-neutral-500"
            style={{ letterSpacing: 0.5 }}
          >
            KURIPOT SCORE
          </Text>
        </View>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textTertiary}
        />
      </View>

      {/* Score + Grade */}
      <View className="mb-1 flex-row items-end" style={{ gap: 12 }}>
        <AnimatedScore target={score} hidden={hideBalances} />
        <View className="mb-2 flex-row items-center" style={{ gap: 6 }}>
          <View
            className="items-center justify-center rounded-lg px-2.5 py-1"
            style={{ backgroundColor: gradeColor }}
          >
            <Text
              variant="body"
              className="font-sans-bold"
              style={{ color: '#FFFFFF', fontSize: 16 }}
            >
              {grade}
            </Text>
          </View>
          <Text variant="caption" className="text-neutral-400">
            / 100
          </Text>
        </View>
      </View>

      {/* Summary line */}
      <Text variant="caption" className="mb-3 text-neutral-500" style={{ fontSize: 11 }}>
        {summary}
      </Text>

      {/* Factor Bars using shared ProgressBar */}
      <View style={{ gap: expanded ? 10 : 8 }}>
        <FactorRow
          label="Savings Rate"
          value={factors.savingsRate}
          icon="trending-up-outline"
          tip={getTip('savingsRate', factors.savingsRate)}
          expanded={expanded}
        />
        <FactorRow
          label="Budget Adherence"
          value={factors.budgetAdherence}
          icon="pie-chart-outline"
          tip={getTip('budgetAdherence', factors.budgetAdherence)}
          expanded={expanded}
        />
        <FactorRow
          label="Emergency Fund"
          value={factors.emergencyFund}
          icon="shield-outline"
          tip={getTip('emergencyFund', factors.emergencyFund)}
          expanded={expanded}
        />
        <FactorRow
          label="Debt Ratio"
          value={factors.debtRatio}
          icon="card-outline"
          tip={getTip('debtRatio', factors.debtRatio)}
          expanded={expanded}
        />
      </View>

      {/* Expand hint */}
      {!expanded && (
        <Text variant="caption" className="mt-2 text-center text-neutral-400" style={{ fontSize: 9 }}>
          Tap for tips
        </Text>
      )}
    </Card>
  );
}
