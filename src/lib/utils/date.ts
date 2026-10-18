import {
  format,
  formatDistanceToNow,
  isToday as _isToday,
  isYesterday,
  isThisWeek as _isThisWeek,
  isThisMonth as _isThisMonth,
  isThisYear,
  parseISO,
} from 'date-fns';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function toDate(input: string | Date): Date {
  if (typeof input === 'string') {
    return parseISO(input);
  }
  return input;
}

// ────────────────────────────────────────────────────────────────────────────
// Format functions
// ────────────────────────────────────────────────────────────────────────────

/**
 * General-purpose date format.
 *
 * @param input - Date or ISO 8601 string.
 * @param pattern - date-fns format pattern (default: 'MMM d, yyyy').
 *
 * @example formatDate('2025-03-15') // "Mar 15, 2025"
 */
export function formatDate(input: string | Date, pattern: string = 'MMM d, yyyy'): string {
  try {
    return format(toDate(input), pattern);
  } catch {
    return String(input);
  }
}

/**
 * Human-friendly relative date, e.g. "5 minutes ago", "2 days ago".
 */
export function formatRelativeDate(input: string | Date): string {
  try {
    return formatDistanceToNow(toDate(input), { addSuffix: true });
  } catch {
    return String(input);
  }
}

/**
 * Smart date formatting optimised for transaction lists:
 * - Today       -> "Today, 2:30 PM"
 * - Yesterday   -> "Yesterday, 2:30 PM"
 * - This year   -> "Mar 15, 2:30 PM"
 * - Older       -> "Mar 15, 2024"
 */
export function formatTransactionDate(input: string | Date): string {
  try {
    const date = toDate(input);

    if (_isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    }

    if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    }

    if (isThisYear(date)) {
      return format(date, 'MMM d, h:mm a');
    }

    return format(date, 'MMM d, yyyy');
  } catch {
    return String(input);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Boolean checks (re-exported with a friendlier signature)
// ────────────────────────────────────────────────────────────────────────────

export function isToday(input: string | Date): boolean {
  try {
    return _isToday(toDate(input));
  } catch {
    return false;
  }
}

export function isThisWeek(input: string | Date): boolean {
  try {
    return _isThisWeek(toDate(input));
  } catch {
    return false;
  }
}

export function isThisMonth(input: string | Date): boolean {
  try {
    return _isThisMonth(toDate(input));
  } catch {
    return false;
  }
}
