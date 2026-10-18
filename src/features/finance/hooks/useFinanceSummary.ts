import { useMemo } from 'react';
import { useFinanceStore } from '../store/finance.store';
import { convertToBase } from '@lib/utils/currency';

export function useFinanceSummary() {
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);
  const profileCurrency = useFinanceStore((s) => s.profile.currency);

  return useMemo(() => {
    // Convert all account balances to profile currency
    const totalBalance = accounts.reduce(
      (sum, a) => sum + convertToBase(a.balance, a.currency, profileCurrency),
      0,
    );

    // Current month transactions (date-only comparison to avoid timezone issues)
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthTxns = transactions.filter((t) => t.date.slice(0, 10) >= monthStart);

    const totalIncome = monthTxns
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + convertToBase(t.amount, t.currency, profileCurrency), 0);

    const totalExpenses = monthTxns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + convertToBase(t.amount, t.currency, profileCurrency), 0);

    const safeToSpend = totalIncome - totalExpenses;

    const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalBudgetSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const budgetUtilization = totalBudgeted > 0 ? totalBudgetSpent / totalBudgeted : 0;

    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      safeToSpend,
      totalBudgeted,
      totalBudgetSpent,
      budgetUtilization,
    };
  }, [accounts, transactions, budgets, profileCurrency]);
}
