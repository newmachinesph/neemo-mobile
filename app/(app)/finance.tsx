import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { View, FlatList, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon, type IconName } from '@ui/components/Icon';
import { ListItem } from '@ui/components/ListItem';
import { EmptyState } from '@ui/components/EmptyState';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { hapticLight } from '@lib/utils/haptics';
import { ACCOUNT_TYPE_LABELS } from '@lib/constants/finance';
import { getInstitutionById } from '@lib/constants/institutions';
import { useFinanceStore } from '@/src/features/finance';
import { useFinanceSummary } from '@/src/features/finance/hooks/useFinanceSummary';
import { TransactionRow } from '@/src/features/finance/components/TransactionRow';
import { AddAccountSheet } from '@/src/features/finance/components/AddAccountSheet';
import { AddTransactionSheet } from '@/src/features/finance/components/AddTransactionSheet';
import { DebtPayoffSection } from '@/src/features/finance/components/DebtPayoffSection';
import { UtangSection } from '@/src/features/finance/components/UtangSection';
import { CardSection } from '@/src/features/finance/components/CardSection';
import { useTheme } from '@theme/ThemeProvider';
import type { Account, Transaction } from '@/src/features/finance';

type Tab = 'accounts' | 'transactions' | 'debts' | 'utang';
const TAB_LABELS: Record<Tab, string> = { accounts: 'Accounts', transactions: 'Txns', debts: 'Debts', utang: 'Utang' };
type TxnFilter = 'all' | 'income' | 'expense' | 'transfer';

const ACCOUNT_ICONS: Record<string, string> = {
  savings: 'wallet-outline',
  checking: 'card-outline',
  e_wallet: 'phone-portrait-outline',
  digital_bank: 'globe-outline',
  investment: 'trending-up-outline',
  loan: 'cash-outline',
  credit_card: 'card-outline',
  government_fund: 'shield-outline',
  cash: 'cash-outline',
  other: 'ellipsis-horizontal-outline',
};

export default function FinanceScreen() {
  const { colors } = useTheme();
  const { tab: initialTab } = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(initialTab ?? 'accounts');
  const [txnFilter, setTxnFilter] = useState<TxnFilter>('all');
  const [cardFilter, setCardFilter] = useState<string>('all');
  const lastAppliedTab = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (initialTab && initialTab !== lastAppliedTab.current) {
      setTab(initialTab);
      lastAppliedTab.current = initialTab;
    }
  }, [initialTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const cards = useFinanceStore((s) => s.cards);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const { totalBalance } = useFinanceSummary();

  const addAccountRef = useRef<GorhomBottomSheetModal>(null);
  const addTxnRef = useRef<GorhomBottomSheetModal>(null);

  const filteredTxns = useMemo(() => {
    let result = transactions;
    if (txnFilter !== 'all') {
      result = result.filter((t) => t.type === txnFilter);
    }
    if (cardFilter !== 'all') {
      result = result.filter((t) => t.cardId === cardFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.merchantName.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q))),
      );
    }
    // H5 fix: Sort transactions by date (newest first)
    return [...result].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [transactions, txnFilter, cardFilter, searchQuery]);

  const handleAccountPress = useCallback((account: Account) => {
    hapticLight();
    setSelectedAccount(account);
    addAccountRef.current?.present();
  }, []);

  const handleTxnPress = useCallback((txn: Transaction) => {
    hapticLight();
    setSelectedTxn(txn);
    addTxnRef.current?.present();
  }, []);

  const handleAccountDismiss = useCallback(() => {
    setSelectedAccount(null);
  }, []);

  const handleTxnDismiss = useCallback(() => {
    setSelectedTxn(null);
  }, []);

  return (
    <ScreenContainer scrollable={false} edges={['top', 'left', 'right']}>
      {/* Header */}
      <StaggeredFadeIn index={0}>
        <Text variant="h2" className="mb-4 mt-2">
          Finance
        </Text>
      </StaggeredFadeIn>

      {/* Tab pills */}
      <StaggeredFadeIn index={1}>
        <View className="mb-4 flex-row gap-2">
          {(['accounts', 'transactions', 'debts', 'utang'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => { hapticLight(); setTab(t); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              accessibilityLabel={`${TAB_LABELS[t]} tab`}
              className={`flex-1 items-center rounded-xl py-2.5 border ${
                tab === t
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <Text
                variant="caption"
                className={`font-sans-semibold ${tab === t ? 'text-white' : ''}`}
              >
                {TAB_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>
      </StaggeredFadeIn>

      {/* Accounts tab */}
      <StaggeredFadeIn index={2} className="flex-1">
        {tab === 'accounts' && (
          <FlatList<Account>
            data={accounts}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-24"
            ListHeaderComponent={
              <>
                {accounts.length > 0 && (
                  <Card className="mb-4">
                    <Text variant="caption" className="mb-1">Total Balance</Text>
                    <Text variant="h2">{hideBalances ? maskedCurrency() : formatCurrency(totalBalance)}</Text>
                  </Card>
                )}
                <CardSection />
              </>
            }
            ListEmptyComponent={
              <EmptyState
                icon="wallet-outline"
                title="No accounts yet"
                description="Tap + to add your first account"
              />
            }
            renderItem={({ item }) => {
              const inst = item.institution ? getInstitutionById(item.institution) : undefined;
              const brandColor = item.color ?? inst?.brandColor;
              const iconName = (item.icon ?? inst?.icon ?? ACCOUNT_ICONS[item.type] ?? 'wallet-outline') as IconName;
              return (
                <Card className="mb-2 min-h-[64px] justify-center px-0 py-0" pressable onPress={() => handleAccountPress(item)}>
                  <ListItem
                    title={item.name}
                    subtitle={inst?.shortName ?? ACCOUNT_TYPE_LABELS[item.type] ?? item.type}
                    leftIcon={
                      <View
                        className="h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: brandColor ? brandColor + '18' : colors.primaryLight }}
                      >
                        {inst ? (
                          <Text style={{ fontSize: 11, fontWeight: '800', color: brandColor ?? colors.primary, letterSpacing: -0.3 }}>
                            {inst.shortName.length <= 4 ? inst.shortName : inst.shortName.slice(0, 3)}
                          </Text>
                        ) : (
                          <Icon name={iconName} size={20} color={brandColor ?? colors.primary} />
                        )}
                      </View>
                    }
                    rightValue={hideBalances ? maskedCurrency(item.currency) : formatCurrency(item.balance, item.currency)}
                    showChevron
                  />
                </Card>
              );
            }}
          />
        )}

        {/* Transactions tab */}
        {tab === 'transactions' && (
          <>
            {/* Search bar */}
            <View className="mb-3">
              <View className="flex-row items-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 dark:border-neutral-700 dark:bg-neutral-900">
                <Icon name="search-outline" size={18} color={colors.textTertiary} />
                <TextInput
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  accessibilityLabel="Search transactions"
                  className="ml-2 flex-1 py-2.5 font-[Inter-Regular] text-sm text-neutral-900 dark:text-neutral-100"
                  placeholderTextColor={colors.textTertiary}
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() => { hapticLight(); setSearchQuery(''); }}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                  >
                    <Icon name="close-circle" size={18} color={colors.textTertiary} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Filter chips */}
            <View className="mb-2 flex-row gap-2">
              {(['all', 'income', 'expense', 'transfer'] as const).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => { hapticLight(); setTxnFilter(f); }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: txnFilter === f }}
                  accessibilityLabel={`${f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} filter`}
                  className={`rounded-full px-3.5 py-1.5 border ${
                    txnFilter === f
                      ? 'bg-primary-500 border-primary-500'
                      : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <Text
                    variant="caption"
                    className={`font-sans-medium capitalize ${txnFilter === f ? 'text-white' : ''}`}
                  >
                    {f}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Card filter */}
            {cards.length > 0 && (
              <View className="mb-3 flex-row gap-2">
                <Pressable
                  onPress={() => { hapticLight(); setCardFilter('all'); }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: cardFilter === 'all' }}
                  accessibilityLabel="All cards filter"
                  className={`rounded-full px-3 py-1 border ${
                    cardFilter === 'all' ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <Text variant="caption" className={`font-sans-medium ${cardFilter === 'all' ? 'text-white' : ''}`} style={{ fontSize: 11 }}>
                    All Cards
                  </Text>
                </Pressable>
                {cards.filter((c) => c.isActive).map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => { hapticLight(); setCardFilter(c.id); }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: cardFilter === c.id }}
                    accessibilityLabel={`${c.nickname} card filter`}
                    className={`rounded-full px-3 py-1 border ${
                      cardFilter === c.id ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <Text variant="caption" className={`font-sans-medium ${cardFilter === c.id ? 'text-white' : ''}`} style={{ fontSize: 11 }}>
                      {c.nickname} · {c.last4}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <FlatList<Transaction>
              data={filteredTxns}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              className="-mx-4"
              contentContainerClassName="pb-24"
              renderItem={({ item }) => (
                <TransactionRow transaction={item} onPress={() => handleTxnPress(item)} />
              )}
              ListEmptyComponent={
                <EmptyState
                  icon="receipt-outline"
                  title="No transactions found"
                  description="Try adjusting your search or filters"
                />
              }
            />
          </>
        )}

        {/* Debts tab */}
        {tab === 'debts' && <DebtPayoffSection />}

        {/* Utang tab */}
        {tab === 'utang' && <UtangSection />}
      </StaggeredFadeIn>

      {/* FAB — hidden on debts/utang tabs */}
      {tab !== 'debts' && tab !== 'utang' && (
        <View className="absolute bottom-6 right-6 items-center gap-3">
          {/* Add FAB */}
          <Pressable
            onPress={() => {
              hapticLight();
              if (tab === 'accounts') {
                setSelectedAccount(null);
                addAccountRef.current?.present();
              } else {
                setSelectedTxn(null);
                addTxnRef.current?.present();
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={`Add new ${tab === 'accounts' ? 'account' : 'transaction'}`}
            className="h-14 w-14 items-center justify-center rounded-full bg-primary-500 shadow-lg active:opacity-80"
            style={{ elevation: 8 }}
          >
            <Icon name="add" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      <AddAccountSheet sheetRef={addAccountRef} editItem={selectedAccount} onDismiss={handleAccountDismiss} />
      <AddTransactionSheet sheetRef={addTxnRef} editItem={selectedTxn} onDismiss={handleTxnDismiss} />
    </ScreenContainer>
  );
}
