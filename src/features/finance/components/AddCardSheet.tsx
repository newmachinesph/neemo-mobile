import { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { useFinanceStore } from '../store/finance.store';
import { CARD_TYPES, CARD_TYPE_LABELS, CARD_NETWORKS } from '@lib/constants/finance';
import type { CardType, CardNetwork } from '@lib/constants/finance';
import type { Card as CardModel } from '../types/finance.types';

interface AddCardSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: CardModel | null;
  onDismiss?: () => void;
}

export function AddCardSheet({ sheetRef, editItem, onDismiss }: AddCardSheetProps) {
  const addCard = useFinanceStore((s) => s.addCard);
  const updateCard = useFinanceStore((s) => s.updateCard);
  const deleteCard = useFinanceStore((s) => s.deleteCard);
  const accounts = useFinanceStore((s) => s.accounts);

  const [nickname, setNickname] = useState('');
  const [type, setType] = useState<CardType>('debit');
  const [last4, setLast4] = useState('');
  const [network, setNetwork] = useState<CardNetwork | 'other'>('visa');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [statementCutDay, setStatementCutDay] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (editItem) {
      setNickname(editItem.nickname);
      setType(editItem.type);
      setLast4(editItem.last4);
      setNetwork(editItem.network);
      setLinkedAccountId(editItem.linkedAccountId || '');
      setCreditLimit(editItem.creditLimit ? String(editItem.creditLimit) : '');
      setStatementCutDay(editItem.statementCutDay ? String(editItem.statementCutDay) : '');
      setPaymentDueDay(editItem.paymentDueDay ? String(editItem.paymentDueDay) : '');
    }
  }, [editItem]);

  const reset = useCallback(() => {
    setNickname('');
    setType('debit');
    setLast4('');
    setNetwork('visa');
    setLinkedAccountId('');
    setCreditLimit('');
    setStatementCutDay('');
    setPaymentDueDay('');
    setShowConfirmDelete(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleSave = useCallback(() => {
    const name = nickname.trim();
    if (!name || last4.length !== 4) return;

    const data = {
      nickname: name,
      type,
      last4,
      network,
      linkedAccountId: linkedAccountId || undefined,
      creditLimit: parseFloat(creditLimit) || undefined,
      outstandingBalance: editItem?.outstandingBalance,
      statementCutDay: parseInt(statementCutDay, 10) || undefined,
      paymentDueDay: parseInt(paymentDueDay, 10) || undefined,
      isActive: true,
    };

    if (editItem) {
      updateCard(editItem.id, data);
    } else {
      addCard(data);
    }
    sheetRef.current?.dismiss();
    reset();
  }, [nickname, type, last4, network, linkedAccountId, creditLimit, statementCutDay, paymentDueDay, editItem, addCard, updateCard, sheetRef, reset]);

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    if (!showConfirmDelete) { setShowConfirmDelete(true); return; }
    deleteCard(editItem.id);
    sheetRef.current?.dismiss();
    reset();
  }, [editItem, showConfirmDelete, deleteCard, sheetRef, reset]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['85%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">{editItem ? 'Edit Card' : 'Add Card'}</Text>

      <Input label="Nickname" placeholder="e.g. BPI Debit" value={nickname} onChangeText={setNickname} className="mb-3" />
      <Input label="Last 4 Digits" placeholder="e.g. 4523" value={last4} onChangeText={(t) => setLast4(t.slice(0, 4))} keyboardType="numeric" className="mb-3" />

      {/* Card Type */}
      <Text variant="caption" className="mb-1 text-neutral-500">Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {CARD_TYPES.map((ct) => (
            <Pressable
              key={ct}
              onPress={() => setType(ct)}
              accessibilityRole="button"
              accessibilityLabel={CARD_TYPE_LABELS[ct]}
              accessibilityState={{ selected: type === ct }}
              className={`rounded-full px-4 py-2 border ${
                type === ct ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <Text variant="caption" className={`font-sans-semibold ${type === ct ? 'text-white' : ''}`}>
                {CARD_TYPE_LABELS[ct]}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Network */}
      <Text variant="caption" className="mb-1 text-neutral-500">Network</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {[...CARD_NETWORKS, 'other' as const].map((n) => (
            <Pressable
              key={n}
              onPress={() => setNetwork(n)}
              accessibilityRole="button"
              accessibilityLabel={n}
              accessibilityState={{ selected: network === n }}
              className={`rounded-full px-4 py-2 border ${
                network === n ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <Text variant="caption" className={`font-sans-semibold capitalize ${network === n ? 'text-white' : ''}`}>
                {n}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Linked Account */}
      <Text variant="caption" className="mb-1 text-neutral-500">Linked Account</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setLinkedAccountId('')}
            accessibilityRole="button"
            accessibilityLabel="No linked account"
            accessibilityState={{ selected: !linkedAccountId }}
            className={`rounded-full px-4 py-2 border ${
              !linkedAccountId ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-semibold ${!linkedAccountId ? 'text-white' : ''}`}>
              None
            </Text>
          </Pressable>
          {accounts.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setLinkedAccountId(a.id)}
              accessibilityRole="button"
              accessibilityLabel={`Link to ${a.name}`}
              accessibilityState={{ selected: linkedAccountId === a.id }}
              className={`rounded-full px-4 py-2 border ${
                linkedAccountId === a.id ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <Text variant="caption" className={`font-sans-semibold ${linkedAccountId === a.id ? 'text-white' : ''}`}>
                {a.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {type === 'credit' && (
        <>
          <Input label="Credit Limit" placeholder="e.g. 80000" value={creditLimit} onChangeText={setCreditLimit} keyboardType="decimal-pad" className="mb-3" />
          <View className="flex-row gap-3 mb-3">
            <Input label="Statement Cut Day" placeholder="e.g. 15" value={statementCutDay} onChangeText={setStatementCutDay} keyboardType="numeric" className="flex-1" />
            <Input label="Payment Due Day" placeholder="e.g. 5" value={paymentDueDay} onChangeText={setPaymentDueDay} keyboardType="numeric" className="flex-1" />
          </View>
        </>
      )}

      <Button onPress={handleSave} disabled={!nickname.trim() || last4.length !== 4} className="mb-2">{editItem ? 'Update' : 'Add Card'}</Button>

      {editItem && (
        <Button onPress={handleDelete} variant="outline">{showConfirmDelete ? 'Confirm Delete' : 'Delete'}</Button>
      )}
    </BottomSheetModal>
  );
}
