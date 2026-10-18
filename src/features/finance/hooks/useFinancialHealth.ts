import { useMemo } from 'react';
import { useFinanceStore } from '../store/finance.store';
import { convertToBase } from '@lib/utils/currency';

export type MetricStatus = 'good' | 'warning' | 'critical';

export interface PulseMetric {
  key: string;
  icon: string;
  label: string;
  value: string;
  status: MetricStatus;
  insight: string;
}

export interface PulseCheckResult {
  metrics: PulseMetric[];
  overallStatus: MetricStatus;
  hasData: boolean;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function usePulseCheck(): PulseCheckResult {
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const recurringBills = useFinanceStore((s) => s.recurringBills);
  const utangs = useFinanceStore((s) => s.utangs);
  const profileCurrency = useFinanceStore((s) => s.profile.currency);

  return useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const metrics: PulseMetric[] = [];

    // ── 1. Cash Runway ──────────────────────────────────────────────────
    // Months of liquid assets / average monthly expenses (3-month lookback)
    const liquidTypes = new Set(['savings', 'checking', 'e_wallet', 'digital_bank', 'cash']);
    const liquidAssets = accounts
      .filter((a) => liquidTypes.has(a.type) && a.balance > 0)
      .reduce((sum, a) => sum + convertToBase(a.balance, a.currency, profileCurrency), 0);

    const histStart = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    const histEnd = monthStart;
    const histTxns = transactions.filter(
      (t) => t.type === 'expense' && t.date >= histStart && t.date < histEnd,
    );
    const histMonths = new Set(histTxns.map((t) => t.date.slice(0, 7)));
    const monthCount = Math.max(histMonths.size, 1);
    const avgMonthlyExpense =
      histTxns.reduce(
        (s, t) => s + convertToBase(t.amount, t.currency, profileCurrency),
        0,
      ) / monthCount;

    // Fall back to projected current month if no history
    const currentMonthExpenses = transactions
      .filter((t) => t.type === 'expense' && t.date >= monthStart)
      .reduce((s, t) => s + convertToBase(t.amount, t.currency, profileCurrency), 0);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = Math.max(now.getDate(), 1);
    const projectedMonthSpend = (currentMonthExpenses / daysElapsed) * daysInMonth;

    const monthlyBurn = avgMonthlyExpense > 0 ? avgMonthlyExpense : projectedMonthSpend;
    const runway = monthlyBurn > 0 ? liquidAssets / monthlyBurn : 0;
    const runwayRounded = Math.round(runway * 10) / 10;

    let runwayStatus: MetricStatus = 'good';
    let runwayInsight: string;
    if (runway >= 6) {
      runwayInsight = '6+ months covered — very healthy';
    } else if (runway >= 3) {
      runwayInsight = 'Solid foundation';
    } else if (runway >= 1) {
      runwayStatus = 'warning';
      runwayInsight = 'Building up — aim for 3+ months';
    } else {
      runwayStatus = 'critical';
      runwayInsight = 'Savings are thin — prioritize reserves';
    }

    metrics.push({
      key: 'runway',
      icon: 'hourglass-outline',
      label: 'Cash Runway',
      value: `${runwayRounded} mo`,
      status: runwayStatus,
      insight: runwayInsight,
    });

    // ── 2. Spending Pulse ───────────────────────────────────────────────
    // Projected full-month spend vs 3-month average
    const pace = avgMonthlyExpense > 0 ? projectedMonthSpend / avgMonthlyExpense : 1;
    const pacePct = Math.round((pace - 1) * 100);

    let paceStatus: MetricStatus = 'good';
    let paceValue: string;
    let paceInsight: string;
    if (pacePct <= 0) {
      paceValue = pacePct === 0 ? 'On track' : `${Math.abs(pacePct)}% under`;
      paceInsight = 'Spending less than usual';
    } else if (pacePct <= 15) {
      paceValue = `${pacePct}% over`;
      paceStatus = 'warning';
      paceInsight = 'Slightly above your 3-mo avg';
    } else {
      paceValue = `${pacePct}% over`;
      paceStatus = 'critical';
      paceInsight = 'Well above your usual pace';
    }

    metrics.push({
      key: 'spending',
      icon: 'speedometer-outline',
      label: 'Spending Pulse',
      value: paceValue,
      status: paceStatus,
      insight: paceInsight,
    });

    // ── 3. Bills Ready ──────────────────────────────────────────────────
    // Can you cover remaining unpaid bills this month?
    const today = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let remainingBillsAmt = 0;
    let billCount = 0;
    for (const bill of recurringBills) {
      if (!bill.isActive || bill.frequency !== 'monthly') continue;
      if (bill.lastPaidDate) {
        const paid = new Date(bill.lastPaidDate);
        if (paid.getMonth() === currentMonth && paid.getFullYear() === currentYear)
          continue;
      }
      if (bill.dueDay > today) {
        remainingBillsAmt += bill.amount;
        billCount++;
      }
    }

    const currentMonthIncome = transactions
      .filter((t) => t.type === 'income' && t.date >= monthStart)
      .reduce((s, t) => s + convertToBase(t.amount, t.currency, profileCurrency), 0);
    const safeToSpend = currentMonthIncome - currentMonthExpenses;

    let billsStatus: MetricStatus = 'good';
    let billsValue: string;
    let billsInsight: string;
    if (billCount === 0) {
      billsValue = 'All clear';
      billsInsight = 'No upcoming bills this month';
    } else if (safeToSpend >= remainingBillsAmt * 1.3) {
      billsValue = `${billCount} upcoming`;
      billsInsight = 'Comfortably covered';
    } else if (safeToSpend >= remainingBillsAmt) {
      billsValue = `${billCount} upcoming`;
      billsStatus = 'warning';
      billsInsight = 'Covered, but budget will be tight';
    } else {
      billsValue = `${billCount} upcoming`;
      billsStatus = 'critical';
      billsInsight = 'May not cover all remaining bills';
    }

    metrics.push({
      key: 'bills',
      icon: 'receipt-outline',
      label: 'Bills Ready',
      value: billsValue,
      status: billsStatus,
      insight: billsInsight,
    });

    // ── 4. Debt Balance ─────────────────────────────────────────────────
    // Net lend/borrow position
    const activeLent = utangs
      .filter((u) => u.type === 'lent' && u.status !== 'settled')
      .reduce((s, u) => s + u.remainingBalance, 0);
    const activeBorrowed = utangs
      .filter((u) => u.type === 'borrowed' && u.status !== 'settled')
      .reduce((s, u) => s + u.remainingBalance, 0);
    const netUtang = activeLent - activeBorrowed;

    let utangStatus: MetricStatus = 'good';
    let utangValue: string;
    let utangInsight: string;
    if (activeLent === 0 && activeBorrowed === 0) {
      utangValue = 'Clear';
      utangInsight = 'No active debts';
    } else if (netUtang > 0) {
      utangValue = `+${formatCompact(netUtang)} net`;
      utangInsight = `${formatCompact(activeLent)} lent out`;
    } else if (netUtang === 0) {
      utangValue = 'Even';
      utangStatus = 'warning';
      utangInsight = `${formatCompact(activeLent)} lent = ${formatCompact(activeBorrowed)} owed`;
    } else {
      utangValue = `-${formatCompact(Math.abs(netUtang))} net`;
      utangStatus = activeBorrowed > currentMonthIncome * 0.3 ? 'critical' : 'warning';
      utangInsight = `You owe ${formatCompact(activeBorrowed)} total`;
    }

    metrics.push({
      key: 'utang',
      icon: 'people-outline',
      label: 'Debt Balance',
      value: utangValue,
      status: utangStatus,
      insight: utangInsight,
    });

    // ── Overall ─────────────────────────────────────────────────────────
    const statuses = metrics.map((m) => m.status);
    let overallStatus: MetricStatus = 'good';
    if (statuses.includes('critical')) overallStatus = 'critical';
    else if (statuses.includes('warning')) overallStatus = 'warning';

    const hasData = accounts.length > 0 && transactions.length > 0;

    return { metrics, overallStatus, hasData };
  }, [accounts, transactions, recurringBills, utangs, profileCurrency]);
}
