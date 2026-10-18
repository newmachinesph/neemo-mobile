import { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useFinanceStore } from '../store/finance.store';
import type { Paluwagan, PaluwaganMember } from '../types/finance.types';

interface AddPaluwaganSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: Paluwagan | null;
  onDismiss?: () => void;
}

export function AddPaluwaganSheet({ sheetRef, editItem, onDismiss }: AddPaluwaganSheetProps) {
  const addPaluwagan = useFinanceStore((s) => s.addPaluwagan);
  const updatePaluwagan = useFinanceStore((s) => s.updatePaluwagan);
  const deletePaluwagan = useFinanceStore((s) => s.deletePaluwagan);

  const [groupName, setGroupName] = useState('');
  const [contribution, setContribution] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [memberNames, setMemberNames] = useState('');
  const [totalRounds, setTotalRounds] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (editItem) {
      setGroupName(editItem.groupName);
      setContribution(String(editItem.contributionAmount));
      setFrequency(editItem.frequency);
      setMemberNames(editItem.members.map((m) => m.name).join(', '));
      setTotalRounds(String(editItem.totalRounds));
    }
  }, [editItem]);

  const reset = useCallback(() => {
    setGroupName('');
    setContribution('');
    setFrequency('monthly');
    setMemberNames('');
    setTotalRounds('');
    setShowConfirmDelete(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleSave = useCallback(() => {
    const name = groupName.trim();
    const amt = parseFloat(contribution);
    const names = memberNames.split(',').map((n) => n.trim()).filter(Boolean);
    const rounds = parseInt(totalRounds, 10);

    if (!name || !amt || names.length < 2 || !rounds || rounds < names.length) return;

    const members: PaluwaganMember[] = names.map((n, i) => ({
      name: n,
      turnOrder: i + 1,
      hasPaidCurrentRound: false,
      hasReceived: false,
    }));

    if (editItem) {
      updatePaluwagan(editItem.id, {
        groupName: name,
        contributionAmount: amt,
        frequency,
        members: editItem.members.length === members.length ? editItem.members : members,
        totalRounds: rounds,
        startDate: editItem.startDate,
        currentRound: editItem.currentRound,
      });
    } else {
      addPaluwagan({
        groupName: name,
        contributionAmount: amt,
        frequency,
        members,
        startDate: new Date().toISOString(),
        currentRound: 1,
        totalRounds: rounds,
      });
    }
    sheetRef.current?.dismiss();
    reset();
  }, [groupName, contribution, frequency, memberNames, totalRounds, editItem, addPaluwagan, updatePaluwagan, sheetRef, reset]);

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    if (!showConfirmDelete) { setShowConfirmDelete(true); return; }
    deletePaluwagan(editItem.id);
    sheetRef.current?.dismiss();
    reset();
  }, [editItem, showConfirmDelete, deletePaluwagan, sheetRef, reset]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['75%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">{editItem ? 'Edit Paluwagan' : 'New Paluwagan'}</Text>

      <Input
        label="Group Name"
        placeholder="e.g. Office Paluwagan"
        value={groupName}
        onChangeText={setGroupName}
        className="mb-3"
      />

      <Input
        label="Contribution Amount"
        placeholder="e.g. 1000"
        value={contribution}
        onChangeText={setContribution}
        keyboardType="decimal-pad"
        className="mb-3"
      />

      {/* Frequency */}
      <Text variant="caption" className="mb-1 text-neutral-500">Frequency</Text>
      <View className="mb-3 flex-row gap-2">
        {(['weekly', 'monthly'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFrequency(f)}
            accessibilityRole="button"
            accessibilityLabel={`Frequency: ${f}${frequency === f ? ', selected' : ''}`}
            className={`flex-1 items-center rounded-xl py-2.5 border ${
              frequency === f ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-semibold capitalize ${frequency === f ? 'text-white' : ''}`}>
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input
        label="Members (comma-separated)"
        placeholder="e.g. You, Maria, Jose, Ana"
        value={memberNames}
        onChangeText={setMemberNames}
        className="mb-3"
      />

      <Input
        label="Total Rounds"
        placeholder="e.g. 5"
        value={totalRounds}
        onChangeText={setTotalRounds}
        keyboardType="numeric"
        className="mb-4"
      />

      <Button onPress={handleSave} disabled={!groupName.trim() || !parseFloat(contribution) || !parseInt(totalRounds, 10)} className="mb-2">{editItem ? 'Update' : 'Create Paluwagan'}</Button>

      {editItem && (
        <Button onPress={handleDelete} variant="outline">{showConfirmDelete ? 'Confirm Delete' : 'Delete'}</Button>
      )}
    </BottomSheetModal>
  );
}
