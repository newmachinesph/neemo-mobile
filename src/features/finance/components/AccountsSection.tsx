import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SectionHeader } from '@ui/components/SectionHeader';
import { AccountCard } from './AccountCard';
import { useFinanceStore } from '../store/finance.store';

export function AccountsSection() {
  const router = useRouter();
  const accounts = useFinanceStore((s) => s.accounts);

  if (accounts.length === 0) return null;

  return (
    <>
      <SectionHeader title="Accounts" actionLabel="See all" onAction={() => router.push('/(app)/finance')} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-4 mb-4"
        contentContainerClassName="px-4 py-1"
      >
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} onPress={() => router.push('/(app)/finance')} />
        ))}
      </ScrollView>
    </>
  );
}
