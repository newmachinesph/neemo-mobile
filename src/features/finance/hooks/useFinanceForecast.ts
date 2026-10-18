import { useMemo } from 'react';
import { useFinanceStore } from '../store/finance.store';
import { useFinanceSummary } from './useFinanceSummary';

export type ForecastStatus = 'green' | 'yellow' | 'red';

export function useFinanceForecast() {
  const recurringBills = useFinanceStore((s) => s.recurringBills);
  const { totalBalance, totalIncome, totalExpenses } = useFinanceSummary();

  return useMemo(() => {
    const now = new Date();
    const today = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Sum unpaid active monthly bills with dueDay > today
    let remainingBills = 0;
    for (const bill of recurringBills) {
      if (!bill.isActive || bill.frequency !== 'monthly') continue;
      // Check if already paid this month
      if (bill.lastPaidDate) {
        const paid = new Date(bill.lastPaidDate);
        if (paid.getMonth() === currentMonth && paid.getFullYear() === currentYear) continue;
      }
      if (bill.dueDay > today) {
        remainingBills += bill.amount;
      }
    }

    const safeToSpend = Math.max(0, totalIncome - totalExpenses - remainingBills);
    const projectedEndOfMonth = totalBalance - remainingBills;

    // Status based on remaining percentage of income
    let status: ForecastStatus = 'green';
    if (totalIncome > 0) {
      const remainingRatio = safeToSpend / totalIncome;
      if (remainingRatio < 0.1) status = 'red';
      else if (remainingRatio < 0.3) status = 'yellow';
    } else if (safeToSpend <= 0) {
      status = 'red';
    }

    return { remainingBills, safeToSpend, projectedEndOfMonth, status };
  }, [recurringBills, totalBalance, totalIncome, totalExpenses]);
}
