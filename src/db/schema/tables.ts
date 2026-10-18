import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

// ---------------------------------------------------------------------------
// 1. Accounts
// ---------------------------------------------------------------------------
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  balance: real('balance').notNull(),
  currency: text('currency').notNull(),
  institution: text('institution'),
  icon: text('icon'),
  color: text('color'),
});

// ---------------------------------------------------------------------------
// 2. Transactions
// ---------------------------------------------------------------------------
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id),
  type: text('type').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull(),
  description: text('description').notNull(),
  merchantName: text('merchant_name').notNull(),
  category: text('category').notNull(),
  date: text('date').notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  splits: text('splits', { mode: 'json' }).$type<
    { category: string; amount: number }[]
  >(),
  subcategory: text('subcategory'),
  cardId: text('card_id'),
  receiptUri: text('receipt_uri'),
  notes: text('notes'),
  toAccountId: text('to_account_id'),
  exchangeRate: real('exchange_rate'),
  isBusiness: integer('is_business', { mode: 'boolean' }),
});

// ---------------------------------------------------------------------------
// 3. Budgets
// ---------------------------------------------------------------------------
export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  amount: real('amount').notNull(),
  spent: real('spent').notNull(),
  period: text('period').notNull(),
  style: text('style'),
  rollover: integer('rollover', { mode: 'boolean' }),
  rolloverAmount: real('rollover_amount'),
});

// ---------------------------------------------------------------------------
// 4. Goals
// ---------------------------------------------------------------------------
export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').notNull(),
  targetDate: text('target_date').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  challengeType: text('challenge_type'),
  isLocked: integer('is_locked', { mode: 'boolean' }),
  linkedAccountId: text('linked_account_id'),
  isEmergencyFund: integer('is_emergency_fund', { mode: 'boolean' }),
});

// ---------------------------------------------------------------------------
// 5. Recurring Bills
// ---------------------------------------------------------------------------
export const recurringBills = sqliteTable('recurring_bills', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  category: text('category').notNull(),
  frequency: text('frequency').notNull(),
  dueDay: integer('due_day').notNull(),
  accountId: text('account_id'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull(),
  lastPaidDate: text('last_paid_date'),
});

// ---------------------------------------------------------------------------
// 6. Bill Payments (junction for paymentHistory[])
// ---------------------------------------------------------------------------
export const billPayments = sqliteTable('bill_payments', {
  id: text('id').primaryKey(),
  billId: text('bill_id')
    .notNull()
    .references(() => recurringBills.id),
  date: text('date').notNull(),
  amount: real('amount').notNull(),
  transactionId: text('transaction_id'),
});

// ---------------------------------------------------------------------------
// 7. Debt Infos
// ---------------------------------------------------------------------------
export const debtInfos = sqliteTable('debt_infos', {
  accountId: text('account_id')
    .primaryKey()
    .references(() => accounts.id),
  interestRate: real('interest_rate').notNull(),
  minimumPayment: real('minimum_payment').notNull(),
  extraPayment: real('extra_payment'),
});

// ---------------------------------------------------------------------------
// 8. Cards
// ---------------------------------------------------------------------------
export const cards = sqliteTable('cards', {
  id: text('id').primaryKey(),
  nickname: text('nickname').notNull(),
  type: text('type').notNull(),
  last4: text('last4').notNull(),
  linkedAccountId: text('linked_account_id'),
  network: text('network').notNull(),
  creditLimit: real('credit_limit'),
  outstandingBalance: real('outstanding_balance'),
  statementCutDay: integer('statement_cut_day'),
  paymentDueDay: integer('payment_due_day'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull(),
});

// ---------------------------------------------------------------------------
// 9. Utangs (Debts / IOUs)
// ---------------------------------------------------------------------------
export const utangs = sqliteTable('utangs', {
  id: text('id').primaryKey(),
  personName: text('person_name').notNull(),
  type: text('type').notNull(),
  amount: real('amount').notNull(),
  remainingBalance: real('remaining_balance').notNull(),
  description: text('description'),
  date: text('date').notNull(),
  expectedReturnDate: text('expected_return_date'),
  status: text('status').notNull(),
});

// ---------------------------------------------------------------------------
// 10. Utang Payments (junction for payments[])
// ---------------------------------------------------------------------------
export const utangPayments = sqliteTable('utang_payments', {
  id: text('id').primaryKey(),
  utangId: text('utang_id')
    .notNull()
    .references(() => utangs.id),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  note: text('note'),
});

// ---------------------------------------------------------------------------
// 11. Paluwagans (Rotating Savings Groups)
// ---------------------------------------------------------------------------
export const paluwagans = sqliteTable('paluwagans', {
  id: text('id').primaryKey(),
  groupName: text('group_name').notNull(),
  contributionAmount: real('contribution_amount').notNull(),
  frequency: text('frequency').notNull(),
  startDate: text('start_date').notNull(),
  currentRound: integer('current_round').notNull(),
  totalRounds: integer('total_rounds').notNull(),
});

// ---------------------------------------------------------------------------
// 12. Paluwagan Members (junction for members[])
// ---------------------------------------------------------------------------
export const paluwaganMembers = sqliteTable('paluwagan_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  paluwaganId: text('paluwagan_id')
    .notNull()
    .references(() => paluwagans.id),
  name: text('name').notNull(),
  turnOrder: integer('turn_order').notNull(),
  hasPaidCurrentRound: integer('has_paid_current_round', {
    mode: 'boolean',
  }).notNull(),
  hasReceived: integer('has_received', { mode: 'boolean' }).notNull(),
});

// ---------------------------------------------------------------------------
// 13. Remittances
// ---------------------------------------------------------------------------
export const remittances = sqliteTable('remittances', {
  id: text('id').primaryKey(),
  senderName: text('sender_name').notNull(),
  amountForeign: real('amount_foreign').notNull(),
  foreignCurrency: text('foreign_currency').notNull(),
  exchangeRate: real('exchange_rate').notNull(),
  amountPHP: real('amount_php').notNull(),
  channel: text('channel').notNull(),
  date: text('date').notNull(),
  note: text('note'),
});

// ---------------------------------------------------------------------------
// 14. Government Contributions
// ---------------------------------------------------------------------------
export const govtContributions = sqliteTable('govt_contributions', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  amount: real('amount').notNull(),
  paidDate: text('paid_date'),
  status: text('status').notNull(),
});

// ---------------------------------------------------------------------------
// 15. Subscriptions
// ---------------------------------------------------------------------------
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull(),
  frequency: text('frequency').notNull(),
  renewalDay: integer('renewal_day').notNull(),
  category: text('category').notNull(),
  paymentMethod: text('payment_method'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull(),
  notes: text('notes'),
  flaggedForReview: integer('flagged_for_review', { mode: 'boolean' }),
});

// ---------------------------------------------------------------------------
// 16. Net Worth Snapshots
// ---------------------------------------------------------------------------
export const netWorthSnapshots = sqliteTable('net_worth_snapshots', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  totalAssets: real('total_assets').notNull(),
  totalLiabilities: real('total_liabilities').notNull(),
  netWorth: real('net_worth').notNull(),
});

// ---------------------------------------------------------------------------
// 17. Manual Assets
// ---------------------------------------------------------------------------
export const manualAssets = sqliteTable('manual_assets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  value: real('value').notNull(),
  category: text('category').notNull(),
  notes: text('notes'),
});

// ---------------------------------------------------------------------------
// 18. Tax Records
// ---------------------------------------------------------------------------
export const taxRecords = sqliteTable('tax_records', {
  id: text('id').primaryKey(),
  year: integer('year').notNull(),
  quarter: integer('quarter').notNull(),
  grossIncome: real('gross_income').notNull(),
  deductions: real('deductions').notNull(),
  taxDue: real('tax_due').notNull(),
  taxPaid: real('tax_paid').notNull(),
  filingDate: text('filing_date'),
  status: text('status').notNull(),
});

// ---------------------------------------------------------------------------
// 19. Recurring Transactions
// ---------------------------------------------------------------------------
export const recurringTransactions = sqliteTable('recurring_transactions', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull(),
  category: text('category').notNull(),
  merchantName: text('merchant_name').notNull(),
  description: text('description'),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id),
  toAccountId: text('to_account_id'),
  frequency: text('frequency').notNull(),
  dayOfMonth: integer('day_of_month'),
  nextDueDate: text('next_due_date').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull(),
  lastProcessedDate: text('last_processed_date'),
});

// ---------------------------------------------------------------------------
// 20. Custom Categories
// ---------------------------------------------------------------------------
export const customCategories = sqliteTable('custom_categories', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  type: text('type').notNull(),
});

// ---------------------------------------------------------------------------
// 21. Custom Subcategories
// ---------------------------------------------------------------------------
export const customSubcategories = sqliteTable('custom_subcategories', {
  id: text('id').primaryKey(),
  parentCategoryId: text('parent_category_id')
    .notNull()
    .references(() => customCategories.id),
  label: text('label').notNull(),
});

// ---------------------------------------------------------------------------
// 22. Saved Payees
// ---------------------------------------------------------------------------
export const savedPayees = sqliteTable('saved_payees', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category'),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull(),
  lastUsed: text('last_used'),
  useCount: integer('use_count').notNull(),
});

// ---------------------------------------------------------------------------
// 23. Saved Tags
// ---------------------------------------------------------------------------
export const savedTags = sqliteTable('saved_tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
  useCount: integer('use_count').notNull(),
});

// ---------------------------------------------------------------------------
// 24. Wishlist Items
// ---------------------------------------------------------------------------
export const wishlistItems = sqliteTable('wishlist_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').notNull(),
  priority: text('priority').notNull(),
  category: text('category'),
  imageUrl: text('image_url'),
  link: text('link'),
  notes: text('notes'),
  isPurchased: integer('is_purchased', { mode: 'boolean' }).notNull(),
  purchasedDate: text('purchased_date'),
});

// ---------------------------------------------------------------------------
// 25. Planner Items
// ---------------------------------------------------------------------------
export const plannerItems = sqliteTable('planner_items', {
  id: text('id').primaryKey(),
  plannerType: text('planner_type').notNull(),
  label: text('label').notNull(),
  amount: real('amount').notNull(),
  status: text('status').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
});

// ---------------------------------------------------------------------------
// 26. App Notifications
// ---------------------------------------------------------------------------
export const appNotifications = sqliteTable('app_notifications', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  type: text('type').notNull(),
  relatedId: text('related_id'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull(),
  createdAt: text('created_at').notNull(),
});

// ---------------------------------------------------------------------------
// 28. Transaction Templates
// ---------------------------------------------------------------------------
export const transactionTemplates = sqliteTable('transaction_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  merchantName: text('merchant_name').notNull(),
  amount: real('amount').notNull(),
  category: text('category').notNull(),
  type: text('type').notNull(),
  accountId: text('account_id').notNull(),
  currency: text('currency').notNull(),
  description: text('description').notNull(),
  subcategory: text('subcategory'),
});

// ---------------------------------------------------------------------------
// 29. Split Groups
// ---------------------------------------------------------------------------
export const splitGroups = sqliteTable('split_groups', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  date: text('date').notNull(),
  totalAmount: real('total_amount').notNull(),
  settled: integer('settled', { mode: 'boolean' }).notNull(),
});

// ---------------------------------------------------------------------------
// 30. Split Group Members (junction for members[])
// ---------------------------------------------------------------------------
export const splitGroupMembers = sqliteTable('split_group_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  splitGroupId: text('split_group_id')
    .notNull()
    .references(() => splitGroups.id),
  name: text('name').notNull(),
  avatar: text('avatar').notNull(),
  owes: real('owes').notNull(),
  paid: integer('paid', { mode: 'boolean' }).notNull(),
});

// ---------------------------------------------------------------------------
// 31. Household Members
// ---------------------------------------------------------------------------
export const householdMembers = sqliteTable('household_members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  avatar: text('avatar').notNull(),
  color: text('color').notNull(),
});

// ---------------------------------------------------------------------------
// 32. Shared Budgets
// ---------------------------------------------------------------------------
export const sharedBudgets = sqliteTable('shared_budgets', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  amount: real('amount').notNull(),
  spent: real('spent').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
});

// ---------------------------------------------------------------------------
// 33. Shared Budget Contributions (junction for contributions[])
// ---------------------------------------------------------------------------
export const sharedBudgetContributions = sqliteTable('shared_budget_contributions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sharedBudgetId: text('shared_budget_id')
    .notNull()
    .references(() => sharedBudgets.id),
  memberId: text('member_id').notNull(),
  amount: real('amount').notNull(),
});

// ---------------------------------------------------------------------------
// 34. Accountability Partners
// ---------------------------------------------------------------------------
export const accountabilityPartners = sqliteTable('accountability_partners', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  goalId: text('goal_id'),
  checkInDates: text('check_in_dates', { mode: 'json' }).$type<string[]>().notNull(),
  streak: integer('streak').notNull(),
  createdAt: text('created_at').notNull(),
});

// ---------------------------------------------------------------------------
// 27. Profile (singleton row)
// ---------------------------------------------------------------------------
export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey({ autoIncrement: false }).default(1),
  name: text('name').notNull(),
  email: text('email').notNull(),
  currency: text('currency').notNull(),
  language: text('language').notNull(),
  phone: text('phone').notNull(),
  employmentType: text('employment_type'),
  isSeeded: integer('is_seeded', { mode: 'boolean' }).notNull().default(false),
});
