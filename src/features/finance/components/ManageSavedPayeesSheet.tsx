import { View, Pressable, Alert } from 'react-native';
import { BottomSheetModal } from '@ui/components/BottomSheetModal';
import type { BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { ListItem } from '@ui/components/ListItem';
import { Divider } from '@ui/components/Divider';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '../store/finance.store';

interface ManageSavedPayeesSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
}

export function ManageSavedPayeesSheet({ sheetRef }: ManageSavedPayeesSheetProps) {
  const { colors } = useTheme();
  const savedPayees = useFinanceStore((s) => s.savedPayees);
  const updateSavedPayee = useFinanceStore((s) => s.updateSavedPayee);
  const deleteSavedPayee = useFinanceStore((s) => s.deleteSavedPayee);

  const sortedPayees = [...savedPayees].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return b.useCount - a.useCount;
  });

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['80%']}>
      <Text variant="h3" className="mb-4">
        Saved Payees ({savedPayees.length})
      </Text>

      {sortedPayees.length === 0 && (
        <Text variant="caption" className="text-center text-neutral-500 mt-8">
          Payees are saved automatically when you add transactions.
        </Text>
      )}

      {sortedPayees.map((payee, idx) => (
        <View key={payee.id}>
          {idx > 0 && <Divider />}
          <ListItem
            title={payee.name}
            subtitle={`Used ${payee.useCount} time${payee.useCount !== 1 ? 's' : ''}`}
            leftIcon={
              <Pressable onPress={() => updateSavedPayee(payee.id, { isFavorite: !payee.isFavorite })} accessibilityRole="button" accessibilityLabel={payee.isFavorite ? `Unfavorite ${payee.name}` : `Favorite ${payee.name}`} hitSlop={8}>
                <Icon name={payee.isFavorite ? 'star' : 'star-outline'} size={20} color={colors.warning} />
              </Pressable>
            }
            rightElement={
              <Pressable
                onPress={() => {
                  Alert.alert('Delete Payee', `Remove "${payee.name}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteSavedPayee(payee.id) },
                  ]);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Delete payee ${payee.name}`}
                hitSlop={8}
              >
                <Icon name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            }
            showChevron={false}
          />
        </View>
      ))}
    </BottomSheetModal>
  );
}
