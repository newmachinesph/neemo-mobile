import { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from '@lib/constants/finance';
import type { AccountType } from '@lib/constants/finance';
import {
  PHILIPPINE_INSTITUTIONS,
  getInstitutionsByAccountType,
  type Institution,
} from '@lib/constants/institutions';
import { useFinanceStore } from '../store/finance.store';
import type { Account } from '../types/finance.types';
import { useTheme } from '@theme/ThemeProvider';

// ── Institution Badge ──────────────────────────────────────────────────────

function InstitutionBadge({
  institution,
  selected,
  onPress,
}: {
  institution: Institution;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${institution.name}${selected ? ', selected' : ''}`}
      className="items-center mr-3 mb-2"
      style={{ width: 72 }}
    >
      <View
        className="items-center justify-center rounded-2xl mb-1.5"
        style={[
          {
            width: 52,
            height: 52,
            backgroundColor: selected ? institution.brandColor : colors.surfaceSecondary,
            borderWidth: selected ? 2.5 : 1.5,
            borderColor: selected ? institution.brandColor : colors.border,
          },
        ]}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '800',
            color: selected ? '#FFFFFF' : institution.brandColor,
            textAlign: 'center',
            letterSpacing: -0.3,
          }}
          numberOfLines={1}
        >
          {institution.shortName.length <= 6
            ? institution.shortName
            : institution.shortName.slice(0, 3)}
        </Text>
      </View>
      <Text
        variant="caption"
        className="text-center"
        style={{
          fontSize: 10,
          color: selected ? institution.brandColor : colors.textSecondary,
          fontWeight: selected ? '600' : '400',
        }}
        numberOfLines={2}
      >
        {institution.shortName}
      </Text>
    </Pressable>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface AddAccountSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: Account | null;
  onDismiss?: () => void;
}

export function AddAccountSheet({ sheetRef, editItem, onDismiss }: AddAccountSheetProps) {
  const addAccount = useFinanceStore((s) => s.addAccount);
  const updateAccount = useFinanceStore((s) => s.updateAccount);
  const deleteAccount = useFinanceStore((s) => s.deleteAccount);
  const profileCurrency = useFinanceStore((s) => s.profile.currency);
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('savings');
  const [balance, setBalance] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<string | undefined>();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isEditing = !!editItem;

  // Filter institutions by selected account type
  const filteredInstitutions = useMemo(
    () => getInstitutionsByAccountType(type),
    [type],
  );

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setType(editItem.type);
      setBalance(String(editItem.balance));
      setSelectedInstitution(editItem.institution);
    }
  }, [editItem]);

  // Auto-fill name when selecting an institution (only for new accounts)
  const handleInstitutionSelect = useCallback(
    (inst: Institution) => {
      if (selectedInstitution === inst.id) {
        // Deselect
        setSelectedInstitution(undefined);
        if (!isEditing) setName('');
        return;
      }
      setSelectedInstitution(inst.id);
      if (!isEditing && !name.trim()) {
        // Auto-fill with institution name + account type
        const typeLabel = ACCOUNT_TYPE_LABELS[type];
        setName(`${inst.shortName} ${typeLabel}`);
      }
    },
    [selectedInstitution, isEditing, name, type],
  );

  const reset = useCallback(() => {
    setName('');
    setType('savings');
    setBalance('');
    setSelectedInstitution(undefined);
    setShowConfirmDelete(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleSave = useCallback(() => {
    if (!name.trim()) return;

    const institution = selectedInstitution;
    const matchedInst = institution
      ? PHILIPPINE_INSTITUTIONS.find((i) => i.id === institution)
      : undefined;

    if (isEditing && editItem) {
      updateAccount(editItem.id, {
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        currency: editItem.currency ?? profileCurrency,
        institution,
        icon: matchedInst?.icon,
        color: matchedInst?.brandColor,
      });
    } else {
      addAccount({
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        currency: profileCurrency,
        institution,
        icon: matchedInst?.icon,
        color: matchedInst?.brandColor,
      });
    }
    reset();
    sheetRef.current?.dismiss();
  }, [
    name,
    type,
    balance,
    selectedInstitution,
    isEditing,
    editItem,
    addAccount,
    updateAccount,
    reset,
    sheetRef,
    profileCurrency,
  ]);

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    deleteAccount(editItem.id);
    reset();
    sheetRef.current?.dismiss();
  }, [editItem, deleteAccount, reset, sheetRef]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['85%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">
        {isEditing ? 'Edit Account' : 'Add Account'}
      </Text>

      {/* Account Type Picker */}
      <Text variant="label" className="mb-2">
        Account Type
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3"
        contentContainerClassName="gap-2"
      >
        {ACCOUNT_TYPES.map((t) => (
          <Pressable
            key={t}
            onPress={() => {
              setType(t);
              setSelectedInstitution(undefined);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Account type: ${ACCOUNT_TYPE_LABELS[t]}${type === t ? ', selected' : ''}`}
            className={`rounded-full px-3.5 py-1.5 border ${
              type === t
                ? 'bg-primary-500 border-primary-500'
                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-surface-dark-secondary'
            }`}
          >
            <Text
              variant="caption"
              className={`font-sans-medium ${type === t ? 'text-white' : ''}`}
            >
              {ACCOUNT_TYPE_LABELS[t]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Institution Picker */}
      {filteredInstitutions.length > 0 && (
        <>
          <Text variant="label" className="mb-2">
            Institution
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
            contentContainerClassName="pr-4"
          >
            {filteredInstitutions.map((inst) => (
              <InstitutionBadge
                key={inst.id}
                institution={inst}
                selected={selectedInstitution === inst.id}
                onPress={() => handleInstitutionSelect(inst)}
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* Account Name */}
      <Input
        label="Account Name"
        placeholder="e.g. BPI Savings"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        className="mb-3"
      />

      {/* Balance */}
      <Input
        label={isEditing ? 'Balance' : 'Initial Balance'}
        placeholder="0.00"
        value={balance}
        onChangeText={setBalance}
        keyboardType="decimal-pad"
        className="mb-6"
      />

      {/* Selected Institution Preview */}
      {selectedInstitution && (() => {
        const inst = PHILIPPINE_INSTITUTIONS.find((i) => i.id === selectedInstitution);
        if (!inst) return null;
        return (
          <View
            className="flex-row items-center rounded-xl p-3 mb-4"
            style={{ backgroundColor: inst.brandColor + '12' }}
          >
            <View
              className="items-center justify-center rounded-lg mr-3"
              style={{
                width: 36,
                height: 36,
                backgroundColor: inst.brandColor,
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>
                {inst.shortName.slice(0, 3)}
              </Text>
            </View>
            <View className="flex-1">
              <Text variant="body" style={{ fontWeight: '600', color: inst.brandColor }}>
                {inst.name}
              </Text>
              <Text variant="caption" style={{ color: colors.textSecondary }}>
                {inst.type === 'bank'
                  ? 'Universal Bank'
                  : inst.type === 'e_wallet'
                    ? 'E-Wallet'
                    : inst.type === 'digital_bank'
                      ? 'Digital Bank'
                      : inst.type === 'government'
                        ? 'Government'
                        : inst.type === 'cooperative'
                          ? 'Cooperative'
                          : 'Other'}
              </Text>
            </View>
            <Icon
              name="checkmark-circle"
              size={22}
              color={inst.brandColor}
            />
          </View>
        );
      })()}

      <Button onPress={handleSave} disabled={!name.trim()}>
        {isEditing ? 'Save Changes' : 'Save Account'}
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
              Delete Account
            </Button>
          )}
        </View>
      )}
    </BottomSheetModal>
  );
}
