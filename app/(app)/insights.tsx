import { useState, useRef, useCallback, useEffect } from 'react';
import { View, FlatList, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { ProgressBar } from '@ui/components/ProgressBar';
import { EmptyState } from '@ui/components/EmptyState';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { formatCurrency } from '@lib/utils/currency';
import { hapticLight } from '@lib/utils/haptics';
import { useFinanceStore } from '@/src/features/finance';
import { useFinanceSummary } from '@/src/features/finance/hooks/useFinanceSummary';
import { BudgetRow } from '@/src/features/finance/components/BudgetRow';
import { GoalCard } from '@/src/features/finance/components/GoalCard';
import { AddBudgetSheet } from '@/src/features/finance/components/AddBudgetSheet';
import { AddGoalSheet } from '@/src/features/finance/components/AddGoalSheet';
import { ReportsTab } from '@/src/features/finance/components/ReportsTab';
import { SubscriptionSection } from '@/src/features/finance/components/SubscriptionSection';
import { useTheme } from '@theme/ThemeProvider';
import type { Budget, Goal } from '@/src/features/finance';

type Tab = 'budgets' | 'goals' | 'reports' | 'subs';
const TAB_LABELS: Record<Tab, string> = { budgets: 'Budgets', goals: 'Goals', reports: 'Reports', subs: 'Subs' };

export default function InsightsScreen() {
  const { colors } = useTheme();
  const { tab: initialTab } = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(initialTab ?? 'budgets');
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const lastAppliedTab = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (initialTab && initialTab !== lastAppliedTab.current) {
      setTab(initialTab);
      lastAppliedTab.current = initialTab;
    }
  }, [initialTab]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const budgets = useFinanceStore((s) => s.budgets);
  const goals = useFinanceStore((s) => s.goals);
  const { totalBudgeted, totalBudgetSpent, budgetUtilization } = useFinanceSummary();

  const addBudgetRef = useRef<GorhomBottomSheetModal>(null);
  const addGoalRef = useRef<GorhomBottomSheetModal>(null);

  const handleBudgetPress = useCallback((budget: Budget) => {
    hapticLight();
    setSelectedBudget(budget);
    addBudgetRef.current?.present();
  }, []);

  const handleGoalPress = useCallback((goal: Goal) => {
    hapticLight();
    setSelectedGoal(goal);
    addGoalRef.current?.present();
  }, []);

  const handleBudgetDismiss = useCallback(() => {
    setSelectedBudget(null);
  }, []);

  const handleGoalDismiss = useCallback(() => {
    setSelectedGoal(null);
  }, []);

  return (
    <ScreenContainer scrollable={false} edges={['top', 'left', 'right']}>
      {/* Header */}
      <Text variant="h2" className="mb-4 mt-2">
        Insights
      </Text>

      {/* Tab pills */}
      <StaggeredFadeIn index={0}>
        <View className="mb-4 flex-row gap-2">
          {(['budgets', 'goals', 'reports', 'subs'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => { hapticLight(); setTab(t); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              accessibilityLabel={`${TAB_LABELS[t]} tab`}
              className={`flex-1 items-center rounded-xl py-2.5 border ${
                tab === t
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <Text
                variant="caption"
                className={`font-sans-semibold capitalize ${tab === t ? 'text-white' : ''}`}
              >
                {TAB_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>
      </StaggeredFadeIn>

      <StaggeredFadeIn index={1} className="flex-1">
        {/* Budgets tab */}
        {tab === 'budgets' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-24">
            {budgets.length > 0 ? (
              <>
                <Card className="mb-4">
                  <Text variant="caption" className="mb-1">Monthly Overview</Text>
                  <Text variant="h3" className="mb-2">
                    {formatCurrency(totalBudgetSpent)} / {formatCurrency(totalBudgeted)}
                  </Text>
                  <ProgressBar progress={budgetUtilization} height="md" useThresholdColors />
                </Card>
                <Card>
                  <View className="gap-1">
                    {budgets.map((item) => (
                      <BudgetRow key={item.id} budget={item} onPress={() => handleBudgetPress(item)} />
                    ))}
                  </View>
                </Card>
              </>
            ) : (
              <EmptyState
                icon="pie-chart-outline"
                title="No budgets yet"
                description="Tap + to create your first budget and start tracking spending."
              />
            )}
          </ScrollView>
        )}

        {/* Goals tab */}
        {tab === 'goals' && (
          <FlatList<Goal>
            data={goals}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-24"
            renderItem={({ item }) => (
              <GoalCard goal={item} onPress={() => handleGoalPress(item)} />
            )}
            ListEmptyComponent={
              <EmptyState
                icon="flag-outline"
                title="No goals yet"
                description="Tap + to set your first savings goal."
              />
            }
          />
        )}

        {/* Reports tab */}
        {tab === 'reports' && <ReportsTab />}

        {/* Subscriptions tab */}
        {tab === 'subs' && <SubscriptionSection />}
      </StaggeredFadeIn>

      {/* FAB — only on budgets & goals tabs */}
      {(tab === 'budgets' || tab === 'goals') && (
        <Pressable
          onPress={() => {
            hapticLight();
            if (tab === 'budgets') {
              setSelectedBudget(null);
              addBudgetRef.current?.present();
            } else {
              setSelectedGoal(null);
              addGoalRef.current?.present();
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={`Add new ${tab === 'budgets' ? 'budget' : 'goal'}`}
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary-500 shadow-lg active:opacity-80"
          style={{ elevation: 8 }}
        >
          <Icon name="add" size={28} color="#FFFFFF" />
        </Pressable>
      )}

      <AddBudgetSheet sheetRef={addBudgetRef} editItem={selectedBudget} onDismiss={handleBudgetDismiss} />
      <AddGoalSheet sheetRef={addGoalRef} editItem={selectedGoal} onDismiss={handleGoalDismiss} />
    </ScreenContainer>
  );
}
