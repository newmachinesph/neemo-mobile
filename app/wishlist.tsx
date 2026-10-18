import { useState, useRef, useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { EmptyState } from '@ui/components/EmptyState';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { useTheme } from '@theme/ThemeProvider';
import { hapticLight } from '@lib/utils/haptics';
import { useFinanceStore } from '@/src/features/finance';
import { WishlistCard } from '@/src/features/finance/components/WishlistCard';
import { AddWishlistSheet } from '@/src/features/finance/components/AddWishlistSheet';
import type { WishlistItem } from '@/src/features/finance/types/finance.types';

const TABS = ['Active', 'Purchased'] as const;
type Tab = (typeof TABS)[number];

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

export default function WishlistScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('Active');
  const addSheetRef = useRef<GorhomBottomSheetModal>(null);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);

  const wishlistItems = useFinanceStore((s) => s.wishlistItems);

  const activeItems = useMemo(
    () =>
      wishlistItems
        .filter((w) => !w.isPurchased)
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]),
    [wishlistItems],
  );

  const purchasedItems = useMemo(
    () =>
      wishlistItems
        .filter((w) => w.isPurchased)
        .sort((a, b) => (b.purchasedDate ?? '').localeCompare(a.purchasedDate ?? '')),
    [wishlistItems],
  );

  const displayItems = activeTab === 'Active' ? activeItems : purchasedItems;

  const headerLeft = useCallback(() => null, []);
  const headerRight = useCallback(() => (
    <View className="flex-row items-center" style={{ gap: 12 }}>
      <Pressable
        onPress={() => {
          hapticLight();
          setEditingItem(null);
          addSheetRef.current?.present();
        }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Add wishlist item"
      >
        <Icon name="add-circle-outline" size={26} color={colors.primary} />
      </Pressable>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close screen"
      >
        <Icon name="close" size={24} color={colors.text} />
      </Pressable>
    </View>
  ), [colors.primary, colors.text, router]);
  const headerTitleStyle = useMemo(() => ({ fontFamily: 'Inter-SemiBold' as const, fontSize: 17 }), []);
  const headerStyle = useMemo(() => ({ backgroundColor: colors.background }), [colors.background]);
  const screenOptions = useMemo(() => ({
    headerShown: true,
    title: 'Gusto Ko (Wishlist)',
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

      {/* Tabs */}
      <StaggeredFadeIn index={1}>
        <View className="mb-4 flex-row gap-2">
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => { hapticLight(); setActiveTab(tab); }}
              className={`flex-1 items-center rounded-full border py-2 ${
                activeTab === tab ? 'border-transparent' : 'border-neutral-200 dark:border-neutral-700'
              }`}
              style={activeTab === tab ? { backgroundColor: colors.primary } : undefined}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab }}
              accessibilityLabel={`${tab} tab (${tab === 'Active' ? activeItems.length : purchasedItems.length} items)`}
            >
              <Text
                variant="caption"
                className="font-sans-medium"
                style={activeTab === tab ? { color: '#FFFFFF' } : undefined}
              >
                {tab} ({tab === 'Active' ? activeItems.length : purchasedItems.length})
              </Text>
            </Pressable>
          ))}
        </View>
      </StaggeredFadeIn>

      {/* List */}
      {displayItems.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title={activeTab === 'Active' ? 'No wishlist items' : 'No purchased items'}
          description={activeTab === 'Active' ? 'Tap + to add something you want to save for.' : 'Items you mark as purchased will appear here.'}
          actionLabel={activeTab === 'Active' ? 'Add Item' : undefined}
          onAction={activeTab === 'Active' ? () => addSheetRef.current?.present() : undefined}
        />
      ) : (
        displayItems.map((item, i) => (
          <StaggeredFadeIn key={item.id} index={i + 2}>
            <WishlistCard
              item={item}
              onEdit={() => {
                hapticLight();
                setEditingItem(item);
                addSheetRef.current?.present();
              }}
            />
          </StaggeredFadeIn>
        ))
      )}

      <AddWishlistSheet
        sheetRef={addSheetRef}
        editItem={editingItem}
        onDismiss={() => setEditingItem(null)}
      />
    </ScreenContainer>
    </>
  );
}
