import { useMemo } from 'react';
import { useFinanceStore } from '../store/finance.store';

export function useRemittanceSummary() {
  const remittances = useFinanceStore((s) => s.remittances);

  return useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const thisMonthRemittances = remittances.filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const thisYearRemittances = remittances.filter((r) => {
      const d = new Date(r.date);
      return d.getFullYear() === thisYear;
    });

    const totalThisMonth = thisMonthRemittances.reduce((sum, r) => sum + r.amountPHP, 0);
    const totalThisYear = thisYearRemittances.reduce((sum, r) => sum + r.amountPHP, 0);

    // Group by channel
    const byChannel: Record<string, number> = {};
    remittances.forEach((r) => {
      byChannel[r.channel] = (byChannel[r.channel] || 0) + r.amountPHP;
    });

    // Group by sender
    const bySender: Record<string, number> = {};
    remittances.forEach((r) => {
      bySender[r.senderName] = (bySender[r.senderName] || 0) + r.amountPHP;
    });

    return {
      totalThisMonth,
      totalThisYear,
      totalAll: remittances.reduce((sum, r) => sum + r.amountPHP, 0),
      countThisMonth: thisMonthRemittances.length,
      byChannel,
      bySender,
    };
  }, [remittances]);
}
