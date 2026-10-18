import { useMemo } from 'react';
import { useFinanceStore } from '../store/finance.store';

export type DebtAccount = {
  accountId: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  extraPayment: number;
};

export type PayoffStrategy = {
  name: string;
  description: string;
  totalMonths: number;
  totalInterestPaid: number;
};

function calculatePayoff(debts: DebtAccount[], sortFn: (a: DebtAccount, b: DebtAccount) => number): PayoffStrategy & { name: string; description: string } {
  if (debts.length === 0) return { name: '', description: '', totalMonths: 0, totalInterestPaid: 0 };

  // Clone debts sorted by strategy
  const sorted = [...debts].sort(sortFn);
  const balances = sorted.map((d) => d.balance);
  const rates = sorted.map((d) => d.interestRate / 100 / 12); // monthly rate
  const minimums = sorted.map((d) => d.minimumPayment);
  const totalExtra = sorted.reduce((sum, d) => sum + d.extraPayment, 0);

  let totalInterest = 0;
  let months = 0;
  const MAX_MONTHS = 600; // 50 year cap

  while (balances.some((b) => b > 0) && months < MAX_MONTHS) {
    months++;
    let extraThisMonth = totalExtra;

    for (let i = 0; i < balances.length; i++) {
      if (balances[i]! <= 0) continue;

      // Apply interest
      const interest = balances[i]! * rates[i]!;
      totalInterest += interest;
      balances[i] = balances[i]! + interest;

      // Apply minimum payment
      const payment = Math.min(minimums[i]!, balances[i]!);
      balances[i] = balances[i]! - payment;
    }

    // Apply extra to first non-zero debt (priority)
    for (let i = 0; i < balances.length; i++) {
      if (balances[i]! <= 0) continue;
      const extraPayment = Math.min(extraThisMonth, balances[i]!);
      balances[i] = balances[i]! - extraPayment;
      extraThisMonth -= extraPayment;
      if (extraThisMonth <= 0) break;
    }
  }

  return { name: '', description: '', totalMonths: months, totalInterestPaid: Math.round(totalInterest) };
}

export function useDebtPayoff() {
  const accounts = useFinanceStore((s) => s.accounts);
  const debtInfos = useFinanceStore((s) => s.debtInfos);

  return useMemo(() => {
    // Match debt accounts with their debt info
    const debtAccounts: DebtAccount[] = [];
    for (const info of debtInfos) {
      const account = accounts.find((a) => a.id === info.accountId);
      if (!account) continue;
      debtAccounts.push({
        accountId: account.id,
        name: account.name,
        balance: Math.abs(account.balance),
        interestRate: info.interestRate,
        minimumPayment: info.minimumPayment,
        extraPayment: info.extraPayment ?? 0,
      });
    }

    const snowball: PayoffStrategy = {
      ...calculatePayoff(debtAccounts, (a, b) => a.balance - b.balance),
      name: 'Snowball',
      description: 'Pay smallest balance first for quick wins',
    };

    const avalanche: PayoffStrategy = {
      ...calculatePayoff(debtAccounts, (a, b) => b.interestRate - a.interestRate),
      name: 'Avalanche',
      description: 'Pay highest interest first to save money',
    };

    return { debtAccounts, snowball, avalanche };
  }, [accounts, debtInfos]);
}
