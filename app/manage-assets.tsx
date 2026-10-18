import { useState, useRef, useCallback, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { Text } from '@ui/components/Text';
import { Icon, type IconName } from '@ui/components/Icon';
import { Card } from '@ui/components/Card';
import { ListItem } from '@ui/components/ListItem';
import { Divider } from '@ui/components/Divider';
import { Button } from '@ui/components/Button';
import { EmptyState } from '@ui/components/EmptyState';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { hapticLight } from '@lib/utils/haptics';
import { ASSET_CATEGORY_LABELS } from '@lib/constants/finance';
import { useFinanceStore } from '@/src/features/finance';
import { AddManualAssetSheet } from '@/src/features/finance/components/AddManualAssetSheet';
import type { ManualAsset } from '@/src/features/finance/types/finance.types';

const ASSET_ICONS: Record<string, string> = {
  property: 'home-outline',
  vehicle: 'car-outline',
  jewelry: 'diamond-outline',
  other: 'cube-outline',
};

type Filter = 'all' | 'property' | 'vehicle' | 'jewelry' | 'other';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'property', label: 'Property' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'jewelry', label: 'Jewelry' },
  { key: 'other', label: 'Other' },
];

export default function ManageAssetsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const manualAssets = useFinanceStore((s) => s.manualAssets);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => (hideBalances ? maskedCurrency() : formatCurrency(v));

  const [filter, setFilter] = useState<Filter>('all');
  const [selectedAsset, setSelectedAsset] = useState<ManualAsset | null>(null);
  const addAssetRef = useRef<GorhomBottomSheetModal>(null);

  const filtered = useMemo(
    () => (filter === 'all' ? manualAssets : manualAssets.filter((a) => a.category === filter)),
    [manualAssets, filter],
  );

  const totalValue = useMemo(
    () => filtered.reduce((sum, a) => sum + a.value, 0),
    [filtered],
  );

  const handleEdit = useCallback((asset: ManualAsset) => {
    hapticLight();
    setSelectedAsset(asset);
    addAssetRef.current?.present();
  }, []);

  const handleAdd = useCallback(() => {
    hapticLight();
    setSelectedAsset(null);
    addAssetRef.current?.present();
  }, []);

  const headerLeft = useCallback(() => null, []);
  const headerRight = useCallback(() => (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      className="mr-2"
      accessibilityRole="button"
      accessibilityLabel="Close screen"
    >
      <Icon name="close" size={24} color={colors.text} />
    </Pressable>
  ), [colors.text, router]);
  const headerTitleStyle = useMemo(() => ({ fontFamily: 'Inter-SemiBold' as const, fontSize: 17 }), []);
  const headerStyle = useMemo(() => ({ backgroundColor: colors.background }), [colors.background]);
  const screenOptions = useMemo(() => ({
    headerShown: true,
    title: 'Assets',
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

      {/* Summary */}
      <StaggeredFadeIn index={1}>
        <Card className="mb-4">
          <Text variant="caption" className="text-neutral-500">Total Asset Value</Text>
          <Text variant="h2">{amt(totalValue)}</Text>
          <Text variant="caption" className="mt-1 text-neutral-400">
            {filtered.length} asset{filtered.length !== 1 ? 's' : ''}
          </Text>
        </Card>
      </StaggeredFadeIn>

      {/* Filters */}
      <StaggeredFadeIn index={2}>
        <View className="mb-4 flex-row gap-2">
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => { hapticLight(); setFilter(f.key); }}
              className={`rounded-full px-4 py-2 border ${
                filter === f.key
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-neutral-200 dark:border-neutral-700'
              }`}
              accessibilityRole="tab"
              accessibilityState={{ selected: filter === f.key }}
              accessibilityLabel={`Filter by ${f.label}`}
            >
              <Text
                variant="caption"
                className={`font-sans-semibold ${filter === f.key ? 'text-white' : ''}`}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </StaggeredFadeIn>

      {/* Add Button */}
      <StaggeredFadeIn index={3}>
        <Button
          variant="outline"
          onPress={handleAdd}
          className="mb-4"
          leftIcon={<Icon name="add" size={18} color={colors.primary} />}
        >
          Add Asset
        </Button>
      </StaggeredFadeIn>

      {/* Asset List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title="No assets yet"
          description="Add your properties, vehicles, jewelry and other assets to track your net worth."
          actionLabel="Add Asset"
          onAction={handleAdd}
        />
      ) : (
        <StaggeredFadeIn index={4}>
          <Card className="mb-3 px-0">
            <Text variant="label" className="mb-2 px-4">
              Assets ({filtered.length})
            </Text>
            {filtered.map((asset, idx) => {
              const iconName = ASSET_ICONS[asset.category] ?? 'cube-outline';
              return (
                <View key={asset.id}>
                  {idx > 0 && <Divider className="mx-4" />}
                  <ListItem
                    title={asset.name}
                    subtitle={ASSET_CATEGORY_LABELS[asset.category] ?? asset.category}
                    leftIcon={
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <Icon name={iconName as IconName} size={20} color={colors.warning} />
                      </View>
                    }
                    rightValue={amt(asset.value)}
                    showChevron
                    onPress={() => handleEdit(asset)}
                  />
                </View>
              );
            })}
          </Card>
        </StaggeredFadeIn>
      )}

      <AddManualAssetSheet
        sheetRef={addAssetRef}
        editItem={selectedAsset}
        onDismiss={() => setSelectedAsset(null)}
      />
    </ScreenContainer>
    </>
  );
}
