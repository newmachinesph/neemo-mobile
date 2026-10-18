import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { Divider } from '@ui/components/Divider';
import { useTheme } from '@theme/ThemeProvider';
import { BillRow } from './BillRow';
import { BillCalendar } from './BillCalendar';
import type { RecurringBill } from '../types/finance.types';

interface UpcomingBillsSectionProps {
  bills: RecurringBill[];
  onBillPress?: (bill: RecurringBill) => void;
}

export function UpcomingBillsSection({ bills, onBillPress }: UpcomingBillsSectionProps) {
  const { colors } = useTheme();
  const [showCalendar, setShowCalendar] = useState(false);

  const now = new Date();
  const today = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter: active bills due within next 7 days (or overdue this month)
  const upcoming = bills
    .filter((b) => {
      if (!b.isActive) return false;
      // Already paid this month?
      if (b.lastPaidDate) {
        const paid = new Date(b.lastPaidDate);
        if (paid.getMonth() === currentMonth && paid.getFullYear() === currentYear) return false;
      }
      // Recently overdue (up to 3 days) or due within next 7 days
      return b.dueDay >= today - 3 && b.dueDay <= today + 7;
    })
    .sort((a, b) => a.dueDay - b.dueDay);

  if (upcoming.length === 0 && !showCalendar) return null;

  return (
    <>
      <Card className="mb-4">
        <View className="flex-row items-center justify-between">
          <Text variant="label">Upcoming Bills</Text>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => setShowCalendar(!showCalendar)} accessibilityRole="button" accessibilityLabel={showCalendar ? 'Show list view' : 'Show calendar view'} hitSlop={8}>
              <Icon
                name={showCalendar ? 'list-outline' : 'calendar-outline'}
                size={18}
                color={colors.primary}
              />
            </Pressable>
            <Text variant="caption">{upcoming.length} due soon</Text>
          </View>
        </View>
        {!showCalendar && (
          <View className="mt-2">
            {upcoming.map((bill, idx) => (
              <View key={bill.id}>
                {idx > 0 && <Divider className="mx-0" />}
                <BillRow bill={bill} onPress={onBillPress ? () => onBillPress(bill) : undefined} />
              </View>
            ))}
          </View>
        )}
      </Card>

      {showCalendar && <BillCalendar bills={bills} />}
    </>
  );
}
