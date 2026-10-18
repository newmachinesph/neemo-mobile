import { memo } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@ui/components/Text';
import { Icon, type IconProps } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { palette } from '@theme/colors';
import type { AppNotification } from '../types/finance.types';

const TYPE_ICONS: Record<AppNotification['type'], IconProps['name']> = {
  bill: 'receipt-outline',
  budget: 'pie-chart-outline',
  subscription: 'card-outline',
  system: 'information-circle-outline',
};

const TYPE_COLORS: Record<AppNotification['type'], string> = {
  bill: '#EF4444',
  budget: '#F59E0B',
  subscription: '#3B82F6',
  system: palette.primary[600],
};

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

interface NotificationRowProps {
  notification: AppNotification;
  onPress?: () => void;
  onDelete?: () => void;
}

export const NotificationRow = memo(function NotificationRow({ notification, onPress, onDelete }: NotificationRowProps) {
  const { colors } = useTheme();
  const color = TYPE_COLORS[notification.type];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Notification: ${notification.title}. ${notification.body}${!notification.isRead ? ', unread' : ''}`}
      className={`flex-row items-start px-4 py-3 ${!notification.isRead ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
      style={{ gap: 12 }}
    >
      <View
        className="mt-0.5 h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon name={TYPE_ICONS[notification.type]} size={18} color={color} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            variant="body"
            className={`flex-1 ${!notification.isRead ? 'font-sans-semibold' : ''}`}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            {!notification.isRead && (
              <View className="h-2 w-2 rounded-full bg-primary-500" />
            )}
            {onDelete && (
              <Pressable onPress={onDelete} hitSlop={6} accessibilityRole="button" accessibilityLabel="Delete notification">
                <Icon name="trash-outline" size={16} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>
        <Text variant="caption" className="text-neutral-500 mt-0.5" numberOfLines={2}>
          {notification.body}
        </Text>
        <Text variant="caption" className="text-neutral-400 mt-1" style={{ fontSize: 11 }}>
          {timeAgo(notification.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
});
