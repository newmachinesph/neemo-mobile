import { useRef, useState, useMemo, useCallback } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '../store/finance.store';
import { UtangCard } from './UtangCard';
import { AddUtangSheet } from './AddUtangSheet';
import { AddUtangPaymentSheet } from './AddUtangPaymentSheet';
import type { Utang } from '../types/finance.types';

type Filter = 'all' | 'lent' | 'borrowed';

export function UtangSection() {
  const { colors } = useTheme();
  const utangs = useFinanceStore((s) => s.utangs);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);
  const addUtangRef = useRef<GorhomBottomSheetModal>(null);
  const addPaymentRef = useRef<GorhomBottomSheetModal>(null);
  const [selectedUtang, setSelectedUtang] = useState<Utang | null>(null);
  const [paymentUtangId, setPaymentUtangId] = useState<string | null>(null);
  const [paymentRemaining, setPaymentRemaining] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');

  const activeUtangs = useMemo(
    () => utangs.filter((u) => u.status !== 'settled'),
    [utangs],
  );

  const filteredUtangs = useMemo(
    () => (filter === 'all' ? activeUtangs : activeUtangs.filter((u) => u.type === filter)),
    [activeUtangs, filter],
  );

  const totalLent = useMemo(
    () => activeUtangs.filter((u) => u.type === 'lent').reduce((sum, u) => sum + u.remainingBalance, 0),
    [activeUtangs],
  );
  const totalBorrowed = useMemo(
    () => activeUtangs.filter((u) => u.type === 'borrowed').reduce((sum, u) => sum + u.remainingBalance, 0),
    [activeUtangs],
  );

  const handleAddPayment = useCallback((utang: Utang) => {
    setPaymentUtangId(utang.id);
    setPaymentRemaining(utang.remainingBalance);
    addPaymentRef.current?.present();
  }, []);

  const handleEditUtang = useCallback((utang: Utang) => {
    setSelectedUtang(utang);
    addUtangRef.current?.present();
  }, []);

  return (
    <>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="pb-24">
        {/* Summary Card */}
        <Card className="mb-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text variant="caption" className="text-neutral-500">Pinahiram (Lent)</Text>
              <Text variant="body" className="font-sans-bold" style={{ color: colors.info }}>
                {amt(totalLent)}
              </Text>
            </View>
            <View className="items-end">
              <Text variant="caption" className="text-neutral-500">Hiniram (Borrowed)</Text>
              <Text variant="body" className="font-sans-bold" style={{ color: colors.danger }}>
                {amt(totalBorrowed)}
              </Text>
            </View>
          </View>
          <View className="mt-2 border-t border-neutral-100 pt-2 dark:border-neutral-800">
            <View className="flex-row items-center justify-between">
              <Text variant="caption" className="text-neutral-500">Net</Text>
              <Text variant="body" className="font-sans-bold">
                {amt(totalLent - totalBorrowed)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Filter Pills */}
        <View className="mb-3 flex-row gap-2">
          {(['all', 'lent', 'borrowed'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              accessibilityRole="button"
              accessibilityLabel={`Filter: ${f}${filter === f ? ', selected' : ''}`}
              className={`flex-1 items-center rounded-xl py-2 border ${
                filter === f ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <Text variant="caption" className={`font-sans-semibold capitalize ${filter === f ? 'text-white' : ''}`}>
                {f}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* List */}
        {filteredUtangs.length === 0 ? (
          <Card>
            <Text variant="caption" className="py-4 text-center text-neutral-400">
              No active utangs
            </Text>
          </Card>
        ) : (
          filteredUtangs.map((utang) => (
            <UtangCard
              key={utang.id}
              utang={utang}
              onPress={() => handleEditUtang(utang)}
              onAddPayment={() => handleAddPayment(utang)}
            />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => {
          setSelectedUtang(null);
          addUtangRef.current?.present();
        }}
        accessibilityRole="button"
        accessibilityLabel="Add utang"
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary-500 shadow-lg active:opacity-80"
        style={{ elevation: 8 }}
      >
        <Icon name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <AddUtangSheet
        sheetRef={addUtangRef}
        editItem={selectedUtang}
        onDismiss={() => setSelectedUtang(null)}
      />
      <AddUtangPaymentSheet
        sheetRef={addPaymentRef}
        utangId={paymentUtangId}
        remainingBalance={paymentRemaining}
        onDismiss={() => setPaymentUtangId(null)}
      />
    </>
  );
}
