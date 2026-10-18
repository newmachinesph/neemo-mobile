import { View, Pressable, Alert } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { Badge } from '@ui/components/Badge';
import { ProgressBar } from '@ui/components/ProgressBar';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '../store/finance.store';
import type { WishlistItem } from '../types/finance.types';

const PRIORITY_COLORS = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#3B82F6',
} as const;

interface WishlistCardProps {
  item: WishlistItem;
  onEdit?: () => void;
}

export function WishlistCard({ item, onEdit }: WishlistCardProps) {
  const { colors } = useTheme();
  const markPurchased = useFinanceStore((s) => s.markWishlistPurchased);
  const deleteItem = useFinanceStore((s) => s.deleteWishlistItem);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);
  const progress = item.targetAmount > 0 ? item.currentAmount / item.targetAmount : 0;

  const handleMarkPurchased = () => {
    Alert.alert('Mark as Purchased?', `Did you buy "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: () => markPurchased(item.id) },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Item', `Remove "${item.name}" from wishlist?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteItem(item.id) },
    ]);
  };

  return (
    <Card className="mb-3">
      <View className="flex-row items-start">
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${PRIORITY_COLORS[item.priority]}15` }}
        >
          <Icon name="heart-outline" size={20} color={PRIORITY_COLORS[item.priority]} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text variant="body" className="flex-1 font-sans-semibold" numberOfLines={1}>
              {item.name}
            </Text>
            <Badge
              variant={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'info'}
            >
              {item.priority}
            </Badge>
          </View>
          <Text variant="caption" className="mt-0.5">
            {amt(item.targetAmount)}
          </Text>
        </View>
      </View>

      {item.currentAmount > 0 && !item.isPurchased && (
        <View className="mt-2">
          <ProgressBar progress={progress} height="sm" color="primary" />
          <Text variant="caption" className="mt-1 text-neutral-500" style={{ fontSize: 11 }}>
            {amt(item.currentAmount)} saved ({Math.round(progress * 100)}%)
          </Text>
        </View>
      )}

      {item.isPurchased && item.purchasedDate && (
        <Text variant="caption" className="mt-2" style={{ color: colors.success }}>
          Purchased {new Date(item.purchasedDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      )}

      {item.notes && (
        <Text variant="caption" className="mt-1 text-neutral-400" numberOfLines={1}>
          {item.notes}
        </Text>
      )}

      {!item.isPurchased && (
        <View className="mt-3 flex-row gap-2">
          {onEdit && (
            <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel="Edit wishlist item" className="flex-1 flex-row items-center justify-center rounded-lg border border-neutral-200 py-2 dark:border-neutral-700">
              <Icon name="create-outline" size={16} color={colors.textTertiary} />
              <Text variant="caption" className="ml-1 font-sans-medium">Edit</Text>
            </Pressable>
          )}
          <Pressable onPress={handleMarkPurchased} accessibilityRole="button" accessibilityLabel="Mark as purchased" className="flex-1 flex-row items-center justify-center rounded-lg py-2" style={{ backgroundColor: colors.primary }}>
            <Icon name="checkmark-outline" size={16} color="#FFFFFF" />
            <Text variant="caption" className="ml-1 font-sans-medium" style={{ color: '#FFFFFF' }}>Bought</Text>
          </Pressable>
          <Pressable onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Delete wishlist item" className="flex-row items-center justify-center rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700" hitSlop={4}>
            <Icon name="trash-outline" size={16} color={colors.danger} />
          </Pressable>
        </View>
      )}
    </Card>
  );
}
