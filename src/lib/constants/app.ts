/** Human-readable application name. */
export const APP_NAME = 'Neemo';

/** Current application version (semver). */
export const APP_VERSION = '1.0.0';

/** Build number for native stores. */
export const APP_BUILD_NUMBER = 1;

/** Deep-link URL scheme. */
export const APP_SCHEME = 'neemo';

/** Bundle identifiers / package name. */
export const BUNDLE_ID = {
  IOS: 'one.neemo',
  ANDROID: 'one.neemo',
} as const;

// ────────────────────────────────────────────────────────────────────────────
// Timing constants
// ────────────────────────────────────────────────────────────────────────────

/** Default cache TTL: 5 minutes. */
export const CACHE_DURATION_MS = 5 * 60 * 1000;

/** Stale-while-revalidate window: 30 seconds. */
export const STALE_DURATION_MS = 30 * 1000;

/** Session inactivity timeout: 15 minutes. */
export const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

/** Token refresh interval: 10 minutes. */
export const TOKEN_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/** Debounce delay for search inputs: 300 ms. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Animation durations. */
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// ────────────────────────────────────────────────────────────────────────────
// Pagination
// ────────────────────────────────────────────────────────────────────────────

/** Default page size for paginated API requests. */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum page size the API accepts. */
export const MAX_PAGE_SIZE = 100;

// ────────────────────────────────────────────────────────────────────────────
// Storage keys
// ────────────────────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  AUTH_STORE: 'neemo-auth-store',
  THEME: 'neemo-theme',
  ONBOARDING_COMPLETE: 'neemo-onboarding-complete',
  LAST_SYNC: 'neemo-last-sync',
  PUSH_TOKEN: 'neemo-push-token',
  MINIAPPS_STORE: 'neemo-miniapps-store',
  FINANCE_STORE: 'neemo-finance-store',
  NOTIF_BILL_REMINDERS: 'neemo-notif-bill-reminders',
  NOTIF_BUDGET_ALERTS: 'neemo-notif-budget-alerts',
  NOTIF_RECURRING_REMINDERS: 'neemo-notif-recurring-reminders',
  LAST_CHECKIN: 'neemo-last-checkin',
} as const;
