import type { AccountType } from '@lib/constants/finance';

// ────────────────────────────────────────────────────────────────────────────
// Institution types
// ────────────────────────────────────────────────────────────────────────────

export type InstitutionType =
  | 'bank'
  | 'e_wallet'
  | 'digital_bank'
  | 'government'
  | 'cooperative'
  | 'other';

export interface Institution {
  id: string;
  name: string;
  shortName: string;
  type: InstitutionType;
  brandColor: string;
  secondaryColor?: string;
  icon: string;
  accountTypes: AccountType[];
}

// ────────────────────────────────────────────────────────────────────────────
// Shared account-type sets
// ────────────────────────────────────────────────────────────────────────────

const BANK_ACCOUNT_TYPES: AccountType[] = [
  'savings',
  'checking',
  'time_deposit',
  'investment',
  'loan',
  'credit_card',
];

const E_WALLET_ACCOUNT_TYPES: AccountType[] = ['e_wallet'];

const DIGITAL_BANK_ACCOUNT_TYPES: AccountType[] = ['savings', 'digital_bank'];

const GOVERNMENT_ACCOUNT_TYPES: AccountType[] = ['government_fund'];

const COOPERATIVE_ACCOUNT_TYPES: AccountType[] = ['cooperative', 'savings', 'loan'];

// ────────────────────────────────────────────────────────────────────────────
// Philippine institutions
// ────────────────────────────────────────────────────────────────────────────

export const PHILIPPINE_INSTITUTIONS: Institution[] = [
  // ── Major Banks ─────────────────────────────────────────────────────────
  {
    id: 'bdo',
    name: 'BDO Unibank',
    shortName: 'BDO',
    type: 'bank',
    brandColor: '#043673',
    secondaryColor: '#FFB20C',
    icon: 'business-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },
  {
    id: 'bpi',
    name: 'Bank of the Philippine Islands',
    shortName: 'BPI',
    type: 'bank',
    brandColor: '#C8102E',
    secondaryColor: '#F2A900',
    icon: 'business-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },
  {
    id: 'metrobank',
    name: 'Metrobank',
    shortName: 'Metrobank',
    type: 'bank',
    brandColor: '#003D7C',
    icon: 'business-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },
  {
    id: 'landbank',
    name: 'Landbank',
    shortName: 'Landbank',
    type: 'bank',
    brandColor: '#006B3F',
    secondaryColor: '#003366',
    icon: 'leaf-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },
  {
    id: 'pnb',
    name: 'Philippine National Bank',
    shortName: 'PNB',
    type: 'bank',
    brandColor: '#A20E37',
    secondaryColor: '#FBBC09',
    icon: 'business-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },
  {
    id: 'security_bank',
    name: 'Security Bank',
    shortName: 'Security Bank',
    type: 'bank',
    brandColor: '#00A651',
    icon: 'shield-checkmark-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },
  {
    id: 'unionbank',
    name: 'UnionBank',
    shortName: 'UnionBank',
    type: 'bank',
    brandColor: '#FF8000',
    icon: 'business-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },
  {
    id: 'chinabank',
    name: 'China Bank',
    shortName: 'China Bank',
    type: 'bank',
    brandColor: '#D22630',
    icon: 'business-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },
  {
    id: 'rcbc',
    name: 'RCBC',
    shortName: 'RCBC',
    type: 'bank',
    brandColor: '#023F7E',
    secondaryColor: '#F2A900',
    icon: 'business-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },
  {
    id: 'eastwest',
    name: 'EastWest Bank',
    shortName: 'EastWest',
    type: 'bank',
    brandColor: '#500778',
    icon: 'business-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },
  {
    id: 'psbank',
    name: 'PSBank',
    shortName: 'PSBank',
    type: 'bank',
    brandColor: '#003DA5',
    secondaryColor: '#FFD100',
    icon: 'business-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },
  {
    id: 'dbp',
    name: 'Development Bank of the Philippines',
    shortName: 'DBP',
    type: 'bank',
    brandColor: '#003087',
    secondaryColor: '#CE1126',
    icon: 'business-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },
  {
    id: 'aub',
    name: 'Asia United Bank',
    shortName: 'AUB',
    type: 'bank',
    brandColor: '#003366',
    icon: 'business-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },
  {
    id: 'pvb',
    name: 'Philippine Veterans Bank',
    shortName: 'PVB',
    type: 'bank',
    brandColor: '#003366',
    icon: 'business-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },
  {
    id: 'robinsons_bank',
    name: 'Robinsons Bank',
    shortName: 'Robinsons Bank',
    type: 'bank',
    brandColor: '#7B2D8E',
    icon: 'business-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },
  {
    id: 'sterling_bank',
    name: 'Sterling Bank of Asia',
    shortName: 'Sterling Bank',
    type: 'bank',
    brandColor: '#003366',
    icon: 'business-outline',
    accountTypes: BANK_ACCOUNT_TYPES,
  },

  // ── E-Wallets ───────────────────────────────────────────────────────────
  {
    id: 'gcash',
    name: 'GCash',
    shortName: 'GCash',
    type: 'e_wallet',
    brandColor: '#1972F9',
    icon: 'phone-portrait-outline',
    accountTypes: E_WALLET_ACCOUNT_TYPES,
  },
  {
    id: 'maya',
    name: 'Maya (PayMaya)',
    shortName: 'Maya',
    type: 'e_wallet',
    brandColor: '#0C126F',
    secondaryColor: '#40E0D0',
    icon: 'phone-portrait-outline',
    accountTypes: E_WALLET_ACCOUNT_TYPES,
  },
  {
    id: 'grabpay',
    name: 'GrabPay',
    shortName: 'GrabPay',
    type: 'e_wallet',
    brandColor: '#02B150',
    icon: 'phone-portrait-outline',
    accountTypes: E_WALLET_ACCOUNT_TYPES,
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    shortName: 'ShopeePay',
    type: 'e_wallet',
    brandColor: '#EE4D2D',
    icon: 'phone-portrait-outline',
    accountTypes: E_WALLET_ACCOUNT_TYPES,
  },
  {
    id: 'coinsph',
    name: 'Coins.ph',
    shortName: 'Coins.ph',
    type: 'e_wallet',
    brandColor: '#2962FF',
    icon: 'phone-portrait-outline',
    accountTypes: E_WALLET_ACCOUNT_TYPES,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    shortName: 'PayPal',
    type: 'e_wallet',
    brandColor: '#003087',
    secondaryColor: '#0070E0',
    icon: 'phone-portrait-outline',
    accountTypes: E_WALLET_ACCOUNT_TYPES,
  },

  // ── Digital Banks ───────────────────────────────────────────────────────
  {
    id: 'gotyme',
    name: 'GoTyme Bank',
    shortName: 'GoTyme',
    type: 'digital_bank',
    brandColor: '#0047BB',
    icon: 'card-outline',
    accountTypes: DIGITAL_BANK_ACCOUNT_TYPES,
  },
  {
    id: 'tonik',
    name: 'Tonik',
    shortName: 'Tonik',
    type: 'digital_bank',
    brandColor: '#FF6B35',
    icon: 'card-outline',
    accountTypes: DIGITAL_BANK_ACCOUNT_TYPES,
  },
  {
    id: 'maya_bank',
    name: 'Maya Bank',
    shortName: 'Maya Bank',
    type: 'digital_bank',
    brandColor: '#0C126F',
    icon: 'card-outline',
    accountTypes: DIGITAL_BANK_ACCOUNT_TYPES,
  },
  {
    id: 'cimb',
    name: 'CIMB Bank PH',
    shortName: 'CIMB',
    type: 'digital_bank',
    brandColor: '#ED1C24',
    icon: 'card-outline',
    accountTypes: DIGITAL_BANK_ACCOUNT_TYPES,
  },
  {
    id: 'ing',
    name: 'ING Philippines',
    shortName: 'ING',
    type: 'digital_bank',
    brandColor: '#FF6200',
    icon: 'card-outline',
    accountTypes: DIGITAL_BANK_ACCOUNT_TYPES,
  },
  {
    id: 'uno',
    name: 'UNO Digital Bank',
    shortName: 'UNO',
    type: 'digital_bank',
    brandColor: '#6C63FF',
    icon: 'card-outline',
    accountTypes: DIGITAL_BANK_ACCOUNT_TYPES,
  },
  {
    id: 'diskartech',
    name: 'DiskarTech (by RCBC)',
    shortName: 'DiskarTech',
    type: 'digital_bank',
    brandColor: '#FF4B4B',
    icon: 'card-outline',
    accountTypes: DIGITAL_BANK_ACCOUNT_TYPES,
  },
  {
    id: 'ofbank',
    name: 'Overseas Filipino Bank (OFBank)',
    shortName: 'OFBank',
    type: 'digital_bank',
    brandColor: '#003087',
    icon: 'card-outline',
    accountTypes: DIGITAL_BANK_ACCOUNT_TYPES,
  },
  {
    id: 'seabank',
    name: 'Seabank',
    shortName: 'Seabank',
    type: 'digital_bank',
    brandColor: '#3FD0AE',
    icon: 'card-outline',
    accountTypes: DIGITAL_BANK_ACCOUNT_TYPES,
  },

  // ── Government ──────────────────────────────────────────────────────────
  {
    id: 'sss',
    name: 'SSS',
    shortName: 'SSS',
    type: 'government',
    brandColor: '#003087',
    icon: 'shield-checkmark-outline',
    accountTypes: GOVERNMENT_ACCOUNT_TYPES,
  },
  {
    id: 'philhealth',
    name: 'PhilHealth',
    shortName: 'PhilHealth',
    type: 'government',
    brandColor: '#006B3F',
    icon: 'medkit-outline',
    accountTypes: GOVERNMENT_ACCOUNT_TYPES,
  },
  {
    id: 'pagibig',
    name: 'Pag-IBIG Fund',
    shortName: 'Pag-IBIG',
    type: 'government',
    brandColor: '#FFB20C',
    secondaryColor: '#003087',
    icon: 'home-outline',
    accountTypes: GOVERNMENT_ACCOUNT_TYPES,
  },

  // ── Cooperative ─────────────────────────────────────────────────────────
  {
    id: 'cooperative',
    name: 'Cooperative (Generic)',
    shortName: 'Cooperative',
    type: 'cooperative',
    brandColor: '#10B981',
    icon: 'people-outline',
    accountTypes: COOPERATIVE_ACCOUNT_TYPES,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Quick lookup map
// ────────────────────────────────────────────────────────────────────────────

export const INSTITUTION_MAP = new Map<string, Institution>(
  PHILIPPINE_INSTITUTIONS.map((inst) => [inst.id, inst]),
);

// ────────────────────────────────────────────────────────────────────────────
// Helper functions
// ────────────────────────────────────────────────────────────────────────────

/**
 * Find an institution by its unique id.
 */
export function getInstitutionById(id: string): Institution | undefined {
  return INSTITUTION_MAP.get(id);
}

/**
 * Return all institutions of a given type (e.g. 'bank', 'e_wallet').
 */
export function getInstitutionsByType(type: InstitutionType): Institution[] {
  return PHILIPPINE_INSTITUTIONS.filter((inst) => inst.type === type);
}

/**
 * Return all institutions that support a given account type
 * (e.g. 'savings', 'credit_card').
 */
export function getInstitutionsByAccountType(accountType: AccountType): Institution[] {
  return PHILIPPINE_INSTITUTIONS.filter((inst) => inst.accountTypes.includes(accountType));
}
