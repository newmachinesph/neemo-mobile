import { useMemo } from 'react';
import { View } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '../store/finance.store';
import type { RecurringBill } from '../types/finance.types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface BillCalendarProps {
  bills: RecurringBill[];
  year?: number;
  month?: number; // 0-indexed
}

export function BillCalendar({ bills, year, month }: BillCalendarProps) {
  const { colors } = useTheme();
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const now = new Date();
  const calYear = year ?? now.getFullYear();
  const calMonth = month ?? now.getMonth();

  const { daysInMonth, firstDayOfWeek, billsByDay } = useMemo(() => {
    const dim = new Date(calYear, calMonth + 1, 0).getDate();
    const fdow = new Date(calYear, calMonth, 1).getDay();

    const byDay = new Map<number, RecurringBill[]>();
    for (const bill of bills) {
      if (!bill.isActive) continue;
      const day = bill.dueDay > dim ? dim : bill.dueDay;
      const existing = byDay.get(day) ?? [];
      existing.push(bill);
      byDay.set(day, existing);
    }

    return { daysInMonth: dim, firstDayOfWeek: fdow, billsByDay: byDay };
  }, [bills, calYear, calMonth]);

  const monthLabel = new Date(calYear, calMonth).toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  });

  const today = now.getDate();
  const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth();

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Card className="mb-3">
      <Text variant="label" className="mb-3 text-center">{monthLabel}</Text>

      {/* Day headers */}
      <View className="flex-row mb-1">
        {DAY_NAMES.map((d) => (
          <View key={d} className="flex-1 items-center">
            <Text variant="caption" style={{ fontSize: 10 }} className="text-neutral-400">{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {Array.from({ length: cells.length / 7 }, (_, weekIdx) => (
        <View key={weekIdx} className="flex-row">
          {cells.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, cellIdx) => {
            const billsOnDay = day ? billsByDay.get(day) : undefined;
            const isToday = isCurrentMonth && day === today;
            const totalDue = billsOnDay?.reduce((sum, b) => sum + b.amount, 0) ?? 0;

            return (
              <View
                key={`${weekIdx}-${cellIdx}`}
                className={`flex-1 items-center py-1.5 ${isToday ? 'rounded-lg bg-primary-50 dark:bg-primary-950' : ''}`}
              >
                {day ? (
                  <>
                    <Text
                      variant="caption"
                      className={`font-sans-medium ${isToday ? 'text-primary-600 dark:text-primary-400' : ''}`}
                      style={{ fontSize: 11 }}
                    >
                      {day}
                    </Text>
                    {billsOnDay && billsOnDay.length > 0 && (
                      <View className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                    )}
                    {totalDue > 0 && (
                      <Text variant="caption" style={{ fontSize: 7, color: colors.danger }}>
                        {hideBalances ? '•••' : formatCurrency(totalDue)}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text variant="caption" style={{ fontSize: 11, color: 'transparent' }}>0</Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </Card>
  );
}
