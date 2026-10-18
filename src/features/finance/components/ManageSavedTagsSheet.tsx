import { View, Pressable, Alert } from 'react-native';
import { BottomSheetModal } from '@ui/components/BottomSheetModal';
import type { BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { ListItem } from '@ui/components/ListItem';
import { Divider } from '@ui/components/Divider';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '../store/finance.store';

interface ManageSavedTagsSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
}

export function ManageSavedTagsSheet({ sheetRef }: ManageSavedTagsSheetProps) {
  const { colors } = useTheme();
  const savedTags = useFinanceStore((s) => s.savedTags);
  const deleteSavedTag = useFinanceStore((s) => s.deleteSavedTag);

  const sortedTags = [...savedTags].sort((a, b) => b.useCount - a.useCount);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['70%']}>
      <Text variant="h3" className="mb-4">
        Saved Tags ({savedTags.length})
      </Text>

      {sortedTags.length === 0 && (
        <Text variant="caption" className="text-center text-neutral-500 mt-8">
          Tags are saved automatically when you add them to transactions.
        </Text>
      )}

      {sortedTags.map((tag, idx) => (
        <View key={tag.id}>
          {idx > 0 && <Divider />}
          <ListItem
            title={`#${tag.name}`}
            subtitle={`Used ${tag.useCount} time${tag.useCount !== 1 ? 's' : ''}`}
            leftIcon={<Icon name="pricetag-outline" size={18} color={colors.primary} />}
            rightElement={
              <Pressable
                onPress={() => {
                  Alert.alert('Delete Tag', `Remove "#${tag.name}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteSavedTag(tag.id) },
                  ]);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Delete tag ${tag.name}`}
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
