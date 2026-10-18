import { View } from 'react-native';
import { ListItem } from '@ui/components/ListItem';
import { Icon, type IconName } from '@ui/components/Icon';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { ASSET_CATEGORY_LABELS } from '@lib/constants/finance';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '../store/finance.store';
import type { ManualAsset } from '../types/finance.types';

const ASSET_ICONS: Record<string, string> = {
  property: 'home-outline',
  vehicle: 'car-outline',
  jewelry: 'diamond-outline',
  other: 'cube-outline',
};

interface ManualAssetRowProps {
  asset: ManualAsset;
  onPress?: () => void;
}

export function ManualAssetRow({ asset, onPress }: ManualAssetRowProps) {
  const { colors } = useTheme();
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const iconName = ASSET_ICONS[asset.category] ?? 'cube-outline';

  return (
    <ListItem
      title={asset.name}
      subtitle={ASSET_CATEGORY_LABELS[asset.category] ?? asset.category}
      leftIcon={
        <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Icon name={iconName as IconName} size={20} color={colors.warning} />
        </View>
      }
      rightValue={hideBalances ? maskedCurrency() : formatCurrency(asset.value)}
      showChevron
      onPress={onPress}
      className="px-2"
    />
  );
}
