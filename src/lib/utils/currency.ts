/**
 * Format a numeric amount as a full currency string.
 *
 * @param amount  - The numeric value to format.
 * @param currency - ISO 4217 currency code (default: 'PHP').
 * @param locale  - BCP 47 locale string (default: 'en-PH').
 *
 * @example
 * formatCurrency(1234.5)          // "₱1,234.50"
 * formatCurrency(1234.5, 'USD')   // "$1,234.50"
 */
export function formatCurrency(
  amount: number,
  currency: string = 'PHP',
  locale: string = 'en-PH',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback when Intl is not fully available (e.g. Hermes on older RN).
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format a numeric amount in a compact human-readable form.
 *
 * @param amount  - The numeric value to format.
 * @param currency - ISO 4217 currency code (default: 'PHP').
 * @param locale  - BCP 47 locale string (default: 'en-PH').
 *
 * @example
 * formatCompactCurrency(1_500_000) // "₱1.5M"
 * formatCompactCurrency(2_300)     // "₱2.3K"
 */
export function formatCompactCurrency(
  amount: number,
  currency: string = 'PHP',
  locale: string = 'en-PH',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    // Simple fallback for environments without compact notation support.
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (abs >= 1_000_000_000) return `${sign}₱${(abs / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${sign}₱${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}₱${(abs / 1_000).toFixed(1)}K`;
    return `${sign}₱${abs.toFixed(2)}`;
  }
}

/**
 * Returns a masked currency string like "₱ •••••"
 */
export function maskedCurrency(currency: string = 'PHP'): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol} •••••`;
}

// ── Exchange Rates (to PHP) ─────────────────────────────────────────────────

/** Hardcoded exchange rates to PHP. */
export const EXCHANGE_RATES: Record<string, number> = {
  PHP: 1,
  USD: 56.5,
  SGD: 42.1,
  AED: 15.4,
  EUR: 61.5,
  GBP: 71.8,
  JPY: 0.38,
  KRW: 0.042,
  AUD: 36.8,
  CAD: 41.2,
  HKD: 7.25,
  CNY: 7.85,
  THB: 1.62,
  MYR: 12.8,
  IDR: 0.0036,
  INR: 0.68,
  TWD: 1.77,
  VND: 0.0023,
  SAR: 15.07,
  QAR: 15.52,
  KWD: 184.5,
  BHD: 150.0,
};

/**
 * Convert an amount between currencies using PHP as the base.
 *
 * @example
 * convertToBase(100, 'USD', 'PHP') // 5650
 * convertToBase(1000, 'PHP', 'USD') // ~17.70
 */
export function convertToBase(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  const fromRate = EXCHANGE_RATES[from] ?? 1;
  const toRate = EXCHANGE_RATES[to] ?? 1;
  // Convert: from → PHP → to
  return (amount * fromRate) / toRate;
}

/**
 * Returns the currency symbol for a given ISO 4217 code.
 */
export function getCurrencySymbol(currency: string = 'PHP', locale: string = 'en-PH'): string {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
}
