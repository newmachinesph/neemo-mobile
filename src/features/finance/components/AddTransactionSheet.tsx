import { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { Icon, type IconName } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { TRANSACTION_CATEGORIES, SUBCATEGORIES } from '@lib/constants/finance';
import type { TransactionType } from '@lib/constants/finance';
import { useFinanceStore } from '../store/finance.store';
import type { Transaction } from '../types/finance.types';

let splitIdSeq = 0;
const nextSplitId = () => `split-${Date.now()}-${++splitIdSeq}`;

export interface TransactionPrefill {
  merchant?: string;
  amount?: number;
  category?: string;
  description?: string;
}

interface AddTransactionSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: Transaction | null;
  initialData?: TransactionPrefill | null;
  onDismiss?: () => void;
}

// Smart Categorization — merchant keyword → category id
const MERCHANT_CATEGORY_MAP: Record<string, string> = {
  jollibee: 'food', mcdonalds: 'food', 'mcdonald\'s': 'food', kfc: 'food',
  chowking: 'food', 'mang inasal': 'food', greenwich: 'food', starbucks: 'food',
  'tim hortons': 'food', 'yellow cab': 'food', 'pizza hut': 'food',
  grab: 'transport', angkas: 'transport', 'move it': 'transport',
  sm: 'shopping', 'sm supermarket': 'groceries', 'sm department': 'shopping',
  uniqlo: 'shopping', h$m: 'shopping', zara: 'shopping', shopee: 'shopping', lazada: 'shopping',
  meralco: 'utilities', maynilad: 'utilities', manila_water: 'utilities',
  pldt: 'utilities', globe: 'utilities', smart: 'load_topup', converge: 'utilities',
  netflix: 'subscriptions', spotify: 'subscriptions', youtube: 'subscriptions',
  'disney+': 'subscriptions', 'apple music': 'subscriptions',
  '7-eleven': 'groceries', '711': 'groceries', ministop: 'groceries',
  puregold: 'groceries', robinsons: 'groceries', 'save more': 'groceries',
  palengke: 'groceries', 'sari-sari': 'groceries',
  mercury: 'healthcare', watsons: 'healthcare',
  sss: 'government', philhealth: 'government', 'pag-ibig': 'government', pagibig: 'government',
  gcash: 'transfer', paymaya: 'transfer', maya: 'transfer',
  western_union: 'padala', palawan: 'padala', cebuana: 'padala',
};

const TYPES: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'transfer', label: 'Transfer' },
];

/** Reusable selected/unselected pill. */
function Chip({
  selected,
  onPress,
  label,
  icon,
  iconColor,
  size = 'md',
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  icon?: string;
  iconColor?: string;
  size?: 'sm' | 'md';
}) {
  const sizeClass = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}${selected ? ', selected' : ''}`}
      className={`flex-row items-center rounded-full border ${sizeClass} ${
        selected ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
      }`}
    >
      {icon && (
        <Icon name={icon as IconName} size={size === 'sm' ? 12 : 14} color={selected ? '#FFFFFF' : iconColor} />
      )}
      <Text
        variant="caption"
        className={`font-sans-medium ${icon ? 'ml-1.5' : ''} ${selected ? 'text-white' : ''}`}
        {...(size === 'sm' ? { style: { fontSize: 10 } } : {})}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function AddTransactionSheet({ sheetRef, editItem, initialData, onDismiss }: AddTransactionSheetProps) {
  const { colors } = useTheme();
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);
  const accounts = useFinanceStore((s) => s.accounts);
  const customCategories = useFinanceStore((s) => s.customCategories);
  const customSubcategories = useFinanceStore((s) => s.customSubcategories);
  const savedPayees = useFinanceStore((s) => s.savedPayees);
  const savedTags = useFinanceStore((s) => s.savedTags);
  const recordPayeeUsage = useFinanceStore((s) => s.recordPayeeUsage);
  const recordTagUsage = useFinanceStore((s) => s.recordTagUsage);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [subcategory, setSubcategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUri, setReceiptUri] = useState('');
  const [showSplits, setShowSplits] = useState(false);
  const [splits, setSplits] = useState<{ id: string; category: string; amount: string }[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [exchangeRate, setExchangeRate] = useState('');
  const [isBusiness, setIsBusiness] = useState(false);

  const [showPayeeSuggestions, setShowPayeeSuggestions] = useState(false);

  const isEditing = !!editItem;
  const profile = useFinanceStore((s) => s.profile);

  // Merge built-in + custom subcategories for current category
  const mergedSubcategories = useMemo(() => {
    const builtIn = SUBCATEGORIES[category] ?? [];
    const custom = customSubcategories.filter((s) => s.parentCategoryId === category);
    return { builtIn, custom, hasAny: builtIn.length > 0 || custom.length > 0 };
  }, [category, customSubcategories]);

  // Filtered payee suggestions
  const payeeSuggestions = useMemo(() => {
    if (!merchant.trim() || type === 'transfer') return [];
    return savedPayees
      .filter((p) => p.name.toLowerCase().includes(merchant.toLowerCase()))
      .sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return b.useCount - a.useCount;
      })
      .slice(0, 5);
  }, [merchant, savedPayees, type]);

  // Filtered tag suggestions
  const tagSuggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    return savedTags
      .filter((t) => t.name.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t.name))
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 5);
  }, [tagInput, savedTags, tags]);
  // Smart Categorization — suggest category based on merchant name
  const smartSuggestion = useMemo(() => {
    const trimmed = merchant.trim().toLowerCase();
    if (trimmed.length < 3 || type === 'transfer') return null;
    for (const [keyword, catId] of Object.entries(MERCHANT_CATEGORY_MAP)) {
      if (trimmed.includes(keyword)) {
        const cat = TRANSACTION_CATEGORIES.find((c) => c.id === catId);
        if (cat && cat.id !== category) return cat;
      }
    }
    return null;
  }, [merchant, type, category]);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const showExchangeRate = selectedAccount && selectedAccount.currency !== profile.currency;

  useEffect(() => {
    if (editItem) {
      setType(editItem.type);
      setAmount(String(editItem.amount));
      setMerchant(editItem.merchantName);
      setDescription(editItem.description);
      setCategory(editItem.category);
      setSubcategory(editItem.subcategory ?? '');
      setAccountId(editItem.accountId ?? '');
      setToAccountId(editItem.toAccountId ?? '');
      setNotes(editItem.notes ?? '');
      setReceiptUri(editItem.receiptUri ?? '');
      setTags(editItem.tags ?? []);
      setExchangeRate(editItem.exchangeRate ? String(editItem.exchangeRate) : '');
      setIsBusiness(editItem.isBusiness ?? false);
      if (editItem.splits && editItem.splits.length > 0) {
        setShowSplits(true);
        setSplits(editItem.splits.map((s) => ({ id: nextSplitId(), category: s.category, amount: String(s.amount) })));
      }
    }
  }, [editItem]);

  // Prefill from voice/scanner results
  useEffect(() => {
    if (initialData) {
      if (initialData.amount) setAmount(String(initialData.amount));
      if (initialData.merchant) setMerchant(initialData.merchant);
      if (initialData.description) setDescription(initialData.description);
      if (initialData.category) {
        const match = TRANSACTION_CATEGORIES.find(
          (c) => c.label.toLowerCase() === initialData.category!.toLowerCase(),
        );
        if (match) setCategory(match.id);
      }
    }
  }, [initialData]);

  const reset = useCallback(() => {
    setType('expense');
    setAmount('');
    setMerchant('');
    setDescription('');
    setCategory('other');
    setSubcategory('');
    setAccountId('');
    setToAccountId('');
    setNotes('');
    setReceiptUri('');
    setTags([]);
    setTagInput('');
    setShowSplits(false);
    setSplits([]);
    setShowConfirmDelete(false);
    setExchangeRate('');
    setIsBusiness(false);
    onDismiss?.();
  }, [onDismiss]);

  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  }, [tagInput, tags]);

  const handleSave = useCallback(() => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || !merchant.trim()) return;

    const parsedSplits = showSplits
      ? splits
          .map((s) => ({ category: s.category, amount: parseFloat(s.amount) || 0 }))
          .filter((s) => s.amount > 0)
      : undefined;

    const txnTags = tags.length > 0 ? tags : undefined;
    const parsedExchangeRate = exchangeRate ? parseFloat(exchangeRate) : undefined;

    const txnSubcategory = subcategory || undefined;
    const resolvedAccountId = accountId || accounts[0]?.id || '';
    const resolvedToAccountId = type === 'transfer' && toAccountId ? toAccountId : undefined;

    if (isEditing && editItem) {
      updateTransaction(editItem.id, {
        type,
        amount: parsedAmount,
        description: description.trim() || merchant.trim(),
        merchantName: merchant.trim(),
        category: type === 'transfer' ? 'transfer' : category,
        subcategory: txnSubcategory,
        accountId: resolvedAccountId,
        toAccountId: resolvedToAccountId,
        notes: notes.trim() || undefined,
        receiptUri: receiptUri || undefined,
        tags: txnTags,
        splits: parsedSplits,
        exchangeRate: parsedExchangeRate,
        isBusiness: isBusiness || undefined,
      });
    } else {
      addTransaction({
        accountId: resolvedAccountId,
        type,
        amount: parsedAmount,
        currency: selectedAccount?.currency ?? 'PHP',
        description: description.trim() || merchant.trim(),
        merchantName: merchant.trim(),
        category: type === 'transfer' ? 'transfer' : category,
        subcategory: txnSubcategory,
        toAccountId: resolvedToAccountId,
        notes: notes.trim() || undefined,
        receiptUri: receiptUri || undefined,
        date: new Date().toISOString(),
        tags: txnTags,
        splits: parsedSplits,
        exchangeRate: parsedExchangeRate,
        isBusiness: isBusiness || undefined,
      });

      // Note: addTransaction already handles crediting the destination account
      // for transfers via toAccountId — no paired transaction needed.
    }
    // Record payee and tag usage for autocomplete
    if (type !== 'transfer' && merchant.trim()) {
      recordPayeeUsage(merchant.trim(), category);
    }
    tags.forEach((t) => recordTagUsage(t));

    reset();
    sheetRef.current?.dismiss();
  }, [amount, merchant, description, type, category, subcategory, accountId, toAccountId, notes, receiptUri, tags, showSplits, splits, isEditing, editItem, accounts, addTransaction, updateTransaction, reset, sheetRef, recordPayeeUsage, recordTagUsage]);

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    deleteTransaction(editItem.id);
    reset();
    sheetRef.current?.dismiss();
  }, [editItem, deleteTransaction, reset, sheetRef]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['85%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">
        {isEditing ? 'Edit Transaction' : 'Add Transaction'}
      </Text>

      {/* Type toggle */}
      <View className="mb-3 flex-row gap-2">
        {TYPES.map((t) => (
          <Pressable
            key={t.value}
            onPress={() => setType(t.value)}
            accessibilityRole="button"
            accessibilityLabel={`Transaction type: ${t.label}${type === t.value ? ', selected' : ''}`}
            className={`flex-1 items-center rounded-xl border py-2.5 ${
              type === t.value
                ? 'bg-primary-500 border-primary-500'
                : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-semibold ${type === t.value ? 'text-white' : ''}`}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Business toggle (Batch 7) */}
      <Pressable
        onPress={() => setIsBusiness(!isBusiness)}
        accessibilityRole="button"
        accessibilityLabel={`Business transaction${isBusiness ? ', checked' : ', unchecked'}`}
        className="mb-4 flex-row items-center gap-2"
      >
        <Icon name={isBusiness ? 'checkbox' : 'square-outline'} size={20} color={colors.primary} />
        <Text variant="caption" className="font-sans-medium">Business transaction</Text>
      </Pressable>

      {/* Transfer account pickers */}
      {type === 'transfer' && accounts.length > 0 && (
        <>
          <Text variant="label" className="mb-2">From Account</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerClassName="gap-2">
            {accounts.map((a) => (
              <Chip key={a.id} selected={accountId === a.id} onPress={() => setAccountId(a.id)} label={a.name} />
            ))}
          </ScrollView>

          <Text variant="label" className="mb-2">To Account</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerClassName="gap-2">
            {accounts.filter((a) => a.id !== accountId).map((a) => (
              <Chip key={a.id} selected={toAccountId === a.id} onPress={() => setToAccountId(a.id)} label={a.name} />
            ))}
          </ScrollView>
        </>
      )}

      <Input
        label="Amount"
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        className="mb-3"
      />

      {/* Exchange Rate (Batch 6) — shown when account currency differs from profile */}
      {showExchangeRate && (
        <View className="mb-3">
          <Input
            label={`Exchange Rate (1 ${selectedAccount?.currency ?? ''} = ? ${profile.currency})`}
            placeholder="e.g. 56.50"
            value={exchangeRate}
            onChangeText={setExchangeRate}
            keyboardType="decimal-pad"
          />
          {exchangeRate && amount && !isNaN(parseFloat(amount)) && !isNaN(parseFloat(exchangeRate)) && (
            <Text variant="caption" className="mt-1 text-neutral-500">
              ≈ ₱{(parseFloat(amount) * parseFloat(exchangeRate)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          )}
        </View>
      )}

      <Input
        label={type === 'transfer' ? 'Note / Label' : 'Merchant / Payee'}
        placeholder={type === 'transfer' ? 'e.g. Savings top-up' : 'e.g. Jollibee'}
        value={merchant}
        onChangeText={(val) => {
          setMerchant(val);
          setShowPayeeSuggestions(true);
        }}
        autoCapitalize="words"
        className={payeeSuggestions.length > 0 && showPayeeSuggestions ? '' : 'mb-3'}
      />
      {/* Payee autocomplete */}
      {payeeSuggestions.length > 0 && showPayeeSuggestions && (
        <View className="mb-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
          {payeeSuggestions.map((p, idx) => (
            <Pressable
              key={p.id}
              onPress={() => {
                setMerchant(p.name);
                if (p.category) setCategory(p.category);
                setShowPayeeSuggestions(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Select payee: ${p.name}`}
              className={`flex-row items-center justify-between px-3 py-2.5 ${
                idx < payeeSuggestions.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : ''
              }`}
            >
              <View className="flex-row items-center gap-2">
                {p.isFavorite && <Icon name="star" size={14} color="#f59e0b" />}
                <Text variant="body">{p.name}</Text>
              </View>
              {p.category && (
                <Text variant="caption" className="text-neutral-400">{p.category}</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}

      <Input
        label="Description (optional)"
        placeholder="What was this for?"
        value={description}
        onChangeText={setDescription}
        autoCapitalize="sentences"
        className="mb-3"
      />

      {/* Tags */}
      <Text variant="label" className="mb-2">Tags</Text>
      <View className="mb-3">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input
              placeholder="Add a tag..."
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
          </View>
          <Pressable onPress={addTag} accessibilityRole="button" accessibilityLabel="Add tag" className="h-11 w-11 items-center justify-center rounded-xl bg-primary-500">
            <Icon name="add" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
        {/* Tag suggestions */}
        {tagSuggestions.length > 0 && (
          <View className="mt-1 flex-row flex-wrap gap-1.5">
            {tagSuggestions.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => {
                  setTags([...tags, t.name]);
                  setTagInput('');
                }}
                accessibilityRole="button"
                accessibilityLabel={`Add tag: ${t.name}`}
                className="flex-row items-center rounded-full border border-neutral-200 px-2.5 py-1 dark:border-neutral-700"
              >
                <Text variant="caption" className="text-neutral-500">#{t.name}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {tags.length > 0 && (
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => setTags(tags.filter((t) => t !== tag))}
                accessibilityRole="button"
                accessibilityLabel={`Remove tag: ${tag}`}
                className="flex-row items-center rounded-full bg-primary-100 px-2.5 py-1 dark:bg-primary-900"
              >
                <Text variant="caption" className="font-sans-medium mr-1" style={{ color: colors.primary }}>
                  {tag}
                </Text>
                <Icon name="close" size={12} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Split toggle */}
      <Pressable
        onPress={() => {
          setShowSplits(!showSplits);
          if (!showSplits && splits.length === 0) {
            setSplits([{ id: nextSplitId(), category: 'other', amount: '' }]);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={`Split by category${showSplits ? ', enabled' : ', disabled'}`}
        className="mb-3 flex-row items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-700"
      >
        <Text variant="body" className="font-sans-medium">Split by category</Text>
        <Icon name={showSplits ? 'checkbox' : 'square-outline'} size={20} color={colors.primary} />
      </Pressable>

      {showSplits && (
        <View className="mb-3 gap-2">
          {splits.map((split, idx) => (
            <View key={split.id} className="flex-row items-center gap-2">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1" contentContainerClassName="gap-1">
                {TRANSACTION_CATEGORIES.filter((c) => !['salary', 'freelance', 'investment_income', 'transfer'].includes(c.id)).map((cat) => (
                  <Chip
                    key={cat.id}
                    selected={split.category === cat.id}
                    onPress={() => {
                      const updated = [...splits];
                      updated[idx] = { ...updated[idx]!, category: cat.id };
                      setSplits(updated);
                    }}
                    label={cat.label}
                    size="sm"
                  />
                ))}
              </ScrollView>
              <View style={{ width: 80 }}>
                <Input
                  placeholder="0.00"
                  value={split.amount}
                  onChangeText={(val) => {
                    const updated = [...splits];
                    updated[idx] = { ...updated[idx]!, amount: val };
                    setSplits(updated);
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
              <Pressable onPress={() => setSplits(splits.filter((_, i) => i !== idx))} accessibilityRole="button" accessibilityLabel="Remove split">
                <Icon name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={() => setSplits([...splits, { id: nextSplitId(), category: 'other', amount: '' }])}
            accessibilityRole="button"
            accessibilityLabel="Add split"
            className="flex-row items-center justify-center rounded-xl border border-dashed border-neutral-300 py-2 dark:border-neutral-600"
          >
            <Icon name="add" size={16} color={colors.primary} />
            <Text variant="caption" className="font-sans-medium ml-1" style={{ color: colors.primary }}>Add split</Text>
          </Pressable>
        </View>
      )}

      {/* Category grid — hidden for transfers */}
      {type !== 'transfer' && (
        <>
          {/* Smart Categorization suggestion */}
          {smartSuggestion && (
            <Pressable
              onPress={() => {
                setCategory(smartSuggestion.id);
                setSubcategory('');
              }}
              accessibilityRole="button"
              accessibilityLabel={`Apply suggested category: ${smartSuggestion.label}`}
              className="mb-2 flex-row items-center self-start rounded-full px-3 py-1.5"
              style={{ backgroundColor: `${smartSuggestion.color}15`, borderWidth: 1, borderColor: `${smartSuggestion.color}40` }}
            >
              <Icon name="sparkles-outline" size={14} color={smartSuggestion.color} />
              <Text variant="caption" className="ml-1 font-sans-medium" style={{ color: smartSuggestion.color, fontSize: 11 }}>
                Suggested: {smartSuggestion.label}
              </Text>
            </Pressable>
          )}
          <Text variant="label" className="mb-2">
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
            contentContainerClassName="gap-2 pb-1"
          >
            {TRANSACTION_CATEGORIES.map((cat) => (
              <Chip
                key={cat.id}
                selected={category === cat.id}
                onPress={() => { setCategory(cat.id); setSubcategory(''); }}
                label={cat.label}
                icon={cat.icon}
                iconColor={cat.color}
              />
            ))}
            {customCategories.filter((cc) => cc.type === type).map((cc) => (
              <Chip
                key={cc.id}
                selected={category === cc.id}
                onPress={() => { setCategory(cc.id); setSubcategory(''); }}
                label={cc.label}
                icon={cc.icon}
                iconColor={cc.color}
              />
            ))}
          </ScrollView>

          {/* Subcategory chips (built-in + custom) */}
          {mergedSubcategories.hasAny && (
            <>
              <Text variant="caption" className="mb-1 text-neutral-500">Subcategory</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerClassName="gap-2">
                <Chip selected={!subcategory} onPress={() => setSubcategory('')} label="General" />
                {mergedSubcategories.builtIn.map((sub) => (
                  <Chip key={sub.id} selected={subcategory === sub.id} onPress={() => setSubcategory(sub.id)} label={sub.label} />
                ))}
                {mergedSubcategories.custom.map((sub) => (
                  <Chip key={sub.id} selected={subcategory === sub.id} onPress={() => setSubcategory(sub.id)} label={sub.label} />
                ))}
              </ScrollView>
            </>
          )}
        </>
      )}

      {/* Notes */}
      <Text variant="label" className="mb-1">Notes (optional)</Text>
      <View className="mb-3 rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-700">
        <TextInput
          placeholder="Add notes..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          className="font-[Inter-Regular] text-sm text-neutral-900 dark:text-neutral-100"
          placeholderTextColor={colors.textTertiary}
          style={{ minHeight: 60, textAlignVertical: 'top' }}
        />
      </View>

      {/* Receipt */}
      <Pressable
        onPress={async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            setReceiptUri(result.assets[0].uri);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={receiptUri ? 'Receipt attached. Tap to change' : 'Attach receipt'}
        className="mb-6 flex-row items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-700"
      >
        <View className="flex-row items-center gap-2">
          <Icon name="camera-outline" size={18} color={colors.primary} />
          <Text variant="body" className="font-sans-medium">
            {receiptUri ? 'Receipt attached' : 'Attach receipt'}
          </Text>
        </View>
        {receiptUri ? (
          <Pressable onPress={() => setReceiptUri('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remove receipt">
            <Icon name="close-circle" size={20} color={colors.danger} />
          </Pressable>
        ) : (
          <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
        )}
      </Pressable>

      <Button onPress={handleSave} disabled={!amount || !merchant.trim()}>
        {isEditing ? 'Save Changes' : 'Save Transaction'}
      </Button>

      {isEditing && (
        <View className="mt-3">
          {showConfirmDelete ? (
            <View className="flex-row gap-2">
              <Button variant="ghost" onPress={() => setShowConfirmDelete(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="danger" onPress={handleDelete} className="flex-1">
                Confirm Delete
              </Button>
            </View>
          ) : (
            <Button variant="ghost" onPress={() => setShowConfirmDelete(true)}>
              Delete Transaction
            </Button>
          )}
        </View>
      )}
    </BottomSheetModal>
  );
}
