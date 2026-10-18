/**
 * ScreenContainer Component
 *
 * Standard screen wrapper providing SafeAreaView + ScrollView + padding.
 * Used as the root container for most screens in the app.
 */

import React from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeProvider';

export interface ScreenContainerProps {
  /** Screen content */
  children: React.ReactNode;
  /** Disable scrolling (useful for screens with their own scroll containers) */
  scrollable?: boolean;
  /** Remove horizontal padding */
  noPadding?: boolean;
  /** SafeAreaView edges to respect */
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
  /** Additional NativeWind classes for the outer SafeAreaView */
  className?: string;
  /** Additional NativeWind classes for the scroll content container */
  contentClassName?: string;
  /** Pull-to-refresh handler — when provided, enables RefreshControl */
  onRefresh?: () => void;
  /** Whether refresh is in progress */
  refreshing?: boolean;
}

export function ScreenContainer({
  children,
  scrollable = true,
  noPadding = false,
  edges = ['top', 'bottom', 'left', 'right'],
  className = '',
  contentClassName = '',
  onRefresh,
  refreshing = false,
}: ScreenContainerProps) {
  const { colors } = useTheme();
  const paddingClass = noPadding ? '' : 'px-4';
  // When top edge is excluded (screen has its own header), add top padding
  // so content doesn't sit flush against the header background
  const topPaddingClass = edges.includes('top') ? '' : 'pt-4';
  // When bottom edge is excluded (modal screens), add extra bottom padding
  // so content doesn't overlap the home indicator / safe area
  const bottomPaddingClass = edges.includes('bottom') ? 'pb-8' : 'pb-24';

  if (scrollable) {
    return (
      <SafeAreaView
        className={`flex-1 bg-surface-secondary dark:bg-surface-dark ${className}`}
        edges={edges}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName={`${bottomPaddingClass} ${topPaddingClass} ${paddingClass} ${contentClassName}`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 bg-surface-secondary dark:bg-surface-dark ${className}`}
      edges={edges}
    >
      <View className={`flex-1 ${topPaddingClass} ${paddingClass} ${contentClassName}`}>
        {children}
      </View>
    </SafeAreaView>
  );
}
