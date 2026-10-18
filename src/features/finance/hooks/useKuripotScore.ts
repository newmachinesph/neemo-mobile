import { useMemo } from 'react';
import { useFinanceStore } from '../store/finance.store';
import { convertToBase } from '@lib/utils/currency';
import { CATEGORY_MAP } from '@lib/constants/finance';

type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

function getGrade(score: number): Grade {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

function getGradeColor(grade: Grade): string {
  switch (grade) {
    case 'A+':
    case 'A':
      return '#22C55E';
    case 'B':
      return '#F59E0B';
    case 'C':
      return '#F97316';
    case 'D':
      return '#EF4444';
    case 'F':
      return '#DC2626';
  }
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

export interface KuripotScoreResult {
  score: number;
  grade: Grade;
  gradeColor: string;
  factors: {
    savingsRate: number;
    budgetAdherence: number;
    emergencyFund: number;
    debtRatio: number;
  };
}

export interface ExpensePrediction {
  projectedMonthly: number;
  actualSoFar: number;
  daysElapsed: number;
  daysInMonth: number;
  progress: number;
}

export interface AnomalyResult {
  detected: boolean;
  category: string;
  categoryLabel: string;
  currentAmount: number;
  averageAmount: number;
  ratio: number;
}

export function useKuripotScore() {
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);
  const goals = useFinanceStore((s) => s.goals);
  const cards = useFinanceStore((s) => s.cards);
  const profileCurrency = useFinanceStore((s) => s.profile.currency);

  return useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthTxns = transactions.filter((t) => t.date >= monthStart);

    const totalIncome = monthTxns
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + convertToBase(t.amount, t.currency, profileCurrency), 0);

    const totalExpenses = monthTxns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + convertToBase(t.amount, t.currency, profileCurrency), 0);

    // ── Factor 1: Savings Rate (30%) ──────────────────────────────────
    // Percentage of income saved this month
    const savingsRate = totalIncome > 0
      ? clamp(((totalIncome - totalExpenses) / totalIncome) * 100)
      : 50; // neutral if no income data

    // ── Factor 2: Budget Adherence (25%) ─────────────────────────────
    // Compute actual spend per budget category from this month's transactions
    let budgetAdherence = 70; // default when no budgets
    if (budgets.length > 0) {
      const spendByCategory: Record<string, number> = {};
      monthTxns
        .filter((t) => t.type === 'expense')
        .forEach((t) => {
          spendByCategory[t.category] = (spendByCategory[t.category] || 0) +
            convertToBase(t.amount, t.currency, profileCurrency);
        });
      const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
      const totalSpent = budgets.reduce((s, b) => s + (spendByCategory[b.category] || 0), 0);
      const utilization = totalBudgeted > 0 ? totalSpent / totalBudgeted : 0;
      // 100 = spent 0%, 0 = spent 200%+
      budgetAdherence = clamp(100 - (utilization * 100));
    }

    // ── Factor 3: Emergency Fund Coverage (25%) ──────────────────────
    const emergencyGoals = goals.filter(
      (g) => g.isEmergencyFund || g.name.toLowerCase().includes('emergency'),
    );
    let emergencyFund = 50; // neutral when no emergency goals set up yet
    if (emergencyGoals.length > 0) {
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const recentExpenses = transactions.filter(
        (t) => t.type === 'expense' && t.date >= threeMonthsAgo.toISOString(),
      );
      const monthlyExpenseAvg = recentExpenses.reduce(
        (s, t) => s + convertToBase(t.amount, t.currency, profileCurrency), 0,
      ) / 3 || 1;
      const emergencySaved = emergencyGoals.reduce((s, g) => s + g.currentAmount, 0);
      const monthsCovered = emergencySaved / monthlyExpenseAvg;
      // 6+ months = 100, 0 months = 0
      emergencyFund = clamp((monthsCovered / 6) * 100);
    }

    // ── Factor 4: Debt Ratio (20%) ───────────────────────────────────
    // Based on credit card utilization
    const totalCreditLimit = cards
      .filter((c) => c.type === 'credit' && c.isActive)
      .reduce((s, c) => s + (c.creditLimit || 0), 0);
    const totalOutstanding = cards
      .filter((c) => c.type === 'credit' && c.isActive)
      .reduce((s, c) => s + (c.outstandingBalance || 0), 0);
    let debtRatio = 80; // default (good) when no credit cards
    if (totalCreditLimit > 0) {
      const utilization = totalOutstanding / totalCreditLimit;
      // 0% util = 100, 100% util = 0
      debtRatio = clamp(100 - (utilization * 100));
    }

    // ── Weighted Score ───────────────────────────────────────────────
    const score = Math.round(
      savingsRate * 0.3 +
      budgetAdherence * 0.25 +
      emergencyFund * 0.25 +
      debtRatio * 0.2,
    );
    const grade = getGrade(score);

    const kuripotScore: KuripotScoreResult = {
      score,
      grade,
      gradeColor: getGradeColor(grade),
      factors: {
        savingsRate: Math.round(savingsRate),
        budgetAdherence: Math.round(budgetAdherence),
        emergencyFund: Math.round(emergencyFund),
        debtRatio: Math.round(debtRatio),
      },
    };

    // ── Expense Prediction ───────────────────────────────────────────
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const dailyRate = daysElapsed > 0 ? totalExpenses / daysElapsed : 0;
    const projectedMonthly = Math.round(dailyRate * daysInMonth);

    const prediction: ExpensePrediction = {
      projectedMonthly,
      actualSoFar: Math.round(totalExpenses),
      daysElapsed,
      daysInMonth,
      progress: daysElapsed / daysInMonth,
    };

    // ── Anomaly Detection ────────────────────────────────────────────
    // Compare this month's category spending against real 3-month averages

    // Current month spend per category
    const categorySpend: Record<string, number> = {};
    monthTxns
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categorySpend[t.category] = (categorySpend[t.category] || 0) +
          convertToBase(t.amount, t.currency, profileCurrency);
      });

    // Historical spend per category for the 3 months before this month
    const histStart = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    const histEnd = monthStart; // up to (but not including) current month
    const histTxns = transactions.filter(
      (t) => t.type === 'expense' && t.date >= histStart && t.date < histEnd,
    );

    // Count how many distinct calendar months appear in the history window
    const histMonths = new Set(
      histTxns.map((t) => t.date.slice(0, 7)),
    );
    const monthCount = Math.max(histMonths.size, 1); // avoid /0

    const histCategorySpend: Record<string, number> = {};
    histTxns.forEach((t) => {
      histCategorySpend[t.category] = (histCategorySpend[t.category] || 0) +
        convertToBase(t.amount, t.currency, profileCurrency);
    });

    // Use the canonical CATEGORY_MAP from finance constants

    let anomaly: AnomalyResult = {
      detected: false,
      category: '',
      categoryLabel: '',
      currentAmount: 0,
      averageAmount: 0,
      ratio: 0,
    };

    // Find the category with the highest spike vs its historical average
    let worstRatio = 0;
    for (const [cat, currentAmt] of Object.entries(categorySpend)) {
      const histTotal = histCategorySpend[cat] || 0;
      const avgMonthly = histTotal / monthCount;
      // Need meaningful history — skip if average is too small
      if (avgMonthly < 1) continue;
      const ratio = currentAmt / avgMonthly;
      if (ratio > 1.5 && ratio > worstRatio) {
        worstRatio = ratio;
        anomaly = {
          detected: true,
          category: cat,
          categoryLabel: CATEGORY_MAP.get(cat)?.label ?? cat,
          currentAmount: Math.round(currentAmt),
          averageAmount: Math.round(avgMonthly),
          ratio: Math.round(ratio * 10) / 10,
        };
      }
    }

    // Only meaningful when there's at least 1 income or expense this month
    const hasEnoughData = totalIncome > 0 || totalExpenses > 0;

    return { kuripotScore, prediction, anomaly, hasEnoughData };
  }, [accounts, transactions, budgets, goals, cards, profileCurrency]);
}
