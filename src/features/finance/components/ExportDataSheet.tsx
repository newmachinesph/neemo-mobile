import { useState, useCallback } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '../store/finance.store';
import { CATEGORY_MAP } from '@lib/constants/finance';

type Period = 'all' | 'month' | '3months' | '6months';
type Format = 'csv' | 'pdf';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'month', label: 'This Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: '6months', label: 'Last 6 Months' },
];

interface ExportDataSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
}

export function ExportDataSheet({ sheetRef }: ExportDataSheetProps) {
  const { colors } = useTheme();
  const transactions = useFinanceStore((s) => s.transactions);
  const accounts = useFinanceStore((s) => s.accounts);
  const [period, setPeriod] = useState<Period>('all');
  const [format, setFormat] = useState<Format>('csv');
  const [exporting, setExporting] = useState(false);
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Derive top categories for filter
  const topCategories = Array.from(
    new Set(transactions.map((t) => t.category)),
  ).slice(0, 8);

  const getFilteredTransactions = useCallback(() => {
    const now = new Date();
    let cutoff: Date | null = null;

    if (period === 'month') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === '3months') {
      cutoff = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    } else if (period === '6months') {
      cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    }

    let result = cutoff
      ? transactions.filter((t) => new Date(t.date) >= cutoff)
      : [...transactions];

    if (accountFilter !== 'all') {
      result = result.filter((t) => t.accountId === accountFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category === categoryFilter);
    }

    return result;
  }, [period, transactions, accountFilter, categoryFilter]);

  const handleExportCSV = useCallback(async () => {
    const filtered = getFilteredTransactions();
    const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

    const header = 'Date,Merchant,Description,Category,Amount,Type,Account,Tags';
    const rows = filtered.map((t) => {
      const date = new Date(t.date).toLocaleDateString('en-PH');
      const catLabel = CATEGORY_MAP.get(t.category)?.label ?? t.category;
      const accountName = accountMap.get(t.accountId) ?? t.accountId;
      const tags = t.tags?.join('; ') ?? '';
      const escape = (s: string) => {
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };
      return [date, escape(t.merchantName), escape(t.description), escape(catLabel), t.amount.toFixed(2), t.type, escape(accountName), escape(tags)].join(',');
    });

    const csv = [header, ...rows].join('\n');
    const now = new Date();
    const filename = `neemo-transactions-${now.toISOString().slice(0, 10)}.csv`;
    const file = new File(Paths.cache, filename);
    file.create({ overwrite: true });
    file.write(csv);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Transactions',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      Alert.alert('Sharing not available', 'Sharing is not supported on this device.');
    }
  }, [getFilteredTransactions, accounts]);

  const handleExportPDF = useCallback(async () => {
    const filtered = getFilteredTransactions();
    const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

    const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const tableRows = filtered.map((t) => {
      const date = new Date(t.date).toLocaleDateString('en-PH');
      const catLabel = CATEGORY_MAP.get(t.category)?.label ?? t.category;
      const accountName = accountMap.get(t.accountId) ?? t.accountId;
      const color = t.type === 'income' ? '#22c55e' : '#ef4444';
      const sign = t.type === 'income' ? '+' : '-';
      return `<tr>
        <td>${date}</td>
        <td>${t.merchantName}</td>
        <td>${catLabel}</td>
        <td style="color:${color};font-weight:600">${sign}₱${t.amount.toFixed(2)}</td>
        <td>${accountName}</td>
      </tr>`;
    }).join('');

    const html = `
      <html>
      <head><style>
        body { font-family: system-ui; padding: 20px; color: #1a1a1a; }
        h1 { color: #9b1b3c; margin-bottom: 4px; }
        .summary { display: flex; gap: 20px; margin: 16px 0; }
        .stat { padding: 12px; background: #f5f5f5; border-radius: 8px; }
        .stat-label { font-size: 12px; color: #666; }
        .stat-value { font-size: 18px; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #9b1b3c; color: white; padding: 8px; text-align: left; font-size: 12px; }
        td { padding: 8px; border-bottom: 1px solid #eee; font-size: 11px; }
        tr:nth-child(even) { background: #fafafa; }
      </style></head>
      <body>
        <h1>Neemo Finance Report</h1>
        <p style="color:#666;font-size:12px">Generated ${new Date().toLocaleDateString('en-PH')}</p>
        <div class="summary">
          <div class="stat"><div class="stat-label">Total Income</div><div class="stat-value" style="color:#22c55e">₱${totalIncome.toFixed(2)}</div></div>
          <div class="stat"><div class="stat-label">Total Expenses</div><div class="stat-value" style="color:#ef4444">₱${totalExpense.toFixed(2)}</div></div>
          <div class="stat"><div class="stat-label">Net</div><div class="stat-value">₱${(totalIncome - totalExpense).toFixed(2)}</div></div>
        </div>
        <table>
          <thead><tr><th>Date</th><th>Merchant</th><th>Category</th><th>Amount</th><th>Account</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <p style="color:#999;font-size:10px;margin-top:24px;text-align:center">${filtered.length} transactions</p>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export PDF Report',
      });
    }
  }, [getFilteredTransactions, accounts]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      if (format === 'csv') {
        await handleExportCSV();
      } else {
        await handleExportPDF();
      }
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export your data. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [format, handleExportCSV, handleExportPDF]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['75%']}>
      <Text variant="h3" className="mb-4">Export Data</Text>

      {/* Format toggle */}
      <Text variant="caption" className="mb-2 text-neutral-500">Format</Text>
      <View className="mb-4 flex-row gap-2">
        {(['csv', 'pdf'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFormat(f)}
            accessibilityRole="button"
            accessibilityLabel={`Export format: ${f.toUpperCase()}${format === f ? ', selected' : ''}`}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2.5 border ${
              format === f ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Icon
              name={f === 'csv' ? 'document-text-outline' : 'document-outline'}
              size={16}
              color={format === f ? '#FFFFFF' : colors.textTertiary}
            />
            <Text variant="caption" className={`font-sans-semibold uppercase ${format === f ? 'text-white' : ''}`}>
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text variant="caption" className="mb-2 text-neutral-500">Time period</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Pressable
            key={p.value}
            onPress={() => setPeriod(p.value)}
            accessibilityRole="button"
            accessibilityLabel={`Time period: ${p.label}${period === p.value ? ', selected' : ''}`}
            className={`rounded-full px-4 py-2 border ${
              period === p.value
                ? 'bg-primary-500 border-primary-500'
                : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text
              variant="caption"
              className={`font-sans-medium ${period === p.value ? 'text-white' : ''}`}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Account filter */}
      <Text variant="caption" className="mb-2 text-neutral-500">Account</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => setAccountFilter('all')}
          accessibilityRole="button"
          accessibilityLabel={`Account filter: All${accountFilter === 'all' ? ', selected' : ''}`}
          className={`rounded-full px-3 py-1.5 border ${
            accountFilter === 'all' ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
          }`}
        >
          <Text variant="caption" className={`font-sans-medium ${accountFilter === 'all' ? 'text-white' : ''}`}>All</Text>
        </Pressable>
        {accounts.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => setAccountFilter(a.id)}
            accessibilityRole="button"
            accessibilityLabel={`Account filter: ${a.name}${accountFilter === a.id ? ', selected' : ''}`}
            className={`rounded-full px-3 py-1.5 border ${
              accountFilter === a.id ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-medium ${accountFilter === a.id ? 'text-white' : ''}`}>{a.name}</Text>
          </Pressable>
        ))}
      </View>

      {/* Category filter */}
      <Text variant="caption" className="mb-2 text-neutral-500">Category</Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => setCategoryFilter('all')}
          accessibilityRole="button"
          accessibilityLabel={`Category filter: All${categoryFilter === 'all' ? ', selected' : ''}`}
          className={`rounded-full px-3 py-1.5 border ${
            categoryFilter === 'all' ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
          }`}
        >
          <Text variant="caption" className={`font-sans-medium ${categoryFilter === 'all' ? 'text-white' : ''}`}>All</Text>
        </Pressable>
        {topCategories.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setCategoryFilter(cat)}
            accessibilityRole="button"
            accessibilityLabel={`Category filter: ${CATEGORY_MAP.get(cat)?.label ?? cat}${categoryFilter === cat ? ', selected' : ''}`}
            className={`rounded-full px-3 py-1.5 border ${
              categoryFilter === cat ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-medium ${categoryFilter === cat ? 'text-white' : ''}`}>
              {CATEGORY_MAP.get(cat)?.label ?? cat}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button onPress={handleExport} disabled={exporting}>
        {exporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
      </Button>
    </BottomSheetModal>
  );
}
