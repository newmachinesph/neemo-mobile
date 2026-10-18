/**
 * Hydration helpers: load all data from SQLite and map snake_case rows
 * to the camelCase types used by the Zustand store.
 */
import type { Scalar } from '@op-engineering/op-sqlite';

function safeJsonParse<T>(value: unknown, fallback: T): T {
  try {
    return typeof value === 'string' ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
import type {
  Account,
  Transaction,
  Budget,
  Goal,
  RecurringBill,
  DebtInfo,
  Card,
  Utang,
  UtangPayment,
  Paluwagan,
  PaluwaganMember,
  Remittance,
  GovtContribution,
  Subscription,
  NetWorthSnapshot,
  ManualAsset,
  TaxRecord,
  RecurringTransaction,
  CustomCategory,
  CustomSubcategory,
  SavedPayee,
  SavedTag,
  WishlistItem,
  PlannerItem,
  AppNotification,
  Profile,
  TransactionTemplate,
  SplitGroup,
  SplitMember,
  HouseholdMember,
  SharedBudgetItem,
  SharedBudgetContribution,
  AccountabilityPartner,
} from '@features/finance/types/finance.types';
import { palette } from '@theme/colors';
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
  getIsSeeded,
  transactionTemplateRepo,
  splitGroupRepo,
  splitGroupMemberRepo,
  householdMemberRepo,
  sharedBudgetRepo,
  sharedBudgetContributionRepo,
  accountabilityPartnerRepo,
} from './repository';

type Row = Record<string, Scalar>;

// ── Row mappers ───────────────────────────────────────────────────────────────

function toAccount(r: Row): Account {
  return {
    id: r.id as string,
    name: r.name as string,
    type: r.type as Account['type'],
    balance: r.balance as number,
    currency: r.currency as Account['currency'],
    institution: (r.institution as string) || undefined,
    icon: (r.icon as string) || undefined,
    color: (r.color as string) || undefined,
  };
}

function toTransaction(r: Row): Transaction {
  return {
    id: r.id as string,
    accountId: r.account_id as string,
    type: r.type as Transaction['type'],
    amount: r.amount as number,
    currency: r.currency as Transaction['currency'],
    description: r.description as string,
    merchantName: r.merchant_name as string,
    category: r.category as string,
    date: r.date as string,
    tags: r.tags ? safeJsonParse<string[]>(r.tags, []) : undefined,
    splits: r.splits ? safeJsonParse<{ category: string; amount: number }[]>(r.splits, []) : undefined,
    subcategory: (r.subcategory as string) || undefined,
    cardId: (r.card_id as string) || undefined,
    receiptUri: (r.receipt_uri as string) || undefined,
    notes: (r.notes as string) || undefined,
    toAccountId: (r.to_account_id as string) || undefined,
    exchangeRate: r.exchange_rate != null ? (r.exchange_rate as number) : undefined,
    isBusiness: r.is_business === 1 ? true : undefined,
  };
}

function toBudget(r: Row): Budget {
  return {
    id: r.id as string,
    name: r.name as string,
    category: r.category as string,
    amount: r.amount as number,
    spent: r.spent as number,
    period: r.period as Budget['period'],
    style: (r.style as Budget['style']) || undefined,
    rollover: r.rollover === 1 ? true : undefined,
    rolloverAmount: r.rollover_amount != null ? (r.rollover_amount as number) : undefined,
  };
}

function toGoal(r: Row): Goal {
  return {
    id: r.id as string,
    name: r.name as string,
    targetAmount: r.target_amount as number,
    currentAmount: r.current_amount as number,
    targetDate: r.target_date as string,
    icon: r.icon as string,
    color: r.color as string,
    challengeType: (r.challenge_type as Goal['challengeType']) || undefined,
    isLocked: r.is_locked === 1 ? true : undefined,
    linkedAccountId: (r.linked_account_id as string) || undefined,
    isEmergencyFund: r.is_emergency_fund === 1 ? true : undefined,
  };
}

function toDebtInfo(r: Row): DebtInfo {
  return {
    accountId: r.account_id as string,
    interestRate: r.interest_rate as number,
    minimumPayment: r.minimum_payment as number,
    extraPayment: r.extra_payment != null ? (r.extra_payment as number) : undefined,
  };
}

function toCard(r: Row): Card {
  return {
    id: r.id as string,
    nickname: r.nickname as string,
    type: r.type as Card['type'],
    last4: r.last4 as string,
    linkedAccountId: (r.linked_account_id as string) || undefined,
    network: r.network as Card['network'],
    creditLimit: r.credit_limit != null ? (r.credit_limit as number) : undefined,
    outstandingBalance: r.outstanding_balance != null ? (r.outstanding_balance as number) : undefined,
    statementCutDay: r.statement_cut_day != null ? (r.statement_cut_day as number) : undefined,
    paymentDueDay: r.payment_due_day != null ? (r.payment_due_day as number) : undefined,
    isActive: r.is_active === 1,
  };
}

function toUtangPayment(r: Row): UtangPayment {
  return {
    id: r.id as string,
    amount: r.amount as number,
    date: r.date as string,
    note: (r.note as string) || undefined,
  };
}

function toRemittance(r: Row): Remittance {
  return {
    id: r.id as string,
    senderName: r.sender_name as string,
    amountForeign: r.amount_foreign as number,
    foreignCurrency: r.foreign_currency as string,
    exchangeRate: r.exchange_rate as number,
    amountPHP: r.amount_php as number,
    channel: r.channel as string,
    date: r.date as string,
    note: (r.note as string) || undefined,
  };
}

function toGovtContribution(r: Row): GovtContribution {
  return {
    id: r.id as string,
    type: r.type as GovtContribution['type'],
    year: r.year as number,
    month: r.month as number,
    amount: r.amount as number,
    paidDate: (r.paid_date as string) || undefined,
    status: r.status as GovtContribution['status'],
  };
}

function toSubscription(r: Row): Subscription {
  return {
    id: r.id as string,
    name: r.name as string,
    amount: r.amount as number,
    currency: r.currency as string,
    frequency: r.frequency as Subscription['frequency'],
    renewalDay: r.renewal_day as number,
    category: r.category as string,
    paymentMethod: (r.payment_method as string) || undefined,
    isActive: r.is_active === 1,
    notes: (r.notes as string) || undefined,
    flaggedForReview: r.flagged_for_review === 1 ? true : undefined,
  };
}

function toNetWorthSnapshot(r: Row): NetWorthSnapshot {
  return {
    id: r.id as string,
    date: r.date as string,
    totalAssets: r.total_assets as number,
    totalLiabilities: r.total_liabilities as number,
    netWorth: r.net_worth as number,
  };
}

function toManualAsset(r: Row): ManualAsset {
  return {
    id: r.id as string,
    name: r.name as string,
    value: r.value as number,
    category: r.category as ManualAsset['category'],
    notes: (r.notes as string) || undefined,
  };
}

function toTaxRecord(r: Row): TaxRecord {
  return {
    id: r.id as string,
    year: r.year as number,
    quarter: r.quarter as TaxRecord['quarter'],
    grossIncome: r.gross_income as number,
    deductions: r.deductions as number,
    taxDue: r.tax_due as number,
    taxPaid: r.tax_paid as number,
    filingDate: (r.filing_date as string) || undefined,
    status: r.status as TaxRecord['status'],
  };
}

function toRecurringTransaction(r: Row): RecurringTransaction {
  return {
    id: r.id as string,
    type: r.type as RecurringTransaction['type'],
    amount: r.amount as number,
    currency: r.currency as RecurringTransaction['currency'],
    category: r.category as string,
    merchantName: r.merchant_name as string,
    description: (r.description as string) || undefined,
    accountId: r.account_id as string,
    toAccountId: (r.to_account_id as string) || undefined,
    frequency: r.frequency as RecurringTransaction['frequency'],
    dayOfMonth: r.day_of_month != null ? (r.day_of_month as number) : undefined,
    nextDueDate: r.next_due_date as string,
    isActive: r.is_active === 1,
    lastProcessedDate: (r.last_processed_date as string) || undefined,
  };
}

function toCustomCategory(r: Row): CustomCategory {
  return {
    id: r.id as string,
    label: r.label as string,
    icon: r.icon as string,
    color: r.color as string,
    type: r.type as CustomCategory['type'],
  };
}

function toCustomSubcategory(r: Row): CustomSubcategory {
  return {
    id: r.id as string,
    parentCategoryId: r.parent_category_id as string,
    label: r.label as string,
  };
}

function toSavedPayee(r: Row): SavedPayee {
  return {
    id: r.id as string,
    name: r.name as string,
    category: (r.category as string) || undefined,
    isFavorite: r.is_favorite === 1,
    lastUsed: (r.last_used as string) || undefined,
    useCount: r.use_count as number,
  };
}

function toSavedTag(r: Row): SavedTag {
  return {
    id: r.id as string,
    name: r.name as string,
    color: (r.color as string) || undefined,
    useCount: r.use_count as number,
  };
}

function toWishlistItem(r: Row): WishlistItem {
  return {
    id: r.id as string,
    name: r.name as string,
    targetAmount: r.target_amount as number,
    currentAmount: r.current_amount as number,
    priority: r.priority as WishlistItem['priority'],
    category: (r.category as string) || undefined,
    imageUrl: (r.image_url as string) || undefined,
    link: (r.link as string) || undefined,
    notes: (r.notes as string) || undefined,
    isPurchased: r.is_purchased === 1,
    purchasedDate: (r.purchased_date as string) || undefined,
  };
}

function toPlannerItem(r: Row): PlannerItem {
  return {
    id: r.id as string,
    plannerType: r.planner_type as PlannerItem['plannerType'],
    label: r.label as string,
    amount: r.amount as number,
    status: r.status as string,
    icon: r.icon as string,
    color: r.color as string,
  };
}

function toAppNotification(r: Row): AppNotification {
  return {
    id: r.id as string,
    title: r.title as string,
    body: r.body as string,
    type: r.type as AppNotification['type'],
    relatedId: (r.related_id as string) || undefined,
    isRead: r.is_read === 1,
    createdAt: r.created_at as string,
  };
}

function toProfile(r: Row): Profile {
  return {
    name: r.name as string,
    email: r.email as string,
    currency: r.currency as Profile['currency'],
    language: r.language as string,
    phone: r.phone as string,
    employmentType: (r.employment_type as Profile['employmentType']) || undefined,
  };
}

function toPaluwaganMember(r: Row): PaluwaganMember {
  return {
    name: r.name as string,
    turnOrder: r.turn_order as number,
    hasPaidCurrentRound: r.has_paid_current_round === 1,
    hasReceived: r.has_received === 1,
  };
}

function toTransactionTemplate(r: Row): TransactionTemplate {
  return {
    id: r.id as string,
    name: r.name as string,
    merchantName: r.merchant_name as string,
    amount: r.amount as number,
    category: r.category as string,
    type: r.type as TransactionTemplate['type'],
    accountId: r.account_id as string,
    currency: r.currency as TransactionTemplate['currency'],
    description: r.description as string,
    subcategory: (r.subcategory as string) || undefined,
  };
}

function toSplitMember(r: Row): SplitMember {
  return {
    name: r.name as string,
    avatar: r.avatar as string,
    owes: r.owes as number,
    paid: r.paid === 1,
  };
}

function toHouseholdMember(r: Row): HouseholdMember {
  return {
    id: r.id as string,
    name: r.name as string,
    avatar: r.avatar as string,
    color: r.color as string,
  };
}

function toAccountabilityPartner(r: Row): AccountabilityPartner {
  return {
    id: r.id as string,
    name: r.name as string,
    goalId: (r.goal_id as string) || undefined,
    checkInDates: r.check_in_dates ? safeJsonParse<string[]>(r.check_in_dates, []) : [],
    streak: r.streak as number,
    createdAt: r.created_at as string,
  };
}

// ── Main hydration function ─────────────────────────────────────────────────

export type HydratedState = {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  recurringBills: RecurringBill[];
  debtInfos: DebtInfo[];
  cards: Card[];
  utangs: Utang[];
  paluwagans: Paluwagan[];
  remittances: Remittance[];
  govtContributions: GovtContribution[];
  subscriptions: Subscription[];
  netWorthSnapshots: NetWorthSnapshot[];
  manualAssets: ManualAsset[];
  taxRecords: TaxRecord[];
  recurringTransactions: RecurringTransaction[];
  customCategories: CustomCategory[];
  customSubcategories: CustomSubcategory[];
  savedPayees: SavedPayee[];
  savedTags: SavedTag[];
  wishlistItems: WishlistItem[];
  plannerItems: PlannerItem[];
  appNotifications: AppNotification[];
  profile: Profile;
  isSeeded: boolean;
  transactionTemplates: TransactionTemplate[];
  splitGroups: SplitGroup[];
  householdMembers: HouseholdMember[];
  sharedBudgets: SharedBudgetItem[];
  accountabilityPartners: AccountabilityPartner[];
};

const defaultProfile: Profile = {
  name: '',
  email: '',
  currency: 'PHP',
  language: 'en',
  phone: '',
};

export function hydrateFromDb(): HydratedState {
  // Load flat tables
  const accountRows = accountRepo.getAll();
  const transactionRows = transactionRepo.getAll();
  const budgetRows = budgetRepo.getAll();
  const goalRows = goalRepo.getAll();
  const billRows = recurringBillRepo.getAll();
  const debtRows = debtInfoRepo.getAll();
  const cardRows = cardRepo.getAll();
  const utangRows = utangRepo.getAll();
  const paluwaganRows = paluwaganRepo.getAll();
  const remittanceRows = remittanceRepo.getAll();
  const govtRows = govtContributionRepo.getAll();
  const subRows = subscriptionRepo.getAll();
  const nwRows = netWorthSnapshotRepo.getAll();
  const assetRows = manualAssetRepo.getAll();
  const taxRows = taxRecordRepo.getAll();
  const rtRows = recurringTransactionRepo.getAll();
  const ccatRows = customCategoryRepo.getAll();
  const csubRows = customSubcategoryRepo.getAll();
  const payeeRows = savedPayeeRepo.getAll();
  const tagRows = savedTagRepo.getAll();
  const wishRows = wishlistItemRepo.getAll();
  const plannerRows = plannerItemRepo.getAll();
  const notifRows = appNotificationRepo.getAll();
  const profileRow = profileRepo.get();
  const templateRows = transactionTemplateRepo.getAll();
  const splitGroupRows = splitGroupRepo.getAll();
  const householdMemberRows = householdMemberRepo.getAll();
  const sharedBudgetRows = sharedBudgetRepo.getAll();
  const partnerRows = accountabilityPartnerRepo.getAll();

  // Load junction tables for nested arrays
  const allBillPayments = billPaymentRepo.getAll();
  const allUtangPayments = utangPaymentRepo.getAll();
  const allPaluwaganMembers = paluwaganMemberRepo.getAll();
  const allSplitGroupMembers = splitGroupMemberRepo.getAll();
  const allSharedBudgetContributions = sharedBudgetContributionRepo.getAll();

  // Group junction table data by parent ID
  const billPaymentsByBillId = new Map<string, { date: string; amount: number; transactionId?: string }[]>();
  for (const r of allBillPayments) {
    const billId = r.bill_id as string;
    if (!billPaymentsByBillId.has(billId)) billPaymentsByBillId.set(billId, []);
    billPaymentsByBillId.get(billId)!.push({
      date: r.date as string,
      amount: r.amount as number,
      transactionId: (r.transaction_id as string) || undefined,
    });
  }

  const utangPaymentsByUtangId = new Map<string, UtangPayment[]>();
  for (const r of allUtangPayments) {
    const utangId = r.utang_id as string;
    if (!utangPaymentsByUtangId.has(utangId)) utangPaymentsByUtangId.set(utangId, []);
    utangPaymentsByUtangId.get(utangId)!.push(toUtangPayment(r));
  }

  const membersByPaluwaganId = new Map<string, PaluwaganMember[]>();
  for (const r of allPaluwaganMembers) {
    const pid = r.paluwagan_id as string;
    if (!membersByPaluwaganId.has(pid)) membersByPaluwaganId.set(pid, []);
    membersByPaluwaganId.get(pid)!.push(toPaluwaganMember(r));
  }

  const splitMembersByGroupId = new Map<string, SplitMember[]>();
  for (const r of allSplitGroupMembers) {
    const gid = r.split_group_id as string;
    if (!splitMembersByGroupId.has(gid)) splitMembersByGroupId.set(gid, []);
    splitMembersByGroupId.get(gid)!.push(toSplitMember(r));
  }

  const contribsByBudgetId = new Map<string, SharedBudgetContribution[]>();
  for (const r of allSharedBudgetContributions) {
    const bid = r.shared_budget_id as string;
    if (!contribsByBudgetId.has(bid)) contribsByBudgetId.set(bid, []);
    contribsByBudgetId.get(bid)!.push({
      memberId: r.member_id as string,
      amount: r.amount as number,
    });
  }

  // Map recurring bills with payment history
  const recurringBills: RecurringBill[] = billRows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    amount: r.amount as number,
    category: r.category as string,
    frequency: r.frequency as RecurringBill['frequency'],
    dueDay: r.due_day as number,
    accountId: (r.account_id as string) || undefined,
    isActive: r.is_active === 1,
    lastPaidDate: (r.last_paid_date as string) || undefined,
    paymentHistory: billPaymentsByBillId.get(r.id as string),
  }));

  // Map utangs with payments
  const utangsResult: Utang[] = utangRows.map((r) => ({
    id: r.id as string,
    personName: r.person_name as string,
    type: r.type as Utang['type'],
    amount: r.amount as number,
    remainingBalance: r.remaining_balance as number,
    description: (r.description as string) || undefined,
    date: r.date as string,
    expectedReturnDate: (r.expected_return_date as string) || undefined,
    payments: utangPaymentsByUtangId.get(r.id as string) || [],
    status: r.status as Utang['status'],
  }));

  // Map paluwagans with members
  const paluwagansResult: Paluwagan[] = paluwaganRows.map((r) => ({
    id: r.id as string,
    groupName: r.group_name as string,
    contributionAmount: r.contribution_amount as number,
    frequency: r.frequency as Paluwagan['frequency'],
    members: membersByPaluwaganId.get(r.id as string) || [],
    startDate: r.start_date as string,
    currentRound: r.current_round as number,
    totalRounds: r.total_rounds as number,
  }));

  // Map split groups with members
  const splitGroupsResult: SplitGroup[] = splitGroupRows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    date: r.date as string,
    totalAmount: r.total_amount as number,
    members: splitMembersByGroupId.get(r.id as string) || [],
    settled: r.settled === 1,
  }));

  // Map shared budgets with contributions
  const sharedBudgetsResult: SharedBudgetItem[] = sharedBudgetRows.map((r) => ({
    id: r.id as string,
    label: r.label as string,
    amount: r.amount as number,
    spent: r.spent as number,
    icon: r.icon as string,
    color: r.color as string,
    contributions: contribsByBudgetId.get(r.id as string) || [],
  }));

  // Hydrate household members — ensure "You" default exists
  const householdMembersResult = householdMemberRows.length > 0
    ? householdMemberRows.map(toHouseholdMember)
    : [{ id: 'you', name: 'You', avatar: '\u{1F464}', color: palette.primary[600] }];

  return {
    accounts: accountRows.map(toAccount),
    transactions: transactionRows.map(toTransaction),
    budgets: budgetRows.map(toBudget),
    goals: goalRows.map(toGoal),
    recurringBills,
    debtInfos: debtRows.map(toDebtInfo),
    cards: cardRows.map(toCard),
    utangs: utangsResult,
    paluwagans: paluwagansResult,
    remittances: remittanceRows.map(toRemittance),
    govtContributions: govtRows.map(toGovtContribution),
    subscriptions: subRows.map(toSubscription),
    netWorthSnapshots: nwRows.map(toNetWorthSnapshot),
    manualAssets: assetRows.map(toManualAsset),
    taxRecords: taxRows.map(toTaxRecord),
    recurringTransactions: rtRows.map(toRecurringTransaction),
    customCategories: ccatRows.map(toCustomCategory),
    customSubcategories: csubRows.map(toCustomSubcategory),
    savedPayees: payeeRows.map(toSavedPayee),
    savedTags: tagRows.map(toSavedTag),
    wishlistItems: wishRows.map(toWishlistItem),
    plannerItems: plannerRows.map(toPlannerItem),
    appNotifications: notifRows.map(toAppNotification),
    profile: profileRow ? toProfile(profileRow) : defaultProfile,
    isSeeded: getIsSeeded(),
    transactionTemplates: templateRows.map(toTransactionTemplate),
    splitGroups: splitGroupsResult,
    householdMembers: householdMembersResult,
    sharedBudgets: sharedBudgetsResult,
    accountabilityPartners: partnerRows.map(toAccountabilityPartner),
  };
}
