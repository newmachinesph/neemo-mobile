import { create } from 'zustand';
import {
  accountRepo,
  transactionRepo,
  budgetRepo,
  goalRepo,
  recurringBillRepo,
  billPaymentRepo,
  debtInfoRepo,
  cardRepo,
  utangRepo,
  utangPaymentRepo,
  paluwaganRepo,
  paluwaganMemberRepo,
  remittanceRepo,
  govtContributionRepo,
  subscriptionRepo,
  netWorthSnapshotRepo,
  manualAssetRepo,
  taxRecordRepo,
  recurringTransactionRepo,
  customCategoryRepo,
  customSubcategoryRepo,
  savedPayeeRepo,
  savedTagRepo,
  wishlistItemRepo,
  plannerItemRepo,
  appNotificationRepo,
  profileRepo,
  truncateAll,

  transactionTemplateRepo,
  splitGroupRepo,
  splitGroupMemberRepo,
  householdMemberRepo,
  sharedBudgetRepo,
  sharedBudgetContributionRepo,
  accountabilityPartnerRepo,
} from '@db/repository';
import { hydrateFromDb } from '@db/hydrate';

import { palette } from '@theme/colors';
import { appStorage } from '@lib/storage/mmkv';
import { STORAGE_KEYS } from '@lib/constants/app';
import type {
  FinanceState,

  Account,
  AccountInsert,
  Transaction,
  TransactionInsert,
  Budget,
  BudgetInsert,
  Goal,
  GoalInsert,
  RecurringBill,
  RecurringBillInsert,
  DebtInfo,
  Profile,
  Card,
  CardInsert,
  Utang,
  UtangInsert,
  UtangPayment,
  Paluwagan,
  PaluwaganInsert,
  Remittance,
  RemittanceInsert,
  GovtContribution,
  GovtContributionInsert,
  Subscription,
  SubscriptionInsert,
  NetWorthSnapshot,
  ManualAsset,
  ManualAssetInsert,
  TaxRecord,
  TaxRecordInsert,
  RecurringTransaction,
  RecurringTransactionInsert,
  CustomCategory,
  CustomCategoryInsert,
  CustomSubcategory,
  CustomSubcategoryInsert,
  SavedPayee,
  SavedPayeeInsert,
  SavedTag,
  SavedTagInsert,
  WishlistItem,
  WishlistItemInsert,
  PlannerItem,
  PlannerItemInsert,
  AppNotification,
  AppNotificationInsert,
  NotificationPreferences,
  TransactionTemplate,
  TransactionTemplateInsert,
  SplitGroup,
  SplitGroupInsert,
  HouseholdMember,
  SharedBudgetItem,
  SharedBudgetItemInsert,
  AccountabilityPartner,
  AccountabilityPartnerInsert,
} from '../types/finance.types';

// ── Helpers ─────────────────────────────────────────────────────────────────

let _counter = 0;
function uid(prefix: string): string {
  _counter += 1;
  return `${prefix}-${Date.now()}-${_counter}`;
}

// ── Default state ───────────────────────────────────────────────────────────

const defaultProfile: Profile = {
  name: '',
  email: '',
  currency: 'PHP',
  language: 'en',
  phone: '',
};

const defaultNotificationPreferences: NotificationPreferences = {
  billReminders: appStorage.getBoolean(STORAGE_KEYS.NOTIF_BILL_REMINDERS) ?? true,
  budgetAlerts: appStorage.getBoolean(STORAGE_KEYS.NOTIF_BUDGET_ALERTS) ?? true,
  recurringReminders:
    appStorage.getBoolean(STORAGE_KEYS.NOTIF_RECURRING_REMINDERS) ?? true,
};

// ── Store ───────────────────────────────────────────────────────────────────

export const useFinanceStore = create<FinanceState>()((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────
  accounts: [],
  transactions: [],
  budgets: [],
  goals: [],
  recurringBills: [],
  debtInfos: [],
  cards: [],
  utangs: [],
  paluwagans: [],
  remittances: [],
  govtContributions: [],
  subscriptions: [],
  netWorthSnapshots: [],
  manualAssets: [],
  taxRecords: [],
  recurringTransactions: [],
  customCategories: [],
  customSubcategories: [],
  savedPayees: [],
  savedTags: [],
  wishlistItems: [],
  plannerItems: [],
  appNotifications: [],
  profile: defaultProfile,
  hideBalances: false,
  isSeeded: false,
  notificationPreferences: defaultNotificationPreferences,
  transactionTemplates: [],
  splitGroups: [],
  householdMembers: [{ id: 'you', name: 'You', avatar: '👤', color: palette.primary[600] }],
  sharedBudgets: [],
  accountabilityPartners: [],

  // ── Hydrate ─────────────────────────────────────────────────────────

  _hydrate() {
    const data = hydrateFromDb();
    set(data);
  },

  // ── Account Actions ────────────────────────────────────────────────

  addAccount(item: AccountInsert) {
    const account: Account = { ...item, id: uid('acc') };
    set((s) => ({ accounts: [...s.accounts, account] }));
    accountRepo.insert(account);
  },

  updateAccount(id: string, partial: Partial<AccountInsert>) {
    set((s) => ({
      accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...partial } : a)),
    }));
    const snaked: Record<string, any> = {};
    if (partial.name !== undefined) snaked.name = partial.name;
    if (partial.type !== undefined) snaked.type = partial.type;
    if (partial.balance !== undefined) snaked.balance = partial.balance;
    if (partial.currency !== undefined) snaked.currency = partial.currency;
    if (partial.institution !== undefined) snaked.institution = partial.institution;
    if (partial.icon !== undefined) snaked.icon = partial.icon;
    if (partial.color !== undefined) snaked.color = partial.color;
    accountRepo.update(id, snaked);
  },

  updateAccountBalance(id: string, balance: number) {
    set((s) => ({
      accounts: s.accounts.map((a) => (a.id === id ? { ...a, balance } : a)),
    }));
    accountRepo.update(id, { balance });
  },

  deleteAccount(id: string) {
    // H1 fix: Clean up orphaned recurring transactions and debt info
    const orphanedRTs = get().recurringTransactions.filter((rt) => rt.accountId === id);
    set((s) => ({
      accounts: s.accounts.filter((a) => a.id !== id),
      recurringTransactions: s.recurringTransactions.filter((rt) => rt.accountId !== id),
      debtInfos: s.debtInfos.filter((d) => d.accountId !== id),
    }));
    accountRepo.delete(id);
    for (const rt of orphanedRTs) recurringTransactionRepo.delete(rt.id);
    debtInfoRepo.delete(id);
  },

  // ── Transaction Actions ────────────────────────────────────────────

  addTransaction(item: TransactionInsert) {
    const txn: Transaction = { ...item, id: uid('txn'), amount: Math.abs(item.amount) };
    set((s) => {
      const next: Partial<FinanceState> = { transactions: [txn, ...s.transactions] };

      // Update source account balance
      if (txn.type === 'expense' || txn.type === 'income' || txn.type === 'transfer') {
        const delta = txn.type === 'income' ? txn.amount : -txn.amount;
        next.accounts = s.accounts.map((a) =>
          a.id === txn.accountId ? { ...a, balance: a.balance + delta } : a,
        );
        // Credit the destination account for transfers
        if (txn.type === 'transfer' && txn.toAccountId) {
          next.accounts = (next.accounts ?? s.accounts).map((a) =>
            a.id === txn.toAccountId ? { ...a, balance: a.balance + txn.amount } : a,
          );
        }
      }

      // Update matching budget spent
      if (txn.type === 'expense') {
        next.budgets = s.budgets.map((b) =>
          b.category === txn.category ? { ...b, spent: b.spent + txn.amount } : b,
        );
      }

      return next;
    });
    transactionRepo.insert(txn);

    // Persist balance changes
    const acct = get().accounts.find((a) => a.id === txn.accountId);
    if (acct) accountRepo.update(txn.accountId, { balance: acct.balance });
    if (txn.type === 'transfer' && txn.toAccountId) {
      const dest = get().accounts.find((a) => a.id === txn.toAccountId);
      if (dest) accountRepo.update(txn.toAccountId, { balance: dest.balance });
    }
    // Persist budget spent
    if (txn.type === 'expense') {
      const bgt = get().budgets.find((b) => b.category === txn.category);
      if (bgt) budgetRepo.update(bgt.id, { spent: bgt.spent });
    }
  },

  updateTransaction(id: string, partial: Partial<TransactionInsert>) {
    // H2 fix: Guard against negative amounts (same as addTransaction)
    if (partial.amount !== undefined) partial = { ...partial, amount: Math.abs(partial.amount) };
    const oldTxn = get().transactions.find((t) => t.id === id);

    set((s) => {
      const next: Partial<FinanceState> = {
        transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...partial } : t)),
      };

      if (oldTxn) {
        let accts = s.accounts;

        // Reverse old balance impact
        if (
          oldTxn.type === 'expense' ||
          oldTxn.type === 'income' ||
          oldTxn.type === 'transfer'
        ) {
          const oldDelta = oldTxn.type === 'income' ? -oldTxn.amount : oldTxn.amount;
          accts = accts.map((a) =>
            a.id === oldTxn.accountId ? { ...a, balance: a.balance + oldDelta } : a,
          );
          if (oldTxn.type === 'transfer' && oldTxn.toAccountId) {
            accts = accts.map((a) =>
              a.id === oldTxn.toAccountId
                ? { ...a, balance: a.balance - oldTxn.amount }
                : a,
            );
          }
        }

        // Apply new balance impact
        const newType = partial.type ?? oldTxn.type;
        const newAmount = partial.amount ?? oldTxn.amount;
        const newAccountId = partial.accountId ?? oldTxn.accountId;
        const newToAccountId = partial.toAccountId ?? oldTxn.toAccountId;

        if (newType === 'expense' || newType === 'income' || newType === 'transfer') {
          const newDelta = newType === 'income' ? newAmount : -newAmount;
          accts = accts.map((a) =>
            a.id === newAccountId ? { ...a, balance: a.balance + newDelta } : a,
          );
          if (newType === 'transfer' && newToAccountId) {
            accts = accts.map((a) =>
              a.id === newToAccountId ? { ...a, balance: a.balance + newAmount } : a,
            );
          }
        }

        next.accounts = accts;

        // Reverse old budget impact, apply new
        let budgets = s.budgets;
        if (oldTxn.type === 'expense') {
          budgets = budgets.map((b) =>
            b.category === oldTxn.category
              ? { ...b, spent: Math.max(0, b.spent - oldTxn.amount) }
              : b,
          );
        }
        const newCategory = partial.category ?? oldTxn.category;
        if (newType === 'expense') {
          budgets = budgets.map((b) =>
            b.category === newCategory ? { ...b, spent: b.spent + newAmount } : b,
          );
        }
        next.budgets = budgets;
      }

      return next;
    });

    // Persist to DB
    const snaked: Record<string, any> = {};
    if (partial.accountId !== undefined) snaked.account_id = partial.accountId;
    if (partial.type !== undefined) snaked.type = partial.type;
    if (partial.amount !== undefined) snaked.amount = partial.amount;
    if (partial.currency !== undefined) snaked.currency = partial.currency;
    if (partial.description !== undefined) snaked.description = partial.description;
    if (partial.merchantName !== undefined) snaked.merchant_name = partial.merchantName;
    if (partial.category !== undefined) snaked.category = partial.category;
    if (partial.date !== undefined) snaked.date = partial.date;
    if (partial.tags !== undefined) snaked.tags = JSON.stringify(partial.tags);
    if (partial.splits !== undefined) snaked.splits = JSON.stringify(partial.splits);
    if (partial.subcategory !== undefined) snaked.subcategory = partial.subcategory;
    if (partial.cardId !== undefined) snaked.card_id = partial.cardId;
    if (partial.receiptUri !== undefined) snaked.receipt_uri = partial.receiptUri;
    if (partial.notes !== undefined) snaked.notes = partial.notes;
    if (partial.toAccountId !== undefined) snaked.to_account_id = partial.toAccountId;
    if (partial.exchangeRate !== undefined) snaked.exchange_rate = partial.exchangeRate;
    if (partial.isBusiness !== undefined) snaked.is_business = partial.isBusiness ? 1 : 0;
    transactionRepo.update(id, snaked);

    // Persist balance and budget changes
    if (oldTxn) {
      const affectedAccountIds = new Set<string>();
      affectedAccountIds.add(oldTxn.accountId);
      if (oldTxn.toAccountId) affectedAccountIds.add(oldTxn.toAccountId);
      if (partial.accountId) affectedAccountIds.add(partial.accountId);
      if (partial.toAccountId) affectedAccountIds.add(partial.toAccountId);

      for (const aid of affectedAccountIds) {
        const acct = get().accounts.find((a) => a.id === aid);
        if (acct) accountRepo.update(aid, { balance: acct.balance });
      }

      const affectedCategories = new Set<string>();
      if (oldTxn.type === 'expense') affectedCategories.add(oldTxn.category);
      const newType = partial.type ?? oldTxn.type;
      const newCategory = partial.category ?? oldTxn.category;
      if (newType === 'expense') affectedCategories.add(newCategory);

      for (const cat of affectedCategories) {
        const bgt = get().budgets.find((b) => b.category === cat);
        if (bgt) budgetRepo.update(bgt.id, { spent: bgt.spent });
      }
    }
  },

  deleteTransaction(id: string) {
    const txn = get().transactions.find((t) => t.id === id);
    set((s) => {
      const next: Partial<FinanceState> = {
        transactions: s.transactions.filter((t) => t.id !== id),
      };

      if (txn) {
        // Reverse account balance
        if (txn.type === 'expense' || txn.type === 'income' || txn.type === 'transfer') {
          const delta = txn.type === 'income' ? -txn.amount : txn.amount;
          next.accounts = s.accounts.map((a) =>
            a.id === txn.accountId ? { ...a, balance: a.balance + delta } : a,
          );
          if (txn.type === 'transfer' && txn.toAccountId) {
            next.accounts = (next.accounts ?? s.accounts).map((a) =>
              a.id === txn.toAccountId ? { ...a, balance: a.balance - txn.amount } : a,
            );
          }
        }

        // Reverse budget spent
        if (txn.type === 'expense') {
          next.budgets = s.budgets.map((b) =>
            b.category === txn.category
              ? { ...b, spent: Math.max(0, b.spent - txn.amount) }
              : b,
          );
        }
      }

      return next;
    });
    transactionRepo.delete(id);

    // Persist balance reversals
    if (txn) {
      const acct = get().accounts.find((a) => a.id === txn.accountId);
      if (acct) accountRepo.update(txn.accountId, { balance: acct.balance });
      if (txn.type === 'transfer' && txn.toAccountId) {
        const dest = get().accounts.find((a) => a.id === txn.toAccountId);
        if (dest) accountRepo.update(txn.toAccountId, { balance: dest.balance });
      }
      if (txn.type === 'expense') {
        const bgt = get().budgets.find((b) => b.category === txn.category);
        if (bgt) budgetRepo.update(bgt.id, { spent: bgt.spent });
      }
    }
  },

  // ── Budget Actions ─────────────────────────────────────────────────

  addBudget(item: BudgetInsert) {
    // H8 fix: Calculate initial spent from existing transactions in current period
    const now = new Date();
    let periodStart: Date;
    if (item.period === 'weekly') {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - now.getDay());
      periodStart.setHours(0, 0, 0, 0);
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const periodStartISO = periodStart.toISOString();
    const initialSpent = get().transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.category === item.category &&
          t.date >= periodStartISO,
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const budget: Budget = { ...item, id: uid('bgt'), spent: initialSpent };
    set((s) => ({ budgets: [...s.budgets, budget] }));
    budgetRepo.insert(budget);
  },

  updateBudget(id: string, partial: Partial<BudgetInsert>) {
    set((s) => ({
      budgets: s.budgets.map((b) => (b.id === id ? { ...b, ...partial } : b)),
    }));
    const snaked: Record<string, any> = {};
    if (partial.name !== undefined) snaked.name = partial.name;
    if (partial.category !== undefined) snaked.category = partial.category;
    if (partial.amount !== undefined) snaked.amount = partial.amount;
    if (partial.spent !== undefined) snaked.spent = partial.spent;
    if (partial.period !== undefined) snaked.period = partial.period;
    if (partial.style !== undefined) snaked.style = partial.style;
    if (partial.rollover !== undefined) snaked.rollover = partial.rollover ? 1 : 0;
    if (partial.rolloverAmount !== undefined)
      snaked.rollover_amount = partial.rolloverAmount;
    budgetRepo.update(id, snaked);
  },

  updateBudgetSpent(id: string, spent: number) {
    set((s) => ({
      budgets: s.budgets.map((b) => (b.id === id ? { ...b, spent } : b)),
    }));
    budgetRepo.update(id, { spent });
  },

  deleteBudget(id: string) {
    set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
    budgetRepo.delete(id);
  },

  // ── Goal Actions ───────────────────────────────────────────────────

  addGoal(item: GoalInsert) {
    const goal: Goal = { ...item, id: uid('goal') };
    set((s) => ({ goals: [...s.goals, goal] }));
    goalRepo.insert(goal);
  },

  updateGoal(id: string, partial: Partial<GoalInsert>) {
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...partial } : g)),
    }));
    const snaked: Record<string, any> = {};
    if (partial.name !== undefined) snaked.name = partial.name;
    if (partial.targetAmount !== undefined) snaked.target_amount = partial.targetAmount;
    if (partial.currentAmount !== undefined)
      snaked.current_amount = partial.currentAmount;
    if (partial.targetDate !== undefined) snaked.target_date = partial.targetDate;
    if (partial.icon !== undefined) snaked.icon = partial.icon;
    if (partial.color !== undefined) snaked.color = partial.color;
    if (partial.challengeType !== undefined)
      snaked.challenge_type = partial.challengeType;
    if (partial.isLocked !== undefined) snaked.is_locked = partial.isLocked ? 1 : 0;
    if (partial.linkedAccountId !== undefined)
      snaked.linked_account_id = partial.linkedAccountId;
    if (partial.isEmergencyFund !== undefined)
      snaked.is_emergency_fund = partial.isEmergencyFund ? 1 : 0;
    goalRepo.update(id, snaked);
  },

  updateGoalProgress(id: string, currentAmount: number) {
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, currentAmount } : g)),
    }));
    goalRepo.update(id, { current_amount: currentAmount });
  },

  deleteGoal(id: string) {
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
    goalRepo.delete(id);
  },

  // ── Recurring Bill Actions ─────────────────────────────────────────

  addRecurringBill(item: RecurringBillInsert) {
    const bill: RecurringBill = { ...item, id: uid('bill') };
    set((s) => ({ recurringBills: [...s.recurringBills, bill] }));
    recurringBillRepo.insert(bill);
  },

  updateRecurringBill(id: string, partial: Partial<RecurringBillInsert>) {
    set((s) => ({
      recurringBills: s.recurringBills.map((b) =>
        b.id === id ? { ...b, ...partial } : b,
      ),
    }));
    const snaked: Record<string, any> = {};
    if (partial.name !== undefined) snaked.name = partial.name;
    if (partial.amount !== undefined) snaked.amount = partial.amount;
    if (partial.category !== undefined) snaked.category = partial.category;
    if (partial.frequency !== undefined) snaked.frequency = partial.frequency;
    if (partial.dueDay !== undefined) snaked.due_day = partial.dueDay;
    if (partial.accountId !== undefined) snaked.account_id = partial.accountId;
    if (partial.isActive !== undefined) snaked.is_active = partial.isActive ? 1 : 0;
    if (partial.lastPaidDate !== undefined) snaked.last_paid_date = partial.lastPaidDate;
    recurringBillRepo.update(id, snaked);
  },

  deleteRecurringBill(id: string) {
    set((s) => ({ recurringBills: s.recurringBills.filter((b) => b.id !== id) }));
    recurringBillRepo.delete(id);
  },

  markBillPaid(id: string) {
    const s = get();
    const bill = s.recurringBills.find((b) => b.id === id);
    if (!bill) return;

    const payAccountId = bill.accountId || s.accounts[0]?.id;
    if (!payAccountId) return; // No account available — cannot create transaction

    const now = new Date().toISOString();
    const txnId = uid('txn');

    // Create an expense transaction for this bill payment
    const txn: Transaction = {
      id: txnId,
      accountId: payAccountId,
      type: 'expense',
      amount: bill.amount,
      currency: s.profile.currency,
      description: `${bill.name} payment`,
      merchantName: bill.name,
      category: bill.category,
      date: now,
    };

    set({
      transactions: [txn, ...s.transactions],
      // Debit the account balance
      accounts: s.accounts.map((a) =>
        a.id === payAccountId ? { ...a, balance: a.balance - bill.amount } : a,
      ),
      // Update matching budget spent
      budgets: s.budgets.map((b) =>
        b.category === bill.category ? { ...b, spent: b.spent + bill.amount } : b,
      ),
      recurringBills: s.recurringBills.map((b) =>
        b.id === id
          ? {
              ...b,
              lastPaidDate: now,
              paymentHistory: [
                ...(b.paymentHistory || []),
                { date: now, amount: bill.amount, transactionId: txnId },
              ],
            }
          : b,
      ),
    });
    transactionRepo.insert(txn);
    billPaymentRepo.insert({
      id: uid('bp'),
      billId: id,
      date: now,
      amount: bill.amount,
      transactionId: txnId,
    });
    recurringBillRepo.update(id, { last_paid_date: now });

    // Persist balance and budget changes
    const acct = get().accounts.find((a) => a.id === payAccountId);
    if (acct) accountRepo.update(payAccountId, { balance: acct.balance });
    const bgt = get().budgets.find((b) => b.category === bill.category);
    if (bgt) budgetRepo.update(bgt.id, { spent: bgt.spent });
  },

  // ── Debt Info Actions ──────────────────────────────────────────────

  addDebtInfo(info: DebtInfo) {
    set((s) => ({ debtInfos: [...s.debtInfos, info] }));
    debtInfoRepo.insert(info);
  },

  updateDebtInfo(accountId: string, partial: Partial<Omit<DebtInfo, 'accountId'>>) {
    set((s) => ({
      debtInfos: s.debtInfos.map((d) =>
        d.accountId === accountId ? { ...d, ...partial } : d,
      ),
    }));
    const snaked: Record<string, any> = {};
    if (partial.interestRate !== undefined) snaked.interest_rate = partial.interestRate;
    if (partial.minimumPayment !== undefined)
      snaked.minimum_payment = partial.minimumPayment;
    if (partial.extraPayment !== undefined) snaked.extra_payment = partial.extraPayment;
    debtInfoRepo.update(accountId, snaked);
  },

  deleteDebtInfo(accountId: string) {
    set((s) => ({ debtInfos: s.debtInfos.filter((d) => d.accountId !== accountId) }));
    debtInfoRepo.delete(accountId);
  },

  // ── Card Actions ───────────────────────────────────────────────────

  addCard(item: CardInsert) {
    const card: Card = { ...item, id: uid('card') };
    set((s) => ({ cards: [...s.cards, card] }));
    cardRepo.insert(card);
  },

  updateCard(id: string, partial: Partial<CardInsert>) {
    set((s) => ({
      cards: s.cards.map((c) => (c.id === id ? { ...c, ...partial } : c)),
    }));
    const snaked: Record<string, any> = {};
    if (partial.nickname !== undefined) snaked.nickname = partial.nickname;
    if (partial.type !== undefined) snaked.type = partial.type;
    if (partial.last4 !== undefined) snaked.last4 = partial.last4;
    if (partial.linkedAccountId !== undefined)
      snaked.linked_account_id = partial.linkedAccountId;
    if (partial.network !== undefined) snaked.network = partial.network;
    if (partial.creditLimit !== undefined) snaked.credit_limit = partial.creditLimit;
    if (partial.outstandingBalance !== undefined)
      snaked.outstanding_balance = partial.outstandingBalance;
    if (partial.statementCutDay !== undefined)
      snaked.statement_cut_day = partial.statementCutDay;
    if (partial.paymentDueDay !== undefined)
      snaked.payment_due_day = partial.paymentDueDay;
    if (partial.isActive !== undefined) snaked.is_active = partial.isActive ? 1 : 0;
    cardRepo.update(id, snaked);
  },

  deleteCard(id: string) {
    set((s) => ({ cards: s.cards.filter((c) => c.id !== id) }));
    cardRepo.delete(id);
  },

  // ── Utang Actions ──────────────────────────────────────────────────

  addUtang(item: UtangInsert) {
    const utang: Utang = {
      ...item,
      id: uid('utang'),
      remainingBalance: item.amount,
      payments: [],
      status: 'pending',
    };
    set((s) => ({ utangs: [...s.utangs, utang] }));
    utangRepo.insert({
      id: utang.id,
      personName: item.personName,
      type: item.type,
      amount: item.amount,
      remainingBalance: item.amount,
      description: item.description,
      date: item.date,
      expectedReturnDate: item.expectedReturnDate,
      status: 'pending',
    });
  },

  updateUtang(id: string, partial: Partial<UtangInsert>) {
    // M4 fix: If amount changes, recalculate remainingBalance
    set((s) => ({
      utangs: s.utangs.map((u) => {
        if (u.id !== id) return u;
        const updated = { ...u, ...partial };
        if (partial.amount !== undefined && partial.amount !== u.amount) {
          const totalPaid = u.payments.reduce((sum, p) => sum + p.amount, 0);
          updated.remainingBalance = Math.max(0, partial.amount - totalPaid);
          updated.status = updated.remainingBalance <= 0 ? 'settled' : totalPaid > 0 ? 'partial' : 'pending';
        }
        return updated;
      }),
    }));
    const snaked: Record<string, any> = {};
    if (partial.personName !== undefined) snaked.person_name = partial.personName;
    if (partial.type !== undefined) snaked.type = partial.type;
    if (partial.amount !== undefined) snaked.amount = partial.amount;
    if (partial.description !== undefined) snaked.description = partial.description;
    if (partial.date !== undefined) snaked.date = partial.date;
    if (partial.expectedReturnDate !== undefined)
      snaked.expected_return_date = partial.expectedReturnDate;
    // M4 fix: Also persist recalculated remaining_balance and status
    if (partial.amount !== undefined) {
      const updated = get().utangs.find((u) => u.id === id);
      if (updated) {
        snaked.remaining_balance = updated.remainingBalance;
        snaked.status = updated.status;
      }
    }
    utangRepo.update(id, snaked);
  },

  deleteUtang(id: string) {
    set((s) => ({ utangs: s.utangs.filter((u) => u.id !== id) }));
    utangRepo.delete(id);
  },

  addUtangPayment(utangId: string, payment: Omit<UtangPayment, 'id'>) {
    const existing = get().utangs.find((u) => u.id === utangId);
    if (!existing) return;

    const newPaymentId = uid('up');
    const newRemaining = Math.max(0, existing.remainingBalance - payment.amount);
    const newStatus = newRemaining <= 0 ? 'settled' : 'partial';
    const newPayment: UtangPayment = { ...payment, id: newPaymentId };

    set((s) => ({
      utangs: s.utangs.map((u) =>
        u.id !== utangId
          ? u
          : {
              ...u,
              payments: [...u.payments, newPayment],
              remainingBalance: newRemaining,
              status: newStatus,
            },
      ),
    }));
    utangPaymentRepo.insert({
      id: newPaymentId,
      utangId,
      amount: payment.amount,
      date: payment.date,
      note: payment.note,
    });
    utangRepo.update(utangId, {
      remaining_balance: newRemaining,
      status: newStatus,
    });
  },

  // ── Paluwagan Actions ──────────────────────────────────────────────

  addPaluwagan(item: PaluwaganInsert) {
    const paluwagan: Paluwagan = { ...item, id: uid('paluwagan') };
    set((s) => ({ paluwagans: [...s.paluwagans, paluwagan] }));
    const { members, ...pData } = paluwagan;
    paluwaganRepo.insert(pData);
    for (const m of members)
      paluwaganMemberRepo.insert({ paluwaganId: paluwagan.id, ...m });
  },

  updatePaluwagan(id: string, partial: Partial<PaluwaganInsert>) {
    set((s) => ({
      paluwagans: s.paluwagans.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    }));
    const snaked: Record<string, any> = {};
    if (partial.groupName !== undefined) snaked.group_name = partial.groupName;
    if (partial.contributionAmount !== undefined)
      snaked.contribution_amount = partial.contributionAmount;
    if (partial.frequency !== undefined) snaked.frequency = partial.frequency;
    if (partial.startDate !== undefined) snaked.start_date = partial.startDate;
    if (partial.currentRound !== undefined) snaked.current_round = partial.currentRound;
    if (partial.totalRounds !== undefined) snaked.total_rounds = partial.totalRounds;
    paluwaganRepo.update(id, snaked);
    if (partial.members) {
      paluwaganMemberRepo.deleteByPaluwaganId(id);
      for (const m of partial.members)
        paluwaganMemberRepo.insert({ paluwaganId: id, ...m });
    }
  },

  deletePaluwagan(id: string) {
    set((s) => ({ paluwagans: s.paluwagans.filter((p) => p.id !== id) }));
    paluwaganRepo.delete(id);
  },

  // ── Remittance Actions ─────────────────────────────────────────────

  addRemittance(item: RemittanceInsert) {
    const remittance: Remittance = { ...item, id: uid('rem') };
    set((s) => ({ remittances: [remittance, ...s.remittances] }));
    remittanceRepo.insert(remittance);
  },

  updateRemittance(id: string, partial: Partial<RemittanceInsert>) {
    set((s) => ({
      remittances: s.remittances.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    }));
    const snaked: Record<string, any> = {};
    if (partial.senderName !== undefined) snaked.sender_name = partial.senderName;
    if (partial.amountForeign !== undefined)
      snaked.amount_foreign = partial.amountForeign;
    if (partial.foreignCurrency !== undefined)
      snaked.foreign_currency = partial.foreignCurrency;
    if (partial.exchangeRate !== undefined) snaked.exchange_rate = partial.exchangeRate;
    if (partial.amountPHP !== undefined) snaked.amount_php = partial.amountPHP;
    if (partial.channel !== undefined) snaked.channel = partial.channel;
    if (partial.date !== undefined) snaked.date = partial.date;
    if (partial.note !== undefined) snaked.note = partial.note;
    remittanceRepo.update(id, snaked);
  },

  deleteRemittance(id: string) {
    set((s) => ({ remittances: s.remittances.filter((r) => r.id !== id) }));
    remittanceRepo.delete(id);
  },

  // ── Govt Contribution Actions ──────────────────────────────────────

  addGovtContribution(item: GovtContributionInsert) {
    const contrib: GovtContribution = { ...item, id: uid('gc') };
    set((s) => ({ govtContributions: [...s.govtContributions, contrib] }));
    govtContributionRepo.insert(contrib);
  },

  markGovtContribPaid(type: GovtContribution['type'], year: number, month: number) {
    set((s) => ({
      govtContributions: s.govtContributions.map((c) =>
        c.type === type && c.year === year && c.month === month
          ? {
              ...c,
              status: 'paid' as const,
              paidDate: new Date().toISOString().slice(0, 10),
            }
          : c,
      ),
    }));
    govtContributionRepo.markPaid(
      type,
      year,
      month,
      new Date().toISOString().slice(0, 10),
    );
  },

  // ── Subscription Actions ───────────────────────────────────────────

  addSubscription(item: SubscriptionInsert) {
    const sub: Subscription = { ...item, id: uid('sub') };
    set((s) => ({ subscriptions: [...s.subscriptions, sub] }));
    subscriptionRepo.insert(sub);
  },

  updateSubscription(id: string, partial: Partial<SubscriptionInsert>) {
    set((s) => ({
      subscriptions: s.subscriptions.map((sub) =>
        sub.id === id ? { ...sub, ...partial } : sub,
      ),
    }));
    const snaked: Record<string, any> = {};
    if (partial.name !== undefined) snaked.name = partial.name;
    if (partial.amount !== undefined) snaked.amount = partial.amount;
    if (partial.currency !== undefined) snaked.currency = partial.currency;
    if (partial.frequency !== undefined) snaked.frequency = partial.frequency;
    if (partial.renewalDay !== undefined) snaked.renewal_day = partial.renewalDay;
    if (partial.category !== undefined) snaked.category = partial.category;
    if (partial.paymentMethod !== undefined)
      snaked.payment_method = partial.paymentMethod;
    if (partial.isActive !== undefined) snaked.is_active = partial.isActive ? 1 : 0;
    if (partial.notes !== undefined) snaked.notes = partial.notes;
    if (partial.flaggedForReview !== undefined)
      snaked.flagged_for_review = partial.flaggedForReview ? 1 : 0;
    subscriptionRepo.update(id, snaked);
  },

  deleteSubscription(id: string) {
    set((s) => ({ subscriptions: s.subscriptions.filter((sub) => sub.id !== id) }));
    subscriptionRepo.delete(id);
  },

  // ── Net Worth Actions ──────────────────────────────────────────────

  takeNetWorthSnapshot() {
    const s = get();
    const accountAssets = s.accounts.reduce(
      (sum, a) => sum + (a.balance > 0 ? a.balance : 0),
      0,
    );
    const manualAssetTotal = s.manualAssets.reduce((sum, a) => sum + a.value, 0);
    const totalAssets = accountAssets + manualAssetTotal;
    // M2 fix: Include credit card outstanding balances and utang in liabilities
    const accountLiabilities = s.accounts.reduce(
      (sum, a) => sum + (a.balance < 0 ? Math.abs(a.balance) : 0),
      0,
    );
    const cardLiabilities = s.cards.reduce(
      (sum, c) => sum + (c.outstandingBalance ?? 0),
      0,
    );
    const utangLiabilities = s.utangs
      .filter((u) => u.type === 'borrowed' && u.status !== 'settled')
      .reduce((sum, u) => sum + u.remainingBalance, 0);
    const totalLiabilities = accountLiabilities + cardLiabilities + utangLiabilities;
    const snapshot: NetWorthSnapshot = {
      id: uid('nw'),
      date: new Date().toISOString(),
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
    };
    set((prev) => ({ netWorthSnapshots: [...prev.netWorthSnapshots, snapshot] }));
    netWorthSnapshotRepo.insert(snapshot);
  },

  // ── Manual Asset Actions ───────────────────────────────────────────

  addManualAsset(item: ManualAssetInsert) {
    const asset: ManualAsset = { ...item, id: uid('asset') };
    set((s) => ({ manualAssets: [...s.manualAssets, asset] }));
    manualAssetRepo.insert(asset);
  },

  updateManualAsset(id: string, partial: Partial<ManualAssetInsert>) {
    set((s) => ({
      manualAssets: s.manualAssets.map((a) => (a.id === id ? { ...a, ...partial } : a)),
    }));
    const snaked: Record<string, any> = {};
    if (partial.name !== undefined) snaked.name = partial.name;
    if (partial.value !== undefined) snaked.value = partial.value;
    if (partial.category !== undefined) snaked.category = partial.category;
    if (partial.notes !== undefined) snaked.notes = partial.notes;
    manualAssetRepo.update(id, snaked);
  },

  deleteManualAsset(id: string) {
    set((s) => ({ manualAssets: s.manualAssets.filter((a) => a.id !== id) }));
    manualAssetRepo.delete(id);
  },

  // ── Tax Record Actions ─────────────────────────────────────────────

  addTaxRecord(item: TaxRecordInsert) {
    const record: TaxRecord = { ...item, id: uid('tax') };
    set((s) => ({ taxRecords: [...s.taxRecords, record] }));
    taxRecordRepo.insert(record);
  },

  updateTaxRecord(id: string, partial: Partial<TaxRecordInsert>) {
    set((s) => ({
      taxRecords: s.taxRecords.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    }));
    const snaked: Record<string, any> = {};
    if (partial.year !== undefined) snaked.year = partial.year;
    if (partial.quarter !== undefined) snaked.quarter = partial.quarter;
    if (partial.grossIncome !== undefined) snaked.gross_income = partial.grossIncome;
    if (partial.deductions !== undefined) snaked.deductions = partial.deductions;
    if (partial.taxDue !== undefined) snaked.tax_due = partial.taxDue;
    if (partial.taxPaid !== undefined) snaked.tax_paid = partial.taxPaid;
    if (partial.filingDate !== undefined) snaked.filing_date = partial.filingDate;
    if (partial.status !== undefined) snaked.status = partial.status;
    taxRecordRepo.update(id, snaked);
  },

  deleteTaxRecord(id: string) {
    set((s) => ({ taxRecords: s.taxRecords.filter((r) => r.id !== id) }));
    taxRecordRepo.delete(id);
  },

  // ── Recurring Transaction Actions ──────────────────────────────────

  addRecurringTransaction(item: RecurringTransactionInsert) {
    const rt: RecurringTransaction = { ...item, id: uid('rt') };
    set((s) => ({ recurringTransactions: [...s.recurringTransactions, rt] }));
    recurringTransactionRepo.insert(rt);
  },

  updateRecurringTransaction(id: string, partial: Partial<RecurringTransactionInsert>) {
    set((s) => ({
      recurringTransactions: s.recurringTransactions.map((r) =>
        r.id === id ? { ...r, ...partial } : r,
      ),
    }));
    const snaked: Record<string, any> = {};
    if (partial.type !== undefined) snaked.type = partial.type;
    if (partial.amount !== undefined) snaked.amount = partial.amount;
    if (partial.currency !== undefined) snaked.currency = partial.currency;
    if (partial.category !== undefined) snaked.category = partial.category;
    if (partial.merchantName !== undefined) snaked.merchant_name = partial.merchantName;
    if (partial.description !== undefined) snaked.description = partial.description;
    if (partial.accountId !== undefined) snaked.account_id = partial.accountId;
    if (partial.toAccountId !== undefined) snaked.to_account_id = partial.toAccountId;
    if (partial.frequency !== undefined) snaked.frequency = partial.frequency;
    if (partial.dayOfMonth !== undefined) snaked.day_of_month = partial.dayOfMonth;
    if (partial.nextDueDate !== undefined) snaked.next_due_date = partial.nextDueDate;
    if (partial.isActive !== undefined) snaked.is_active = partial.isActive ? 1 : 0;
    if (partial.lastProcessedDate !== undefined)
      snaked.last_processed_date = partial.lastProcessedDate;
    recurringTransactionRepo.update(id, snaked);
  },

  deleteRecurringTransaction(id: string) {
    set((s) => ({
      recurringTransactions: s.recurringTransactions.filter((r) => r.id !== id),
    }));
    recurringTransactionRepo.delete(id);
  },

  processRecurringTransactions() {
    const s = get();
    const today = new Date().toISOString().slice(0, 10);
    const newTransactions: Transaction[] = [];

    const updatedRecurring = s.recurringTransactions.map((rt) => {
      if (!rt.isActive) return rt;

      // C3 fix: Loop to catch up all missed periods (not just one)
      let due = new Date(rt.nextDueDate);
      const todayDate = new Date(today + 'T23:59:59');
      let processed = false;

      while (due <= todayDate) {
        processed = true;

        // C4 fix: Include toAccountId for transfers
        newTransactions.push({
          id: uid('txn'),
          accountId: rt.accountId,
          toAccountId: rt.toAccountId,
          type: rt.type,
          amount: rt.amount,
          currency: rt.currency,
          description: rt.description || rt.merchantName,
          merchantName: rt.merchantName,
          category: rt.category,
          date: due.toISOString(),
        });

        // Advance to next due date
        switch (rt.frequency) {
          case 'daily':
            due.setDate(due.getDate() + 1);
            break;
          case 'weekly':
            due.setDate(due.getDate() + 7);
            break;
          case 'biweekly':
            due.setDate(due.getDate() + 14);
            break;
          case 'monthly':
            due.setMonth(due.getMonth() + 1);
            break;
          case 'quarterly':
            due.setMonth(due.getMonth() + 3);
            break;
          case 'yearly':
            due.setFullYear(due.getFullYear() + 1);
            break;
        }
      }

      if (!processed) return rt;

      return {
        ...rt,
        nextDueDate: due.toISOString(),
        lastProcessedDate: new Date().toISOString(),
      };
    });

    if (newTransactions.length > 0) {
      set((prev) => {
        let accts = prev.accounts;
        let budgets = prev.budgets;

        // Apply balance and budget impact for each new transaction
        for (const txn of newTransactions) {
          if (
            txn.type === 'expense' ||
            txn.type === 'income' ||
            txn.type === 'transfer'
          ) {
            const delta = txn.type === 'income' ? txn.amount : -txn.amount;
            accts = accts.map((a) =>
              a.id === txn.accountId ? { ...a, balance: a.balance + delta } : a,
            );
            if (txn.type === 'transfer' && txn.toAccountId) {
              accts = accts.map((a) =>
                a.id === txn.toAccountId ? { ...a, balance: a.balance + txn.amount } : a,
              );
            }
          }
          if (txn.type === 'expense') {
            budgets = budgets.map((b) =>
              b.category === txn.category ? { ...b, spent: b.spent + txn.amount } : b,
            );
          }
        }

        return {
          transactions: [...newTransactions, ...prev.transactions],
          recurringTransactions: updatedRecurring,
          accounts: accts,
          budgets,
        };
      });

      // Persist new transactions
      for (const txn of newTransactions) transactionRepo.insert(txn);

      // Persist balance changes for affected accounts
      const affectedAccountIds = new Set<string>();
      for (const txn of newTransactions) {
        affectedAccountIds.add(txn.accountId);
        if (txn.type === 'transfer' && txn.toAccountId)
          affectedAccountIds.add(txn.toAccountId);
      }
      for (const aid of affectedAccountIds) {
        const acct = get().accounts.find((a) => a.id === aid);
        if (acct) accountRepo.update(aid, { balance: acct.balance });
      }

      // Persist budget changes
      const affectedCategories = new Set<string>();
      for (const txn of newTransactions) {
        if (txn.type === 'expense') affectedCategories.add(txn.category);
      }
      for (const cat of affectedCategories) {
        const bgt = get().budgets.find((b) => b.category === cat);
        if (bgt) budgetRepo.update(bgt.id, { spent: bgt.spent });
      }

      // Persist updated recurring transactions
      for (const rt of updatedRecurring) {
        const original = s.recurringTransactions.find((o) => o.id === rt.id);
        if (
          original &&
          (original.nextDueDate !== rt.nextDueDate ||
            original.lastProcessedDate !== rt.lastProcessedDate)
        ) {
          recurringTransactionRepo.update(rt.id, {
            next_due_date: rt.nextDueDate,
            last_processed_date: rt.lastProcessedDate ?? null,
          });
        }
      }
    }
  },

  resetBudgetPeriods() {
    const s = get();
    const now = new Date();
    let periodStart: Date;

    const updatedBudgets = s.budgets.map((budget) => {
      // Determine period start based on budget period
      if (budget.period === 'weekly') {
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
        periodStart.setHours(0, 0, 0, 0);
      } else {
        // monthly (default)
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const periodStartISO = periodStart.toISOString();

      // Recalculate spent from transactions within this period
      const spent = s.transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            t.category === budget.category &&
            t.date >= periodStartISO,
        )
        .reduce((sum, t) => sum + t.amount, 0);

      if (spent === budget.spent) return budget;

      // Handle rollover: carry over unspent amount from previous period
      const rolloverAmt =
        budget.rollover && budget.spent < budget.amount
          ? budget.amount - budget.spent
          : 0;

      return {
        ...budget,
        spent,
        rolloverAmount: rolloverAmt > 0 ? rolloverAmt : budget.rolloverAmount,
      };
    });

    // Only update if something changed
    const changed = updatedBudgets.some(
      (b, i) => b.spent !== s.budgets[i]!.spent,
    );
    if (changed) {
      set({ budgets: updatedBudgets });
      for (const b of updatedBudgets) {
        budgetRepo.update(b.id, {
          spent: b.spent,
          rollover_amount: b.rolloverAmount ?? 0,
        });
      }
    }
  },

  // ── Custom Category Actions ──────────────────────────────────────────

  addCustomCategory(item: CustomCategoryInsert) {
    const cat: CustomCategory = { ...item, id: uid('ccat') };
    set((s) => ({ customCategories: [...s.customCategories, cat] }));
    customCategoryRepo.insert(cat);
  },

  updateCustomCategory(id: string, partial: Partial<CustomCategoryInsert>) {
    set((s) => ({
      customCategories: s.customCategories.map((c) =>
        c.id === id ? { ...c, ...partial } : c,
      ),
    }));
    const snaked: Record<string, any> = {};
    if (partial.label !== undefined) snaked.label = partial.label;
    if (partial.icon !== undefined) snaked.icon = partial.icon;
    if (partial.color !== undefined) snaked.color = partial.color;
    if (partial.type !== undefined) snaked.type = partial.type;
    customCategoryRepo.update(id, snaked);
  },

  deleteCustomCategory(id: string) {
    set((s) => ({
      customCategories: s.customCategories.filter((c) => c.id !== id),
      customSubcategories: s.customSubcategories.filter(
        (sc) => sc.parentCategoryId !== id,
      ),
    }));
    customCategoryRepo.delete(id);
  },

  // ── Custom Subcategory Actions ─────────────────────────────────────

  addCustomSubcategory(item: CustomSubcategoryInsert) {
    const sc: CustomSubcategory = { ...item, id: uid('csub') };
    set((s) => ({ customSubcategories: [...s.customSubcategories, sc] }));
    customSubcategoryRepo.insert(sc);
  },

  updateCustomSubcategory(id: string, partial: Partial<CustomSubcategoryInsert>) {
    set((s) => ({
      customSubcategories: s.customSubcategories.map((sc) =>
        sc.id === id ? { ...sc, ...partial } : sc,
      ),
    }));
    const snaked: Record<string, any> = {};
    if (partial.parentCategoryId !== undefined)
      snaked.parent_category_id = partial.parentCategoryId;
    if (partial.label !== undefined) snaked.label = partial.label;
    customSubcategoryRepo.update(id, snaked);
  },

  deleteCustomSubcategory(id: string) {
    set((s) => ({
      customSubcategories: s.customSubcategories.filter((sc) => sc.id !== id),
    }));
    customSubcategoryRepo.delete(id);
  },

  // ── Saved Payee Actions ────────────────────────────────────────────

  addSavedPayee(item: SavedPayeeInsert) {
    const payee: SavedPayee = { ...item, id: uid('payee'), useCount: 0 };
    set((s) => ({ savedPayees: [...s.savedPayees, payee] }));
    savedPayeeRepo.insert(payee);
  },

  updateSavedPayee(id: string, partial: Partial<SavedPayeeInsert>) {
    set((s) => ({
      savedPayees: s.savedPayees.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    }));
    const snaked: Record<string, any> = {};
    if (partial.name !== undefined) snaked.name = partial.name;
    if (partial.category !== undefined) snaked.category = partial.category;
    if (partial.isFavorite !== undefined) snaked.is_favorite = partial.isFavorite ? 1 : 0;
    if (partial.lastUsed !== undefined) snaked.last_used = partial.lastUsed;
    savedPayeeRepo.update(id, snaked);
  },

  deleteSavedPayee(id: string) {
    set((s) => ({ savedPayees: s.savedPayees.filter((p) => p.id !== id) }));
    savedPayeeRepo.delete(id);
  },

  recordPayeeUsage(payeeName: string, category?: string) {
    const s = get();
    const existing = s.savedPayees.find(
      (p) => p.name.toLowerCase() === payeeName.toLowerCase(),
    );
    if (existing) {
      set({
        savedPayees: s.savedPayees.map((p) =>
          p.id === existing.id
            ? {
                ...p,
                useCount: p.useCount + 1,
                lastUsed: new Date().toISOString(),
                category: category ?? p.category,
              }
            : p,
        ),
      });
      savedPayeeRepo.update(existing.id, {
        use_count: existing.useCount + 1,
        last_used: new Date().toISOString(),
        category: category ?? existing.category ?? null,
      });
    } else {
      const newPayee: SavedPayee = {
        id: uid('payee'),
        name: payeeName,
        category,
        isFavorite: false,
        lastUsed: new Date().toISOString(),
        useCount: 1,
      };
      set({ savedPayees: [...s.savedPayees, newPayee] });
      savedPayeeRepo.insert(newPayee);
    }
  },

  // ── Saved Tag Actions ──────────────────────────────────────────────

  addSavedTag(item: SavedTagInsert) {
    const tag: SavedTag = { ...item, id: uid('tag'), useCount: 0 };
    set((s) => ({ savedTags: [...s.savedTags, tag] }));
    savedTagRepo.insert(tag);
  },

  deleteSavedTag(id: string) {
    set((s) => ({ savedTags: s.savedTags.filter((t) => t.id !== id) }));
    savedTagRepo.delete(id);
  },

  recordTagUsage(tagName: string) {
    const s = get();
    const existing = s.savedTags.find(
      (t) => t.name.toLowerCase() === tagName.toLowerCase(),
    );
    if (existing) {
      set({
        savedTags: s.savedTags.map((t) =>
          t.id === existing.id ? { ...t, useCount: t.useCount + 1 } : t,
        ),
      });
      savedTagRepo.update(existing.id, { use_count: existing.useCount + 1 });
    } else {
      const newTag: SavedTag = { id: uid('tag'), name: tagName, useCount: 1 };
      set({ savedTags: [...s.savedTags, newTag] });
      savedTagRepo.insert(newTag);
    }
  },

  // ── Wishlist Actions ─────────────────────────────────────────────

  addWishlistItem(item: WishlistItemInsert) {
    const newItem: WishlistItem = {
      ...item,
      id: uid('wish'),
      currentAmount: 0,
      isPurchased: false,
    };
    set((s) => ({ wishlistItems: [...s.wishlistItems, newItem] }));
    wishlistItemRepo.insert(newItem);
  },

  updateWishlistItem(id: string, partial: Partial<WishlistItemInsert>) {
    set((s) => ({
      wishlistItems: s.wishlistItems.map((w) => (w.id === id ? { ...w, ...partial } : w)),
    }));
    const snaked: Record<string, any> = {};
    if (partial.name !== undefined) snaked.name = partial.name;
    if (partial.targetAmount !== undefined) snaked.target_amount = partial.targetAmount;
    if (partial.priority !== undefined) snaked.priority = partial.priority;
    if (partial.category !== undefined) snaked.category = partial.category;
    if (partial.imageUrl !== undefined) snaked.image_url = partial.imageUrl;
    if (partial.link !== undefined) snaked.link = partial.link;
    if (partial.notes !== undefined) snaked.notes = partial.notes;
    wishlistItemRepo.update(id, snaked);
  },

  deleteWishlistItem(id: string) {
    set((s) => ({ wishlistItems: s.wishlistItems.filter((w) => w.id !== id) }));
    wishlistItemRepo.delete(id);
  },

  markWishlistPurchased(id: string) {
    set((s) => ({
      wishlistItems: s.wishlistItems.map((w) =>
        w.id === id
          ? { ...w, isPurchased: true, purchasedDate: new Date().toISOString() }
          : w,
      ),
    }));
    wishlistItemRepo.update(id, {
      is_purchased: 1,
      purchased_date: new Date().toISOString(),
    });
  },

  // ── Planner Items ─────────────────────────────────────────────────

  addPlannerItem(item: PlannerItemInsert) {
    const newItem: PlannerItem = { ...item, id: uid('planner') };
    set((s) => ({ plannerItems: [...s.plannerItems, newItem] }));
    plannerItemRepo.insert(newItem);
  },

  updatePlannerItem(id: string, partial: Partial<PlannerItemInsert>) {
    set((s) => ({
      plannerItems: s.plannerItems.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    }));
    const snaked: Record<string, any> = {};
    if (partial.plannerType !== undefined) snaked.planner_type = partial.plannerType;
    if (partial.label !== undefined) snaked.label = partial.label;
    if (partial.amount !== undefined) snaked.amount = partial.amount;
    if (partial.status !== undefined) snaked.status = partial.status;
    if (partial.icon !== undefined) snaked.icon = partial.icon;
    if (partial.color !== undefined) snaked.color = partial.color;
    plannerItemRepo.update(id, snaked);
  },

  deletePlannerItem(id: string) {
    set((s) => ({ plannerItems: s.plannerItems.filter((p) => p.id !== id) }));
    plannerItemRepo.delete(id);
  },

  // ── Notifications ─────────────────────────────────────────────────

  addAppNotification(item: AppNotificationInsert) {
    const notif: AppNotification = {
      ...item,
      id: uid('notif'),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ appNotifications: [notif, ...s.appNotifications] }));
    appNotificationRepo.insert(notif);
  },

  markNotificationRead(id: string) {
    set((s) => ({
      appNotifications: s.appNotifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
    }));
    appNotificationRepo.markRead(id);
  },

  markAllNotificationsRead() {
    set((s) => ({
      appNotifications: s.appNotifications.map((n) => ({ ...n, isRead: true })),
    }));
    appNotificationRepo.markAllRead();
  },

  deleteAppNotification(id: string) {
    set((s) => ({ appNotifications: s.appNotifications.filter((n) => n.id !== id) }));
    appNotificationRepo.delete(id);
  },

  clearAppNotifications() {
    set({ appNotifications: [] });
    appNotificationRepo.deleteAll();
  },

  // ── UI Preferences ──────────────────────────────────────────────

  toggleHideBalances() {
    set((s) => ({ hideBalances: !s.hideBalances }));
  },

  // ── Notification Preferences ──────────────────────────────────

  updateNotificationPreference(key: keyof NotificationPreferences, value: boolean) {
    set((s) => ({
      notificationPreferences: { ...s.notificationPreferences, [key]: value },
    }));
    // Persist to MMKV
    const storageKeyMap: Record<keyof NotificationPreferences, string> = {
      billReminders: STORAGE_KEYS.NOTIF_BILL_REMINDERS,
      budgetAlerts: STORAGE_KEYS.NOTIF_BUDGET_ALERTS,
      recurringReminders: STORAGE_KEYS.NOTIF_RECURRING_REMINDERS,
    };
    appStorage.set(storageKeyMap[key], value);
  },

  // ── Transaction Template Actions ──────────────────────────────

  addTransactionTemplate(item: TransactionTemplateInsert) {
    const template: TransactionTemplate = { ...item, id: uid('tmpl') };
    set((s) => ({ transactionTemplates: [...s.transactionTemplates, template] }));
    transactionTemplateRepo.insert({
      id: template.id, name: template.name, merchantName: template.merchantName,
      amount: template.amount, category: template.category, type: template.type,
      accountId: template.accountId, currency: template.currency,
      description: template.description, subcategory: template.subcategory ?? null,
    });
  },

  updateTransactionTemplate(id: string, partial: Partial<TransactionTemplateInsert>) {
    set((s) => ({
      transactionTemplates: s.transactionTemplates.map((t) =>
        t.id === id ? { ...t, ...partial } : t,
      ),
    }));
    const snaked: Record<string, any> = {};
    if (partial.name !== undefined) snaked.name = partial.name;
    if (partial.merchantName !== undefined) snaked.merchant_name = partial.merchantName;
    if (partial.amount !== undefined) snaked.amount = partial.amount;
    if (partial.category !== undefined) snaked.category = partial.category;
    if (partial.type !== undefined) snaked.type = partial.type;
    if (partial.accountId !== undefined) snaked.account_id = partial.accountId;
    if (partial.currency !== undefined) snaked.currency = partial.currency;
    if (partial.description !== undefined) snaked.description = partial.description;
    if (partial.subcategory !== undefined) snaked.subcategory = partial.subcategory;
    transactionTemplateRepo.update(id, snaked);
  },

  deleteTransactionTemplate(id: string) {
    set((s) => ({
      transactionTemplates: s.transactionTemplates.filter((t) => t.id !== id),
    }));
    transactionTemplateRepo.delete(id);
  },

  // ── Split Group Actions ───────────────────────────────────────

  addSplitGroup(item: SplitGroupInsert) {
    const group: SplitGroup = { ...item, id: uid('split') };
    set((s) => ({ splitGroups: [...s.splitGroups, group] }));
    splitGroupRepo.insert({
      id: group.id, title: group.title, date: group.date,
      totalAmount: group.totalAmount, settled: group.settled,
    });
    for (const m of group.members) {
      splitGroupMemberRepo.insert({
        splitGroupId: group.id, name: m.name, avatar: m.avatar,
        owes: m.owes, paid: m.paid,
      });
    }
  },

  updateSplitGroup(id: string, partial: Partial<SplitGroupInsert>) {
    set((s) => ({
      splitGroups: s.splitGroups.map((g) => (g.id === id ? { ...g, ...partial } : g)),
    }));
    const snaked: Record<string, any> = {};
    if (partial.title !== undefined) snaked.title = partial.title;
    if (partial.date !== undefined) snaked.date = partial.date;
    if (partial.totalAmount !== undefined) snaked.total_amount = partial.totalAmount;
    if (partial.settled !== undefined) snaked.settled = partial.settled ? 1 : 0;
    splitGroupRepo.update(id, snaked);
    if (partial.members) {
      splitGroupMemberRepo.deleteBySplitGroupId(id);
      for (const m of partial.members) {
        splitGroupMemberRepo.insert({
          splitGroupId: id, name: m.name, avatar: m.avatar,
          owes: m.owes, paid: m.paid,
        });
      }
    }
  },

  deleteSplitGroup(id: string) {
    set((s) => ({ splitGroups: s.splitGroups.filter((g) => g.id !== id) }));
    splitGroupRepo.delete(id);
  },

  settleSplitGroup(id: string) {
    set((s) => ({
      splitGroups: s.splitGroups.map((g) =>
        g.id === id
          ? { ...g, settled: true, members: g.members.map((m) => ({ ...m, paid: true })) }
          : g,
      ),
    }));
    splitGroupRepo.update(id, { settled: 1 });
    splitGroupMemberRepo.updateAllPaid(id);
  },

  markSplitMemberPaid(groupId: string, memberName: string) {
    let allPaid = false;
    set((s) => ({
      splitGroups: s.splitGroups.map((g) => {
        if (g.id !== groupId) return g;
        const updated = {
          ...g,
          members: g.members.map((m) =>
            m.name === memberName ? { ...m, paid: true } : m,
          ),
        };
        allPaid = updated.members.every((m) => m.paid);
        return { ...updated, settled: allPaid };
      }),
    }));
    splitGroupMemberRepo.updatePaid(groupId, memberName, true);
    if (allPaid) splitGroupRepo.update(groupId, { settled: 1 });
  },

  // ── Household / Shared Budget Actions ─────────────────────────────

  addHouseholdMember(item: Omit<HouseholdMember, 'id'>) {
    const member: HouseholdMember = { ...item, id: uid('member') };
    set((s) => ({ householdMembers: [...s.householdMembers, member] }));
    householdMemberRepo.insert({
      id: member.id, name: member.name, avatar: member.avatar, color: member.color,
    });
  },

  deleteHouseholdMember(id: string) {
    set((s) => ({ householdMembers: s.householdMembers.filter((m) => m.id !== id) }));
    householdMemberRepo.delete(id);
  },

  addSharedBudget(item: SharedBudgetItemInsert) {
    const budget: SharedBudgetItem = { ...item, id: uid('shbudget') };
    set((s) => ({ sharedBudgets: [...s.sharedBudgets, budget] }));
    sharedBudgetRepo.insert({
      id: budget.id, label: budget.label, amount: budget.amount,
      spent: budget.spent, icon: budget.icon, color: budget.color,
    });
    for (const c of budget.contributions) {
      sharedBudgetContributionRepo.insert({
        sharedBudgetId: budget.id, memberId: c.memberId, amount: c.amount,
      });
    }
  },

  updateSharedBudget(id: string, partial: Partial<SharedBudgetItemInsert>) {
    set((s) => ({
      sharedBudgets: s.sharedBudgets.map((b) => (b.id === id ? { ...b, ...partial } : b)),
    }));
    const snaked: Record<string, any> = {};
    if (partial.label !== undefined) snaked.label = partial.label;
    if (partial.amount !== undefined) snaked.amount = partial.amount;
    if (partial.spent !== undefined) snaked.spent = partial.spent;
    if (partial.icon !== undefined) snaked.icon = partial.icon;
    if (partial.color !== undefined) snaked.color = partial.color;
    sharedBudgetRepo.update(id, snaked);
    if (partial.contributions) {
      sharedBudgetContributionRepo.deleteByBudgetId(id);
      for (const c of partial.contributions) {
        sharedBudgetContributionRepo.insert({
          sharedBudgetId: id, memberId: c.memberId, amount: c.amount,
        });
      }
    }
  },

  deleteSharedBudget(id: string) {
    set((s) => ({ sharedBudgets: s.sharedBudgets.filter((b) => b.id !== id) }));
    sharedBudgetRepo.delete(id);
  },

  logSharedExpense(budgetId: string, memberId: string, amount: number) {
    let newSpent = 0;
    let newContribAmount = 0;
    set((s) => ({
      sharedBudgets: s.sharedBudgets.map((b) => {
        if (b.id !== budgetId) return b;
        const existing = b.contributions.find((c) => c.memberId === memberId);
        const contributions = existing
          ? b.contributions.map((c) =>
              c.memberId === memberId ? { ...c, amount: c.amount + amount } : c,
            )
          : [...b.contributions, { memberId, amount }];
        newSpent = b.spent + amount;
        newContribAmount = existing ? existing.amount + amount : amount;
        return { ...b, spent: newSpent, contributions };
      }),
    }));
    sharedBudgetRepo.update(budgetId, { spent: newSpent });
    sharedBudgetContributionRepo.upsert(budgetId, memberId, newContribAmount);
  },

  // ── Accountability Partner Actions ──────────────────────────────────

  addAccountabilityPartner(item: AccountabilityPartnerInsert) {
    const partner: AccountabilityPartner = { ...item, id: uid('partner') };
    set((s) => ({ accountabilityPartners: [...s.accountabilityPartners, partner] }));
    accountabilityPartnerRepo.insert({
      id: partner.id, name: partner.name, goalId: partner.goalId ?? null,
      checkInDates: partner.checkInDates, streak: partner.streak,
      createdAt: partner.createdAt,
    });
  },

  deleteAccountabilityPartner(id: string) {
    set((s) => ({
      accountabilityPartners: s.accountabilityPartners.filter((p) => p.id !== id),
    }));
    accountabilityPartnerRepo.delete(id);
  },

  recordPartnerCheckIn(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    let updatedDates: string[] = [];
    let updatedStreak = 0;
    set((s) => ({
      accountabilityPartners: s.accountabilityPartners.map((p) => {
        if (p.id !== id) return p;
        if (p.checkInDates.includes(today)) return p; // already checked in today
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const lastCheckIn = p.checkInDates[p.checkInDates.length - 1];
        const streak = lastCheckIn === yesterday ? p.streak + 1 : 1;
        updatedDates = [...p.checkInDates, today];
        updatedStreak = streak;
        return { ...p, checkInDates: updatedDates, streak };
      }),
    }));
    if (updatedDates.length > 0) {
      accountabilityPartnerRepo.update(id, {
        check_in_dates: JSON.stringify(updatedDates),
        streak: updatedStreak,
      });
    }
  },

  // ── Profile & Reset ────────────────────────────────────────────────

  updateProfile(partial: Partial<Profile>) {
    set((s) => ({ profile: { ...s.profile, ...partial } }));
    const snaked: Record<string, any> = {};
    if (partial.name !== undefined) snaked.name = partial.name;
    if (partial.email !== undefined) snaked.email = partial.email;
    if (partial.currency !== undefined) snaked.currency = partial.currency;
    if (partial.language !== undefined) snaked.language = partial.language;
    if (partial.phone !== undefined) snaked.phone = partial.phone;
    if (partial.employmentType !== undefined)
      snaked.employment_type = partial.employmentType;
    profileRepo.update(snaked);
  },

  resetStore() {
    set({
      accounts: [],
      transactions: [],
      budgets: [],
      goals: [],
      recurringBills: [],
      debtInfos: [],
      cards: [],
      utangs: [],
      paluwagans: [],
      remittances: [],
      govtContributions: [],
      subscriptions: [],
      netWorthSnapshots: [],
      manualAssets: [],
      taxRecords: [],
      recurringTransactions: [],
      customCategories: [],
      customSubcategories: [],
      savedPayees: [],
      savedTags: [],
      wishlistItems: [],
      plannerItems: [],
      appNotifications: [],
      profile: defaultProfile,
      hideBalances: false,
      isSeeded: false,
      notificationPreferences: {
        billReminders: true,
        budgetAlerts: true,
        recurringReminders: true,
      },
      transactionTemplates: [],
      splitGroups: [],
      householdMembers: [{ id: 'you', name: 'You', avatar: '👤', color: palette.primary[600] }],
      sharedBudgets: [],
      accountabilityPartners: [],
    });
    // Clear notification preferences from storage
    appStorage.remove(STORAGE_KEYS.NOTIF_BILL_REMINDERS);
    appStorage.remove(STORAGE_KEYS.NOTIF_BUDGET_ALERTS);
    appStorage.remove(STORAGE_KEYS.NOTIF_RECURRING_REMINDERS);
    truncateAll();
  },
}));
