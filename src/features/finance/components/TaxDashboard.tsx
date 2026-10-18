import { useState } from 'react';
import { View } from 'react-native';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Input } from '@ui/components/Input';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '../store/finance.store';
import { useTaxComputation } from '../hooks/useTaxComputation';

export function TaxDashboard() {
  const { colors } = useTheme();
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);
  const [grossIncome, setGrossIncome] = useState('');
  const [deductions, setDeductions] = useState('');

  const annualGross = (parseFloat(grossIncome) || 0) * 12;
  const annualDeductions = parseFloat(deductions) || 0;

  const tax = useTaxComputation(annualGross, annualDeductions);

  return (
    <>
      <Card className="mb-3">
        <Text variant="label" className="mb-3" style={{ color: colors.primary }}>
          Income Details
        </Text>
        <Input
          label="Monthly Gross Income"
          placeholder="e.g. 45,000"
          value={grossIncome}
          onChangeText={setGrossIncome}
          keyboardType="decimal-pad"
          className="mb-3"
        />
        <Input
          label="Annual Deductions (optional)"
          placeholder="e.g. 60,000"
          value={deductions}
          onChangeText={setDeductions}
          keyboardType="decimal-pad"
        />
      </Card>

      {annualGross > 0 && (
        <>
          {/* Tax Comparison */}
          <Card className="mb-3">
            <Text variant="label" className="mb-3" style={{ color: colors.primary }}>
              Tax Comparison
            </Text>

            <View className="flex-row gap-3">
              <View className={`flex-1 rounded-xl p-3 ${tax.recommended === '8% Flat' ? 'bg-green-50 border border-green-200' : 'bg-neutral-50 dark:bg-neutral-800'}`}>
                <Text variant="caption" className="text-neutral-500 mb-1">8% Flat Tax</Text>
                <Text variant="body" className="font-sans-bold">{amt(tax.flatTax)}</Text>
                <Text variant="caption" className="text-neutral-400 mt-1" style={{ fontSize: 10 }}>
                  ₱{Math.round(tax.quarterlyFlat).toLocaleString()}/quarter
                </Text>
                {tax.recommended === '8% Flat' && (
                  <View className="mt-2 flex-row items-center gap-1">
                    <Icon name="checkmark-circle" size={14} color={colors.success} />
                    <Text variant="caption" style={{ color: colors.success, fontSize: 10 }}>Recommended</Text>
                  </View>
                )}
              </View>

              <View className={`flex-1 rounded-xl p-3 ${tax.recommended === 'Graduated' ? 'bg-green-50 border border-green-200' : 'bg-neutral-50 dark:bg-neutral-800'}`}>
                <Text variant="caption" className="text-neutral-500 mb-1">Graduated Tax</Text>
                <Text variant="body" className="font-sans-bold">{amt(tax.graduatedTax)}</Text>
                <Text variant="caption" className="text-neutral-400 mt-1" style={{ fontSize: 10 }}>
                  ₱{Math.round(tax.quarterlyGraduated).toLocaleString()}/quarter
                </Text>
                {tax.recommended === 'Graduated' && (
                  <View className="mt-2 flex-row items-center gap-1">
                    <Icon name="checkmark-circle" size={14} color={colors.success} />
                    <Text variant="caption" style={{ color: colors.success, fontSize: 10 }}>Recommended</Text>
                  </View>
                )}
              </View>
            </View>

            <View className="mt-3 flex-row items-center gap-2 rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
              <Icon name="information-circle-outline" size={16} color={colors.info} />
              <Text variant="caption" style={{ color: colors.info }}>
                You save {amt(tax.savings)} with {tax.recommended}
              </Text>
            </View>
          </Card>

          {/* Summary */}
          <Card className="mb-3">
            <Text variant="label" className="mb-3">Summary</Text>
            <ResultRow label="Annual Gross" value={amt(annualGross)} />
            <ResultRow label="Deductions" value={amt(annualDeductions)} />
            <ResultRow label="Taxable Income" value={amt(tax.taxableIncome)} />
            <View className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />
            <ResultRow label="3% Percentage Tax" value={amt(tax.percentageTax)} />
            <Text variant="caption" className="mt-2 text-neutral-400">
              For non-VAT registered businesses with gross sales ≤ ₱3M/year.
            </Text>
          </Card>
        </>
      )}
    </>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text variant="body" className="text-neutral-600 dark:text-neutral-400">{label}</Text>
      <Text variant="body" className="font-sans-semibold">{value}</Text>
    </View>
  );
}
