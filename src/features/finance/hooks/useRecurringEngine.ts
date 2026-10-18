import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useFinanceStore } from '../store/finance.store';

/**
 * Hook that processes due recurring transactions on mount.
 * Shows an Alert prompt if there are due transactions.
 * Call this from the Home screen so it runs on each app launch.
 */
export function useRecurringEngine() {
  const processRecurringTransactions = useFinanceStore(
    (s) => s.processRecurringTransactions,
  );
  const recurringTransactions = useFinanceStore((s) => s.recurringTransactions);
  const recurringReminders = useFinanceStore(
    (s) => s.notificationPreferences.recurringReminders,
  );
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (recurringTransactions.length === 0) return;
    if (!recurringReminders) return;
    hasRun.current = true;

    const today = new Date().toISOString().slice(0, 10);
    const dueCount = recurringTransactions.filter(
      (rt) => rt.isActive && rt.nextDueDate.slice(0, 10) <= today,
    ).length;

    if (dueCount === 0) return;

    Alert.alert(
      'Recurring Transactions',
      `${dueCount} transaction${dueCount > 1 ? 's are' : ' is'} due. Create them?`,
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Create', onPress: () => processRecurringTransactions() },
      ],
    );
  }, [recurringTransactions, processRecurringTransactions, recurringReminders]);
}
