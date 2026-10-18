import { eq, and } from 'drizzle-orm';
import { getDb, getSqlite, withTransaction } from './index';
import type { Scalar } from '@op-engineering/op-sqlite';
import {
  accounts,
  transactions,
  budgets,
  goals,
  recurringBills,
  billPayments,
  debtInfos,
  cards,
  utangs,
  utangPayments,
  paluwagans,
  paluwaganMembers,
  remittances,
  govtContributions,
  subscriptions,
  netWorthSnapshots,
  manualAssets,
  taxRecords,
  recurringTransactions,
  customCategories,
  customSubcategories,
  savedPayees,
  savedTags,
  wishlistItems,
  plannerItems,
  appNotifications,
  profile,
  transactionTemplates,
  splitGroups,
  splitGroupMembers,
  householdMembers,
  sharedBudgets,
  sharedBudgetContributions,
  accountabilityPartners,
} from './schema';

// ── Helpers ───────────────────────────────────────────────────────────────────
// op-sqlite executeSync returns rows with snake_case keys.
// We use it for synchronous reads to keep Zustand actions sync.

type Row = Record<string, Scalar>;

const VALID_COLUMN = /^[a-z][a-z0-9_]*$/;
const VALID_TABLE = /^[a-z][a-z0-9_]*$/;

/**
 * Allowlist of every table name that may appear in a safeUpdate call.
 * This prevents SQL injection through a dynamically supplied table name.
 * Kept in sync with ALL_TABLES and the 'profile' singleton below.
 */
const VALID_TABLES = new Set([
  'accounts', 'transactions', 'budgets', 'goals',
  'recurring_bills', 'bill_payments', 'debt_infos', 'cards',
  'utangs', 'utang_payments', 'paluwagans', 'paluwagan_members',
  'remittances', 'govt_contributions', 'subscriptions',
  'net_worth_snapshots', 'manual_assets', 'tax_records',
  'recurring_transactions', 'custom_categories', 'custom_subcategories',
  'saved_payees', 'saved_tags', 'wishlist_items', 'planner_items',
  'app_notifications', 'transaction_templates',
  'split_groups', 'split_group_members',
  'household_members', 'shared_budgets', 'shared_budget_contributions',
  'accountability_partners', 'profile',
]);

function query(sql: string, params?: Scalar[]): Row[] {
  return getSqlite().executeSync(sql, params).rows as Row[];
}

function exec(sql: string, params?: Scalar[]): void {
  getSqlite().executeSync(sql, params);
}

/** Build and execute a safe UPDATE from a key→value record, validating table and column names. */
function safeUpdate(table: string, idCol: string, idVal: Scalar, data: Record<string, Scalar>): void {
  if (!VALID_TABLES.has(table) || !VALID_TABLE.test(table)) {
    throw new Error(`[DB] Invalid or disallowed table name: "${table}"`);
  }
  if (!VALID_COLUMN.test(idCol)) {
    throw new Error(`[DB] Invalid id column name: "${idCol}"`);
  }
  const keys = Object.keys(data);
  if (keys.length === 0) return;
  for (const k of keys) {
    if (!VALID_COLUMN.test(k)) throw new Error(`[DB] Invalid column name: "${k}"`);
  }
  const sets = keys.map((k) => `${k} = ?`).join(', ');
  exec(`UPDATE ${table} SET ${sets} WHERE ${idCol} = ?`, [...Object.values(data), idVal]);
}

// ── Accounts ──────────────────────────────────────────────────────────────────

export const accountRepo = {
  getAll: (): Row[] => query('SELECT * FROM accounts'),
  getById: (id: string): Row | undefined =>
    query('SELECT * FROM accounts WHERE id = ?', [id])[0],
  insert: (data: typeof accounts.$inferInsert) =>
    exec(
      'INSERT INTO accounts (id, name, type, balance, currency, institution, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.name, data.type, data.balance, data.currency, data.institution ?? null, data.icon ?? null, data.color ?? null],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('accounts', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM accounts WHERE id = ?', [id]),
};

// ── Transactions ──────────────────────────────────────────────────────────────

export const transactionRepo = {
  getAll: (): Row[] => query('SELECT * FROM transactions ORDER BY date DESC'),
  insert: (data: typeof transactions.$inferInsert) =>
    exec(
      `INSERT INTO transactions (id, account_id, type, amount, currency, description, merchant_name, category, date, tags, splits, subcategory, card_id, receipt_uri, notes, to_account_id, exchange_rate, is_business) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id, data.accountId, data.type, data.amount, data.currency,
        data.description, data.merchantName, data.category, data.date,
        data.tags ? JSON.stringify(data.tags) : null,
        data.splits ? JSON.stringify(data.splits) : null,
        data.subcategory ?? null, data.cardId ?? null, data.receiptUri ?? null,
        data.notes ?? null, data.toAccountId ?? null, data.exchangeRate ?? null,
        data.isBusiness ? 1 : 0,
      ],
    ),
  insertMany: (items: (typeof transactions.$inferInsert)[]) => {
    for (const data of items) transactionRepo.insert(data);
  },
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('transactions', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM transactions WHERE id = ?', [id]),
  deleteAll: () => exec('DELETE FROM transactions'),
};

// ── Budgets ───────────────────────────────────────────────────────────────────

export const budgetRepo = {
  getAll: (): Row[] => query('SELECT * FROM budgets'),
  insert: (data: typeof budgets.$inferInsert) =>
    exec(
      'INSERT INTO budgets (id, name, category, amount, spent, period, style, rollover, rollover_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.name, data.category, data.amount, data.spent, data.period, data.style ?? null, data.rollover ? 1 : 0, data.rolloverAmount ?? null],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('budgets', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM budgets WHERE id = ?', [id]),
};

// ── Goals ─────────────────────────────────────────────────────────────────────

export const goalRepo = {
  getAll: (): Row[] => query('SELECT * FROM goals'),
  insert: (data: typeof goals.$inferInsert) =>
    exec(
      'INSERT INTO goals (id, name, target_amount, current_amount, target_date, icon, color, challenge_type, is_locked, linked_account_id, is_emergency_fund) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.name, data.targetAmount, data.currentAmount, data.targetDate, data.icon, data.color, data.challengeType ?? null, data.isLocked ? 1 : 0, data.linkedAccountId ?? null, data.isEmergencyFund ? 1 : 0],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('goals', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM goals WHERE id = ?', [id]),
};

// ── Recurring Bills ───────────────────────────────────────────────────────────

export const recurringBillRepo = {
  getAll: (): Row[] => query('SELECT * FROM recurring_bills'),
  insert: (data: typeof recurringBills.$inferInsert) =>
    exec(
      'INSERT INTO recurring_bills (id, name, amount, category, frequency, due_day, account_id, is_active, last_paid_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.name, data.amount, data.category, data.frequency, data.dueDay, data.accountId ?? null, data.isActive ? 1 : 0, data.lastPaidDate ?? null],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('recurring_bills', 'id', id, data),
  delete: (id: string) => withTransaction(() => {
    exec('DELETE FROM bill_payments WHERE bill_id = ?', [id]);
    exec('DELETE FROM recurring_bills WHERE id = ?', [id]);
  }),
};

// ── Bill Payments ─────────────────────────────────────────────────────────────

export const billPaymentRepo = {
  getByBillId: (billId: string): Row[] =>
    query('SELECT * FROM bill_payments WHERE bill_id = ?', [billId]),
  getAll: (): Row[] => query('SELECT * FROM bill_payments'),
  insert: (data: typeof billPayments.$inferInsert) =>
    exec(
      'INSERT INTO bill_payments (id, bill_id, date, amount, transaction_id) VALUES (?, ?, ?, ?, ?)',
      [data.id, data.billId, data.date, data.amount, data.transactionId ?? null],
    ),
};

// ── Debt Infos ────────────────────────────────────────────────────────────────

export const debtInfoRepo = {
  getAll: (): Row[] => query('SELECT * FROM debt_infos'),
  insert: (data: typeof debtInfos.$inferInsert) =>
    exec(
      'INSERT INTO debt_infos (account_id, interest_rate, minimum_payment, extra_payment) VALUES (?, ?, ?, ?)',
      [data.accountId, data.interestRate, data.minimumPayment, data.extraPayment ?? null],
    ),
  update: (accountId: string, data: Record<string, Scalar>) => safeUpdate('debt_infos', 'account_id', accountId, data),
  delete: (accountId: string) => exec('DELETE FROM debt_infos WHERE account_id = ?', [accountId]),
};

// ── Cards ─────────────────────────────────────────────────────────────────────

export const cardRepo = {
  getAll: (): Row[] => query('SELECT * FROM cards'),
  insert: (data: typeof cards.$inferInsert) =>
    exec(
      'INSERT INTO cards (id, nickname, type, last4, linked_account_id, network, credit_limit, outstanding_balance, statement_cut_day, payment_due_day, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.nickname, data.type, data.last4, data.linkedAccountId ?? null, data.network, data.creditLimit ?? null, data.outstandingBalance ?? null, data.statementCutDay ?? null, data.paymentDueDay ?? null, data.isActive ? 1 : 0],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('cards', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM cards WHERE id = ?', [id]),
};

// ── Utangs ────────────────────────────────────────────────────────────────────

export const utangRepo = {
  getAll: (): Row[] => query('SELECT * FROM utangs'),
  insert: (data: typeof utangs.$inferInsert) =>
    exec(
      'INSERT INTO utangs (id, person_name, type, amount, remaining_balance, description, date, expected_return_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.personName, data.type, data.amount, data.remainingBalance, data.description ?? null, data.date, data.expectedReturnDate ?? null, data.status],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('utangs', 'id', id, data),
  delete: (id: string) => withTransaction(() => {
    exec('DELETE FROM utang_payments WHERE utang_id = ?', [id]);
    exec('DELETE FROM utangs WHERE id = ?', [id]);
  }),
};

// ── Utang Payments ────────────────────────────────────────────────────────────

export const utangPaymentRepo = {
  getByUtangId: (utangId: string): Row[] =>
    query('SELECT * FROM utang_payments WHERE utang_id = ?', [utangId]),
  getAll: (): Row[] => query('SELECT * FROM utang_payments'),
  insert: (data: typeof utangPayments.$inferInsert) =>
    exec(
      'INSERT INTO utang_payments (id, utang_id, amount, date, note) VALUES (?, ?, ?, ?, ?)',
      [data.id, data.utangId, data.amount, data.date, data.note ?? null],
    ),
};

// ── Paluwagans ────────────────────────────────────────────────────────────────

export const paluwaganRepo = {
  getAll: (): Row[] => query('SELECT * FROM paluwagans'),
  insert: (data: typeof paluwagans.$inferInsert) =>
    exec(
      'INSERT INTO paluwagans (id, group_name, contribution_amount, frequency, start_date, current_round, total_rounds) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.groupName, data.contributionAmount, data.frequency, data.startDate, data.currentRound, data.totalRounds],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('paluwagans', 'id', id, data),
  delete: (id: string) => withTransaction(() => {
    exec('DELETE FROM paluwagan_members WHERE paluwagan_id = ?', [id]);
    exec('DELETE FROM paluwagans WHERE id = ?', [id]);
  }),
};

// ── Paluwagan Members ─────────────────────────────────────────────────────────

export const paluwaganMemberRepo = {
  getByPaluwaganId: (paluwaganId: string): Row[] =>
    query('SELECT * FROM paluwagan_members WHERE paluwagan_id = ?', [paluwaganId]),
  getAll: (): Row[] => query('SELECT * FROM paluwagan_members'),
  insert: (data: typeof paluwaganMembers.$inferInsert) =>
    exec(
      'INSERT INTO paluwagan_members (paluwagan_id, name, turn_order, has_paid_current_round, has_received) VALUES (?, ?, ?, ?, ?)',
      [data.paluwaganId, data.name, data.turnOrder, data.hasPaidCurrentRound ? 1 : 0, data.hasReceived ? 1 : 0],
    ),
  deleteByPaluwaganId: (paluwaganId: string) =>
    exec('DELETE FROM paluwagan_members WHERE paluwagan_id = ?', [paluwaganId]),
};

// ── Remittances ───────────────────────────────────────────────────────────────

export const remittanceRepo = {
  getAll: (): Row[] => query('SELECT * FROM remittances'),
  insert: (data: typeof remittances.$inferInsert) =>
    exec(
      'INSERT INTO remittances (id, sender_name, amount_foreign, foreign_currency, exchange_rate, amount_php, channel, date, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.senderName, data.amountForeign, data.foreignCurrency, data.exchangeRate, data.amountPHP, data.channel, data.date, data.note ?? null],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('remittances', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM remittances WHERE id = ?', [id]),
};

// ── Govt Contributions ────────────────────────────────────────────────────────

export const govtContributionRepo = {
  getAll: (): Row[] => query('SELECT * FROM govt_contributions'),
  insert: (data: typeof govtContributions.$inferInsert) =>
    exec(
      'INSERT INTO govt_contributions (id, type, year, month, amount, paid_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.type, data.year, data.month, data.amount, data.paidDate ?? null, data.status],
    ),
  markPaid: (type: string, year: number, month: number, paidDate: string) =>
    exec(
      'UPDATE govt_contributions SET status = ?, paid_date = ? WHERE type = ? AND year = ? AND month = ?',
      ['paid', paidDate, type, year, month],
    ),
};

// ── Subscriptions ─────────────────────────────────────────────────────────────

export const subscriptionRepo = {
  getAll: (): Row[] => query('SELECT * FROM subscriptions'),
  insert: (data: typeof subscriptions.$inferInsert) =>
    exec(
      'INSERT INTO subscriptions (id, name, amount, currency, frequency, renewal_day, category, payment_method, is_active, notes, flagged_for_review) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.name, data.amount, data.currency, data.frequency, data.renewalDay, data.category, data.paymentMethod ?? null, data.isActive ? 1 : 0, data.notes ?? null, data.flaggedForReview ? 1 : 0],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('subscriptions', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM subscriptions WHERE id = ?', [id]),
};

// ── Net Worth Snapshots ───────────────────────────────────────────────────────

export const netWorthSnapshotRepo = {
  getAll: (): Row[] => query('SELECT * FROM net_worth_snapshots'),
  insert: (data: typeof netWorthSnapshots.$inferInsert) =>
    exec(
      'INSERT INTO net_worth_snapshots (id, date, total_assets, total_liabilities, net_worth) VALUES (?, ?, ?, ?, ?)',
      [data.id, data.date, data.totalAssets, data.totalLiabilities, data.netWorth],
    ),
};

// ── Manual Assets ─────────────────────────────────────────────────────────────

export const manualAssetRepo = {
  getAll: (): Row[] => query('SELECT * FROM manual_assets'),
  insert: (data: typeof manualAssets.$inferInsert) =>
    exec(
      'INSERT INTO manual_assets (id, name, value, category, notes) VALUES (?, ?, ?, ?, ?)',
      [data.id, data.name, data.value, data.category, data.notes ?? null],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('manual_assets', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM manual_assets WHERE id = ?', [id]),
};

// ── Tax Records ───────────────────────────────────────────────────────────────

export const taxRecordRepo = {
  getAll: (): Row[] => query('SELECT * FROM tax_records'),
  insert: (data: typeof taxRecords.$inferInsert) =>
    exec(
      'INSERT INTO tax_records (id, year, quarter, gross_income, deductions, tax_due, tax_paid, filing_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.year, data.quarter, data.grossIncome, data.deductions, data.taxDue, data.taxPaid, data.filingDate ?? null, data.status],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('tax_records', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM tax_records WHERE id = ?', [id]),
};

// ── Recurring Transactions ────────────────────────────────────────────────────

export const recurringTransactionRepo = {
  getAll: (): Row[] => query('SELECT * FROM recurring_transactions'),
  insert: (data: typeof recurringTransactions.$inferInsert) =>
    exec(
      'INSERT INTO recurring_transactions (id, type, amount, currency, category, merchant_name, description, account_id, to_account_id, frequency, day_of_month, next_due_date, is_active, last_processed_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.type, data.amount, data.currency, data.category, data.merchantName, data.description ?? null, data.accountId, data.toAccountId ?? null, data.frequency, data.dayOfMonth ?? null, data.nextDueDate, data.isActive ? 1 : 0, data.lastProcessedDate ?? null],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('recurring_transactions', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM recurring_transactions WHERE id = ?', [id]),
};

// ── Custom Categories ─────────────────────────────────────────────────────────

export const customCategoryRepo = {
  getAll: (): Row[] => query('SELECT * FROM custom_categories'),
  insert: (data: typeof customCategories.$inferInsert) =>
    exec(
      'INSERT INTO custom_categories (id, label, icon, color, type) VALUES (?, ?, ?, ?, ?)',
      [data.id, data.label, data.icon, data.color, data.type],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('custom_categories', 'id', id, data),
  delete: (id: string) => withTransaction(() => {
    exec('DELETE FROM custom_subcategories WHERE parent_category_id = ?', [id]);
    exec('DELETE FROM custom_categories WHERE id = ?', [id]);
  }),
};

// ── Custom Subcategories ──────────────────────────────────────────────────────

export const customSubcategoryRepo = {
  getAll: (): Row[] => query('SELECT * FROM custom_subcategories'),
  insert: (data: typeof customSubcategories.$inferInsert) =>
    exec(
      'INSERT INTO custom_subcategories (id, parent_category_id, label) VALUES (?, ?, ?)',
      [data.id, data.parentCategoryId, data.label],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('custom_subcategories', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM custom_subcategories WHERE id = ?', [id]),
};

// ── Saved Payees ──────────────────────────────────────────────────────────────

export const savedPayeeRepo = {
  getAll: (): Row[] => query('SELECT * FROM saved_payees'),
  insert: (data: typeof savedPayees.$inferInsert) =>
    exec(
      'INSERT INTO saved_payees (id, name, category, is_favorite, last_used, use_count) VALUES (?, ?, ?, ?, ?, ?)',
      [data.id, data.name, data.category ?? null, data.isFavorite ? 1 : 0, data.lastUsed ?? null, data.useCount],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('saved_payees', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM saved_payees WHERE id = ?', [id]),
};

// ── Saved Tags ────────────────────────────────────────────────────────────────

export const savedTagRepo = {
  getAll: (): Row[] => query('SELECT * FROM saved_tags'),
  insert: (data: typeof savedTags.$inferInsert) =>
    exec(
      'INSERT INTO saved_tags (id, name, color, use_count) VALUES (?, ?, ?, ?)',
      [data.id, data.name, data.color ?? null, data.useCount],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('saved_tags', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM saved_tags WHERE id = ?', [id]),
};

// ── Wishlist Items ────────────────────────────────────────────────────────────

export const wishlistItemRepo = {
  getAll: (): Row[] => query('SELECT * FROM wishlist_items'),
  insert: (data: typeof wishlistItems.$inferInsert) =>
    exec(
      'INSERT INTO wishlist_items (id, name, target_amount, current_amount, priority, category, image_url, link, notes, is_purchased, purchased_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.name, data.targetAmount, data.currentAmount, data.priority, data.category ?? null, data.imageUrl ?? null, data.link ?? null, data.notes ?? null, data.isPurchased ? 1 : 0, data.purchasedDate ?? null],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('wishlist_items', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM wishlist_items WHERE id = ?', [id]),
};

// ── Planner Items ─────────────────────────────────────────────────────────────

export const plannerItemRepo = {
  getAll: (): Row[] => query('SELECT * FROM planner_items'),
  insert: (data: typeof plannerItems.$inferInsert) =>
    exec(
      'INSERT INTO planner_items (id, planner_type, label, amount, status, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.plannerType, data.label, data.amount, data.status, data.icon, data.color],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('planner_items', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM planner_items WHERE id = ?', [id]),
};

// ── App Notifications ─────────────────────────────────────────────────────────

export const appNotificationRepo = {
  getAll: (): Row[] => query('SELECT * FROM app_notifications ORDER BY created_at DESC'),
  insert: (data: typeof appNotifications.$inferInsert) =>
    exec(
      'INSERT INTO app_notifications (id, title, body, type, related_id, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.title, data.body, data.type, data.relatedId ?? null, data.isRead ? 1 : 0, data.createdAt],
    ),
  markRead: (id: string) => exec('UPDATE app_notifications SET is_read = 1 WHERE id = ?', [id]),
  markAllRead: () => exec('UPDATE app_notifications SET is_read = 1'),
  delete: (id: string) => exec('DELETE FROM app_notifications WHERE id = ?', [id]),
  deleteAll: () => exec('DELETE FROM app_notifications'),
};

// ── Profile (singleton) ───────────────────────────────────────────────────────

export const profileRepo = {
  get: (): Row | undefined => query('SELECT * FROM profile WHERE id = 1')[0],
  update: (data: Record<string, Scalar>) => safeUpdate('profile', 'id', 1, data),
};

// ── Transaction Templates ─────────────────────────────────────────────────

export const transactionTemplateRepo = {
  getAll: (): Row[] => query('SELECT * FROM transaction_templates'),
  insert: (data: typeof transactionTemplates.$inferInsert) =>
    exec(
      'INSERT INTO transaction_templates (id, name, merchant_name, amount, category, type, account_id, currency, description, subcategory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.name, data.merchantName, data.amount, data.category, data.type, data.accountId, data.currency, data.description, data.subcategory ?? null],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('transaction_templates', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM transaction_templates WHERE id = ?', [id]),
};

// ── Split Groups ──────────────────────────────────────────────────────────

export const splitGroupRepo = {
  getAll: (): Row[] => query('SELECT * FROM split_groups'),
  insert: (data: typeof splitGroups.$inferInsert) =>
    exec(
      'INSERT INTO split_groups (id, title, date, total_amount, settled) VALUES (?, ?, ?, ?, ?)',
      [data.id, data.title, data.date, data.totalAmount, data.settled ? 1 : 0],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('split_groups', 'id', id, data),
  delete: (id: string) => withTransaction(() => {
    exec('DELETE FROM split_group_members WHERE split_group_id = ?', [id]);
    exec('DELETE FROM split_groups WHERE id = ?', [id]);
  }),
};

// ── Split Group Members ───────────────────────────────────────────────────

export const splitGroupMemberRepo = {
  getBySplitGroupId: (splitGroupId: string): Row[] =>
    query('SELECT * FROM split_group_members WHERE split_group_id = ?', [splitGroupId]),
  getAll: (): Row[] => query('SELECT * FROM split_group_members'),
  insert: (data: typeof splitGroupMembers.$inferInsert) =>
    exec(
      'INSERT INTO split_group_members (split_group_id, name, avatar, owes, paid) VALUES (?, ?, ?, ?, ?)',
      [data.splitGroupId, data.name, data.avatar, data.owes, data.paid ? 1 : 0],
    ),
  deleteBySplitGroupId: (splitGroupId: string) =>
    exec('DELETE FROM split_group_members WHERE split_group_id = ?', [splitGroupId]),
  updatePaid: (splitGroupId: string, memberName: string, paid: boolean) =>
    exec('UPDATE split_group_members SET paid = ? WHERE split_group_id = ? AND name = ?', [paid ? 1 : 0, splitGroupId, memberName]),
  updateAllPaid: (splitGroupId: string) =>
    exec('UPDATE split_group_members SET paid = 1 WHERE split_group_id = ?', [splitGroupId]),
};

// ── Household Members ─────────────────────────────────────────────────────

export const householdMemberRepo = {
  getAll: (): Row[] => query('SELECT * FROM household_members'),
  insert: (data: typeof householdMembers.$inferInsert) =>
    exec(
      'INSERT INTO household_members (id, name, avatar, color) VALUES (?, ?, ?, ?)',
      [data.id, data.name, data.avatar, data.color],
    ),
  delete: (id: string) => exec('DELETE FROM household_members WHERE id = ?', [id]),
};

// ── Shared Budgets ────────────────────────────────────────────────────────

export const sharedBudgetRepo = {
  getAll: (): Row[] => query('SELECT * FROM shared_budgets'),
  insert: (data: typeof sharedBudgets.$inferInsert) =>
    exec(
      'INSERT INTO shared_budgets (id, label, amount, spent, icon, color) VALUES (?, ?, ?, ?, ?, ?)',
      [data.id, data.label, data.amount, data.spent, data.icon, data.color],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('shared_budgets', 'id', id, data),
  delete: (id: string) => withTransaction(() => {
    exec('DELETE FROM shared_budget_contributions WHERE shared_budget_id = ?', [id]);
    exec('DELETE FROM shared_budgets WHERE id = ?', [id]);
  }),
};

// ── Shared Budget Contributions ───────────────────────────────────────────

export const sharedBudgetContributionRepo = {
  getByBudgetId: (budgetId: string): Row[] =>
    query('SELECT * FROM shared_budget_contributions WHERE shared_budget_id = ?', [budgetId]),
  getAll: (): Row[] => query('SELECT * FROM shared_budget_contributions'),
  insert: (data: typeof sharedBudgetContributions.$inferInsert) =>
    exec(
      'INSERT INTO shared_budget_contributions (shared_budget_id, member_id, amount) VALUES (?, ?, ?)',
      [data.sharedBudgetId, data.memberId, data.amount],
    ),
  upsert: (sharedBudgetId: string, memberId: string, amount: number) => {
    const existing = query(
      'SELECT id FROM shared_budget_contributions WHERE shared_budget_id = ? AND member_id = ?',
      [sharedBudgetId, memberId],
    )[0];
    if (existing) {
      exec(
        'UPDATE shared_budget_contributions SET amount = ? WHERE shared_budget_id = ? AND member_id = ?',
        [amount, sharedBudgetId, memberId],
      );
    } else {
      exec(
        'INSERT INTO shared_budget_contributions (shared_budget_id, member_id, amount) VALUES (?, ?, ?)',
        [sharedBudgetId, memberId, amount],
      );
    }
  },
  deleteByBudgetId: (budgetId: string) =>
    exec('DELETE FROM shared_budget_contributions WHERE shared_budget_id = ?', [budgetId]),
};

// ── Accountability Partners ───────────────────────────────────────────────

export const accountabilityPartnerRepo = {
  getAll: (): Row[] => query('SELECT * FROM accountability_partners'),
  insert: (data: typeof accountabilityPartners.$inferInsert) =>
    exec(
      'INSERT INTO accountability_partners (id, name, goal_id, check_in_dates, streak, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [data.id, data.name, data.goalId ?? null, JSON.stringify(data.checkInDates), data.streak, data.createdAt],
    ),
  update: (id: string, data: Record<string, Scalar>) => safeUpdate('accountability_partners', 'id', id, data),
  delete: (id: string) => exec('DELETE FROM accountability_partners WHERE id = ?', [id]),
};

// ── Bulk Operations (for hydration + seed + reset) ────────────────────────────

const ALL_TABLES = [
  'bill_payments', 'utang_payments', 'paluwagan_members', 'custom_subcategories',
  'split_group_members', 'shared_budget_contributions',
  'transactions', 'recurring_transactions', 'debt_infos', 'cards', 'budgets',
  'goals', 'recurring_bills', 'utangs', 'paluwagans', 'remittances',
  'govt_contributions', 'subscriptions', 'net_worth_snapshots', 'manual_assets',
  'tax_records', 'custom_categories', 'saved_payees', 'saved_tags',
  'wishlist_items', 'planner_items', 'app_notifications',
  'transaction_templates', 'split_groups', 'household_members',
  'shared_budgets', 'accountability_partners', 'accounts',
];

export function truncateAll(): void {
  // Safe: ALL_TABLES is a hardcoded array of literal strings — no user input reaches here.
  withTransaction(() => {
    for (const table of ALL_TABLES) {
      exec(`DELETE FROM ${table}`);
    }
    exec("UPDATE profile SET name = '', email = '', currency = 'PHP', language = 'en', phone = '', employment_type = NULL, is_seeded = 0 WHERE id = 1");
  });
}

export function markSeeded(): void {
  exec('UPDATE profile SET is_seeded = 1 WHERE id = 1');
}

export function getIsSeeded(): boolean {
  const row = query('SELECT is_seeded FROM profile WHERE id = 1')[0];
  return row?.is_seeded === 1;
}
