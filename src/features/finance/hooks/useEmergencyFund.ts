import { useMemo } from 'react';
import { useFinanceStore } from '../store/finance.store';

type EmergencyStatus = 'red' | 'yellow' | 'green' | 'excellent';

export function useEmergencyFund() {
  const transactions = useFinanceStore((s) => s.transactions);
  const goals = useFinanceStore((s) => s.goals);

  return useMemo(() => {
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsAgoStr = threeMonthsAgo.toISOString();

    const recentExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date >= threeMonthsAgoStr && t.date <= now.toISOString(),
    );
    const totalExpenses = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenseAvg = totalExpenses / 3 || 1;

    const emergencyGoals = goals.filter((g) => g.isEmergencyFund || g.name.toLowerCase().includes('emergency'));
    const totalEmergencySaved = emergencyGoals.reduce((sum, g) => sum + g.currentAmount, 0);

    const targetMonths = 6;
    const monthsCovered = totalEmergencySaved / monthlyExpenseAvg;

    let status: EmergencyStatus = 'red';
    if (monthsCovered >= 6) status = 'excellent';
    else if (monthsCovered >= 3) status = 'green';
    else if (monthsCovered >= 1) status = 'yellow';

    return {
      monthlyExpenseAvg,
      totalEmergencySaved,
      monthsCovered,
      targetMonths,
      status,
      emergencyGoals,
    };
  }, [transactions, goals]);
}
