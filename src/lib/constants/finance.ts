import { palette } from '@theme/colors';

// ────────────────────────────────────────────────────────────────────────────
// Currency
// ────────────────────────────────────────────────────────────────────────────

export const DEFAULT_CURRENCY = 'PHP';

export const CURRENCY_CODES = [
  'PHP',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'CNY',
  'INR',
  'BRL',
  'MXN',
  'KRW',
  'SGD',
  'HKD',
  'NOK',
  'SEK',
  'DKK',
  'NZD',
  'ZAR',
  'TRY',
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

// ────────────────────────────────────────────────────────────────────────────
// Account types
// ────────────────────────────────────────────────────────────────────────────

export const ACCOUNT_TYPES = [
  'savings',
  'checking',
  'time_deposit',
  'e_wallet',
  'digital_bank',
  'investment',
  'loan',
  'credit_card',
  'government_fund',
  'cooperative',
  'insurance',
  'cash',
  'other',
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  savings: 'Savings',
  checking: 'Checking',
  time_deposit: 'Time Deposit',
  e_wallet: 'E-Wallet',
  digital_bank: 'Digital Bank',
  investment: 'Investment',
  loan: 'Loan',
  credit_card: 'Credit Card',
  government_fund: 'Government Fund',
  cooperative: 'Cooperative',
  insurance: 'Insurance',
  cash: 'Cash',
  other: 'Other',
};

// ────────────────────────────────────────────────────────────────────────────
// Transaction categories
// ────────────────────────────────────────────────────────────────────────────

export interface TransactionCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  { id: 'food', label: 'Food & Dining', icon: 'restaurant-outline', color: '#F59E0B' },
  { id: 'groceries', label: 'Groceries', icon: 'cart-outline', color: '#22C55E' },
  { id: 'transport', label: 'Transportation', icon: 'car-outline', color: '#3B82F6' },
  { id: 'shopping', label: 'Shopping', icon: 'bag-outline', color: '#EC4899' },
  { id: 'utilities', label: 'Bills & Utilities', icon: 'flash-outline', color: '#EF4444' },
  { id: 'government', label: 'Government', icon: 'shield-checkmark-outline', color: palette.primary[600] },
  { id: 'load_topup', label: 'Load & Top-up', icon: 'phone-portrait-outline', color: '#0EA5E9' },
  { id: 'padala', label: 'Padala/Remittance', icon: 'send-outline', color: '#14B8A6' },
  { id: 'education', label: 'Education', icon: 'school-outline', color: palette.primary[600] },
  { id: 'healthcare', label: 'Healthcare', icon: 'medkit-outline', color: '#10B981' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film-outline', color: '#8B5CF6' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'card-outline', color: '#F97316' },
  { id: 'rent', label: 'Rent & Housing', icon: 'home-outline', color: '#D97706' },
  { id: 'insurance', label: 'Insurance', icon: 'shield-outline', color: '#64748B' },
  { id: 'transfer', label: 'Transfer', icon: 'swap-horizontal-outline', color: '#94A3B8' },
  { id: 'salary', label: 'Salary', icon: 'cash-outline', color: '#10B981' },
  { id: 'freelance', label: 'Freelance', icon: 'briefcase-outline', color: '#0EA5E9' },
  { id: 'investment_income', label: 'Investment Income', icon: 'trending-up-outline', color: palette.primary[600] },
  { id: 'gifts', label: 'Gifts/Abuloy', icon: 'gift-outline', color: '#F43F5E' },
  { id: 'family_support', label: 'Pamilya Support', icon: 'people-outline', color: '#EC4899' },
  { id: 'tithes', label: 'Ikapu/Tithes', icon: 'heart-outline', color: '#8B5CF6' },
  { id: 'personal_care', label: 'Personal Care', icon: 'body-outline', color: '#E879F9' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
] as const;

/**
 * Quick lookup map: category id -> TransactionCategory.
 */
export const CATEGORY_MAP = new Map<string, TransactionCategory>(
  TRANSACTION_CATEGORIES.map((cat) => [cat.id, cat]),
);

// ────────────────────────────────────────────────────────────────────────────
// Transaction types
// ────────────────────────────────────────────────────────────────────────────

export const TRANSACTION_TYPES = ['income', 'expense', 'transfer'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

// ────────────────────────────────────────────────────────────────────────────
// Card types
// ────────────────────────────────────────────────────────────────────────────

export const CARD_TYPES = ['debit', 'credit', 'prepaid'] as const;
export type CardType = (typeof CARD_TYPES)[number];

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  debit: 'Debit',
  credit: 'Credit',
  prepaid: 'Prepaid',
};

// ────────────────────────────────────────────────────────────────────────────
// Card networks
// ────────────────────────────────────────────────────────────────────────────

export const CARD_NETWORKS = ['visa', 'mastercard', 'jcb', 'unionpay'] as const;
export type CardNetwork = (typeof CARD_NETWORKS)[number];

// ────────────────────────────────────────────────────────────────────────────
// Government contribution types
// ────────────────────────────────────────────────────────────────────────────

export const CONTRIBUTION_TYPES = ['sss', 'philhealth', 'pagibig', 'mp2'] as const;
export type ContributionType = (typeof CONTRIBUTION_TYPES)[number];

export const CONTRIBUTION_TYPE_LABELS: Record<ContributionType, string> = {
  sss: 'SSS',
  philhealth: 'PhilHealth',
  pagibig: 'Pag-IBIG',
  mp2: 'MP2',
};

// ────────────────────────────────────────────────────────────────────────────
// Employment types
// ────────────────────────────────────────────────────────────────────────────

export const EMPLOYMENT_TYPES = [
  'employed',
  'freelancer',
  'ofw',
  'business_owner',
  'homemaker',
  'student',
] as const;

export const EMPLOYMENT_TYPE_LABELS: Record<(typeof EMPLOYMENT_TYPES)[number], string> = {
  employed: 'Employed',
  freelancer: 'Freelancer / Self-Employed',
  ofw: 'OFW',
  business_owner: 'Business Owner',
  homemaker: 'Homemaker',
  student: 'Student',
};

// ────────────────────────────────────────────────────────────────────────────
// Subcategories
// ────────────────────────────────────────────────────────────────────────────

export interface SubcategoryDef {
  id: string;
  label: string;
  icon?: string;
}

export const SUBCATEGORIES: Record<string, SubcategoryDef[]> = {
  food: [
    { id: 'food-kainan', label: 'Kainan sa Labas' },
    { id: 'food-delivery', label: 'Delivery' },
    { id: 'food-lutong-bahay', label: 'Lutong-bahay' },
    { id: 'food-snacks', label: 'Snacks & Merienda' },
    { id: 'food-coffee', label: 'Coffee & Drinks' },
  ],
  transport: [
    { id: 'transport-grab', label: 'Grab' },
    { id: 'transport-jeep', label: 'Jeepney' },
    { id: 'transport-mrt', label: 'MRT/LRT' },
    { id: 'transport-bus', label: 'Bus' },
    { id: 'transport-gas', label: 'Gas/Fuel' },
    { id: 'transport-angkas', label: 'Angkas' },
    { id: 'transport-parking', label: 'Parking & Tolls' },
  ],
  shopping: [
    { id: 'shop-online', label: 'Online Shopping' },
    { id: 'shop-clothing', label: 'Clothing' },
    { id: 'shop-gadgets', label: 'Gadgets & Electronics' },
    { id: 'shop-home', label: 'Home & Living' },
  ],
  utilities: [
    { id: 'util-electric', label: 'Electricity (MERALCO)' },
    { id: 'util-water', label: 'Water' },
    { id: 'util-internet', label: 'Internet' },
    { id: 'util-phone', label: 'Phone Plan' },
  ],
  groceries: [
    { id: 'groc-supermarket', label: 'Supermarket' },
    { id: 'groc-palengke', label: 'Palengke' },
    { id: 'groc-sari-sari', label: 'Sari-sari Store' },
  ],
  entertainment: [
    { id: 'ent-movies', label: 'Movies' },
    { id: 'ent-streaming', label: 'Streaming' },
    { id: 'ent-gaming', label: 'Gaming' },
    { id: 'ent-events', label: 'Events & Concerts' },
  ],
  healthcare: [
    { id: 'health-checkup', label: 'Check-up' },
    { id: 'health-medicine', label: 'Medicine' },
    { id: 'health-dental', label: 'Dental' },
    { id: 'health-vitamins', label: 'Vitamins & Supplements' },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// Remittance channels
// ────────────────────────────────────────────────────────────────────────────

export const REMITTANCE_CHANNELS = [
  'Wise',
  'Western Union',
  'Palawan Pera Padala',
  'Cebuana Lhuillier',
  'GCash',
  'BPI Direct',
  'Remitly',
  'Xoom',
  'Other',
] as const;

export type RemittanceChannel = (typeof REMITTANCE_CHANNELS)[number];

// ────────────────────────────────────────────────────────────────────────────
// Savings challenge presets
// ────────────────────────────────────────────────────────────────────────────

export type ChallengeType = '52-week' | '50-peso' | '100-daily' | 'custom';

export const CHALLENGE_LABELS: Record<ChallengeType, string> = {
  '52-week': '52-Week Challenge',
  '50-peso': '₱50/Day Challenge',
  '100-daily': '₱100/Day Challenge',
  custom: 'Custom',
};

/** Week 1 = ₱50, Week 2 = ₱100, … Week 52 = ₱2,600. Total = ₱68,900. */
export function get52WeekSchedule(): number[] {
  return Array.from({ length: 52 }, (_, i) => (i + 1) * 50);
}

// ────────────────────────────────────────────────────────────────────────────
// Goal recommendations by employment type
// ────────────────────────────────────────────────────────────────────────────

export type GoalRecommendation = {
  name: string;
  icon: string;
  color: string;
  suggestedAmount: number;
  isEmergencyFund?: boolean;
};

export const GOAL_RECOMMENDATIONS: Record<string, GoalRecommendation[]> = {
  employed: [
    { name: 'Emergency Fund', icon: 'shield-outline', color: '#10B981', suggestedAmount: 100000, isEmergencyFund: true },
    { name: '13th Month Allocation', icon: 'gift-outline', color: '#F43F5E', suggestedAmount: 30000 },
    { name: 'Retirement Fund', icon: 'trending-up-outline', color: '#8B5CF6', suggestedAmount: 500000 },
  ],
  freelancer: [
    { name: 'Emergency Fund (6 Mo)', icon: 'shield-outline', color: '#10B981', suggestedAmount: 150000, isEmergencyFund: true },
    { name: 'Tax Reserve', icon: 'card-outline', color: '#EF4444', suggestedAmount: 50000 },
    { name: 'Income Buffer', icon: 'wallet-outline', color: '#3B82F6', suggestedAmount: 60000 },
  ],
  ofw: [
    { name: 'Remittance Buffer', icon: 'send-outline', color: '#14B8A6', suggestedAmount: 50000 },
    { name: 'Family Emergency Fund', icon: 'shield-outline', color: '#10B981', suggestedAmount: 200000, isEmergencyFund: true },
    { name: 'Investment Fund', icon: 'trending-up-outline', color: '#8B5CF6', suggestedAmount: 300000 },
  ],
  business_owner: [
    { name: 'Business Emergency Fund', icon: 'shield-outline', color: '#10B981', suggestedAmount: 200000, isEmergencyFund: true },
    { name: 'Equipment Fund', icon: 'build-outline', color: '#F59E0B', suggestedAmount: 100000 },
    { name: 'Tax Reserve', icon: 'card-outline', color: '#EF4444', suggestedAmount: 80000 },
  ],
  student: [
    { name: 'Emergency Fund', icon: 'shield-outline', color: '#10B981', suggestedAmount: 20000, isEmergencyFund: true },
    { name: 'Textbook & Supplies', icon: 'book-outline', color: '#3B82F6', suggestedAmount: 15000 },
    { name: 'Graduation Fund', icon: 'school-outline', color: '#EC4899', suggestedAmount: 50000 },
  ],
  homemaker: [
    { name: 'Household Emergency', icon: 'shield-outline', color: '#10B981', suggestedAmount: 80000, isEmergencyFund: true },
    { name: 'Education Fund', icon: 'school-outline', color: '#EC4899', suggestedAmount: 100000 },
    { name: 'Side Income Goal', icon: 'trending-up-outline', color: '#8B5CF6', suggestedAmount: 30000 },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// Manual asset categories
// ────────────────────────────────────────────────────────────────────────────

export const ASSET_CATEGORIES = ['property', 'vehicle', 'jewelry', 'other'] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  property: 'Property',
  vehicle: 'Vehicle',
  jewelry: 'Jewelry',
  other: 'Other',
};

// ────────────────────────────────────────────────────────────────────────────
// Budget styles
// ────────────────────────────────────────────────────────────────────────────

export const BUDGET_STYLES = ['envelope', '50-30-20', 'zero-based'] as const;
export type BudgetStyle = (typeof BUDGET_STYLES)[number];

export const BUDGET_STYLE_LABELS: Record<BudgetStyle, string> = {
  envelope: 'Envelope',
  '50-30-20': '50/30/20',
  'zero-based': 'Zero-Based',
};

// ────────────────────────────────────────────────────────────────────────────
// Icon & color picker options for custom categories
// ────────────────────────────────────────────────────────────────────────────

export const CATEGORY_ICON_OPTIONS = [
  'wallet-outline',
  'cart-outline',
  'restaurant-outline',
  'car-outline',
  'bus-outline',
  'bicycle-outline',
  'airplane-outline',
  'boat-outline',
  'home-outline',
  'business-outline',
  'storefront-outline',
  'flash-outline',
  'water-outline',
  'cafe-outline',
  'pizza-outline',
  'beer-outline',
  'wine-outline',
  'fast-food-outline',
  'gift-outline',
  'heart-outline',
  'fitness-outline',
  'basketball-outline',
  'football-outline',
  'game-controller-outline',
  'musical-notes-outline',
  'camera-outline',
  'film-outline',
  'book-outline',
  'school-outline',
  'briefcase-outline',
  'build-outline',
  'hammer-outline',
  'medical-outline',
  'medkit-outline',
  'shirt-outline',
  'watch-outline',
  'diamond-outline',
  'paw-outline',
  'leaf-outline',
  'flower-outline',
] as const;

export const CATEGORY_COLOR_OPTIONS = [
  '#F59E0B',
  '#22C55E',
  '#3B82F6',
  '#EC4899',
  '#EF4444',
  palette.primary[600],
  '#0EA5E9',
  '#14B8A6',
  '#8B5CF6',
  '#F97316',
  '#10B981',
  '#D97706',
  '#64748B',
  '#94A3B8',
  '#F43F5E',
  '#E879F9',
  '#6B7280',
  '#A855F7',
] as const;
