/**
 * One-time migration: reads the old MMKV JSON blob and inserts
 * all entities into the new SQLite tables. After migration the
 * MMKV key is removed so this never runs again.
 *
 * NOTE: In Expo Go the storage is in-memory (resets each restart),
 * so this only triggers in development builds with real MMKV.
 */
import { appStorage } from '@lib/storage/mmkv';
import { STORAGE_KEYS } from '@lib/constants/app';
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
  markSeeded,
  getIsSeeded,
} from './repository';

let _counter = 0;
function uid(prefix: string): string {
  _counter += 1;
  return `${prefix}-mig-${Date.now()}-${_counter}`;
}

export function migrateFromMMKV(): boolean {
  // Skip if SQLite already has data
  if (getIsSeeded()) return false;

  const raw = appStorage.getString(STORAGE_KEYS.FINANCE_STORE);
  if (!raw) return false;

  let parsed: { state?: Record<string, any>; version?: number };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return false;
  }

  const s = parsed.state;
  if (!s || !s.isSeeded) return false;

  try {
    // Accounts
    if (Array.isArray(s.accounts)) {
      for (const a of s.accounts) accountRepo.insert(a);
    }

    // Transactions
    if (Array.isArray(s.transactions)) {
      for (const t of s.transactions) transactionRepo.insert(t);
    }

    // Budgets
    if (Array.isArray(s.budgets)) {
      for (const b of s.budgets) budgetRepo.insert(b);
    }

    // Goals
    if (Array.isArray(s.goals)) {
      for (const g of s.goals) goalRepo.insert(g);
    }

    // Recurring Bills + payment history
    if (Array.isArray(s.recurringBills)) {
      for (const bill of s.recurringBills) {
        const { paymentHistory, ...billData } = bill;
        recurringBillRepo.insert(billData);
        if (Array.isArray(paymentHistory)) {
          for (const p of paymentHistory) {
            billPaymentRepo.insert({
              id: uid('bp'),
              billId: bill.id,
              date: p.date,
              amount: p.amount,
              transactionId: p.transactionId,
            });
          }
        }
      }
    }

    // Debt Infos
    if (Array.isArray(s.debtInfos)) {
      for (const d of s.debtInfos) debtInfoRepo.insert(d);
    }

    // Cards
    if (Array.isArray(s.cards)) {
      for (const c of s.cards) cardRepo.insert(c);
    }

    // Utangs + payments
    if (Array.isArray(s.utangs)) {
      for (const u of s.utangs) {
        const { payments, ...uData } = u;
        utangRepo.insert(uData);
        if (Array.isArray(payments)) {
          for (const p of payments) utangPaymentRepo.insert({ ...p, utangId: u.id });
        }
      }
    }

    // Paluwagans + members
    if (Array.isArray(s.paluwagans)) {
      for (const pal of s.paluwagans) {
        const { members, ...pData } = pal;
        paluwaganRepo.insert(pData);
        if (Array.isArray(members)) {
          for (const m of members) {
            paluwaganMemberRepo.insert({ paluwaganId: pal.id, ...m });
          }
        }
      }
    }

    // Remittances
    if (Array.isArray(s.remittances)) {
      for (const r of s.remittances) remittanceRepo.insert(r);
    }

    // Govt Contributions
    if (Array.isArray(s.govtContributions)) {
      for (const g of s.govtContributions) govtContributionRepo.insert(g);
    }

    // Subscriptions
    if (Array.isArray(s.subscriptions)) {
      for (const sub of s.subscriptions) subscriptionRepo.insert(sub);
    }

    // Net Worth Snapshots
    if (Array.isArray(s.netWorthSnapshots)) {
      for (const nw of s.netWorthSnapshots) netWorthSnapshotRepo.insert(nw);
    }

    // Manual Assets
    if (Array.isArray(s.manualAssets)) {
      for (const a of s.manualAssets) manualAssetRepo.insert(a);
    }

    // Tax Records
    if (Array.isArray(s.taxRecords)) {
      for (const t of s.taxRecords) taxRecordRepo.insert(t);
    }

    // Recurring Transactions
    if (Array.isArray(s.recurringTransactions)) {
      for (const rt of s.recurringTransactions) recurringTransactionRepo.insert(rt);
    }

    // Custom Categories + Subcategories
    if (Array.isArray(s.customCategories)) {
      for (const c of s.customCategories) customCategoryRepo.insert(c);
    }
    if (Array.isArray(s.customSubcategories)) {
      for (const sc of s.customSubcategories) customSubcategoryRepo.insert(sc);
    }

    // Saved Payees & Tags
    if (Array.isArray(s.savedPayees)) {
      for (const p of s.savedPayees) savedPayeeRepo.insert(p);
    }
    if (Array.isArray(s.savedTags)) {
      for (const t of s.savedTags) savedTagRepo.insert(t);
    }

    // Wishlist
    if (Array.isArray(s.wishlistItems)) {
      for (const w of s.wishlistItems) wishlistItemRepo.insert(w);
    }

    // Planner Items
    if (Array.isArray(s.plannerItems)) {
      for (const p of s.plannerItems) plannerItemRepo.insert(p);
    }

    // Notifications
    if (Array.isArray(s.appNotifications)) {
      for (const n of s.appNotifications) appNotificationRepo.insert(n);
    }

    // Profile
    if (s.profile) {
      const prof = s.profile;
      profileRepo.update({
        name: prof.name ?? '',
        email: prof.email ?? '',
        currency: prof.currency ?? 'PHP',
        language: prof.language ?? 'en',
        phone: prof.phone ?? '',
        employment_type: prof.employmentType ?? null,
      });
    }

    markSeeded();

    // Remove MMKV key to prevent re-migration
    appStorage.remove(STORAGE_KEYS.FINANCE_STORE);

    if (__DEV__) console.log('[Migration] Successfully migrated MMKV data to SQLite');
    return true;
  } catch (error) {
    if (__DEV__) console.error('[Migration] Failed to migrate MMKV data:', error);
    return false;
  }
}
