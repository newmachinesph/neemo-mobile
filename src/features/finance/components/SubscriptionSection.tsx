import { useRef, useState, useMemo, useCallback } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { EmptyState } from '@ui/components/EmptyState';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '../store/finance.store';
import { SubscriptionRow } from './SubscriptionRow';
import { AddSubscriptionSheet } from './AddSubscriptionSheet';
import type { Subscription } from '../types/finance.types';

type SubFilter = 'all' | 'flagged';

export function SubscriptionSection() {
  const subscriptions = useFinanceStore((s) => s.subscriptions);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const addSubRef = useRef<GorhomBottomSheetModal>(null);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [subFilter, setSubFilter] = useState<SubFilter>('all');

  const activeSubs = useMemo(() => subscriptions.filter((s) => s.isActive), [subscriptions]);
  const totalMonthly = useMemo(
    () =>
      activeSubs.reduce((sum, s) => {
        return sum + (s.frequency === 'yearly' ? s.amount / 12 : s.amount);
      }, 0),
    [activeSubs],
  );

  const handleSubPress = useCallback((sub: Subscription) => {
    setSelectedSub(sub);
    addSubRef.current?.present();
  }, []);

  return (
    <>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="pb-24">
        {/* Summary */}
        <Card className="mb-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text variant="caption" className="text-neutral-500">Monthly Subscriptions</Text>
              <Text variant="h3" className="font-sans-bold">{hideBalances ? maskedCurrency() : formatCurrency(totalMonthly)}</Text>
            </View>
            <View className="items-end">
              <Text variant="caption" className="text-neutral-500">{activeSubs.length} active</Text>
              <Text variant="caption" className="text-neutral-400">
                {subscriptions.length - activeSubs.length} paused
              </Text>
            </View>
          </View>
        </Card>

        {/* Filter chips */}
        <View className="mb-3 flex-row gap-2">
          {(['all', 'flagged'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setSubFilter(f)}
              accessibilityRole="button"
              accessibilityLabel={`Filter: ${f === 'flagged' ? 'Flagged' : 'All'}${subFilter === f ? ', selected' : ''}`}
              className={`rounded-full px-3.5 py-1.5 border ${
                subFilter === f ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <Text variant="caption" className={`font-sans-medium capitalize ${subFilter === f ? 'text-white' : ''}`}>
                {f === 'flagged' ? 'Flagged' : 'All'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* List */}
        {(subFilter === 'flagged' ? subscriptions.filter((s) => s.flaggedForReview) : subscriptions).map((sub) => (
          <SubscriptionRow key={sub.id} subscription={sub} onPress={() => handleSubPress(sub)} />
        ))}

        {subscriptions.length === 0 && (
          <EmptyState
            icon="card-outline"
            title="No subscriptions yet"
            description="Tap + to track your recurring subscriptions"
          />
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => {
          setSelectedSub(null);
          addSubRef.current?.present();
        }}
        accessibilityRole="button"
        accessibilityLabel="Add subscription"
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary-500 shadow-lg active:opacity-80"
        style={{ elevation: 8 }}
      >
        <Icon name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <AddSubscriptionSheet
        sheetRef={addSubRef}
        editItem={selectedSub}
        onDismiss={() => setSelectedSub(null)}
      />
    </>
  );
}
