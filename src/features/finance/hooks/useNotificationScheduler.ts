import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useFinanceStore } from '../store/finance.store';

/**
 * Schedules local notifications for:
 * - Bills: 3 days before, 1 day before, and day-of dueDay (gated by billReminders pref)
 * - Budgets at 80%+: immediate notification (gated by budgetAlerts pref)
 * - Subscriptions: 1 day before renewalDay (gated by billReminders pref)
 *
 * Also stores each notification in-app for the notification center.
 * Called once from home.tsx after useRecurringEngine.
 */
export function useNotificationScheduler() {
  const recurringBills = useFinanceStore((s) => s.recurringBills);
  const budgets = useFinanceStore((s) => s.budgets);
  const subscriptions = useFinanceStore((s) => s.subscriptions);
  // Track a fingerprint of the relevant data to avoid duplicate scheduling
  // while still re-scheduling when bills/budgets/subscriptions actually change
  const lastFingerprint = useRef('');

  useEffect(() => {
    const fp = [
      recurringBills.map((b) => `${b.id}:${b.dueDay}:${b.amount}:${b.isActive}:${b.lastPaidDate}`).join(','),
      budgets.map((b) => `${b.id}:${b.spent}:${b.amount}`).join(','),
      subscriptions.map((s) => `${s.id}:${s.renewalDay}:${s.amount}:${s.isActive}`).join(','),
    ].join('|');

    if (fp === lastFingerprint.current) return;
    lastFingerprint.current = fp;

    scheduleAll();

    async function scheduleAll() {
      try {
        // Request permissions
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          if (newStatus !== 'granted') return;
        }

        // Read prefs and addAppNotification imperatively to avoid dependency loops
        const { notificationPreferences: prefs, addAppNotification, appNotifications } =
          useFinanceStore.getState();

        // Helper: only add in-app notification if one with same type+relatedId doesn't
        // already exist today (prevents duplicate spam on data changes)
        const todayStr = new Date().toISOString().slice(0, 10);
        const existingKeys = new Set(
          appNotifications
            .filter((n) => n.createdAt.slice(0, 10) === todayStr)
            .map((n) => `${n.type}:${n.relatedId ?? ''}:${n.title}`),
        );
        const addNotifOnce = (notif: Parameters<typeof addAppNotification>[0]) => {
          const key = `${notif.type}:${notif.relatedId ?? ''}:${notif.title}`;
          if (existingKeys.has(key)) return;
          existingKeys.add(key);
          addAppNotification(notif);
        };

        // Cancel all previous scheduled notifications and reschedule
        await Notifications.cancelAllScheduledNotificationsAsync();

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // ── Bills: schedule 3 days before, 1 day before, and day-of ──
        if (prefs.billReminders) {
          for (const bill of recurringBills) {
            if (!bill.isActive || bill.frequency !== 'monthly') continue;

            // Check if already paid this month
            if (bill.lastPaidDate) {
              const paid = new Date(bill.lastPaidDate);
              if (paid.getMonth() === currentMonth && paid.getFullYear() === currentYear)
                continue;
            }

            for (const daysBefore of [3, 1, 0]) {
              const triggerDay = bill.dueDay - daysBefore;
              if (triggerDay < 1) continue; // Invalid day
              if (triggerDay < now.getDate()) continue; // Already past

              const trigger = new Date(currentYear, currentMonth, triggerDay, 9, 0);
              if (trigger <= now) continue;

              const prefix =
                daysBefore === 0
                  ? 'Today'
                  : `In ${daysBefore} day${daysBefore > 1 ? 's' : ''}`;
              const title = `Bill Due: ${bill.name}`;
              const body = `${prefix} — ₱${bill.amount.toLocaleString()} is due`;

              await Notifications.scheduleNotificationAsync({
                content: { title, body, sound: true },
                trigger: {
                  type: Notifications.SchedulableTriggerInputTypes.DATE,
                  date: trigger,
                },
              });

              addNotifOnce({ title, body, type: 'bill', relatedId: bill.id });
            }
          }
        }

        // ── Budgets at 80%+ ──
        if (prefs.budgetAlerts) {
          for (const budget of budgets) {
            if (budget.amount <= 0) continue;
            const utilization = budget.spent / budget.amount;
            if (utilization >= 0.8 && utilization < 1) {
              const title = `Budget Warning: ${budget.name}`;
              const body = `You've used ${Math.round(utilization * 100)}% of your ${budget.name} budget`;

              await Notifications.scheduleNotificationAsync({
                content: { title, body, sound: true },
                trigger: null, // immediate
              });

              addNotifOnce({ title, body, type: 'budget', relatedId: budget.id });
            }
          }
        }

        // ── Subscriptions: 1 day before renewal ──
        if (prefs.billReminders) {
          for (const sub of subscriptions) {
            if (!sub.isActive || sub.frequency !== 'monthly') continue;
            const triggerDay = sub.renewalDay - 1;
            if (triggerDay < 1) continue; // Invalid day
            // L3 fix: Use < instead of <= so notification fires on the trigger day
            if (triggerDay < now.getDate()) continue;

            const trigger = new Date(currentYear, currentMonth, triggerDay, 9, 0);
            if (trigger <= now) continue;

            const title = `Subscription Renewal: ${sub.name}`;
            const body = `₱${sub.amount.toLocaleString()} renews tomorrow`;

            await Notifications.scheduleNotificationAsync({
              content: { title, body, sound: true },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: trigger,
              },
            });

            addNotifOnce({ title, body, type: 'subscription', relatedId: sub.id });
          }
        }
      } catch (error) {
        if (__DEV__) console.warn('[Notifications] Failed to schedule:', error);
      }
    }
  }, [recurringBills, budgets, subscriptions]);
}
