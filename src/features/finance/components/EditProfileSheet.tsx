import { useState, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Text } from '@ui/components/Text';
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS } from '@lib/constants/finance';
import { useFinanceStore } from '../store/finance.store';
import type { EmploymentType } from '../types/finance.types';

interface EditProfileSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'tl', label: 'Tagalog' },
] as const;

export function EditProfileSheet({ sheetRef }: EditProfileSheetProps) {
  const profile = useFinanceStore((s) => s.profile);
  const updateProfile = useFinanceStore((s) => s.updateProfile);

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>(profile.employmentType ?? '');
  const [language, setLanguage] = useState(profile.language || 'en');

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setPhone(profile.phone);
    setEmploymentType(profile.employmentType ?? '');
    setLanguage(profile.language || 'en');
  }, [profile.name, profile.email, profile.phone, profile.employmentType, profile.language]);

  const handleSave = useCallback(() => {
    updateProfile({
      name: name.trim() || profile.name,
      email: email.trim() || profile.email,
      phone: phone.trim() || profile.phone,
      employmentType: employmentType || undefined,
      language,
    });
    sheetRef.current?.dismiss();
  }, [name, email, phone, employmentType, language, profile, updateProfile, sheetRef]);

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['80%']}>
      <Text variant="h3" className="mb-4">
        Personal Info
      </Text>

      <Input
        label="Full Name"
        placeholder="Juan Dela Cruz"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        className="mb-3"
      />

      <Input
        label="Email"
        placeholder="you@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        className="mb-3"
      />

      <Input
        label="Phone"
        placeholder="+63 917 xxx xxxx"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        className="mb-4"
      />

      {/* Employment Type */}
      <Text variant="label" className="mb-2">Employment Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerClassName="gap-2">
        <Pressable
          onPress={() => setEmploymentType('')}
          accessibilityRole="button"
          accessibilityLabel="Not set"
          accessibilityState={{ selected: !employmentType }}
          className={`rounded-full px-3.5 py-1.5 border ${
            !employmentType ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
          }`}
        >
          <Text variant="caption" className={`font-sans-medium ${!employmentType ? 'text-white' : ''}`}>
            Not set
          </Text>
        </Pressable>
        {EMPLOYMENT_TYPES.map((et) => (
          <Pressable
            key={et}
            onPress={() => setEmploymentType(et)}
            accessibilityRole="button"
            accessibilityLabel={EMPLOYMENT_TYPE_LABELS[et]}
            accessibilityState={{ selected: employmentType === et }}
            className={`rounded-full px-3.5 py-1.5 border ${
              employmentType === et ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-medium ${employmentType === et ? 'text-white' : ''}`}>
              {EMPLOYMENT_TYPE_LABELS[et]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Language */}
      <Text variant="label" className="mb-2">Language</Text>
      <View className="mb-6 flex-row gap-2">
        {LANGUAGES.map((lang) => (
          <Pressable
            key={lang.value}
            onPress={() => setLanguage(lang.value)}
            accessibilityRole="button"
            accessibilityLabel={lang.label}
            accessibilityState={{ selected: language === lang.value }}
            className={`flex-1 items-center rounded-xl py-2.5 border ${
              language === lang.value ? 'bg-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <Text variant="caption" className={`font-sans-semibold ${language === lang.value ? 'text-white' : ''}`}>
              {lang.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button onPress={handleSave} disabled={!name.trim()}>
        Save Changes
      </Button>
    </BottomSheetModal>
  );
}
