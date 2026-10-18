import { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { useFinanceStore } from '../store/finance.store';
import type { TaxRecord } from '../types/finance.types';

interface AddTaxRecordSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: TaxRecord | null;
  onDismiss?: () => void;
}

export function AddTaxRecordSheet({ sheetRef, editItem, onDismiss }: AddTaxRecordSheetProps) {
  const addTaxRecord = useFinanceStore((s) => s.addTaxRecord);
  const updateTaxRecord = useFinanceStore((s) => s.updateTaxRecord);
  const deleteTaxRecord = useFinanceStore((s) => s.deleteTaxRecord);

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(1);
  const [grossIncome, setGrossIncome] = useState('');
  const [deductions, setDeductions] = useState('');
  const [taxDue, setTaxDue] = useState('');
  const [taxPaid, setTaxPaid] = useState('');
  const [status, setStatus] = useState<'pending' | 'filed'>('pending');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (editItem) {
      setYear(String(editItem.year));
      setQuarter(editItem.quarter);
      setGrossIncome(String(editItem.grossIncome));
      setDeductions(String(editItem.deductions));
      setTaxDue(String(editItem.taxDue));
      setTaxPaid(String(editItem.taxPaid));
      setStatus(editItem.status);
    }
  }, [editItem]);

  const reset = useCallback(() => {
    setYear(String(new Date().getFullYear()));
    setQuarter(1);
    setGrossIncome('');
    setDeductions('');
    setTaxDue('');
    setTaxPaid('');
    setStatus('pending');
    setShowConfirmDelete(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleSave = useCallback(() => {
    const yr = parseInt(year, 10);
    const gross = parseFloat(grossIncome) || 0;
    const ded = parseFloat(deductions) || 0;
    const due = parseFloat(taxDue) || 0;
    const paid = parseFloat(taxPaid) || 0;
    if (!yr) return;

    const data = { year: yr, quarter, grossIncome: gross, deductions: ded, taxDue: due, taxPaid: paid, status };

    if (editItem) {
      updateTaxRecord(editItem.id, data);
    } else {
      addTaxRecord(data);
    }
    sheetRef.current?.dismiss();
    reset();
  }, [year, quarter, grossIncome, deductions, taxDue, taxPaid, status, editItem, addTaxRecord, updateTaxRecord, sheetRef, reset]);

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    if (!showConfirmDelete) { setShowConfirmDelete(true); return; }
    deleteTaxRecord(editItem.id);
    sheetRef.current?.dismiss();
    reset();
  }, [editItem, showConfirmDelete, deleteTaxRecord, sheetRef, reset]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['80%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">{editItem ? 'Edit Tax Record' : 'Add Tax Record'}</Text>

      <View className="mb-3 flex-row gap-3">
        <Input label="Year" placeholder="2026" value={year} onChangeText={setYear} keyboardType="numeric" className="flex-1" />
        <View className="flex-1">
          <Text variant="caption" className="mb-1 text-neutral-500">Quarter</Text>
          <View className="flex-row gap-1">
            {([1, 2, 3, 4] as const).map((q) => (
              <Pressable
                key={q}
                onPress={() => setQuarter(q)}
                accessibilityRole="button"
                accessibilityLabel={`Quarter ${q}`}
                accessibilityState={{ selected: quarter === q }}
                className={`flex-1 items-center rounded-lg py-2 border ${
                  quarter === q ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <Text variant="caption" className={`font-sans-semibold ${quarter === q ? 'text-white' : ''}`}>
                  Q{q}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Input label="Gross Income" placeholder="0" value={grossIncome} onChangeText={setGrossIncome} keyboardType="decimal-pad" className="mb-3" />
      <Input label="Deductions" placeholder="0" value={deductions} onChangeText={setDeductions} keyboardType="decimal-pad" className="mb-3" />
      <Input label="Tax Due" placeholder="0" value={taxDue} onChangeText={setTaxDue} keyboardType="decimal-pad" className="mb-3" />
      <Input label="Tax Paid" placeholder="0" value={taxPaid} onChangeText={setTaxPaid} keyboardType="decimal-pad" className="mb-3" />

      {/* Status */}
      <Text variant="caption" className="mb-1 text-neutral-500">Status</Text>
      <View className="mb-4 flex-row gap-2">
        {(['pending', 'filed'] as const).map((s) => (
          <Pressable
            key={s}
            onPress={() => setStatus(s)}
            accessibilityRole="button"
            accessibilityLabel={s}
            accessibilityState={{ selected: status === s }}
            className={`flex-1 items-center rounded-xl py-2.5 border ${
              status === s ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-semibold capitalize ${status === s ? 'text-white' : ''}`}>
              {s}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button onPress={handleSave} disabled={!parseInt(year, 10)} className="mb-2">{editItem ? 'Update' : 'Add Record'}</Button>

      {editItem && (
        <Button onPress={handleDelete} variant="outline">{showConfirmDelete ? 'Confirm Delete' : 'Delete'}</Button>
      )}
    </BottomSheetModal>
  );
}
