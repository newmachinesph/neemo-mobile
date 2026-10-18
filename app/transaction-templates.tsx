import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Pressable, Alert, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { BottomSheetModal } from '@ui/components/BottomSheetModal';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { Button } from '@ui/components/Button';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { EmptyState } from '@ui/components/EmptyState';
import { useTheme } from '@theme/ThemeProvider';
import { palette } from '@theme/colors';
import { formatCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '@features/finance/store/finance.store';
import type { TransactionTemplate } from '@features/finance/types/finance.types';

/** Map a transaction category to an Ionicon name + color for display. */
function categoryMeta(category: string): { icon: string; color: string } {
  switch (category) {
    case 'food':
      return { icon: 'restaurant-outline', color: '#F59E0B' };
    case 'transport':
      return { icon: 'car-outline', color: '#3B82F6' };
    case 'utilities':
      return { icon: 'flash-outline', color: '#EF4444' };
    case 'transfer':
      return { icon: 'phone-portrait-outline', color: '#0EA5E9' };
    case 'groceries':
      return { icon: 'cart-outline', color: '#22C55E' };
    case 'entertainment':
      return { icon: 'film-outline', color: '#8B5CF6' };
    case 'government':
      return { icon: 'shield-checkmark-outline', color: palette.primary[600] };
    case 'tithes':
      return { icon: 'heart-outline', color: '#8B5CF6' };
    case 'salary':
      return { icon: 'wallet-outline', color: '#10B981' };
    case 'shopping':
      return { icon: 'bag-outline', color: '#EC4899' };
    case 'family_support':
      return { icon: 'people-outline', color: '#F97316' };
    default:
      return { icon: 'ellipse-outline', color: '#6B7280' };
  }
}

type AutoTemplate = {
  merchantName: string;
  amount: number;
  category: string;
  type: string;
  accountId: string;
  currency: string;
  description: string;
  frequency: number;
  subcategory?: string;
};

export default function TransactionTemplatesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const transactions = useFinanceStore((s) => s.transactions);
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const customTemplates = useFinanceStore((s) => s.transactionTemplates);
  const addTransactionTemplate = useFinanceStore((s) => s.addTransactionTemplate);
  const deleteTransactionTemplate = useFinanceStore((s) => s.deleteTransactionTemplate);
  const accounts = useFinanceStore((s) => s.accounts);
  const profileCurrency = useFinanceStore((s) => s.profile.currency);

  const createSheetRef = useRef<GorhomBottomSheetModal>(null);

  // Form state for creating a custom template
  const [formName, setFormName] = useState('');
  const [formMerchant, setFormMerchant] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('food');
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');

  const resetForm = useCallback(() => {
    setFormName('');
    setFormMerchant('');
    setFormAmount('');
    setFormCategory('food');
    setFormType('expense');
  }, []);

  // Auto-detected templates from transaction history
  const autoTemplates = useMemo<AutoTemplate[]>(() => {
    if (transactions.length === 0) return [];

    const merchantMap = new Map<
      string,
      { count: number; latest: (typeof transactions)[number] }
    >();

    for (const txn of transactions) {
      const key = txn.merchantName;
      if (!key) continue;
      const existing = merchantMap.get(key);
      if (!existing) {
        merchantMap.set(key, { count: 1, latest: txn });
      } else {
        existing.count += 1;
        if (txn.date > existing.latest.date) {
          existing.latest = txn;
        }
      }
    }

    return Array.from(merchantMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([merchant, { count, latest }]) => ({
        merchantName: merchant,
        amount: latest.amount,
        category: latest.category,
        type: latest.type,
        accountId: latest.accountId,
        currency: latest.currency,
        description: latest.description,
        frequency: count,
        subcategory: latest.subcategory,
      }));
  }, [transactions]);

  const handleUseAutoTemplate = (t: AutoTemplate) => {
    const today = new Date().toISOString().split('T')[0] ?? '';
    addTransaction({
      accountId: t.accountId,
      type: t.type as 'income' | 'expense' | 'transfer',
      amount: t.amount,
      currency: t.currency as 'PHP' | 'USD',
      description: t.description,
      merchantName: t.merchantName,
      category: t.category,
      date: today,
      subcategory: t.subcategory,
    });
    Alert.alert(
      'Template Applied',
      `${t.merchantName} — ${formatCurrency(t.amount)} added.`,
    );
  };

  const handleUseCustomTemplate = (t: TransactionTemplate) => {
    const today = new Date().toISOString().split('T')[0] ?? '';
    addTransaction({
      accountId: t.accountId,
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      description: t.description,
      merchantName: t.merchantName,
      category: t.category,
      date: today,
      subcategory: t.subcategory,
    });
    Alert.alert('Template Applied', `${t.name} — ${formatCurrency(t.amount)} added.`);
  };

  const handleDeleteTemplate = (t: TransactionTemplate) => {
    Alert.alert('Delete Template', `Remove "${t.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTransactionTemplate(t.id),
      },
    ]);
  };

  const handleCreateTemplate = () => {
    const amount = parseFloat(formAmount);
    if (!formName.trim() || !formMerchant.trim() || isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid', 'Please fill in name, merchant, and a valid amount.');
      return;
    }
    const defaultAccount = accounts[0]?.id ?? '';
    addTransactionTemplate({
      name: formName.trim(),
      merchantName: formMerchant.trim(),
      amount,
      category: formCategory,
      type: formType,
      accountId: defaultAccount,
      currency: profileCurrency,
      description: formMerchant.trim(),
    });
    createSheetRef.current?.dismiss();
    resetForm();
    Alert.alert('Created', `Template "${formName.trim()}" saved.`);
  };

  const inputStyle = useMemo(() => ({
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.text,
    backgroundColor: colors.surface,
  }), [colors.border, colors.text, colors.surface]);

  const headerLeft = useCallback(() => null, []);
  const headerRight = useCallback(() => (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      className="mr-2"
      accessibilityRole="button"
      accessibilityLabel="Close screen"
    >
      <Icon name="close" size={24} color={colors.text} />
    </Pressable>
  ), [colors.text, router]);
  const headerTitleStyle = useMemo(() => ({ fontFamily: 'Inter-SemiBold' as const, fontSize: 17 }), []);
  const headerStyle = useMemo(() => ({ backgroundColor: colors.background }), [colors.background]);
  const screenOptions = useMemo(() => ({
    headerShown: true,
    title: 'Transaction Templates',
    headerTitleStyle,
    headerLeft,
    headerRight,
    headerShadowVisible: false,
    headerStyle,
    headerTintColor: colors.text,
  }), [headerTitleStyle, headerLeft, headerRight, headerStyle, colors.text]);

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <ScreenContainer edges={['bottom', 'left', 'right']}>
        <StaggeredFadeIn index={0}>
          <Text variant="caption" className="mb-4 text-neutral-500 dark:text-neutral-400">
            Quick templates for your most common transactions. Tap &ldquo;Use&rdquo; to
            apply.
          </Text>
        </StaggeredFadeIn>

        {/* Custom Templates */}
        {customTemplates.length > 0 && (
          <>
            <StaggeredFadeIn index={1}>
              <Text variant="label" className="mb-2">
                Custom Templates
              </Text>
            </StaggeredFadeIn>
            <View style={{ gap: 8 }} className="mb-4">
              {customTemplates.map((t, i) => {
                const meta = categoryMeta(t.category);
                return (
                  <StaggeredFadeIn key={t.id} index={i + 2}>
                    <Card className="flex-row items-center gap-3">
                      <View
                        className="h-10 w-10 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${meta.color}18` }}
                      >
                        <Icon
                          name={meta.icon as React.ComponentProps<typeof Icon>['name']}
                          size={20}
                          color={meta.color}
                        />
                      </View>
                      <View className="flex-1">
                        <Text variant="body" className="font-sans-medium">
                          {t.name}
                        </Text>
                        <Text
                          variant="caption"
                          className="text-neutral-400"
                          style={{ fontSize: 10 }}
                        >
                          {t.merchantName} · {t.category}
                        </Text>
                      </View>
                      <Text variant="body" className="font-sans-semibold mr-2">
                        {formatCurrency(t.amount)}
                      </Text>
                      <Pressable
                        onPress={() => handleUseCustomTemplate(t)}
                        className="rounded-full px-3 py-1.5"
                        style={{ backgroundColor: colors.primary }}
                        accessibilityRole="button"
                        accessibilityLabel={`Use template ${t.name}`}
                      >
                        <Text variant="caption" style={{ color: '#FFFFFF', fontSize: 11 }}>
                          Use
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteTemplate(t)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete template ${t.name}`}
                      >
                        <Icon name="trash-outline" size={16} color={colors.danger} />
                      </Pressable>
                    </Card>
                  </StaggeredFadeIn>
                );
              })}
            </View>
          </>
        )}

        {/* Auto-detected Templates */}
        {autoTemplates.length > 0 && (
          <>
            <StaggeredFadeIn index={customTemplates.length + 2}>
              <Text variant="label" className="mb-2">
                Frequent
              </Text>
            </StaggeredFadeIn>
            <View style={{ gap: 8 }}>
              {autoTemplates.map((t, i) => {
                const meta = categoryMeta(t.category);
                return (
                  <StaggeredFadeIn key={t.merchantName} index={i + customTemplates.length + 3}>
                    <Card className="flex-row items-center gap-3">
                      <View
                        className="h-10 w-10 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${meta.color}18` }}
                      >
                        <Icon
                          name={meta.icon as React.ComponentProps<typeof Icon>['name']}
                          size={20}
                          color={meta.color}
                        />
                      </View>
                      <View className="flex-1">
                        <Text variant="body" className="font-sans-medium">
                          {t.merchantName}
                        </Text>
                        <Text
                          variant="caption"
                          className="text-neutral-400"
                          style={{ fontSize: 10 }}
                        >
                          {t.category} · {t.frequency}x
                        </Text>
                      </View>
                      <Text variant="body" className="font-sans-semibold mr-2">
                        {formatCurrency(t.amount)}
                      </Text>
                      <Pressable
                        onPress={() => handleUseAutoTemplate(t)}
                        className="rounded-full px-3 py-1.5"
                        style={{ backgroundColor: colors.primary }}
                        accessibilityRole="button"
                        accessibilityLabel={`Use template ${t.merchantName}`}
                      >
                        <Text variant="caption" style={{ color: '#FFFFFF', fontSize: 11 }}>
                          Use
                        </Text>
                      </Pressable>
                    </Card>
                  </StaggeredFadeIn>
                );
              })}
            </View>
          </>
        )}

        {autoTemplates.length === 0 && customTemplates.length === 0 && (
          <StaggeredFadeIn index={1}>
            <EmptyState
              icon="receipt-outline"
              title="No templates yet"
              description="Start adding transactions to see your frequent templates here."
            />
          </StaggeredFadeIn>
        )}

        {/* Create Custom Template button */}
        <Pressable
          onPress={() => {
            resetForm();
            createSheetRef.current?.present();
          }}
          className="mt-4 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 py-3"
          accessibilityRole="button"
          accessibilityLabel="Create custom template"
        >
          <Icon name="add-outline" size={20} color={colors.textTertiary} />
          <Text variant="body" className="ml-1" style={{ color: colors.textTertiary }}>
            Create Custom Template
          </Text>
        </Pressable>
      </ScreenContainer>

      {/* Create Template Sheet */}
      <BottomSheetModal sheetRef={createSheetRef} snapPoints={['65%']}>
        <View>
          <Text variant="h3" className="mb-4 text-center">
            New Template
          </Text>
          <View style={{ gap: 12 }}>
            <View>
              <Text variant="caption" className="mb-1 text-neutral-500">
                Template Name
              </Text>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Weekly Groceries"
                placeholderTextColor={colors.textTertiary}
                style={inputStyle}
              />
            </View>
            <View>
              <Text variant="caption" className="mb-1 text-neutral-500">
                Merchant
              </Text>
              <TextInput
                value={formMerchant}
                onChangeText={setFormMerchant}
                placeholder="e.g. SM Supermarket"
                placeholderTextColor={colors.textTertiary}
                style={inputStyle}
              />
            </View>
            <View>
              <Text variant="caption" className="mb-1 text-neutral-500">
                Amount
              </Text>
              <TextInput
                value={formAmount}
                onChangeText={setFormAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                style={inputStyle}
              />
            </View>
            <View>
              <Text variant="caption" className="mb-1 text-neutral-500">
                Type
              </Text>
              <View className="flex-row" style={{ gap: 8 }}>
                {(['expense', 'income'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setFormType(t)}
                    className="flex-1 items-center rounded-xl border py-2"
                    style={{
                      borderColor:
                        formType === t ? colors.primary : colors.border,
                      backgroundColor:
                        formType === t ? colors.primaryLight : 'transparent',
                    }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: formType === t }}
                    accessibilityLabel={`Transaction type: ${t}`}
                  >
                    <Text
                      variant="caption"
                      className="font-sans-semibold capitalize"
                      style={{ color: formType === t ? colors.primary : colors.textTertiary }}
                    >
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View>
              <Text variant="caption" className="mb-1 text-neutral-500">
                Category
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                {[
                  'food',
                  'groceries',
                  'transport',
                  'utilities',
                  'entertainment',
                  'shopping',
                  'salary',
                ].map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setFormCategory(cat)}
                    className="rounded-full px-3 py-1.5"
                    style={{
                      backgroundColor:
                        formCategory === cat
                          ? categoryMeta(cat).color
                          : colors.surfaceTertiary,
                    }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: formCategory === cat }}
                    accessibilityLabel={`Category: ${cat}`}
                  >
                    <Text
                      variant="caption"
                      className="capitalize"
                      style={{
                        fontSize: 11,
                        color: formCategory === cat ? '#FFFFFF' : colors.textTertiary,
                      }}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Button onPress={handleCreateTemplate} className="mt-2">
              Save Template
            </Button>
          </View>
        </View>
      </BottomSheetModal>
    </>
  );
}
