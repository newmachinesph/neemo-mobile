/**
 * BottomSheetModal Component
 *
 * Wrapper around @gorhom/bottom-sheet BottomSheetModal with Neemo's default styling.
 * Provides a themed backdrop, handle indicator, and consistent padding.
 */

import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import GorhomBottomSheet, {
  BottomSheetModal as GorhomBottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeProvider';

export interface BottomSheetModalProps {
  /** Ref to control the bottom sheet modal imperatively */
  sheetRef: React.RefObject<GorhomBottomSheetModal | null>;
  /** Snap points as percentage or pixel values (e.g., ['50%', '90%']) */
  snapPoints?: Array<string | number>;
  /** Content to render inside the bottom sheet */
  children: React.ReactNode;
  /** Called when the sheet is dismissed */
  onDismiss?: () => void;
  /** Enable dynamic sizing (ignores snapPoints when true) */
  enableDynamicSizing?: boolean;
  /** Additional NativeWind classes for the content container */
  className?: string;
}

export function BottomSheetModal({
  sheetRef,
  snapPoints: snapPointsProp,
  children,
  onDismiss,
  enableDynamicSizing = false,
  className = '',
}: BottomSheetModalProps) {
  const { colors, isDark } = useTheme();
  const { bottom } = useSafeAreaInsets();

  const snapPoints = useMemo(
    () => snapPointsProp ?? ['50%', '90%'],
    [snapPointsProp],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  return (
    <GorhomBottomSheetModal
      ref={sheetRef}
      snapPoints={enableDynamicSizing ? undefined : snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      onDismiss={onDismiss}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.textTertiary }}
      backgroundStyle={{
        backgroundColor: isDark ? colors.surface : colors.surface,
      }}
    >
      <BottomSheetScrollView>
        <View className={`px-4 ${className}`} style={{ paddingBottom: Math.max(bottom, 16) + 16 }}>{children}</View>
      </BottomSheetScrollView>
    </GorhomBottomSheetModal>
  );
}

/**
 * Re-export the GorhomBottomSheetModal type for ref typing in consuming components.
 */
export type { GorhomBottomSheetModal as BottomSheetModalRef };
