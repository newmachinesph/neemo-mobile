import { useCallback, useMemo, useState } from 'react';
import { View, FlatList, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { EmptyState } from '@ui/components/EmptyState';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { hapticLight, hapticSuccess } from '@lib/utils/haptics';
import { useFinanceStore } from '@/src/features/finance';
import { useTheme } from '@theme/ThemeProvider';
import { NotificationRow } from '@/src/features/finance/components/NotificationRow';
import type { AppNotification } from '@/src/features/finance/types/finance.types';

type FilterType = 'all' | AppNotification['type'];

const FILTERS: { key: FilterType; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: '#b91c4a' },
  { key: 'bill', label: 'Bills', color: '#EF4444' },
  { key: 'budget', label: 'Budgets', color: '#F59E0B' },
  { key: 'subscription', label: 'Subs', color: '#3B82F6' },
  { key: 'system', label: 'Other', color: '#8B5CF6' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const notifications = useFinanceStore((s) => s.appNotifications);
  const markNotificationRead = useFinanceStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useFinanceStore((s) => s.markAllNotificationsRead);
  const deleteAppNotification = useFinanceStore((s) => s.deleteAppNotification);
  const clearAppNotifications = useFinanceStore((s) => s.clearAppNotifications);

  // Filter + sort newest first
  const filteredNotifications = useMemo(() => {
    const filtered =
      activeFilter === 'all'
        ? notifications
        : notifications.filter((n) => n.type === activeFilter);

    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handlePress = useCallback(
    (notif: AppNotification) => {
      hapticLight();
      if (!notif.isRead) markNotificationRead(notif.id);
    },
    [markNotificationRead],
  );

  const handleDelete = useCallback(
    (id: string) => {
      hapticLight();
      deleteAppNotification(id);
    },
    [deleteAppNotification],
  );

  return (
    <ScreenContainer edges={['top', 'left', 'right']} scrollable={false}>
      {/* Header */}
      <StaggeredFadeIn index={0}>
        <View className="mb-3 mt-2 flex-row items-center justify-between">
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Icon name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <Text variant="h2">Notifications</Text>
          </View>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            {unreadCount > 0 && (
              <Pressable
                onPress={() => { hapticSuccess(); markAllNotificationsRead(); }}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Mark all as read"
              >
                <Icon name="checkmark-done-outline" size={22} color={colors.textTertiary} />
              </Pressable>
            )}
            {notifications.length > 0 && (
              <Pressable
                onPress={() => {
                  hapticLight();
                  Alert.alert(
                    'Clear All',
                    'Delete all notifications? This cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear All', style: 'destructive', onPress: () => clearAppNotifications() },
                    ]
                  );
                }}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Clear all notifications"
              >
                <Icon name="trash-outline" size={20} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>
      </StaggeredFadeIn>

      {/* Filter Tabs */}
      <StaggeredFadeIn index={1}>
        <View className="-mx-4 mb-2 flex-row px-4" style={{ gap: 6 }}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;
            const count = filter.key === 'all'
              ? notifications.length
              : notifications.filter((n) => n.type === filter.key).length;
            return (
              <Pressable
                key={filter.key}
                onPress={() => { hapticLight(); setActiveFilter(filter.key); }}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`${filter.label} notifications tab`}
                className="flex-row items-center rounded-full px-2.5"
                style={{
                  height: 28,
                  backgroundColor: isActive
                    ? filter.color
                    : colors.surfaceTertiary,
                  gap: 4,
                }}
              >
                <Text
                  variant="caption"
                  style={{
                    color: isActive ? '#FFFFFF' : colors.textTertiary,
                    fontSize: 11,
                  }}
                >
                  {filter.label}
                </Text>
                {count > 0 && (
                  <Text
                    variant="caption"
                    className="font-sans-semibold"
                    style={{
                      fontSize: 10,
                      color: isActive ? 'rgba(255,255,255,0.7)' : filter.color,
                    }}
                  >
                    {count}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </StaggeredFadeIn>

      <StaggeredFadeIn index={2}>
        <FlatList<AppNotification>
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          className="-mx-4"
          contentContainerClassName="pb-8"
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onPress={() => handlePress(item)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title={
                activeFilter === 'all'
                  ? 'No notifications yet'
                  : `No ${activeFilter === 'subscription' ? 'subscription' : FILTERS.find((f) => f.key === activeFilter)?.label.toLowerCase()} notifications`
              }
              description="You'll see bill reminders, budget alerts, and subscription renewals here"
            />
          }
        />
      </StaggeredFadeIn>
    </ScreenContainer>
  );
}
