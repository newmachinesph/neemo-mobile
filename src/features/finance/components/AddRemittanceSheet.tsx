import { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { useTheme } from '@theme/ThemeProvider';
import { useFinanceStore } from '../store/finance.store';
import { REMITTANCE_CHANNELS } from '@lib/constants/finance';
import type { Remittance } from '../types/finance.types';

interface AddRemittanceSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: Remittance | null;
  onDismiss?: () => void;
}

export function AddRemittanceSheet({ sheetRef, editItem, onDismiss }: AddRemittanceSheetProps) {
  const { colors } = useTheme();
  const addRemittance = useFinanceStore((s) => s.addRemittance);
  const updateRemittance = useFinanceStore((s) => s.updateRemittance);
  const deleteRemittance = useFinanceStore((s) => s.deleteRemittance);

  const [senderName, setSenderName] = useState('');
  const [amountForeign, setAmountForeign] = useState('');
  const [foreignCurrency, setForeignCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState('');
  const [channel, setChannel] = useState('GCash');
  const [note, setNote] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (editItem) {
      setSenderName(editItem.senderName);
      setAmountForeign(String(editItem.amountForeign));
      setForeignCurrency(editItem.foreignCurrency);
      setExchangeRate(String(editItem.exchangeRate));
      setChannel(editItem.channel);
      setNote(editItem.note || '');
    }
  }, [editItem]);

  const reset = useCallback(() => {
    setSenderName('');
    setAmountForeign('');
    setForeignCurrency('USD');
    setExchangeRate('');
    setChannel('GCash');
    setNote('');
    setShowConfirmDelete(false);
    onDismiss?.();
  }, [onDismiss]);

  const computedPHP = (parseFloat(amountForeign) || 0) * (parseFloat(exchangeRate) || 0);

  const handleSave = useCallback(() => {
    const sender = senderName.trim();
    const foreign = parseFloat(amountForeign);
    const rate = parseFloat(exchangeRate);
    if (!sender || !foreign || !rate) return;

    const data = {
      senderName: sender,
      amountForeign: foreign,
      foreignCurrency,
      exchangeRate: rate,
      amountPHP: foreign * rate,
      channel,
      date: editItem?.date || new Date().toISOString(),
      note: note.trim() || undefined,
    };

    if (editItem) {
      updateRemittance(editItem.id, data);
    } else {
      addRemittance(data);
    }
    sheetRef.current?.dismiss();
    reset();
  }, [senderName, amountForeign, foreignCurrency, exchangeRate, channel, note, editItem, addRemittance, updateRemittance, sheetRef, reset]);

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    if (!showConfirmDelete) { setShowConfirmDelete(true); return; }
    deleteRemittance(editItem.id);
    sheetRef.current?.dismiss();
    reset();
  }, [editItem, showConfirmDelete, deleteRemittance, sheetRef, reset]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['85%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">{editItem ? 'Edit Remittance' : 'Log Remittance'}</Text>

      <Input
        label="Sender Name"
        placeholder="e.g. Tita Rose (Dubai)"
        value={senderName}
        onChangeText={setSenderName}
        className="mb-3"
      />

      <View className="mb-3 flex-row gap-3">
        <Input
          label="Amount (Foreign)"
          placeholder="e.g. 500"
          value={amountForeign}
          onChangeText={setAmountForeign}
          keyboardType="decimal-pad"
          className="flex-1"
        />
        <Input
          label="Currency"
          placeholder="USD"
          value={foreignCurrency}
          onChangeText={setForeignCurrency}
          className="w-24"
        />
      </View>

      <Input
        label="Exchange Rate (1 unit = ₱)"
        placeholder="e.g. 56.50"
        value={exchangeRate}
        onChangeText={setExchangeRate}
        keyboardType="decimal-pad"
        className="mb-2"
      />

      {computedPHP > 0 && (
        <Text variant="caption" className="mb-3" style={{ color: colors.success }}>
          = ₱{computedPHP.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </Text>
      )}

      {/* Channel Picker */}
      <Text variant="caption" className="mb-1 text-neutral-500">Channel</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {REMITTANCE_CHANNELS.map((ch) => (
            <Pressable
              key={ch}
              onPress={() => setChannel(ch)}
              accessibilityRole="button"
              accessibilityLabel={`Channel: ${ch}${channel === ch ? ', selected' : ''}`}
              className={`rounded-full px-4 py-2 border ${
                channel === ch ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <Text variant="caption" className={`font-sans-semibold ${channel === ch ? 'text-white' : ''}`}>
                {ch}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Input
        label="Note (optional)"
        placeholder="e.g. For monthly support"
        value={note}
        onChangeText={setNote}
        className="mb-4"
      />

      <Button onPress={handleSave} disabled={!senderName.trim() || !parseFloat(amountForeign) || !parseFloat(exchangeRate)} className="mb-2">{editItem ? 'Update' : 'Log Remittance'}</Button>

      {editItem && (
        <Button onPress={handleDelete} variant="outline">{showConfirmDelete ? 'Confirm Delete' : 'Delete'}</Button>
      )}
    </BottomSheetModal>
  );
}
