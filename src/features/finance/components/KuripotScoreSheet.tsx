import React, { useCallback, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomSheetModal as GorhomBottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { ProgressBar } from '@ui/components/ProgressBar';
import { useTheme } from '@theme/ThemeProvider';
import { useKuripotScore } from '../hooks/useKuripotScore';
import { useFinanceStore } from '../store/finance.store';

interface KuripotScoreSheetProps {
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
}

const FACTOR_CONFIG = [
  { key: 'savingsRate' as const, label: 'Savings Rate', icon: 'trending-up-outline' },
  { key: 'budgetAdherence' as const, label: 'Budget Adherence', icon: 'pie-chart-outline' },
  { key: 'emergencyFund' as const, label: 'Emergency Fund', icon: 'shield-outline' },
  { key: 'debtRatio' as const, label: 'Debt Ratio', icon: 'card-outline' },
] as const;

function getBarHex(value: number): string {
  if (value >= 70) return '#22c55e';
  if (value >= 40) return '#f59e0b';
  return '#ef4444';
}

export function KuripotScoreSheet({ sheetRef }: KuripotScoreSheetProps) {
  const { colors } = useTheme();
  const { kuripotScore, hasEnoughData } = useKuripotScore();
  const hideBalances = useFinanceStore((s) => s.hideBalances);
  const { bottom } = useSafeAreaInsets();
  const [sharing, setSharing] = useState(false);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    [],
  );

  const { score, grade, gradeColor, factors } = kuripotScore;

  const summary =
    score >= 80
      ? "You're managing your money excellently!"
      : score >= 65
        ? 'Solid financial habits -- a few areas to improve.'
        : score >= 50
          ? 'Room for improvement in your spending habits.'
          : 'Your finances need attention. Check the tips below.';

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const factorRows = FACTOR_CONFIG.map((f) => {
        const val = factors[f.key];
        const barColor = getBarHex(val);
        return `
          <div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:12px;color:#666">${f.label}</span>
              <span style="font-size:12px;font-weight:600;color:#333">${val}%</span>
            </div>
            <div style="background:#f0f0f0;border-radius:8px;height:8px;overflow:hidden">
              <div style="width:${val}%;height:100%;background:${barColor};border-radius:8px"></div>
            </div>
          </div>`;
      }).join('');

      const html = `
        <html><head><style>
          body { font-family: system-ui; padding: 32px; background: white; max-width: 400px; margin: 0 auto; }
          .card { background: white; border-radius: 16px; padding: 24px; }
          .header { text-align: center; margin-bottom: 20px; }
          .score { font-size: 64px; font-weight: 800; color: #9b1b3c; }
          .grade { display: inline-block; background: ${gradeColor}; color: white; padding: 4px 12px; border-radius: 8px; font-weight: 700; font-size: 18px; }
          .summary { color: #666; font-size: 13px; text-align: center; margin: 12px 0 20px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; }
          .brand { color: #9b1b3c; font-weight: 700; font-size: 14px; }
          .tagline { color: #999; font-size: 11px; }
        </style></head><body>
          <div class="card">
            <div class="header">
              <div class="score">${score}</div>
              <div><span class="grade">${grade}</span> <span style="color:#999;font-size:14px">/ 100</span></div>
              <div class="summary">${summary}</div>
            </div>
            ${factorRows}
            <div class="footer">
              <div class="brand">Neemo</div>
              <div class="tagline">Track your finances, the Filipino way</div>
            </div>
          </div>
        </body></html>
      `;

      const { uri } = await Print.printToFileAsync({ html, width: 400, height: 560 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Kuripot Score',
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not supported on this device.');
      }
    } catch {
      Alert.alert('Share failed', 'Could not generate your score card. Please try again.');
    } finally {
      setSharing(false);
    }
  }, [score, grade, gradeColor, factors, summary]);

  return (
    <GorhomBottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView className="px-6" style={{ paddingBottom: Math.max(bottom, 32) }}>
        {hasEnoughData ? (
          <>
            {/* Header */}
            <View className="items-center mb-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900 mb-2">
                <Icon name="shield-checkmark-outline" size={24} color={colors.primary} />
              </View>
              <Text variant="h2">Kuripot Score</Text>
            </View>

            {/* Score display */}
            <View className="items-center mb-4">
              <Text
                variant="h1"
                className="font-sans-bold text-primary-600 dark:text-primary-300"
                style={{ fontSize: 48, lineHeight: 52 }}
              >
                {hideBalances ? '••' : score}
              </Text>
              <View className="flex-row items-center mt-1" style={{ gap: 8 }}>
                <View
                  className="items-center justify-center rounded-lg px-2.5 py-1"
                  style={{ backgroundColor: gradeColor }}
                >
                  <Text variant="body" className="font-sans-bold" style={{ color: '#FFFFFF', fontSize: 16 }}>
                    {grade}
                  </Text>
                </View>
                <Text variant="caption" className="text-neutral-400">/ 100</Text>
              </View>
              <Text variant="caption" className="mt-2 text-neutral-500 text-center" style={{ fontSize: 12 }}>
                {summary}
              </Text>
            </View>

            {/* Factor breakdown */}
            <View style={{ gap: 12 }}>
              {FACTOR_CONFIG.map((factor) => {
                const value = factors[factor.key];
                const barColor: 'success' | 'warning' | 'danger' =
                  value >= 70 ? 'success' : value >= 40 ? 'warning' : 'danger';

                return (
                  <View key={factor.key}>
                    <View className="flex-row items-center mb-1" style={{ gap: 8 }}>
                      <Icon
                        name={factor.icon as React.ComponentProps<typeof Icon>['name']}
                        size={14}
                        color="#A69895"
                      />
                      <View className="flex-1 flex-row items-center justify-between">
                        <Text variant="caption" className="text-neutral-500" style={{ fontSize: 11 }}>
                          {factor.label}
                        </Text>
                        <Text variant="caption" className="text-neutral-700 dark:text-neutral-300" style={{ fontSize: 11 }}>
                          {value}%
                        </Text>
                      </View>
                    </View>
                    <ProgressBar
                      progress={value / 100}
                      height="sm"
                      useThresholdColors={false}
                      color={barColor}
                    />
                  </View>
                );
              })}
            </View>

            {/* Share button */}
            <Pressable
              onPress={handleShare}
              disabled={sharing}
              accessibilityRole="button"
              accessibilityLabel={sharing ? 'Generating score card' : 'Share Kuripot Score'}
              className="mt-5 flex-row items-center justify-center rounded-xl bg-primary-500 py-3 active:bg-primary-600"
              style={{ gap: 8, opacity: sharing ? 0.6 : 1 }}
            >
              <Icon name="share-social-outline" size={18} color="#FFFFFF" />
              <Text variant="body" className="font-sans-semibold" style={{ color: '#FFFFFF' }}>
                {sharing ? 'Generating...' : 'Share Score'}
              </Text>
            </Pressable>
          </>
        ) : (
          <View className="items-center py-8" style={{ minHeight: 180 }}>
            <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mb-3">
              <Icon name="shield-checkmark-outline" size={24} color={colors.textTertiary} />
            </View>
            <Text variant="body" className="font-sans-medium text-neutral-500 mb-1">Not enough data yet</Text>
            <Text variant="caption" className="text-neutral-400 text-center" style={{ maxWidth: 240 }}>
              Add income and expense transactions to see your Kuripot Score.
            </Text>
          </View>
        )}
      </BottomSheetView>
    </GorhomBottomSheetModal>
  );
}
