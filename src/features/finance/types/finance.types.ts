import type {
  AccountType,
  TransactionType,
  CurrencyCode,
  CardType,
  CardNetwork,
} from '@lib/constants/finance';

// ── Account ─────────────────────────────────────────────────────────────────

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: CurrencyCode;
  institution?: string;
  icon?: string;
  color?: string;
};

export type AccountInsert = Omit<Account, 'id'>;

// ── Transaction ─────────────────────────────────────────────────────────────

export type Transaction = {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  description: string;
  merchantName: string;
  category: string;
  date: string; // ISO 8601
  tags?: string[];
  splits?: { category: string; amount: number }[];
  subcategory?: string;
  cardId?: string;
  receiptUri?: string;
  notes?: string;
  toAccountId?: string;
  exchangeRate?: number;
  isBusiness?: boolean;
};

export type TransactionInsert = Omit<Transaction, 'id'>;

// ── Budget ──────────────────────────────────────────────────────────────────

export type Budget = {
  id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly';
  style?: 'envelope' | '50-30-20' | 'zero-based';
  rollover?: boolean;
  rolloverAmount?: number;
};

export type BudgetInsert = Omit<Budget, 'id'>;

// ── Goal ────────────────────────────────────────────────────────────────────

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // "YYYY-MM"
  icon: string;
  color: string;
  challengeType?: '52-week' | '50-peso' | '100-daily' | 'custom';
  isLocked?: boolean;
  linkedAccountId?: string;
  isEmergencyFund?: boolean;
};

export type GoalInsert = Omit<Goal, 'id'>;

// ── Recurring Bill ─────────────────────────────────────────────────────────

export type RecurringBill = {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  dueDay: number;
  accountId?: string;
  isActive: boolean;
  lastPaidDate?: string; // ISO 8601
  paymentHistory?: { date: string; amount: number; transactionId?: string }[];
};

export type RecurringBillInsert = Omit<RecurringBill, 'id'>;

// ── Debt Info ──────────────────────────────────────────────────────────────

export type DebtInfo = {
  accountId: string;
  interestRate: number;
  minimumPayment: number;
  extraPayment?: number;
};

// ── Card ────────────────────────────────────────────────────────────────────

export type Card = {
  id: string;
  nickname: string;
  type: CardType;
  last4: string;
  linkedAccountId?: string;
  network: CardNetwork | 'other';
  creditLimit?: number;
  outstandingBalance?: number;
  statementCutDay?: number;
  paymentDueDay?: number;
  isActive: boolean;
};

export type CardInsert = Omit<Card, 'id'>;

// ── Subcategory ─────────────────────────────────────────────────────────────

export type Subcategory = {
  id: string;
  parentCategory: string;
  label: string;
  icon?: string;
};

// ── Utang (Lend/Borrow) ────────────────────────────────────────────────────

export type UtangPayment = {
  id: string;
  amount: number;
  date: string; // ISO 8601
  note?: string;
};

export type Utang = {
  id: string;
  personName: string;
  type: 'lent' | 'borrowed';
  amount: number;
  remainingBalance: number;
  description?: string;
  date: string; // ISO 8601
  expectedReturnDate?: string;
  payments: UtangPayment[];
  status: 'pending' | 'partial' | 'settled';
};

export type UtangInsert = Omit<Utang, 'id' | 'payments' | 'status' | 'remainingBalance'>;

// ── Paluwagan ───────────────────────────────────────────────────────────────

export type PaluwaganMember = {
  name: string;
  turnOrder: number;
  hasPaidCurrentRound: boolean;
  hasReceived: boolean;
};

export type Paluwagan = {
  id: string;
  groupName: string;
  contributionAmount: number;
  frequency: 'weekly' | 'monthly';
  members: PaluwaganMember[];
  startDate: string; // ISO 8601
  currentRound: number;
  totalRounds: number;
};

export type PaluwaganInsert = Omit<Paluwagan, 'id'>;

// ── Remittance ──────────────────────────────────────────────────────────────

export type Remittance = {
  id: string;
  senderName: string;
  amountForeign: number;
  foreignCurrency: string;
  exchangeRate: number;
  amountPHP: number;
  channel: string;
  date: string; // ISO 8601
  note?: string;
};

export type RemittanceInsert = Omit<Remittance, 'id'>;

// ── Govt Contribution ───────────────────────────────────────────────────────

export type GovtContribution = {
  id: string;
  type: 'sss' | 'philhealth' | 'pagibig';
  year: number;
  month: number; // 1-12
  amount: number;
  paidDate?: string;
  status: 'paid' | 'unpaid';
};

export type GovtContributionInsert = Omit<GovtContribution, 'id'>;

// ── Subscription ────────────────────────────────────────────────────────────

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'yearly';
  renewalDay: number;
  category: string;
  paymentMethod?: string;
  isActive: boolean;
  notes?: string;
  flaggedForReview?: boolean;
};

export type SubscriptionInsert = Omit<Subscription, 'id'>;

// ── Net Worth Snapshot ──────────────────────────────────────────────────────

export type NetWorthSnapshot = {
  id: string;
  date: string; // ISO 8601
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
};

// ── Manual Asset ────────────────────────────────────────────────────────────

export type ManualAsset = {
  id: string;
  name: string;
  value: number;
  category: 'property' | 'vehicle' | 'jewelry' | 'other';
  notes?: string;
};

export type ManualAssetInsert = Omit<ManualAsset, 'id'>;

// ── Wishlist Item ──────────────────────────────────────────────────────────

export type WishlistItem = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  imageUrl?: string;
  link?: string;
  notes?: string;
  isPurchased: boolean;
  purchasedDate?: string;
};

export type WishlistItemInsert = Omit<
  WishlistItem,
  'id' | 'isPurchased' | 'currentAmount'
>;

// ── Tax Record ──────────────────────────────────────────────────────────────

export type TaxRecord = {
  id: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  grossIncome: number;
  deductions: number;
  taxDue: number;
  taxPaid: number;
  filingDate?: string;
  status: 'pending' | 'filed';
};

export type TaxRecordInsert = Omit<TaxRecord, 'id'>;

// ── Recurring Transaction ───────────────────────────────────────────────────

export type RecurringTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  category: string;
  merchantName: string;
  description?: string;
  accountId: string;
  toAccountId?: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfMonth?: number;
  nextDueDate: string; // ISO 8601
  isActive: boolean;
  lastProcessedDate?: string;
};

export type RecurringTransactionInsert = Omit<RecurringTransaction, 'id'>;

// ── Profile ─────────────────────────────────────────────────────────────────

export type EmploymentType =
  | 'employed'
  | 'freelancer'
  | 'ofw'
  | 'business_owner'
  | 'homemaker'
  | 'student';

export type Profile = {
  name: string;
  email: string;
  currency: CurrencyCode;
  language: string;
  phone: string;
  employmentType?: EmploymentType;
};

// ── Custom Category ─────────────────────────────────────────────────────────

export type CustomCategory = {
  id: string;
  label: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
};

export type CustomCategoryInsert = Omit<CustomCategory, 'id'>;

// ── Custom Subcategory ──────────────────────────────────────────────────────

export type CustomSubcategory = {
  id: string;
  parentCategoryId: string;
  label: string;
};

export type CustomSubcategoryInsert = Omit<CustomSubcategory, 'id'>;

// ── Saved Payee ─────────────────────────────────────────────────────────────

export type SavedPayee = {
  id: string;
  name: string;
  category?: string;
  isFavorite: boolean;
  lastUsed?: string;
  useCount: number;
};

export type SavedPayeeInsert = Omit<SavedPayee, 'id' | 'useCount'>;

// ── Saved Tag ───────────────────────────────────────────────────────────────

export type SavedTag = {
  id: string;
  name: string;
  color?: string;
  useCount: number;
};

export type SavedTagInsert = Omit<SavedTag, 'id' | 'useCount'>;

// ── App Notification ─────────────────────────────────────────────────────────

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: 'bill' | 'budget' | 'subscription' | 'system';
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
};

export type AppNotificationInsert = Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>;

// ── Planner Item ────────────────────────────────────────────────────────────

export type PlannerType = 'aguinaldo' | 'fiesta' | 'balikbayan' | 'thirteenth-month' | 'noche-buena';

export type PlannerItem = {
  id: string;
  plannerType: PlannerType;
  label: string;
  amount: number;
  status: string;
  icon: string;
  color: string;
};

export type PlannerItemInsert = Omit<PlannerItem, 'id'>;

// ── Notification Preferences ────────────────────────────────────────────────

export type NotificationPreferences = {
  billReminders: boolean;
  budgetAlerts: boolean;
  recurringReminders: boolean;
};

// ── Transaction Template ───────────────────────────────────────────────────

export type TransactionTemplate = {
  id: string;
  name: string;
  merchantName: string;
  amount: number;
  category: string;
  type: TransactionType;
  accountId: string;
  currency: CurrencyCode;
  description: string;
  subcategory?: string;
};

export type TransactionTemplateInsert = Omit<TransactionTemplate, 'id'>;

// ── Split Group ────────────────────────────────────────────────────────────

export type SplitMember = {
  name: string;
  avatar: string;
  owes: number;
  paid: boolean;
};

export type SplitGroup = {
  id: string;
  title: string;
  date: string;
  totalAmount: number;
  members: SplitMember[];
  settled: boolean;
};

export type SplitGroupInsert = Omit<SplitGroup, 'id'>;

// ── Household / Shared Budget ─────────────────────────────────────────────

export type HouseholdMember = {
  id: string;
  name: string;
  avatar: string;
  color: string;
};

export type SharedBudgetContribution = {
  memberId: string;
  amount: number;
};

export type SharedBudgetItem = {
  id: string;
  label: string;
  amount: number;
  spent: number;
  icon: string;
  color: string;
  contributions: SharedBudgetContribution[];
};

export type SharedBudgetItemInsert = Omit<SharedBudgetItem, 'id'>;

// ── Accountability Partner ────────────────────────────────────────────────

export type AccountabilityPartner = {
  id: string;
  name: string;
  goalId?: string;
  checkInDates: string[];
  streak: number;
  createdAt: string;
};

export type AccountabilityPartnerInsert = Omit<AccountabilityPartner, 'id'>;

// ── Store ───────────────────────────────────────────────────────────────────

export type FinanceState = {
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
  hideBalances: boolean;
  isSeeded: boolean;
  notificationPreferences: NotificationPreferences;
  transactionTemplates: TransactionTemplate[];
  splitGroups: SplitGroup[];
  householdMembers: HouseholdMember[];
  sharedBudgets: SharedBudgetItem[];
  accountabilityPartners: AccountabilityPartner[];

  // ── Existing Actions ──────────────────────────────────────────────────
  _hydrate: () => void;

  addAccount: (item: AccountInsert) => void;
  updateAccount: (id: string, partial: Partial<AccountInsert>) => void;
  updateAccountBalance: (id: string, balance: number) => void;
  deleteAccount: (id: string) => void;
  addTransaction: (item: TransactionInsert) => void;
  updateTransaction: (id: string, partial: Partial<TransactionInsert>) => void;
  deleteTransaction: (id: string) => void;
  addBudget: (item: BudgetInsert) => void;
  updateBudget: (id: string, partial: Partial<BudgetInsert>) => void;
  updateBudgetSpent: (id: string, spent: number) => void;
  deleteBudget: (id: string) => void;
  addGoal: (item: GoalInsert) => void;
  updateGoal: (id: string, partial: Partial<GoalInsert>) => void;
  updateGoalProgress: (id: string, currentAmount: number) => void;
  deleteGoal: (id: string) => void;
  addRecurringBill: (item: RecurringBillInsert) => void;
  updateRecurringBill: (id: string, partial: Partial<RecurringBillInsert>) => void;
  deleteRecurringBill: (id: string) => void;
  markBillPaid: (id: string) => void;
  addDebtInfo: (info: DebtInfo) => void;
  updateDebtInfo: (
    accountId: string,
    partial: Partial<Omit<DebtInfo, 'accountId'>>,
  ) => void;
  deleteDebtInfo: (accountId: string) => void;
  updateProfile: (partial: Partial<Profile>) => void;
  resetStore: () => void;

  // ── Card Actions ──────────────────────────────────────────────────────
  addCard: (item: CardInsert) => void;
  updateCard: (id: string, partial: Partial<CardInsert>) => void;
  deleteCard: (id: string) => void;

  // ── Utang Actions ─────────────────────────────────────────────────────
  addUtang: (item: UtangInsert) => void;
  updateUtang: (id: string, partial: Partial<UtangInsert>) => void;
  deleteUtang: (id: string) => void;
  addUtangPayment: (utangId: string, payment: Omit<UtangPayment, 'id'>) => void;

  // ── Paluwagan Actions ─────────────────────────────────────────────────
  addPaluwagan: (item: PaluwaganInsert) => void;
  updatePaluwagan: (id: string, partial: Partial<PaluwaganInsert>) => void;
  deletePaluwagan: (id: string) => void;

  // ── Remittance Actions ────────────────────────────────────────────────
  addRemittance: (item: RemittanceInsert) => void;
  updateRemittance: (id: string, partial: Partial<RemittanceInsert>) => void;
  deleteRemittance: (id: string) => void;

  // ── Govt Contribution Actions ─────────────────────────────────────────
  addGovtContribution: (item: GovtContributionInsert) => void;
  markGovtContribPaid: (
    type: GovtContribution['type'],
    year: number,
    month: number,
  ) => void;

  // ── Subscription Actions ──────────────────────────────────────────────
  addSubscription: (item: SubscriptionInsert) => void;
  updateSubscription: (id: string, partial: Partial<SubscriptionInsert>) => void;
  deleteSubscription: (id: string) => void;

  // ── Net Worth Actions ─────────────────────────────────────────────────
  takeNetWorthSnapshot: () => void;

  // ── Manual Asset Actions ──────────────────────────────────────────────
  addManualAsset: (item: ManualAssetInsert) => void;
  updateManualAsset: (id: string, partial: Partial<ManualAssetInsert>) => void;
  deleteManualAsset: (id: string) => void;

  // ── Tax Record Actions ────────────────────────────────────────────────
  addTaxRecord: (item: TaxRecordInsert) => void;
  updateTaxRecord: (id: string, partial: Partial<TaxRecordInsert>) => void;
  deleteTaxRecord: (id: string) => void;

  // ── Recurring Transaction Actions ─────────────────────────────────────
  addRecurringTransaction: (item: RecurringTransactionInsert) => void;
  updateRecurringTransaction: (
    id: string,
    partial: Partial<RecurringTransactionInsert>,
  ) => void;
  deleteRecurringTransaction: (id: string) => void;
  processRecurringTransactions: () => void;
  resetBudgetPeriods: () => void;

  // ── Custom Category Actions ─────────────────────────────────────────
  addCustomCategory: (item: CustomCategoryInsert) => void;
  updateCustomCategory: (id: string, partial: Partial<CustomCategoryInsert>) => void;
  deleteCustomCategory: (id: string) => void;

  // ── Custom Subcategory Actions ──────────────────────────────────────
  addCustomSubcategory: (item: CustomSubcategoryInsert) => void;
  updateCustomSubcategory: (
    id: string,
    partial: Partial<CustomSubcategoryInsert>,
  ) => void;
  deleteCustomSubcategory: (id: string) => void;

  // ── Saved Payee Actions ─────────────────────────────────────────────
  addSavedPayee: (item: SavedPayeeInsert) => void;
  updateSavedPayee: (id: string, partial: Partial<SavedPayeeInsert>) => void;
  deleteSavedPayee: (id: string) => void;
  recordPayeeUsage: (payeeName: string, category?: string) => void;

  // ── Saved Tag Actions ───────────────────────────────────────────────
  addSavedTag: (item: SavedTagInsert) => void;
  deleteSavedTag: (id: string) => void;
  recordTagUsage: (tagName: string) => void;

  // ── Wishlist Actions ──────────────────────────────────────────────
  addWishlistItem: (item: WishlistItemInsert) => void;
  updateWishlistItem: (id: string, partial: Partial<WishlistItemInsert>) => void;
  deleteWishlistItem: (id: string) => void;
  markWishlistPurchased: (id: string) => void;

  // ── Planner Item Actions ──────────────────────────────────────
  addPlannerItem: (item: PlannerItemInsert) => void;
  updatePlannerItem: (id: string, partial: Partial<PlannerItemInsert>) => void;
  deletePlannerItem: (id: string) => void;

  // ── Notification Actions ────────────────────────────────────────
  addAppNotification: (item: AppNotificationInsert) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteAppNotification: (id: string) => void;
  clearAppNotifications: () => void;

  // ── UI Preferences ─────────────────────────────────────────────
  toggleHideBalances: () => void;

  // ── Notification Preferences ──────────────────────────────────
  updateNotificationPreference: (
    key: keyof NotificationPreferences,
    value: boolean,
  ) => void;

  // ── Transaction Template Actions ──────────────────────────────
  addTransactionTemplate: (item: TransactionTemplateInsert) => void;
  updateTransactionTemplate: (
    id: string,
    partial: Partial<TransactionTemplateInsert>,
  ) => void;
  deleteTransactionTemplate: (id: string) => void;

  // ── Split Group Actions ───────────────────────────────────────
  addSplitGroup: (item: SplitGroupInsert) => void;
  updateSplitGroup: (id: string, partial: Partial<SplitGroupInsert>) => void;
  deleteSplitGroup: (id: string) => void;
  settleSplitGroup: (id: string) => void;
  markSplitMemberPaid: (groupId: string, memberName: string) => void;

  // ── Household / Shared Budget Actions ───────────────────────────
  addHouseholdMember: (item: Omit<HouseholdMember, 'id'>) => void;
  deleteHouseholdMember: (id: string) => void;
  addSharedBudget: (item: SharedBudgetItemInsert) => void;
  updateSharedBudget: (id: string, partial: Partial<SharedBudgetItemInsert>) => void;
  deleteSharedBudget: (id: string) => void;
  logSharedExpense: (budgetId: string, memberId: string, amount: number) => void;

  // ── Accountability Partner Actions ──────────────────────────────
  addAccountabilityPartner: (item: AccountabilityPartnerInsert) => void;
  deleteAccountabilityPartner: (id: string) => void;
  recordPartnerCheckIn: (id: string) => void;
};
