import { View } from 'react-native';
import { BottomSheetModal, type BottomSheetModalRef } from '@ui/components/BottomSheetModal';
import { Text } from '@ui/components/Text';
import { Button } from '@ui/components/Button';
import { Badge } from '@ui/components/Badge';
import { Divider } from '@ui/components/Divider';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency, maskedCurrency } from '@lib/utils/currency';
import { useFinanceStore } from '../store/finance.store';
import type { RecurringBill } from '../types/finance.types';

interface BillDetailSheetProps {
  sheetRef: React.RefObject<BottomSheetModalRef | null>;
  bill: RecurringBill | null;
}

export function BillDetailSheet({ sheetRef, bill }: BillDetailSheetProps) {
  const { colors } = useTheme();
  const markBillPaid = useFinanceStore((s) => s.markBillPaid);
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const amt = (v: number) => hideBalances ? maskedCurrency() : formatCurrency(v);

  if (!bill) return null;

  const isPaidThisMonth = (() => {
    if (!bill.lastPaidDate) return false;
    const paid = new Date(bill.lastPaidDate);
    const now = new Date();
    return paid.getMonth() === now.getMonth() && paid.getFullYear() === now.getFullYear();
  })();

  return (
    <BottomSheetModal sheetRef={sheetRef} snapPoints={['60%']}>
      <View className="mb-4 flex-row items-center justify-between">
        <Text variant="h3">{bill.name}</Text>
        <Badge variant={bill.isActive ? 'success' : 'neutral'}>
          {bill.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </View>

      <View className="mb-4 flex-row justify-between">
        <View>
          <Text variant="caption" className="text-neutral-500">Amount</Text>
          <Text variant="h3">{amt(bill.amount)}</Text>
        </View>
        <View className="items-end">
          <Text variant="caption" className="text-neutral-500">Due Day</Text>
          <Text variant="body" className="font-sans-semibold">Day {bill.dueDay}</Text>
        </View>
      </View>

      <Divider className="mx-0 mb-4" />

      <Text variant="label" className="mb-2">Payment History</Text>
      {(!bill.paymentHistory || bill.paymentHistory.length === 0) ? (
        <Text variant="caption" className="py-4 text-center text-neutral-400">
          No payment history yet
        </Text>
      ) : (
        <View className="gap-2 mb-4">
          {bill.paymentHistory.map((payment) => (
            <View key={`${payment.date}-${payment.amount}`} className="flex-row items-center justify-between py-1.5">
              <View>
                <Text variant="body" className="font-sans-medium">
                  {new Date(payment.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
                {payment.transactionId && (
                  <Text variant="caption" className="text-neutral-400" style={{ fontSize: 10 }}>
                    Linked to transaction
                  </Text>
                )}
              </View>
              <Text variant="body" className="font-sans-semibold">
                {amt(payment.amount)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!isPaidThisMonth && bill.isActive && (
        <Button
          onPress={() => {
            markBillPaid(bill.id);
            sheetRef.current?.dismiss();
          }}
        >
          Mark as Paid
        </Button>
      )}

      {isPaidThisMonth && (
        <View className="items-center py-2">
          <Text variant="caption" style={{ color: colors.success }} className="font-sans-semibold">
            Paid this month
          </Text>
        </View>
      )}
    </BottomSheetModal>
  );
}
