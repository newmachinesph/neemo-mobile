import { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { Button } from '@ui/components/Button';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '../store/finance.store';
import type { Paluwagan, PaluwaganMember } from '../types/finance.types';

interface PaluwaganDetailSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  paluwagan: Paluwagan | null;
  onDismiss?: () => void;
}

export function PaluwaganDetailSheet({ sheetRef, paluwagan, onDismiss }: PaluwaganDetailSheetProps) {
  const updatePaluwagan = useFinanceStore((s) => s.updatePaluwagan);
  const { colors } = useTheme();
  const hideBalances = useFinanceStore((s) => s.hideBalances);

  const togglePaid = useCallback(
    (memberIndex: number) => {
      if (!paluwagan) return;
      const members = paluwagan.members.map((m, i) =>
        i === memberIndex ? { ...m, hasPaidCurrentRound: !m.hasPaidCurrentRound } : m,
      );
      updatePaluwagan(paluwagan.id, { ...paluwagan, members });
    },
    [paluwagan, updatePaluwagan],
  );

  const toggleReceived = useCallback(
    (memberIndex: number) => {
      if (!paluwagan) return;
      const members = paluwagan.members.map((m, i) =>
        i === memberIndex ? { ...m, hasReceived: !m.hasReceived } : m,
      );
      updatePaluwagan(paluwagan.id, { ...paluwagan, members });
    },
    [paluwagan, updatePaluwagan],
  );

  if (!paluwagan) return null;

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['70%']} onDismiss={onDismiss}>
      <Text variant="h3" className="mb-1">{paluwagan.groupName}</Text>
      <Text variant="caption" className="mb-4 text-neutral-500">
        Round {paluwagan.currentRound} of {paluwagan.totalRounds} · {hideBalances ? maskedCurrency() : formatCurrency(paluwagan.contributionAmount)}/{paluwagan.frequency}
      </Text>

      {paluwagan.members.map((member, idx) => (
        <View
          key={member.name}
          className="flex-row items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800"
        >
          <View className="flex-row items-center gap-3 flex-1">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <Text variant="caption" className="font-sans-bold">{member.turnOrder}</Text>
            </View>
            <View>
              <Text variant="body" className="font-sans-semibold">{member.name}</Text>
              <Text variant="caption" className="text-neutral-400">Turn #{member.turnOrder}</Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => togglePaid(idx)}
              accessibilityRole="button"
              accessibilityLabel={member.hasPaidCurrentRound ? `Mark ${member.name} unpaid` : `Mark ${member.name} paid`}
              className={`rounded-lg px-3 py-1.5 ${
                member.hasPaidCurrentRound ? 'bg-green-100' : 'bg-neutral-100 dark:bg-neutral-800'
              }`}
            >
              <Text variant="caption" className="font-sans-semibold" style={{ color: member.hasPaidCurrentRound ? colors.success : colors.textTertiary, fontSize: 11 }}>
                {member.hasPaidCurrentRound ? 'Paid' : 'Unpaid'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => toggleReceived(idx)}
              accessibilityRole="button"
              accessibilityLabel={member.hasReceived ? `Mark ${member.name} not received` : `Mark ${member.name} received`}
              className={`rounded-lg px-3 py-1.5 ${
                member.hasReceived ? 'bg-blue-100' : 'bg-neutral-100 dark:bg-neutral-800'
              }`}
            >
              <Text variant="caption" className="font-sans-semibold" style={{ color: member.hasReceived ? colors.info : colors.textTertiary, fontSize: 11 }}>
                {member.hasReceived ? 'Received' : 'Not Yet'}
              </Text>
            </Pressable>
          </View>
        </View>
      ))}
    </BottomSheetModal>
  );
}
