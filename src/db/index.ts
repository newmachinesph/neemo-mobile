import { open, type DB as OpSQLiteDB } from '@op-engineering/op-sqlite';
import { drizzle } from 'drizzle-orm/op-sqlite';
import * as schema from './schema';
import { VECTOR_TABLES_SQL } from './schema/vectors';

const DB_NAME = 'neemo.db';

let _sqlite: OpSQLiteDB | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _vecLoaded = false;

export function initDatabase(): void {
  if (_db) return;

  try {
    _sqlite = open({ name: DB_NAME });
    _db = drizzle(_sqlite, { schema });

    // Enable WAL mode for better concurrent read/write performance
    _sqlite.executeSync('PRAGMA journal_mode = WAL;');
    _sqlite.executeSync('PRAGMA foreign_keys = ON;');
    _sqlite.executeSync('PRAGMA synchronous = NORMAL;');
    _sqlite.executeSync('PRAGMA cache_size = -8000;');
    _sqlite.executeSync('PRAGMA temp_store = MEMORY;');

    // Create all relational tables (must be synchronous!)
    createTablesSync(_sqlite);

    // Try loading sqlite-vec extension (optional — fails silently if not installed)
    tryLoadVec(_sqlite);
  } catch (error) {
    _sqlite = null;
    _db = null;
    if (__DEV__) console.error('[DB] Failed to initialize database:', error);
    throw error;
  }
}

function tryLoadVec(sqlite: OpSQLiteDB): void {
  try {
    // sqlite-vec is loaded as a runtime extension
    // This will throw if the package isn't installed yet
    sqlite.loadExtension('vec0');
    for (const ddl of VECTOR_TABLES_SQL) {
      sqlite.executeSync(ddl);
    }
    _vecLoaded = true;
  } catch {
    // sqlite-vec not installed yet — that's fine, vector features are optional
    _vecLoaded = false;
  }
}

export function isVecLoaded(): boolean {
  return _vecLoaded;
}

function createTablesSync(sqlite: OpSQLiteDB): void {
  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
    balance REAL NOT NULL, currency TEXT NOT NULL,
    institution TEXT, icon TEXT, color TEXT
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id),
    type TEXT NOT NULL, amount REAL NOT NULL, currency TEXT NOT NULL,
    description TEXT NOT NULL, merchant_name TEXT NOT NULL, category TEXT NOT NULL,
    date TEXT NOT NULL, tags TEXT, splits TEXT, subcategory TEXT,
    card_id TEXT, receipt_uri TEXT, notes TEXT, to_account_id TEXT,
    exchange_rate REAL, is_business INTEGER DEFAULT 0
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
    amount REAL NOT NULL, spent REAL NOT NULL, period TEXT NOT NULL,
    style TEXT, rollover INTEGER DEFAULT 0, rollover_amount REAL
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY, name TEXT NOT NULL,
    target_amount REAL NOT NULL, current_amount REAL NOT NULL,
    target_date TEXT NOT NULL, icon TEXT NOT NULL, color TEXT NOT NULL,
    challenge_type TEXT, is_locked INTEGER DEFAULT 0,
    linked_account_id TEXT, is_emergency_fund INTEGER DEFAULT 0
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS recurring_bills (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, amount REAL NOT NULL,
    category TEXT NOT NULL, frequency TEXT NOT NULL, due_day INTEGER NOT NULL,
    account_id TEXT, is_active INTEGER NOT NULL DEFAULT 1, last_paid_date TEXT
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS bill_payments (
    id TEXT PRIMARY KEY, bill_id TEXT NOT NULL REFERENCES recurring_bills(id),
    date TEXT NOT NULL, amount REAL NOT NULL, transaction_id TEXT
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS debt_infos (
    account_id TEXT PRIMARY KEY REFERENCES accounts(id),
    interest_rate REAL NOT NULL, minimum_payment REAL NOT NULL, extra_payment REAL
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY, nickname TEXT NOT NULL, type TEXT NOT NULL,
    last4 TEXT NOT NULL, linked_account_id TEXT, network TEXT NOT NULL,
    credit_limit REAL, outstanding_balance REAL,
    statement_cut_day INTEGER, payment_due_day INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS utangs (
    id TEXT PRIMARY KEY, person_name TEXT NOT NULL, type TEXT NOT NULL,
    amount REAL NOT NULL, remaining_balance REAL NOT NULL,
    description TEXT, date TEXT NOT NULL, expected_return_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS utang_payments (
    id TEXT PRIMARY KEY, utang_id TEXT NOT NULL REFERENCES utangs(id),
    amount REAL NOT NULL, date TEXT NOT NULL, note TEXT
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS paluwagans (
    id TEXT PRIMARY KEY, group_name TEXT NOT NULL,
    contribution_amount REAL NOT NULL, frequency TEXT NOT NULL,
    start_date TEXT NOT NULL, current_round INTEGER NOT NULL, total_rounds INTEGER NOT NULL
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS paluwagan_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paluwagan_id TEXT NOT NULL REFERENCES paluwagans(id),
    name TEXT NOT NULL, turn_order INTEGER NOT NULL,
    has_paid_current_round INTEGER NOT NULL DEFAULT 0,
    has_received INTEGER NOT NULL DEFAULT 0
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS remittances (
    id TEXT PRIMARY KEY, sender_name TEXT NOT NULL,
    amount_foreign REAL NOT NULL, foreign_currency TEXT NOT NULL,
    exchange_rate REAL NOT NULL, amount_php REAL NOT NULL,
    channel TEXT NOT NULL, date TEXT NOT NULL, note TEXT
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS govt_contributions (
    id TEXT PRIMARY KEY, type TEXT NOT NULL, year INTEGER NOT NULL,
    month INTEGER NOT NULL, amount REAL NOT NULL,
    paid_date TEXT, status TEXT NOT NULL DEFAULT 'unpaid'
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, amount REAL NOT NULL,
    currency TEXT NOT NULL, frequency TEXT NOT NULL, renewal_day INTEGER NOT NULL,
    category TEXT NOT NULL, payment_method TEXT,
    is_active INTEGER NOT NULL DEFAULT 1, notes TEXT,
    flagged_for_review INTEGER DEFAULT 0
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS net_worth_snapshots (
    id TEXT PRIMARY KEY, date TEXT NOT NULL,
    total_assets REAL NOT NULL, total_liabilities REAL NOT NULL, net_worth REAL NOT NULL
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS manual_assets (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, value REAL NOT NULL,
    category TEXT NOT NULL, notes TEXT
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS tax_records (
    id TEXT PRIMARY KEY, year INTEGER NOT NULL, quarter INTEGER NOT NULL,
    gross_income REAL NOT NULL, deductions REAL NOT NULL,
    tax_due REAL NOT NULL, tax_paid REAL NOT NULL,
    filing_date TEXT, status TEXT NOT NULL DEFAULT 'pending'
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS recurring_transactions (
    id TEXT PRIMARY KEY, type TEXT NOT NULL, amount REAL NOT NULL,
    currency TEXT NOT NULL, category TEXT NOT NULL,
    merchant_name TEXT NOT NULL, description TEXT,
    account_id TEXT NOT NULL, to_account_id TEXT,
    frequency TEXT NOT NULL, day_of_month INTEGER,
    next_due_date TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1,
    last_processed_date TEXT
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS custom_categories (
    id TEXT PRIMARY KEY, label TEXT NOT NULL, icon TEXT NOT NULL,
    color TEXT NOT NULL, type TEXT NOT NULL
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS custom_subcategories (
    id TEXT PRIMARY KEY,
    parent_category_id TEXT NOT NULL REFERENCES custom_categories(id),
    label TEXT NOT NULL
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS saved_payees (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT,
    is_favorite INTEGER NOT NULL DEFAULT 0, last_used TEXT,
    use_count INTEGER NOT NULL DEFAULT 0
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS saved_tags (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT,
    use_count INTEGER NOT NULL DEFAULT 0
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS wishlist_items (
    id TEXT PRIMARY KEY, name TEXT NOT NULL,
    target_amount REAL NOT NULL, current_amount REAL NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'medium', category TEXT,
    image_url TEXT, link TEXT, notes TEXT,
    is_purchased INTEGER NOT NULL DEFAULT 0, purchased_date TEXT
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS planner_items (
    id TEXT PRIMARY KEY, planner_type TEXT NOT NULL, label TEXT NOT NULL,
    amount REAL NOT NULL, status TEXT NOT NULL, icon TEXT NOT NULL, color TEXT NOT NULL
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS app_notifications (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL,
    type TEXT NOT NULL, related_id TEXT,
    is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '',
    currency TEXT NOT NULL DEFAULT 'PHP', language TEXT NOT NULL DEFAULT 'en',
    phone TEXT NOT NULL DEFAULT '', employment_type TEXT,
    is_seeded INTEGER NOT NULL DEFAULT 0
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS transaction_templates (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, merchant_name TEXT NOT NULL,
    amount REAL NOT NULL, category TEXT NOT NULL, type TEXT NOT NULL,
    account_id TEXT NOT NULL, currency TEXT NOT NULL, description TEXT NOT NULL,
    subcategory TEXT
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS split_groups (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, date TEXT NOT NULL,
    total_amount REAL NOT NULL, settled INTEGER NOT NULL DEFAULT 0
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS split_group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    split_group_id TEXT NOT NULL REFERENCES split_groups(id),
    name TEXT NOT NULL, avatar TEXT NOT NULL,
    owes REAL NOT NULL, paid INTEGER NOT NULL DEFAULT 0
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS household_members (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, avatar TEXT NOT NULL, color TEXT NOT NULL
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS shared_budgets (
    id TEXT PRIMARY KEY, label TEXT NOT NULL, amount REAL NOT NULL,
    spent REAL NOT NULL DEFAULT 0, icon TEXT NOT NULL, color TEXT NOT NULL
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS shared_budget_contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shared_budget_id TEXT NOT NULL REFERENCES shared_budgets(id),
    member_id TEXT NOT NULL, amount REAL NOT NULL
  )`);

  sqlite.executeSync(`CREATE TABLE IF NOT EXISTS accountability_partners (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, goal_id TEXT,
    check_in_dates TEXT NOT NULL DEFAULT '[]',
    streak INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
  )`);

  // Indexes for frequent queries
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(date)');
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_txn_account ON transactions(account_id)');
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_txn_category ON transactions(category)');
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_txn_type ON transactions(type)');
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_utang_pay ON utang_payments(utang_id)');
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_bill_pay ON bill_payments(bill_id)');
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_pal_member ON paluwagan_members(paluwagan_id)');
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_split_member ON split_group_members(split_group_id)');
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_sb_contrib ON shared_budget_contributions(shared_budget_id)');
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_govt_contrib_type_year ON govt_contributions(type, year, month)');
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_recurring_txn_next_due ON recurring_transactions(next_due_date)');
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_notifications_created ON app_notifications(created_at)');
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_wishlist_purchased ON wishlist_items(is_purchased)');
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_net_worth_date ON net_worth_snapshots(date)');
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_txn_date_type ON transactions(date, type)');
  sqlite.executeSync('CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(is_active)');

  // Ensure profile singleton row exists
  sqlite.executeSync('INSERT OR IGNORE INTO profile (id) VALUES (1)');
}

export type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

export function getDb(): DrizzleDb {
  if (!_db) throw new Error('Database not initialized. Call initDatabase() first.');
  return _db;
}

export function getSqlite(): OpSQLiteDB {
  if (!_sqlite) throw new Error('Database not initialized. Call initDatabase() first.');
  return _sqlite;
}

export function isDbReady(): boolean {
  return _db !== null;
}

export function closeDatabase(): void {
  if (_sqlite) {
    _sqlite.close();
    _sqlite = null;
    _db = null;
  }
}

/**
 * Executes `fn` inside a SQLite transaction.
 * Commits on success and rolls back on any thrown error, then re-throws.
 */
export function withTransaction<T>(fn: () => T): T {
  const sqlite = getSqlite();
  sqlite.executeSync('BEGIN TRANSACTION');
  try {
    const result = fn();
    sqlite.executeSync('COMMIT');
    return result;
  } catch (error) {
    sqlite.executeSync('ROLLBACK');
    throw error;
  }
}
