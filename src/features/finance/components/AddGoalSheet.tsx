import { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { Icon, type IconName } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';
import { CHALLENGE_LABELS, GOAL_RECOMMENDATIONS } from '@lib/constants/finance';
import type { ChallengeType, GoalRecommendation } from '@lib/constants/finance';
import { formatCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '../store/finance.store';
import type { Goal } from '../types/finance.types';

interface AddGoalSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  editItem?: Goal | null;
  onDismiss?: () => void;
}

const GOAL_ICONS = [
  { icon: 'shield-outline', color: '#10B981', label: 'Emergency' },
  { icon: 'car-outline', color: '#3B82F6', label: 'Vehicle' },
  { icon: 'airplane-outline', color: '#F59E0B', label: 'Travel' },
  { icon: 'home-outline', color: '#8B5CF6', label: 'Home' },
  { icon: 'school-outline', color: '#EC4899', label: 'Education' },
  { icon: 'gift-outline', color: '#F43F5E', label: 'Gift' },
  { icon: 'laptop-outline', color: '#0EA5E9', label: 'Tech' },
  { icon: 'heart-outline', color: '#EF4444', label: 'Health' },
] as const;

export function AddGoalSheet({ sheetRef, editItem, onDismiss }: AddGoalSheetProps) {
  const { colors } = useTheme();
  const addGoal = useFinanceStore((s) => s.addGoal);
  const updateGoal = useFinanceStore((s) => s.updateGoal);
  const deleteGoal = useFinanceStore((s) => s.deleteGoal);
  const accounts = useFinanceStore((s) => s.accounts);
  const profile = useFinanceStore((s) => s.profile);

  const recommendations = GOAL_RECOMMENDATIONS[profile.employmentType ?? 'employed'] ?? GOAL_RECOMMENDATIONS.employed!;

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetYear, setTargetYear] = useState('2027');
  const [targetMonth, setTargetMonth] = useState('06');
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [challengeType, setChallengeType] = useState<ChallengeType | ''>('');
  const [isLocked, setIsLocked] = useState(false);
  const [isEmergencyFund, setIsEmergencyFund] = useState(false);
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isEditing = !!editItem;

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setTargetAmount(String(editItem.targetAmount));
      setCurrentAmount(String(editItem.currentAmount));
      const [y, m] = editItem.targetDate.split('-');
      setTargetYear(y ?? '2027');
      setTargetMonth(m ?? '06');
      const iconIdx = GOAL_ICONS.findIndex((g) => g.icon === editItem.icon);
      setSelectedIcon(iconIdx >= 0 ? iconIdx : 0);
      setChallengeType(editItem.challengeType ?? '');
      setIsLocked(editItem.isLocked ?? false);
      setIsEmergencyFund(editItem.isEmergencyFund ?? false);
      setLinkedAccountId(editItem.linkedAccountId ?? '');
    }
  }, [editItem]);

  const reset = useCallback(() => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetYear('2027');
    setTargetMonth('06');
    setSelectedIcon(0);
    setChallengeType('');
    setIsLocked(false);
    setIsEmergencyFund(false);
    setLinkedAccountId('');
    setShowConfirmDelete(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleSave = useCallback(() => {
    const parsed = parseFloat(targetAmount);
    if (!parsed || !name.trim()) return;

    // Validate year (4-digit, reasonable range) and month (1-12)
    const yr = parseInt(targetYear, 10);
    const mo = parseInt(targetMonth, 10);
    if (isNaN(yr) || yr < 2020 || yr > 2100 || isNaN(mo) || mo < 1 || mo > 12) return;
    const safeDate = `${yr}-${String(mo).padStart(2, '0')}`;

    const chosen = GOAL_ICONS[selectedIcon] ?? GOAL_ICONS[0];

    if (isEditing && editItem) {
      updateGoal(editItem.id, {
        name: name.trim(),
        targetAmount: parsed,
        currentAmount: parseFloat(currentAmount) || editItem.currentAmount,
        targetDate: safeDate,
        icon: chosen!.icon,
        color: chosen!.color,
        challengeType: challengeType || undefined,
        isLocked,
        isEmergencyFund,
        linkedAccountId: linkedAccountId || undefined,
      });
    } else {
      addGoal({
        name: name.trim(),
        targetAmount: parsed,
        currentAmount: 0,
        targetDate: safeDate,
        icon: chosen!.icon,
        color: chosen!.color,
        challengeType: challengeType || undefined,
        isLocked,
        isEmergencyFund,
        linkedAccountId: linkedAccountId || undefined,
      });
    }
    reset();
    sheetRef.current?.dismiss();
  }, [name, targetAmount, currentAmount, targetYear, targetMonth, selectedIcon, challengeType, isLocked, isEmergencyFund, linkedAccountId, isEditing, editItem, addGoal, updateGoal, reset, sheetRef]);

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    deleteGoal(editItem.id);
    reset();
    sheetRef.current?.dismiss();
  }, [editItem, deleteGoal, reset, sheetRef]);

  const applyRecommendation = useCallback((rec: GoalRecommendation) => {
    setName(rec.name);
    setTargetAmount(String(rec.suggestedAmount));
    setIsEmergencyFund(!!rec.isEmergencyFund);
    const iconIdx = GOAL_ICONS.findIndex((g) => g.icon === rec.icon);
    if (iconIdx >= 0) setSelectedIcon(iconIdx);
  }, []);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['85%']} onDismiss={reset}>
      <Text variant="h3" className="mb-4">
        {isEditing ? 'Edit Goal' : 'Add Goal'}
      </Text>

      {/* Suggested Goals */}
      {!isEditing && recommendations.length > 0 && (
        <View className="mb-4">
          <Text variant="label" className="mb-2">Suggested for you</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            {recommendations.map((rec) => (
              <Pressable
                key={rec.name}
                onPress={() => applyRecommendation(rec)}
                accessibilityRole="button"
                accessibilityLabel={`Apply suggestion: ${rec.name}, ${formatCurrency(rec.suggestedAmount)}`}
                className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 active:bg-neutral-50 dark:active:bg-neutral-800"
                style={{ minWidth: 130 }}
              >
                <View
                  className="mb-1.5 h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${rec.color}20` }}
                >
                  <Icon name={rec.icon as IconName} size={16} color={rec.color} />
                </View>
                <Text variant="caption" className="font-sans-semibold" numberOfLines={1}>
                  {rec.name}
                </Text>
                <Text variant="caption" className="text-neutral-400" style={{ fontSize: 10 }}>
                  {formatCurrency(rec.suggestedAmount)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <Input
        label="Goal Name"
        placeholder="e.g. Emergency Fund"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        className="mb-3"
      />

      <Input
        label="Target Amount"
        placeholder="0.00"
        value={targetAmount}
        onChangeText={setTargetAmount}
        keyboardType="decimal-pad"
        className="mb-3"
      />

      {isEditing && (
        <Input
          label="Current Amount"
          placeholder="0.00"
          value={currentAmount}
          onChangeText={setCurrentAmount}
          keyboardType="decimal-pad"
          className="mb-3"
        />
      )}

      {/* Target date */}
      <View className="mb-4 flex-row gap-3">
        <Input
          label="Target Year"
          placeholder="2027"
          value={targetYear}
          onChangeText={setTargetYear}
          keyboardType="numeric"
          maxLength={4}
          className="flex-1"
        />
        <Input
          label="Target Month"
          placeholder="06"
          value={targetMonth}
          onChangeText={setTargetMonth}
          keyboardType="numeric"
          maxLength={2}
          className="flex-1"
        />
      </View>

      {/* Challenge type */}
      <Text variant="label" className="mb-2">Savings Challenge</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerClassName="gap-2"
      >
        <Pressable
          onPress={() => setChallengeType('')}
          accessibilityRole="button"
          accessibilityLabel={`Savings challenge: None${!challengeType ? ', selected' : ''}`}
          className={`rounded-full px-3.5 py-1.5 border ${
            !challengeType ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
          }`}
        >
          <Text variant="caption" className={`font-sans-medium ${!challengeType ? 'text-white' : ''}`}>
            None
          </Text>
        </Pressable>
        {(Object.keys(CHALLENGE_LABELS) as ChallengeType[]).map((ct) => (
          <Pressable
            key={ct}
            onPress={() => setChallengeType(ct)}
            accessibilityRole="button"
            accessibilityLabel={`Savings challenge: ${CHALLENGE_LABELS[ct]}${challengeType === ct ? ', selected' : ''}`}
            className={`rounded-full px-3.5 py-1.5 border ${
              challengeType === ct ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-medium ${challengeType === ct ? 'text-white' : ''}`}>
              {CHALLENGE_LABELS[ct]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Lock savings toggle */}
      <Pressable
        onPress={() => setIsLocked(!isLocked)}
        accessibilityRole="button"
        accessibilityLabel={`Lock savings${isLocked ? ', enabled' : ', disabled'}`}
        className="mb-4 flex-row items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-700"
      >
        <View className="flex-row items-center gap-2">
          <Icon name="lock-closed-outline" size={18} color={colors.primary} />
          <Text variant="body" className="font-sans-medium">Lock savings</Text>
        </View>
        <Icon name={isLocked ? 'checkbox' : 'square-outline'} size={20} color={colors.primary} />
      </Pressable>

      {/* Emergency fund toggle */}
      <Pressable
        onPress={() => setIsEmergencyFund(!isEmergencyFund)}
        accessibilityRole="button"
        accessibilityLabel={`Emergency Fund${isEmergencyFund ? ', enabled' : ', disabled'}`}
        className="mb-4 flex-row items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-700"
      >
        <View className="flex-row items-center gap-2">
          <Icon name="shield-checkmark-outline" size={18} color={colors.success} />
          <Text variant="body" className="font-sans-medium">Emergency Fund</Text>
        </View>
        <Icon name={isEmergencyFund ? 'checkbox' : 'square-outline'} size={20} color={colors.success} />
      </Pressable>

      {/* Linked account */}
      <Text variant="label" className="mb-2">Linked Account</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerClassName="gap-2"
      >
        <Pressable
          onPress={() => setLinkedAccountId('')}
          accessibilityRole="button"
          accessibilityLabel={`Linked account: None${!linkedAccountId ? ', selected' : ''}`}
          className={`rounded-full px-3.5 py-1.5 border ${
            !linkedAccountId ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
          }`}
        >
          <Text variant="caption" className={`font-sans-medium ${!linkedAccountId ? 'text-white' : ''}`}>
            None
          </Text>
        </Pressable>
        {accounts.map((acc) => (
          <Pressable
            key={acc.id}
            onPress={() => setLinkedAccountId(acc.id)}
            accessibilityRole="button"
            accessibilityLabel={`Linked account: ${acc.name}${linkedAccountId === acc.id ? ', selected' : ''}`}
            className={`rounded-full px-3.5 py-1.5 border ${
              linkedAccountId === acc.id ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-medium ${linkedAccountId === acc.id ? 'text-white' : ''}`}>
              {acc.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Icon selection */}
      <Text variant="label" className="mb-2">
        Icon
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-6"
        contentContainerClassName="gap-3"
      >
        {GOAL_ICONS.map((item, idx) => (
          <Pressable
            key={item.icon}
            onPress={() => setSelectedIcon(idx)}
            accessibilityRole="button"
            accessibilityLabel={`Icon: ${item.label}${selectedIcon === idx ? ', selected' : ''}`}
            className={`items-center rounded-xl p-2.5 border ${
              selectedIcon === idx
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <View
              className="mb-1 h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: `${item.color}20` }}
            >
              <Icon name={item.icon as IconName} size={20} color={item.color} />
            </View>
            <Text variant="caption" className="text-xs">
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Button onPress={handleSave} disabled={!name.trim() || !parseFloat(targetAmount)}>
        {isEditing ? 'Save Changes' : 'Save Goal'}
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
              Delete Goal
            </Button>
          )}
        </View>
      )}
    </BottomSheetModal>
  );
}
