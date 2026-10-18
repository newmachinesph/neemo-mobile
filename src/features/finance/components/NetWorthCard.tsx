import { useState, useRef, useCallback } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceSummary } from '../hooks/useFinanceSummary';
import { useFinanceStore } from '../store/finance.store';
import { NetWorthChart } from './NetWorthChart';
import { ManualAssetRow } from './ManualAssetRow';
import { AddManualAssetSheet } from './AddManualAssetSheet';
import type { ManualAsset } from '../types/finance.types';

interface NetWorthCardProps {
  todaySpending?: { total: number; count: number };
}

export function NetWorthCard({ todaySpending }: NetWorthCardProps) {
  const { colors } = useTheme();
  const { totalBalance, totalIncome, totalExpenses } = useFinanceSummary();
  const manualAssets = useFinanceStore((s) => s.manualAssets);
  const takeNetWorthSnapshot = useFinanceStore((s) => s.takeNetWorthSnapshot);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);

  const [showHistory, setShowHistory] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<ManualAsset | null>(null);
  const addAssetRef = useRef<GorhomBottomSheetModal | null>(null);

  const totalManualAssets = manualAssets.reduce((sum, a) => sum + a.value, 0);

  const handleAssetPress = useCallback((asset: ManualAsset) => {
    setSelectedAsset(asset);
    addAssetRef.current?.present();
  }, []);

  return (
    <>
      <Card className="mb-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text variant="caption">Net Worth</Text>
          <Pressable onPress={() => setShowHistory(!showHistory)} hitSlop={8} accessibilityRole="button" accessibilityLabel={showHistory ? 'Hide net worth history' : 'Show net worth history'}>
            <Icon name={showHistory ? 'chevron-up' : 'analytics-outline'} size={18} color={colors.primary} />
          </Pressable>
        </View>
        <Text variant="h1">{amt(totalBalance + totalManualAssets)}</Text>
        <View className="mt-3 flex-row gap-4">
          <View className="flex-1 flex-row items-center">
            <Icon name="arrow-up-circle" size={18} color={colors.success} />
            <Text variant="caption" className="ml-1 font-sans-medium" style={{ color: colors.success }}>
              {amt(totalIncome)}
            </Text>
          </View>
          <View className="flex-1 flex-row items-center">
            <Icon name="arrow-down-circle" size={18} color={colors.danger} />
            <Text variant="caption" className="ml-1 text-danger font-sans-medium">
              {amt(totalExpenses)}
            </Text>
          </View>
        </View>
        {/* Today's Spending */}
        {todaySpending && todaySpending.count > 0 && (
          <View className="mt-3 border-t border-neutral-100 pt-3 flex-row items-center dark:border-neutral-800">
            <Icon name="cart-outline" size={16} color={colors.primary} />
            <Text variant="caption" className="ml-2 flex-1">Today</Text>
            <Text variant="label" style={{ color: colors.primary }}>
              {amt(todaySpending.total)}
            </Text>
            <Text variant="caption" className="ml-2">
              {todaySpending.count} txn{todaySpending.count !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Manual Assets summary */}
        {manualAssets.length > 0 && (
          <View className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <View className="flex-row items-center justify-between mb-2">
              <Text variant="caption" className="text-neutral-500">Manual Assets</Text>
              <Text variant="caption" className="font-sans-semibold">{amt(totalManualAssets)}</Text>
            </View>
            <View className="-mx-4">
              {manualAssets.slice(0, 3).map((asset) => (
                <ManualAssetRow key={asset.id} asset={asset} onPress={() => handleAssetPress(asset)} />
              ))}
            </View>
          </View>
        )}

        {/* Add asset / Take snapshot buttons */}
        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={() => {
              setSelectedAsset(null);
              addAssetRef.current?.present();
            }}
            accessibilityRole="button"
            accessibilityLabel="Add manual asset"
            className="flex-1 flex-row items-center justify-center rounded-xl border border-neutral-200 py-2 dark:border-neutral-700"
          >
            <Icon name="add-outline" size={16} color={colors.primary} />
            <Text variant="caption" className="font-sans-medium ml-1" style={{ color: colors.primary }}>Add Asset</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              takeNetWorthSnapshot();
              Alert.alert('Snapshot Saved', 'Your net worth snapshot has been recorded.');
            }}
            accessibilityRole="button"
            accessibilityLabel="Take net worth snapshot"
            className="flex-1 flex-row items-center justify-center rounded-xl border border-neutral-200 py-2 dark:border-neutral-700"
          >
            <Icon name="camera-outline" size={16} color={colors.primary} />
            <Text variant="caption" className="font-sans-medium ml-1" style={{ color: colors.primary }}>Snapshot</Text>
          </Pressable>
        </View>
      </Card>

      {/* Net Worth History chart */}
      {showHistory && <NetWorthChart />}

      <AddManualAssetSheet
        sheetRef={addAssetRef}
        editItem={selectedAsset}
        onDismiss={() => setSelectedAsset(null)}
      />
    </>
  );
}
