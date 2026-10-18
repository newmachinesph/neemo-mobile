import { View } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { Badge } from '@ui/components/Badge';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '../store/finance.store';
import type { Paluwagan } from '../types/finance.types';

interface PaluwaganCardProps {
  paluwagan: Paluwagan;
  onPress?: () => void;
}

export function PaluwaganCard({ paluwagan, onPress }: PaluwaganCardProps) {
  const { colors } = useTheme();
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const paidCount = paluwagan.members.filter((m) => m.hasPaidCurrentRound).length;
  const totalMembers = paluwagan.members.length;

  return (
    <Card pressable={!!onPress} onPress={onPress} className="mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-3 flex-1">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-100">
            <Icon name="people-outline" size={20} color="#F97316" />
          </View>
          <View className="flex-1">
            <Text variant="body" className="font-sans-semibold">{paluwagan.groupName}</Text>
            <Text variant="caption" className="text-neutral-500">
              {hideBalances ? maskedCurrency() : formatCurrency(paluwagan.contributionAmount)} / {paluwagan.frequency}
            </Text>
          </View>
        </View>
        <Badge variant="warning">{`Round ${paluwagan.currentRound}/${paluwagan.totalRounds}`}</Badge>
      </View>

      {/* Member Grid */}
      <View className="flex-row flex-wrap gap-2 mt-1">
        {paluwagan.members.map((member) => (
          <View
            key={member.name}
            className="items-center rounded-lg px-2 py-1 border"
            style={{
              borderColor: member.hasPaidCurrentRound ? '#22C55E' : '#E5E7EB',
              backgroundColor: member.hasReceived ? '#DBEAFE' : member.hasPaidCurrentRound ? '#F0FDF4' : '#F9FAFB',
            }}
          >
            <Text variant="caption" className="font-sans-semibold" style={{ fontSize: 11 }}>
              {member.name}
            </Text>
            <Text variant="caption" style={{ fontSize: 9, color: colors.textTertiary }}>
              {member.hasReceived ? 'Received' : member.hasPaidCurrentRound ? 'Paid' : 'Pending'}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-2 border-t border-neutral-100 pt-2 dark:border-neutral-800">
        <Text variant="caption" className="text-neutral-400">
          {paidCount}/{totalMembers} paid this round
        </Text>
      </View>
    </Card>
  );
}
