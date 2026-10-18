import { relations } from 'drizzle-orm';
import {
  accounts,
  transactions,
  goals,
  cards,
  debtInfos,
  recurringBills,
  billPayments,
  utangs,
  utangPayments,
  paluwagans,
  paluwaganMembers,
  recurringTransactions,
  customCategories,
  customSubcategories,
} from './tables';

// ---------------------------------------------------------------------------
// Accounts relations
// ---------------------------------------------------------------------------
export const accountsRelations = relations(accounts, ({ many, one }) => ({
  transactions: many(transactions),
  recurringTransactions: many(recurringTransactions),
  debtInfo: one(debtInfos, {
    fields: [accounts.id],
    references: [debtInfos.accountId],
  }),
}));

// ---------------------------------------------------------------------------
// Transactions relations
// ---------------------------------------------------------------------------
export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
}));

// ---------------------------------------------------------------------------
// Goals relations
// ---------------------------------------------------------------------------
export const goalsRelations = relations(goals, ({ one }) => ({
  linkedAccount: one(accounts, {
    fields: [goals.linkedAccountId],
    references: [accounts.id],
  }),
}));

// ---------------------------------------------------------------------------
// Cards relations
// ---------------------------------------------------------------------------
export const cardsRelations = relations(cards, ({ one }) => ({
  linkedAccount: one(accounts, {
    fields: [cards.linkedAccountId],
    references: [accounts.id],
  }),
}));

// ---------------------------------------------------------------------------
// Debt Infos relations
// ---------------------------------------------------------------------------
export const debtInfosRelations = relations(debtInfos, ({ one }) => ({
  account: one(accounts, {
    fields: [debtInfos.accountId],
    references: [accounts.id],
  }),
}));

// ---------------------------------------------------------------------------
// Recurring Bills relations
// ---------------------------------------------------------------------------
export const recurringBillsRelations = relations(
  recurringBills,
  ({ many }) => ({
    payments: many(billPayments),
  }),
);

// ---------------------------------------------------------------------------
// Bill Payments relations
// ---------------------------------------------------------------------------
export const billPaymentsRelations = relations(billPayments, ({ one }) => ({
  bill: one(recurringBills, {
    fields: [billPayments.billId],
    references: [recurringBills.id],
  }),
}));

// ---------------------------------------------------------------------------
// Utangs relations
// ---------------------------------------------------------------------------
export const utangsRelations = relations(utangs, ({ many }) => ({
  payments: many(utangPayments),
}));

// ---------------------------------------------------------------------------
// Utang Payments relations
// ---------------------------------------------------------------------------
export const utangPaymentsRelations = relations(utangPayments, ({ one }) => ({
  utang: one(utangs, {
    fields: [utangPayments.utangId],
    references: [utangs.id],
  }),
}));

// ---------------------------------------------------------------------------
// Paluwagans relations
// ---------------------------------------------------------------------------
export const paluwagansRelations = relations(paluwagans, ({ many }) => ({
  members: many(paluwaganMembers),
}));

// ---------------------------------------------------------------------------
// Paluwagan Members relations
// ---------------------------------------------------------------------------
export const paluwaganMembersRelations = relations(
  paluwaganMembers,
  ({ one }) => ({
    paluwagan: one(paluwagans, {
      fields: [paluwaganMembers.paluwaganId],
      references: [paluwagans.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// Recurring Transactions relations
// ---------------------------------------------------------------------------
export const recurringTransactionsRelations = relations(
  recurringTransactions,
  ({ one }) => ({
    account: one(accounts, {
      fields: [recurringTransactions.accountId],
      references: [accounts.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// Custom Categories relations
// ---------------------------------------------------------------------------
export const customCategoriesRelations = relations(
  customCategories,
  ({ many }) => ({
    subcategories: many(customSubcategories),
  }),
);

// ---------------------------------------------------------------------------
// Custom Subcategories relations
// ---------------------------------------------------------------------------
export const customSubcategoriesRelations = relations(
  customSubcategories,
  ({ one }) => ({
    parentCategory: one(customCategories, {
      fields: [customSubcategories.parentCategoryId],
      references: [customCategories.id],
    }),
  }),
);
