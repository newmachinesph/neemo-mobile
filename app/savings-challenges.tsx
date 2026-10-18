import { useCallback, useMemo } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { formatCurrency } from '@lib/utils/currency';
import { hapticLight, hapticSuccess } from '@lib/utils/haptics';
import { CHALLENGE_LABELS, get52WeekSchedule } from '@lib/constants/finance';
import { useFinanceStore } from '@/src/features/finance';
import { ChallengeProgressGrid } from '@/src/features/finance/components/ChallengeProgressGrid';
import { useTheme } from '@theme/ThemeProvider';

type ChallengeDef = {
  id: string;
  type: '52-week' | '50-peso' | '100-daily';
  icon: string;
  color: string;
  description: string;
  projected: number;
};

const CHALLENGES: ChallengeDef[] = [
  {
    id: '52-week',
    type: '52-week',
    icon: 'calendar-outline',
    color: '#3B82F6',
    description: 'Save ₱50 in week 1, ₱100 in week 2, and so on. By week 52, you\'ll have ₱68,900!',
    projected: 68900,
  },
  {
    id: '50-peso',
    type: '50-peso',
    icon: 'cash-outline',
    color: '#22C55E',
    description: 'Save ₱50 every day for a year. Simple, consistent, and you\'ll save ₱18,250!',
    projected: 18250,
  },
  {
    id: '100-daily',
    type: '100-daily',
    icon: 'flash-outline',
    color: '#F59E0B',
    description: 'Save ₱100 every day. An aggressive challenge that saves ₱36,500 in a year!',
    projected: 36500,
  },
];

export default function SavingsChallengesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const goals = useFinanceStore((s) => s.goals);
  const addGoal = useFinanceStore((s) => s.addGoal);

  const activeGoals = useMemo(
    () => goals.filter((g) => g.challengeType),
    [goals],
  );

  const activeChallengeTypes = useMemo(
    () => new Set(activeGoals.map((g) => g.challengeType)),
    [activeGoals],
  );

  const handleStartChallenge = useCallback(
    (challenge: ChallengeDef) => {
      if (activeChallengeTypes.has(challenge.type)) {
        Alert.alert('Already Active', `You already have an active ${CHALLENGE_LABELS[challenge.type]}. Check your Goals tab to track progress.`);
        return;
      }

      // Compute target date as 1 year from now (YYYY-MM)
      const now = new Date();
      const targetYear = now.getFullYear() + 1;
      const targetMonth = String(now.getMonth() + 1).padStart(2, '0');

      addGoal({
        name: CHALLENGE_LABELS[challenge.type],
        targetAmount: challenge.projected,
        currentAmount: 0,
        targetDate: `${targetYear}-${targetMonth}`,
        icon: challenge.icon,
        color: challenge.color,
        challengeType: challenge.type,
      });

      hapticSuccess();
      Alert.alert('Challenge Started!', 'Check your Goals tab to track your progress.');
    },
    [activeChallengeTypes, addGoal],
  );

  // Memoize screen options to prevent infinite re-render loop
  const headerLeft = useCallback(() => null, []);
  const headerRight = useCallback(() => (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      className="mr-2"
      accessibilityRole="button"
      accessibilityLabel="Close savings challenges"
    >
      <Icon name="close" size={24} color={colors.text} />
    </Pressable>
  ), [colors.text, router]);
  const headerTitleStyle = useMemo(() => ({ fontFamily: 'Inter-SemiBold' as const, fontSize: 17 }), []);
  const headerStyle = useMemo(() => ({ backgroundColor: colors.background }), [colors.background]);
  const screenOptions = useMemo(() => ({
    headerShown: true,
    title: 'Savings Challenges',
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
          <Text variant="caption" className="mb-4" style={{ color: colors.textTertiary }}>
            Pick a savings challenge and build your ipon habit!
          </Text>

          {/* Active Challenges from Goals */}
          {activeGoals.length > 0 && (
            <>
              <Text variant="body" className="mb-2 font-sans-semibold">Your Active Challenges</Text>
              {activeGoals.map((g) => (
                <View key={g.id} className="mb-3">
                  <Card>
                    <View className="mb-2 flex-row items-center" style={{ gap: 8 }}>
                      <View
                        className="h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${g.color}20` }}
                      >
                        <Icon name={g.icon as React.ComponentProps<typeof Icon>['name']} size={18} color={g.color} />
                      </View>
                      <View className="flex-1">
                        <Text variant="body" className="font-sans-medium">{g.name}</Text>
                        <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 10 }}>
                          {CHALLENGE_LABELS[g.challengeType!]} · {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}
                        </Text>
                      </View>
                    </View>
                    <ChallengeProgressGrid goal={g} />
                  </Card>
                </View>
              ))}
            </>
          )}
        </StaggeredFadeIn>

        {/* Available Challenges */}
        <StaggeredFadeIn index={1}>
          <Text variant="body" className="mb-2 font-sans-semibold">
            {activeGoals.length > 0 ? 'More Challenges' : 'Choose a Challenge'}
          </Text>
          <View style={{ gap: 12 }}>
            {CHALLENGES.map((c) => (
              <Card key={c.id}>
                <View className="flex-row items-start" style={{ gap: 12 }}>
                  <View
                    className="h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${c.color}18` }}
                  >
                    <Icon
                      name={c.icon as React.ComponentProps<typeof Icon>['name']}
                      size={24}
                      color={c.color}
                    />
                  </View>
                  <View className="flex-1">
                    <Text variant="body" className="font-sans-semibold">
                      {CHALLENGE_LABELS[c.type]}
                    </Text>
                    <Text variant="caption" className="mt-0.5" style={{ color: colors.textTertiary, lineHeight: 18 }}>
                      {c.description}
                    </Text>
                    <View className="mt-2 flex-row items-center justify-between">
                      <Text variant="caption" style={{ color: c.color }}>
                        Projected: {formatCurrency(c.projected)}
                      </Text>
                      <Pressable
                        onPress={() => { hapticLight(); handleStartChallenge(c); }}
                        className="rounded-full px-4 py-1.5"
                        style={{ backgroundColor: activeChallengeTypes.has(c.type) ? colors.textTertiary : c.color }}
                        accessibilityRole="button"
                        accessibilityLabel={activeChallengeTypes.has(c.type) ? `${CHALLENGE_LABELS[c.type]} is already active` : `Start ${CHALLENGE_LABELS[c.type]} challenge`}
                      >
                        <Text variant="caption" style={{ color: '#FFFFFF', fontSize: 11 }}>
                          {activeChallengeTypes.has(c.type) ? 'Active' : 'Start'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </StaggeredFadeIn>
      </ScreenContainer>
    </>
  );
}
