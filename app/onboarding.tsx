import { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  Pressable,
  Dimensions,
  Image,
  TextInput,
  ScrollView,
  useColorScheme,
  type ListRenderItemInfo,
  Text as RNText,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  type SharedValue,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  interpolateColor,
  Extrapolation,
} from 'react-native-reanimated';
import { Icon, type IconProps } from '@ui/components/Icon';
import { hapticLight, hapticSuccess } from '@lib/utils/haptics';
import { useTheme } from '@theme/ThemeProvider';
import { palette } from '@theme/colors';
import { appStorage } from '@lib/storage/mmkv';
import { STORAGE_KEYS } from '@lib/constants/app';
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  ACCOUNT_TYPE_LABELS,
  type AccountType,
} from '@lib/constants/finance';
import { useFinanceStore } from '@/src/features/finance';
import type { EmploymentType } from '@/src/features/finance/types/finance.types';

const { width } = Dimensions.get('window');
const MAROON = palette.primary[600];
const ILLUSTRATION_HEIGHT = 260;

// ── Slide data ──────────────────────────────────────────────────────────────

interface Slide {
  id: string;
  icon: IconProps['name'];
  placeholderBg: string;
  placeholderBgDark: string;
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  {
    id: '1',
    icon: 'calendar-outline',
    placeholderBg: '#FFF0F3',
    placeholderBgDark: '#3B1219',
    title: '"Kailan?"\nEvery Goal Gets a Date',
    subtitle:
      'Hindi ka bad sa pera. Wala ka lang tamang tool. Neemo gives every financial goal a specific month and year.',
  },
  {
    id: '2',
    icon: 'timer-outline',
    placeholderBg: '#F0F9FF',
    placeholderBgDark: '#0C2333',
    title: '30 Seconds.\nOnce a Month.',
    subtitle:
      'Walang resibo. Walang daily logging. I-update lang balances mo at Neemo ang bahala sa calculations.',
  },
  {
    id: '3',
    icon: 'swap-horizontal-outline',
    placeholderBg: '#F0FDF4',
    placeholderBgDark: '#052e16',
    title: 'What If?\nTest Any Decision',
    subtitle:
      'Motorcycle? Career change? See exactly how it affects your goals bago ka mag-commit.',
  },
  {
    id: '4',
    icon: 'flag-outline',
    placeholderBg: '#FFFBEB',
    placeholderBgDark: '#2D1F00',
    title: 'Gawa Para\nsa Filipino',
    subtitle:
      'Paluwagan, 13th month, SSS, PhilHealth, Pag-IBIG — tools for how Filipinos actually manage money.',
  },
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Slide>);

// ── Wizard data ─────────────────────────────────────────────────────────────

const EMPLOYMENT_ICONS: Record<string, IconProps['name']> = {
  employed: 'briefcase-outline',
  freelancer: 'laptop-outline',
  ofw: 'airplane-outline',
  business_owner: 'storefront-outline',
  homemaker: 'home-outline',
  student: 'school-outline',
};

const ACCOUNT_TYPE_OPTIONS: { type: AccountType; icon: IconProps['name'] }[] = [
  { type: 'savings', icon: 'wallet-outline' },
  { type: 'checking', icon: 'card-outline' },
  { type: 'cash', icon: 'cash-outline' },
  { type: 'e_wallet', icon: 'phone-portrait-outline' },
  { type: 'digital_bank', icon: 'globe-outline' },
];

// ── Illustration placeholder ────────────────────────────────────────────────

function IllustrationPlaceholder({
  icon,
  bgColor,
}: {
  icon: IconProps['name'];
  bgColor: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: ILLUSTRATION_HEIGHT,
        marginHorizontal: 24,
        borderRadius: 24,
        backgroundColor: bgColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 180,
          height: 200,
          borderRadius: 20,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <View style={{ width: 140, marginBottom: 16 }}>
          <View
            style={{
              height: 8,
              width: 80,
              borderRadius: 4,
              backgroundColor: MAROON,
              marginBottom: 8,
            }}
          />
          <View
            style={{
              height: 6,
              width: 120,
              borderRadius: 3,
              backgroundColor: colors.border,
            }}
          />
        </View>

        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: bgColor,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Icon name={icon} size={32} color={MAROON} />
        </View>

        <View style={{ width: 140, gap: 6 }}>
          <View
            style={{ height: 6, width: 100, borderRadius: 3, backgroundColor: colors.surfaceTertiary }}
          />
          <View
            style={{ height: 6, width: 60, borderRadius: 3, backgroundColor: colors.surfaceTertiary }}
          />
        </View>
      </View>

      <View
        style={{
          position: 'absolute',
          top: 40,
          right: 40,
          width: 64,
          height: 48,
          borderRadius: 12,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View style={{ width: 32, height: 6, borderRadius: 3, backgroundColor: MAROON }} />
        <View
          style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: colors.border, marginTop: 4 }}
        />
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 50,
          left: 36,
          width: 56,
          height: 40,
          borderRadius: 10,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View style={{ width: 28, height: 5, borderRadius: 3, backgroundColor: colors.accent }} />
        <View
          style={{ width: 20, height: 4, borderRadius: 2, backgroundColor: colors.border, marginTop: 3 }}
        />
      </View>
    </View>
  );
}

// ── Animated slide ──────────────────────────────────────────────────────────

function SlideItem({
  item,
  index,
  scrollX,
  isDark,
}: {
  item: Slide;
  index: number;
  scrollX: SharedValue<number>;
  isDark: boolean;
}) {
  const { colors } = useTheme();

  const illustrationStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    const scale = interpolate(scrollX.value, inputRange, [0.85, 1, 0.85], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });

  const textStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    const translateY = interpolate(scrollX.value, inputRange, [20, 0, 20], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
    return { transform: [{ translateY }], opacity };
  });

  return (
    <View style={{ width }} className="flex-1">
      <Animated.View style={illustrationStyle} className="mt-4">
        <IllustrationPlaceholder
          icon={item.icon}
          bgColor={isDark ? item.placeholderBgDark : item.placeholderBg}
        />
      </Animated.View>

      <Animated.View style={textStyle} className="mt-8 items-center px-10">
        <RNText
          style={{
            fontFamily: 'Inter-Bold',
            fontSize: 28,
            lineHeight: 36,
            letterSpacing: -0.5,
            color: colors.text,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          {item.title}
        </RNText>
        <RNText
          style={{
            fontFamily: 'Inter-Regular',
            fontSize: 15,
            lineHeight: 22,
            color: colors.textTertiary,
            textAlign: 'center',
            maxWidth: 280,
          }}
        >
          {item.subtitle}
        </RNText>
      </Animated.View>
    </View>
  );
}

// ── Dot indicator ───────────────────────────────────────────────────────────

function Dot({
  index,
  scrollX,
}: {
  index: number;
  scrollX: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    const size = interpolate(scrollX.value, inputRange, [8, 10, 8], Extrapolation.CLAMP);
    const backgroundColor = interpolateColor(scrollX.value, inputRange, [
      '#D1D5DB',
      MAROON,
      '#D1D5DB',
    ]);
    return { width: size, height: size, backgroundColor };
  });

  return <Animated.View style={[{ borderRadius: 5 }, animatedStyle]} />;
}

function Dots({ scrollX }: { scrollX: SharedValue<number> }) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {slides.map((slide, i) => (
        <Dot key={slide.id} index={i} scrollX={scrollX} />
      ))}
    </View>
  );
}

// ── Wizard step indicator ───────────────────────────────────────────────────

function WizardSteps({ current, total }: { current: number; total: number }) {
  const { colors } = useTheme();
  return (
    <View className="mb-6 flex-row items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? MAROON : i < current ? colors.accent : colors.border,
          }}
        />
      ))}
    </View>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const scrollX = useSharedValue(0);
  const currentIndex = useRef(0);
  const userTouched = useRef(false);
  const isDark = useColorScheme() === 'dark';
  const { colors } = useTheme();

  // Wizard state: 0 = slides, 1 = nickname, 2 = employment, 3 = account
  const [wizardStep, setWizardStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('savings');
  const [accountBalance, setAccountBalance] = useState('');


  const updateProfile = useFinanceStore((s) => s.updateProfile);
  const addAccount = useFinanceStore((s) => s.addAccount);

  // Auto-play: advance every 3s, loop back to first slide
  useEffect(() => {
    if (wizardStep > 0) return;

    const timer = setInterval(() => {
      if (userTouched.current) return;

      const next = (currentIndex.current + 1) % slides.length;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      currentIndex.current = next;
    }, 3000);

    return () => clearInterval(timer);
  }, [wizardStep]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  function completeOnboarding() {
    // Save nickname + employment type
    const profileUpdate: Partial<{ name: string; employmentType: EmploymentType }> = {};
    if (nickname.trim()) profileUpdate.name = nickname.trim();
    if (employmentType) profileUpdate.employmentType = employmentType as EmploymentType;
    if (Object.keys(profileUpdate).length > 0) updateProfile(profileUpdate);

    // Create first account if name provided
    if (accountName.trim()) {
      addAccount({
        name: accountName.trim(),
        type: accountType,
        balance: Math.max(0, parseFloat(accountBalance) || 0),
        currency: 'PHP',
      });
    }

    appStorage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, true);

    router.replace('/(app)/home');
  }

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Slide>) => (
      <SlideItem item={item} index={index} scrollX={scrollX} isDark={isDark} />
    ),
    [scrollX, isDark],
  );

  // ── Wizard screens ──

  if (wizardStep === 1) {
    return (
      <View
        className="flex-1"
        style={{ backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="flex-1 px-6 pt-8">
          <WizardSteps current={0} total={3} />
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Icon name="person-outline" size={36} color={MAROON} />
            </View>
            <RNText
              style={{
                fontFamily: 'Inter-Bold',
                fontSize: 26,
                lineHeight: 34,
                letterSpacing: -0.5,
                color: colors.text,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Ano tawag sayo?
            </RNText>
            <RNText
              style={{
                fontFamily: 'Inter-Regular',
                fontSize: 15,
                color: colors.textTertiary,
                textAlign: 'center',
              }}
            >
              What should we call you?
            </RNText>
          </View>

          <TextInput
            value={nickname}
            onChangeText={setNickname}
            placeholder="e.g. Juan, Mama, Boss"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            maxLength={20}
            style={{
              fontFamily: 'Inter-SemiBold',
              fontSize: 24,
              textAlign: 'center',
              borderBottomWidth: 2,
              borderBottomColor: nickname.trim() ? MAROON : colors.border,
              paddingVertical: 12,
              marginHorizontal: 40,
              color: colors.text,
            }}
          />
        </View>

        <View className="flex-row items-center justify-between px-6 pb-8">
          <Pressable onPress={() => { hapticLight(); setWizardStep(0); }} accessibilityRole="button" accessibilityLabel="Back">
            <RNText style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.textTertiary }}>
              Back
            </RNText>
          </Pressable>
          <Pressable
            onPress={() => { hapticLight(); setWizardStep(2); }}
            accessibilityRole="button"
            accessibilityLabel="Next"
            style={{
              backgroundColor: MAROON,
              paddingHorizontal: 36,
              paddingVertical: 14,
              borderRadius: 24,
              opacity: nickname.trim() ? 1 : 0.5,
            }}
            disabled={!nickname.trim()}
          >
            <RNText style={{ fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#FFFFFF' }}>
              Next
            </RNText>
          </Pressable>
        </View>
      </View>
    );
  }

  if (wizardStep === 2) {
    return (
      <View
        className="flex-1"
        style={{ backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="flex-1 px-4 pt-6">
          <WizardSteps current={1} total={3} />
          <RNText
            style={{
              fontFamily: 'Inter-Bold',
              fontSize: 26,
              lineHeight: 34,
              letterSpacing: -0.5,
              color: colors.text,
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            What do you do?
          </RNText>
          <RNText
            style={{
              fontFamily: 'Inter-Regular',
              fontSize: 15,
              color: colors.textTertiary,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            This helps us tailor Neemo for you
          </RNText>

          <View style={{ gap: 10 }}>
            {EMPLOYMENT_TYPES.map((et) => (
              <Pressable
                key={et}
                onPress={() => { hapticLight(); setEmploymentType(et as EmploymentType); }}
                accessibilityRole="button"
                accessibilityLabel={EMPLOYMENT_TYPE_LABELS[et as EmploymentType]}
                accessibilityState={{ selected: employmentType === et }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: employmentType === et ? MAROON : colors.border,
                  backgroundColor: employmentType === et ? colors.primaryLight : colors.surface,
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: employmentType === et ? MAROON : colors.surfaceTertiary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    name={EMPLOYMENT_ICONS[et] ?? 'person-outline'}
                    size={22}
                    color={employmentType === et ? '#FFFFFF' : colors.textTertiary}
                  />
                </View>
                <RNText
                  style={{
                    fontFamily: employmentType === et ? 'Inter-SemiBold' : 'Inter-Medium',
                    fontSize: 16,
                    color: employmentType === et ? MAROON : colors.textSecondary,
                  }}
                >
                  {EMPLOYMENT_TYPE_LABELS[et as EmploymentType]}
                </RNText>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="flex-row items-center justify-between px-6 pb-8">
          <Pressable onPress={() => { hapticLight(); setWizardStep(1); }} accessibilityRole="button" accessibilityLabel="Back">
            <RNText style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.textTertiary }}>
              Back
            </RNText>
          </Pressable>
          <Pressable
            onPress={() => { hapticLight(); setWizardStep(3); }}
            accessibilityRole="button"
            accessibilityLabel={employmentType ? 'Next' : 'Skip'}
            style={{
              backgroundColor: MAROON,
              paddingHorizontal: 36,
              paddingVertical: 14,
              borderRadius: 24,
            }}
          >
            <RNText style={{ fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#FFFFFF' }}>
              {employmentType ? 'Next' : 'Skip'}
            </RNText>
          </Pressable>
        </View>
      </View>
    );
  }

  if (wizardStep === 3) {
    return (
      <View
        className="flex-1"
        style={{ backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <ScrollView className="flex-1 px-6 pt-8" keyboardShouldPersistTaps="handled">
          <WizardSteps current={2} total={3} />
          <RNText
            style={{
              fontFamily: 'Inter-Bold',
              fontSize: 26,
              lineHeight: 34,
              letterSpacing: -0.5,
              color: colors.text,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Your first account
          </RNText>
          <RNText
            style={{
              fontFamily: 'Inter-Regular',
              fontSize: 15,
              color: colors.textTertiary,
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            You can add more later
          </RNText>

          {/* Account name */}
          <RNText
            style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.textTertiary, marginBottom: 8 }}
          >
            Account Name
          </RNText>
          <TextInput
            value={accountName}
            onChangeText={setAccountName}
            placeholder="e.g. BPI Savings, GCash"
            placeholderTextColor={colors.textTertiary}
            maxLength={30}
            style={{
              fontFamily: 'Inter-Regular',
              fontSize: 16,
              borderWidth: 1.5,
              borderColor: colors.border,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 20,
              color: colors.text,
              backgroundColor: colors.surface,
            }}
          />

          {/* Account type */}
          <RNText
            style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.textTertiary, marginBottom: 10 }}
          >
            Account Type
          </RNText>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {ACCOUNT_TYPE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.type}
                onPress={() => { hapticLight(); setAccountType(opt.type); }}
                accessibilityRole="button"
                accessibilityLabel={ACCOUNT_TYPE_LABELS[opt.type]}
                accessibilityState={{ selected: accountType === opt.type }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 24,
                  borderWidth: 1.5,
                  borderColor: accountType === opt.type ? MAROON : colors.border,
                  backgroundColor: accountType === opt.type ? colors.primaryLight : colors.surface,
                  gap: 8,
                }}
              >
                <Icon
                  name={opt.icon}
                  size={18}
                  color={accountType === opt.type ? MAROON : colors.textTertiary}
                />
                <RNText
                  style={{
                    fontFamily: accountType === opt.type ? 'Inter-SemiBold' : 'Inter-Regular',
                    fontSize: 14,
                    color: accountType === opt.type ? MAROON : colors.textSecondary,
                  }}
                >
                  {ACCOUNT_TYPE_LABELS[opt.type]}
                </RNText>
              </Pressable>
            ))}
          </View>

          {/* Starting balance */}
          <RNText
            style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.textTertiary, marginBottom: 8 }}
          >
            Starting Balance (optional)
          </RNText>
          <TextInput
            value={accountBalance}
            onChangeText={setAccountBalance}
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            style={{
              fontFamily: 'Inter-Regular',
              fontSize: 16,
              borderWidth: 1.5,
              borderColor: colors.border,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 20,
              color: colors.text,
              backgroundColor: colors.surface,
            }}
          />
        </ScrollView>

        <View className="flex-row items-center justify-between px-6 pb-8">
          <Pressable onPress={() => { hapticLight(); setWizardStep(2); }} accessibilityRole="button" accessibilityLabel="Back">
            <RNText style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.textTertiary }}>
              Back
            </RNText>
          </Pressable>
          <Pressable
            onPress={() => { hapticSuccess(); completeOnboarding(); }}
            accessibilityRole="button"
            accessibilityLabel="Finish setup"
            style={{
              backgroundColor: MAROON,
              paddingHorizontal: 36,
              paddingVertical: 14,
              borderRadius: 24,
            }}
          >
            <RNText style={{ fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#FFFFFF' }}>
              Let's Go!
            </RNText>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Info slides (wizardStep === 0) ──

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Logo at top */}
      <View className="flex-row items-center justify-center gap-2 pb-2 pt-3">
        <Image
          source={require('../assets/images/splash-icon.png')}
          style={{ width: 28, height: 28 }}
          resizeMode="contain"
        />
        <RNText
          style={{
            fontFamily: 'Inter-Bold',
            fontSize: 20,
            color: colors.text,
            letterSpacing: -0.5,
          }}
        >
          Neemo
        </RNText>
      </View>

      {/* Slides */}
      <AnimatedFlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => { userTouched.current = true; }}
        className="flex-1"
      />

      {/* Bottom: dots + Get Started pill button */}
      <View className="items-center gap-6 pb-8">
        <Dots scrollX={scrollX} />

        <Pressable
          onPress={() => { hapticLight(); setWizardStep(1); }}
          accessibilityRole="button"
          accessibilityLabel="Get started"
          className="items-center active:opacity-80"
          style={{
            backgroundColor: MAROON,
            paddingHorizontal: 48,
            paddingVertical: 16,
            borderRadius: 28,
          }}
        >
          <RNText
            style={{
              fontFamily: 'Inter-SemiBold',
              fontSize: 17,
              color: '#FFFFFF',
            }}
          >
            Get Started
          </RNText>
        </Pressable>
      </View>
    </View>
  );
}
