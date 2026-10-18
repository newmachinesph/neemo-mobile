import { useState, useRef, useMemo, useCallback } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { BottomSheetModal } from '@ui/components/BottomSheetModal';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { EmptyState } from '@ui/components/EmptyState';
import { useTheme } from '@theme/ThemeProvider';
import { hapticLight, hapticSuccess } from '@lib/utils/haptics';

export interface PlannerItem {
  id: string;
  label: string;
  amount: number;
  status?: string;
  icon?: string;
  color?: string;
}

interface PlannerScreenLayoutProps {
  title: string;
  subtitle?: string;
  summaryCard?: React.ReactNode;
  items: PlannerItem[];
  formatAmount: (n: number) => string;
  emptyMessage?: string;
  onAddItem?: (item: { label: string; amount: number }) => void;
  addItemLabel?: string;
  /** Status options the user can cycle through. If provided, tapping status cycles it. */
  statusOptions?: string[];
  onUpdateStatus?: (id: string, newStatus: string) => void;
  onDeleteItem?: (id: string) => void;
}

export function PlannerScreenLayout({
  title,
  subtitle,
  summaryCard,
  items,
  formatAmount,
  emptyMessage = 'No items yet.',
  onAddItem,
  addItemLabel = 'Add Item',
  statusOptions,
  onUpdateStatus,
  onDeleteItem,
}: PlannerScreenLayoutProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const sheetRef = useRef<GorhomBottomSheetModal>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const handleSubmit = () => {
    const label = newLabel.trim();
    const amount = parseFloat(newAmount) || 0;
    if (!label || amount <= 0) return;
    onAddItem?.({ label, amount });
    hapticSuccess();
    setNewLabel('');
    setNewAmount('');
    sheetRef.current?.dismiss();
  };

  const handleStatusCycle = (item: PlannerItem) => {
    if (!statusOptions || !onUpdateStatus || !item.status) return;
    const idx = statusOptions.indexOf(item.status);
    const next = statusOptions[(idx + 1) % statusOptions.length]!;
    hapticLight();
    onUpdateStatus(item.id, next);
  };

  const handleDelete = (item: PlannerItem) => {
    if (!onDeleteItem) return;
    Alert.alert('Delete', `Remove "${item.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDeleteItem(item.id) },
    ]);
  };

  const statusColor = useCallback((status?: string) => {
    switch (status) {
      case 'Given': case 'Received': case 'Done': case 'Prepared': return colors.success;
      case 'Bought': case 'Shipped': case 'Saving': return colors.warning;
      case 'Planned': case 'Upcoming': case 'Packing': case 'To Buy': return colors.textTertiary;
      default: return colors.textTertiary;
    }
  }, [colors.success, colors.warning]);

  // Memoize header options to prevent infinite re-render loop from
  // Stack.Screen calling setOptions on every render with a new object
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
    title,
    headerTitleStyle,
    headerLeft,
    headerRight,
    headerShadowVisible: false,
    headerStyle,
    headerTintColor: colors.text,
  }), [title, headerTitleStyle, headerLeft, headerRight, headerStyle, colors.text]);

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <ScreenContainer edges={['bottom', 'left', 'right']}>
        {subtitle && (
          <Text variant="caption" className="mb-3" style={{ color: colors.textTertiary }}>
            {subtitle}
          </Text>
        )}

        {summaryCard}

        {items.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="Nothing here yet"
            description={emptyMessage}
          />
        ) : (
          <View style={{ gap: 8 }}>
            {items.map((item, i) => (
              <StaggeredFadeIn key={item.id} index={i}>
                <Card className="flex-row items-center gap-3">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${item.color || colors.info}18` }}
                  >
                    <Icon
                      name={(item.icon || 'cash-outline') as React.ComponentProps<typeof Icon>['name']}
                      size={20}
                      color={item.color || colors.info}
                    />
                  </View>
                  <View className="flex-1">
                    <Text variant="body" className="font-sans-medium">{item.label}</Text>
                    {item.status && statusOptions && onUpdateStatus ? (
                      <Pressable
                        onPress={() => handleStatusCycle(item)}
                        hitSlop={4}
                        className="mt-0.5 flex-row items-center self-start rounded-full px-2 py-0.5"
                        style={{ backgroundColor: `${statusColor(item.status)}18` }}
                        accessibilityRole="button"
                        accessibilityLabel={`Status: ${item.status}. Tap to change`}
                      >
                        <View
                          className="mr-1 h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: statusColor(item.status) }}
                        />
                        <Text variant="caption" style={{ color: statusColor(item.status), fontSize: 10 }}>
                          {item.status}
                        </Text>
                      </Pressable>
                    ) : item.status ? (
                      <Text variant="caption" style={{ color: colors.textTertiary, fontSize: 11 }}>
                        {item.status}
                      </Text>
                    ) : null}
                  </View>
                  <Text variant="body" className="font-sans-semibold">
                    {formatAmount(item.amount)}
                  </Text>
                  {onDeleteItem && (
                    <Pressable
                      onPress={() => handleDelete(item)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${item.label}`}
                    >
                      <Icon name="trash-outline" size={16} color={colors.danger} />
                    </Pressable>
                  )}
                </Card>
              </StaggeredFadeIn>
            ))}
          </View>
        )}

        {/* Add Button */}
        <Pressable
          onPress={() => { hapticLight(); sheetRef.current?.present(); }}
          className="mt-4 flex-row items-center justify-center rounded-2xl bg-primary-600 py-3"
          accessibilityRole="button"
          accessibilityLabel={addItemLabel}
        >
          <Icon name="add-outline" size={20} color="#FFFFFF" />
          <Text variant="body" className="ml-1 font-sans-semibold" style={{ color: '#FFFFFF' }}>
            {addItemLabel}
          </Text>
        </Pressable>
      </ScreenContainer>

      {/* Add Item Sheet */}
      <BottomSheetModal sheetRef={sheetRef} snapPoints={['45%']}>
        <View>
          <Text variant="h3" className="mb-4">{addItemLabel}</Text>
          <Input
            label="Name"
            placeholder="e.g. Gift for Mama"
            value={newLabel}
            onChangeText={setNewLabel}
            className="mb-3"
          />
          <Input
            label="Amount (₱)"
            placeholder="e.g. 500"
            value={newAmount}
            onChangeText={setNewAmount}
            keyboardType="numeric"
            className="mb-4"
          />
          <Button onPress={handleSubmit} disabled={!newLabel.trim() || !newAmount.trim()}>
            Save
          </Button>
        </View>
      </BottomSheetModal>
    </>
  );
}
