/**
 * Government Contributions Calculator
 *
 * Built-in tool for computing SSS, PhilHealth, Pag-IBIG contributions
 * and MP2 compound interest projections based on monthly salary.
 * Uses 2024 contribution tables.
 */

import { useState, useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { ScreenContainer } from '@ui/components/ScreenContainer';
import { Card } from '@ui/components/Card';
import { Text } from '@ui/components/Text';
import { Input } from '@ui/components/Input';
import { Icon } from '@ui/components/Icon';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { formatCurrency } from '@lib/utils/currency';
import { hapticLight } from '@lib/utils/haptics';
import { GovtContributionGrid } from '@features/finance/components/GovtContributionGrid';
import { GovtContributionSummary } from '@features/finance/components/GovtContributionSummary';
import { useTheme } from '@theme/ThemeProvider';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type Tab = 'sss' | 'philhealth' | 'pagibig' | 'mp2' | 'tracker';

const TABS: { key: Tab; label: string }[] = [
  { key: 'sss', label: 'SSS' },
  { key: 'philhealth', label: 'PhilHealth' },
  { key: 'pagibig', label: 'Pag-IBIG' },
  { key: 'mp2', label: 'MP2' },
  { key: 'tracker', label: 'Tracker' },
];

// SSS 2024 contribution brackets: [minSalary, maxSalary, employeeShare, employerShare]
const SSS_BRACKETS: [number, number, number, number][] = [
  [0, 4250, 180, 380],
  [4250, 4750, 202.5, 427.5],
  [4750, 5250, 225, 475],
  [5250, 5750, 247.5, 522.5],
  [5750, 6250, 270, 570],
  [6250, 6750, 292.5, 617.5],
  [6750, 7250, 315, 665],
  [7250, 7750, 337.5, 712.5],
  [7750, 8250, 360, 760],
  [8250, 8750, 382.5, 807.5],
  [8750, 9250, 405, 855],
  [9250, 9750, 427.5, 902.5],
  [9750, 10250, 450, 950],
  [10250, 10750, 472.5, 997.5],
  [10750, 11250, 495, 1045],
  [11250, 11750, 517.5, 1092.5],
  [11750, 12250, 540, 1140],
  [12250, 12750, 562.5, 1187.5],
  [12750, 13250, 585, 1235],
  [13250, 13750, 607.5, 1282.5],
  [13750, 14250, 630, 1330],
  [14250, 14750, 652.5, 1377.5],
  [14750, 15250, 675, 1425],
  [15250, 15750, 697.5, 1472.5],
  [15750, 16250, 720, 1520],
  [16250, 16750, 742.5, 1567.5],
  [16750, 17250, 765, 1615],
  [17250, 17750, 787.5, 1662.5],
  [17750, 18250, 810, 1710],
  [18250, 18750, 832.5, 1757.5],
  [18750, 19250, 855, 1805],
  [19250, 19750, 877.5, 1852.5],
  [19750, 20250, 900, 1900],
  [20250, 24750, 1125, 2375],
  [24750, 29750, 1350, 2850],
  [29750, Infinity, 1575, 3325],
];

// ---------------------------------------------------------------------------
// Calculation helpers
// ---------------------------------------------------------------------------

function calcSSS(salary: number) {
  for (const [min, max, ee, er] of SSS_BRACKETS) {
    if (salary >= min && salary < max) {
      return { employee: ee, employer: er, total: ee + er };
    }
  }
  const last = SSS_BRACKETS[SSS_BRACKETS.length - 1]!;
  return { employee: last[2], employer: last[3], total: last[2] + last[3] };
}

function calcPhilHealth(salary: number) {
  const rate = 0.05;
  const base = Math.max(10_000, Math.min(salary, 100_000));
  const premium = base * rate;
  const half = premium / 2;
  return { employee: half, employer: half, total: premium };
}

function calcPagIBIG(salary: number) {
  const empRate = salary <= 1500 ? 0.01 : 0.02;
  const base = Math.min(salary, 10_000);
  const employee = base * empRate;
  const employer = base * 0.02;
  return { employee, employer, total: employee + employer, empRate };
}

function calcMP2(monthly: number, years: number) {
  const monthlyRate = 0.06 / 12;
  const months = years * 12;
  const totalContrib = monthly * months;
  let fv = 0;
  for (let i = 0; i < months; i++) {
    fv = (fv + monthly) * (1 + monthlyRate);
  }
  return { totalContrib, futureValue: fv, earnings: fv - totalContrib };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text variant="body" className="text-neutral-600 dark:text-neutral-400">{label}</Text>
      <Text variant="body" className={`font-sans-bold ${highlight ? 'text-primary-600 text-base' : ''}`}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function GovtCalculatorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('sss');
  const [salary, setSalary] = useState('');
  const [mp2Monthly, setMp2Monthly] = useState('500');
  const [mp2Years, setMp2Years] = useState('5');

  const salaryNum = parseFloat(salary) || 0;

  const sss = useMemo(() => calcSSS(salaryNum), [salaryNum]);
  const phil = useMemo(() => calcPhilHealth(salaryNum), [salaryNum]);
  const pagibig = useMemo(() => calcPagIBIG(salaryNum), [salaryNum]);
  const mp2 = useMemo(
    () => calcMP2(parseFloat(mp2Monthly) || 0, parseInt(mp2Years, 10) || 1),
    [mp2Monthly, mp2Years],
  );

  const totalDeductions = useMemo(
    () => sss.employee + phil.employee + pagibig.employee,
    [sss, phil, pagibig],
  );

  const headerLeft = useCallback(() => null, []);
  const headerRight = useCallback(() => (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      className="mr-2"
      accessibilityRole="button"
      accessibilityLabel="Close government contributions calculator"
    >
      <Icon name="close" size={24} color={colors.text} />
    </Pressable>
  ), [colors.text, router]);
  const headerTitleStyle = useMemo(() => ({ fontFamily: 'Inter-SemiBold' as const, fontSize: 17 }), []);
  const headerStyle = useMemo(() => ({ backgroundColor: colors.background }), [colors.background]);
  const screenOptions = useMemo(() => ({
    headerShown: true,
    title: 'Govt Contributions',
    headerTitleStyle,
    headerShadowVisible: false,
    headerStyle,
    headerTintColor: colors.text,
    headerLeft,
    headerRight,
  }), [headerTitleStyle, headerLeft, headerRight, headerStyle, colors.text]);

  return (
    <>
      <Stack.Screen options={screenOptions} />

      <ScreenContainer edges={['bottom', 'left', 'right']}>
        {/* Salary Input */}
        <Input
          label="Monthly Salary"
          placeholder="e.g. 25,000"
          value={salary}
          onChangeText={setSalary}
          keyboardType="decimal-pad"
          className="mb-4"
        />

        {/* Tab Pills */}
        <StaggeredFadeIn index={0}>
          <View className="mb-4 flex-row gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
            {TABS.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => { hapticLight(); setTab(t.key); }}
                className={`flex-1 items-center rounded-lg py-2.5 ${
                  tab === t.key ? 'bg-primary-600' : ''
                }`}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === t.key }}
                accessibilityLabel={t.label}
              >
                <Text
                  variant="caption"
                  className={`font-sans-semibold ${tab === t.key ? 'text-white' : ''}`}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </StaggeredFadeIn>

        {/* Results */}
        <StaggeredFadeIn index={1}>
          {tab === 'sss' && (
            <Card>
              <Text variant="label" className="mb-3" style={{ color: colors.primary }}>
                SSS Contribution
              </Text>
              {salaryNum > 0 ? (
                <>
                  <ResultRow label="Employee Share" value={formatCurrency(sss.employee)} />
                  <ResultRow label="Employer Share" value={formatCurrency(sss.employer)} />
                  <View className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />
                  <ResultRow label="Total Monthly" value={formatCurrency(sss.total)} highlight />
                  <Text variant="caption" className="mt-2 text-neutral-400">
                    Based on 2024–2025 SSS contribution table. Employee share is deducted from salary.
                  </Text>
                </>
              ) : (
                <Text variant="caption" className="py-4 text-center text-neutral-400">
                  Enter your monthly salary above
                </Text>
              )}
            </Card>
          )}

          {tab === 'philhealth' && (
            <Card>
              <Text variant="label" className="mb-3" style={{ color: colors.primary }}>
                PhilHealth Contribution
              </Text>
              {salaryNum > 0 ? (
                <>
                  <ResultRow label="Premium Rate" value="5%" />
                  <ResultRow label="Employee Share" value={formatCurrency(phil.employee)} />
                  <ResultRow label="Employer Share" value={formatCurrency(phil.employer)} />
                  <View className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />
                  <ResultRow label="Total Premium" value={formatCurrency(phil.total)} highlight />
                  <Text variant="caption" className="mt-2 text-neutral-400">
                    Floor: {formatCurrency(10_000)} | Ceiling: {formatCurrency(100_000)}. Premium is split equally.
                  </Text>
                </>
              ) : (
                <Text variant="caption" className="py-4 text-center text-neutral-400">
                  Enter your monthly salary above
                </Text>
              )}
            </Card>
          )}

          {tab === 'pagibig' && (
            <Card>
              <Text variant="label" className="mb-3" style={{ color: colors.primary }}>
                Pag-IBIG Contribution
              </Text>
              {salaryNum > 0 ? (
                <>
                  <ResultRow label="Employee Rate" value={salaryNum <= 1500 ? '1%' : '2%'} />
                  <ResultRow label="Employee Share" value={formatCurrency(pagibig.employee)} />
                  <ResultRow label="Employer Share (2%)" value={formatCurrency(pagibig.employer)} />
                  <View className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />
                  <ResultRow label="Total Monthly" value={formatCurrency(pagibig.total)} highlight />
                  <Text variant="caption" className="mt-2 text-neutral-400">
                    Ceiling: {formatCurrency(10_000)}. Employer always contributes 2%.
                  </Text>
                </>
              ) : (
                <Text variant="caption" className="py-4 text-center text-neutral-400">
                  Enter your monthly salary above
                </Text>
              )}
            </Card>
          )}

          {tab === 'mp2' && (
            <Card>
              <Text variant="label" className="mb-3" style={{ color: colors.primary }}>
                MP2 Savings Calculator
              </Text>
              <View className="mb-3 flex-row gap-3">
                <Input
                  label="Monthly Contribution"
                  placeholder="500"
                  value={mp2Monthly}
                  onChangeText={setMp2Monthly}
                  keyboardType="decimal-pad"
                  className="flex-1"
                />
                <Input
                  label="Years"
                  placeholder="5"
                  value={mp2Years}
                  onChangeText={setMp2Years}
                  keyboardType="numeric"
                  className="flex-1"
                />
              </View>
              <ResultRow label="Total Contributions" value={formatCurrency(mp2.totalContrib)} />
              <ResultRow label="Estimated Earnings" value={formatCurrency(mp2.earnings)} />
              <View className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />
              <ResultRow label="Future Value" value={formatCurrency(mp2.futureValue)} highlight />
              <Text variant="caption" className="mt-2 text-neutral-400">
                Estimated at ~6% annual dividend rate. Actual returns may vary.
              </Text>
            </Card>
          )}

          {tab === 'tracker' && (
            <>
              <GovtContributionSummary year={new Date().getFullYear()} />
              <GovtContributionGrid type="sss" year={new Date().getFullYear()} />
              <GovtContributionGrid type="philhealth" year={new Date().getFullYear()} />
              <GovtContributionGrid type="pagibig" year={new Date().getFullYear()} />
            </>
          )}
        </StaggeredFadeIn>

        {/* Total Deductions Summary */}
        {salaryNum > 0 && tab !== 'mp2' && tab !== 'tracker' && (
          <StaggeredFadeIn index={2}>
            <Card className="mt-3">
              <Text variant="label" className="mb-3">Total Monthly Deductions</Text>
              <ResultRow label="SSS" value={formatCurrency(sss.employee)} />
              <ResultRow label="PhilHealth" value={formatCurrency(phil.employee)} />
              <ResultRow label="Pag-IBIG" value={formatCurrency(pagibig.employee)} />
              <View className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />
              <ResultRow label="Total Deductions" value={formatCurrency(totalDeductions)} highlight />
              <ResultRow label="Net After Deductions" value={formatCurrency(salaryNum - totalDeductions)} />
            </Card>
          </StaggeredFadeIn>
        )}
      </ScreenContainer>
    </>
  );
}
