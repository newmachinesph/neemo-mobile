import { memo } from 'react';
import { View, Switch, Pressable } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '../store/finance.store';
import type { Subscription } from '../types/finance.types';

interface SubscriptionRowProps {
  subscription: Subscription;
  onPress?: () => void;
}

export const SubscriptionRow = memo(function SubscriptionRow({ subscription, onPress }: SubscriptionRowProps) {
  const { colors } = useTheme();
  const updateSubscription = useFinanceStore((s) => s.updateSubscription);
  const hideBalances = useFinanceStore((s) => s.hideBalances);

  return (
    <Card pressable={!!onPress} onPress={onPress} className="mb-2">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-100">
          <Icon name="card-outline" size={20} color={colors.warning} />
        </View>
        <View className="flex-1">
          <Text variant="body" className="font-sans-semibold">{subscription.name}</Text>
          <Text variant="caption" className="text-neutral-500">
            Renews day {subscription.renewalDay} · {subscription.frequency}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => updateSubscription(subscription.id, { flaggedForReview: !subscription.flaggedForReview })}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={subscription.flaggedForReview ? 'Unflag subscription for review' : 'Flag subscription for review'}
          >
            <Icon
              name={subscription.flaggedForReview ? 'flag' : 'flag-outline'}
              size={18}
              color={subscription.flaggedForReview ? colors.warning : colors.textTertiary}
            />
          </Pressable>
          <View className="items-end">
            <Text variant="body" className="font-sans-bold">
              {hideBalances ? maskedCurrency() : formatCurrency(subscription.amount)}
            </Text>
            <Switch
              value={subscription.isActive}
              onValueChange={(val) => updateSubscription(subscription.id, { isActive: val })}
              trackColor={{ false: colors.border, true: `${colors.primary}40` }}
              thumbColor={subscription.isActive ? colors.primary : colors.textTertiary}
              style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
            />
          </View>
        </View>
      </View>
    </Card>
  );
});
