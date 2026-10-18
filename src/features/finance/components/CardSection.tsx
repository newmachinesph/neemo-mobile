import { useRef, useState, useMemo, useCallback } from 'react';
import { View, Pressable, FlatList } from 'react-native';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '../store/finance.store';
import { CardItem } from './CardItem';
import { AddCardSheet } from './AddCardSheet';
import { CardDetailSheet } from './CardDetailSheet';
import type { Card } from '../types/finance.types';

export function CardSection() {
  const { colors } = useTheme();
  const cards = useFinanceStore((s) => s.cards);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const addCardRef = useRef<GorhomBottomSheetModal>(null);
  const detailRef = useRef<GorhomBottomSheetModal>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [detailCard, setDetailCard] = useState<Card | null>(null);

  const activeCards = useMemo(() => cards.filter((c) => c.isActive), [cards]);
  const totalCreditUsed = useMemo(
    () => activeCards.filter((c) => c.type === 'credit').reduce((sum, c) => sum + (c.outstandingBalance || 0), 0),
    [activeCards],
  );

  const handleCardPress = useCallback((card: Card) => {
    setDetailCard(card);
    detailRef.current?.present();
  }, []);

  const handleCardLongPress = useCallback((card: Card) => {
    setSelectedCard(card);
    addCardRef.current?.present();
  }, []);

  return (
    <>
      <View className="mb-2 flex-row items-center justify-between">
        <Text variant="label">Cards</Text>
        <Pressable
          onPress={() => {
            setSelectedCard(null);
            addCardRef.current?.present();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Add new card"
        >
          <Icon name="add-circle-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {activeCards.length === 0 ? (
        <Pressable
          onPress={() => {
            setSelectedCard(null);
            addCardRef.current?.present();
          }}
          className="mb-4 flex-row items-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 py-3 dark:border-neutral-600"
          accessibilityRole="button"
          accessibilityLabel="Add your first card"
        >
          <Icon name="card-outline" size={18} color={colors.textTertiary} />
          <Text variant="caption">Add your first card</Text>
        </Pressable>
      ) : (
        <>
          {totalCreditUsed > 0 && (
            <Text variant="caption" className="mb-2 text-neutral-500">
              Credit used: {hideBalances ? maskedCurrency() : formatCurrency(totalCreditUsed)}
            </Text>
          )}

          <FlatList<Card>
            data={activeCards}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            renderItem={({ item }) => (
              <CardItem card={item} onPress={() => handleCardPress(item)} onLongPress={() => handleCardLongPress(item)} />
            )}
          />
        </>
      )}

      <AddCardSheet
        sheetRef={addCardRef}
        editItem={selectedCard}
        onDismiss={() => setSelectedCard(null)}
      />
      <CardDetailSheet sheetRef={detailRef} card={detailCard} />
    </>
  );
}
