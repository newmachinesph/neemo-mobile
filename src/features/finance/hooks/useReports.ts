import { useMemo } from 'react';
import { useFinanceStore } from '../store/finance.store';
import { CATEGORY_MAP } from '@lib/constants/finance';

export type CategorySpend = {
  category: string;
  label: string;
  color: string;
  icon: string;
  total: number;
  percentage: number;
};

export type MonthlyTrend = {
  month: string; // "Jan", "Feb" etc.
  income: number;
  expenses: number;
};

export type TopMerchant = {
  name: string;
  total: number;
  count: number;
};

export function useReports() {
  const transactions = useFinanceStore((s) => s.transactions);

  return useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // ── Current month transactions ──────────────────────────────────────────

    const monthTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // ── Income vs Expenses ──────────────────────────────────────────────────

    let income = 0;
    let expenses = 0;
    for (const t of monthTxns) {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expenses += t.amount;
    }
    const incomeVsExpenses = { income, expenses, net: income - expenses };

    // ── Spending by Category ────────────────────────────────────────────────

    const categoryMap = new Map<string, number>();
    for (const t of monthTxns) {
      if (t.type !== 'expense') continue;
      // If transaction has splits, distribute to split categories
      if (t.splits && t.splits.length > 0) {
        for (const split of t.splits) {
          categoryMap.set(split.category, (categoryMap.get(split.category) ?? 0) + split.amount);
        }
      } else {
        categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);
      }
    }

    const totalSpending = Array.from(categoryMap.values()).reduce((sum, v) => sum + v, 0);

    const spendingByCategory: CategorySpend[] = Array.from(categoryMap.entries())
      .map(([cat, total]) => {
        const info = CATEGORY_MAP.get(cat);
        return {
          category: cat,
          label: info?.label ?? cat,
          color: info?.color ?? '#6B7280',
          icon: info?.icon ?? 'ellipsis-horizontal-outline',
          total,
          percentage: totalSpending > 0 ? total / totalSpending : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    // ── Monthly Trend (last 6 months) ───────────────────────────────────────

    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend: MonthlyTrend[] = [];

    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m < 0) {
        m += 12;
        y -= 1;
      }

      let mIncome = 0;
      let mExpenses = 0;
      for (const t of transactions) {
        const d = new Date(t.date);
        if (d.getMonth() === m && d.getFullYear() === y) {
          if (t.type === 'income') mIncome += t.amount;
          else if (t.type === 'expense') mExpenses += t.amount;
        }
      }
      monthlyTrend.push({ month: MONTH_NAMES[m]!, income: mIncome, expenses: mExpenses });
    }

    // ── Top Merchants ───────────────────────────────────────────────────────

    const merchantMap = new Map<string, { total: number; count: number }>();
    for (const t of monthTxns) {
      if (t.type !== 'expense') continue;
      const existing = merchantMap.get(t.merchantName) ?? { total: 0, count: 0 };
      existing.total += t.amount;
      existing.count += 1;
      merchantMap.set(t.merchantName, existing);
    }

    const topMerchants: TopMerchant[] = Array.from(merchantMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return { spendingByCategory, incomeVsExpenses, monthlyTrend, topMerchants };
  }, [transactions]);
}
