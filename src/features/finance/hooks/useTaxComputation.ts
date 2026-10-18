import { useMemo } from 'react';
import { useFinanceStore } from '../store/finance.store';

// PH 2023+ graduated tax table
function computeGraduatedTax(taxableIncome: number): number {
  if (taxableIncome <= 250_000) return 0;
  if (taxableIncome <= 400_000) return (taxableIncome - 250_000) * 0.15;
  if (taxableIncome <= 800_000) return 22_500 + (taxableIncome - 400_000) * 0.20;
  if (taxableIncome <= 2_000_000) return 102_500 + (taxableIncome - 800_000) * 0.25;
  if (taxableIncome <= 8_000_000) return 402_500 + (taxableIncome - 2_000_000) * 0.30;
  return 2_202_500 + (taxableIncome - 8_000_000) * 0.35;
}

export function useTaxComputation(annualGrossIncome: number, annualDeductions: number) {
  return useMemo(() => {
    const taxableIncome = Math.max(0, annualGrossIncome - annualDeductions);

    // Option A: 8% flat tax (for self-employed / professionals)
    // 8% on gross sales/receipts exceeding ₱250,000
    const flatTaxBase = Math.max(0, annualGrossIncome - 250_000);
    const flatTax = flatTaxBase * 0.08;

    // Option B: Graduated tax
    const graduatedTax = computeGraduatedTax(taxableIncome);

    // 3% Percentage Tax (for non-VAT registered)
    const percentageTax = annualGrossIncome * 0.03;

    // Quarterly breakdown
    const quarterlyGraduated = graduatedTax / 4;
    const quarterlyFlat = flatTax / 4;

    // Recommendation
    const recommended = flatTax <= graduatedTax ? '8% Flat' : 'Graduated';

    return {
      annualGrossIncome,
      annualDeductions,
      taxableIncome,
      flatTax,
      graduatedTax,
      percentageTax,
      quarterlyGraduated,
      quarterlyFlat,
      recommended,
      savings: Math.abs(flatTax - graduatedTax),
    };
  }, [annualGrossIncome, annualDeductions]);
}
