import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { useFinanceStore } from '@/src/features/finance';
import { useFinanceForecast } from '@/src/features/finance/hooks/useFinanceForecast';
import { useKuripotScore } from '@/src/features/finance/hooks/useKuripotScore';
import { useFinanceSummary } from '@/src/features/finance/hooks/useFinanceSummary';
import { useTheme } from '@theme/ThemeProvider';
import { formatCurrency } from '@lib/utils/currency';
import { hapticLight } from '@lib/utils/haptics';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface ComputedInsights {
  safeToSpend: number;
  remainingBills: number;
  forecastStatus: string;
  kuripotScore: number;
  kuripotGrade: string;
  savingsRate: number;
  anomaly: { category: string; ratio: number } | null;
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
}

function TypingIndicator({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const bounce = (delay: number) =>
      withRepeat(
        withDelay(
          delay,
          withSequence(
            withTiming(-6, { duration: 300 }),
            withTiming(0, { duration: 300 }),
          ),
        ),
        -1,
      );
    dot1.value = bounce(0);
    dot2.value = bounce(150);
    dot3.value = bounce(300);
  }, [dot1, dot2, dot3]);

  const style1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const style2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const style3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  return (
    <View
      className="mb-3 mr-auto max-w-[80%] flex-row items-center rounded-2xl rounded-bl-sm px-4 py-3"
      style={{ backgroundColor: colors.surfaceTertiary, gap: 4 }}
      accessibilityLabel="Neemo is typing"
    >
      {[style1, style2, style3].map((style, i) => (
        <Animated.View
          key={i}
          style={[
            style,
            { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textTertiary },
          ]}
        />
      ))}
    </View>
  );
}

function generateResponse(
  text: string,
  store: ReturnType<typeof useFinanceStore.getState>,
  computed: ComputedInsights,
): string {
  const lower = text.toLowerCase();
  const firstName = store.profile?.name?.trim().split(' ')[0] || 'there';

  // Greetings
  if (/^(hi|hello|hey|kumusta|musta)/i.test(lower)) {
    return `Hi ${firstName}! How can I help with your finances today? You can ask me about your spending, budgets, goals, bills, kuripot score, and more.`;
  }

  // Safe to spend
  if (
    lower.includes('safe to spend') ||
    lower.includes('pwede pa') ||
    lower.includes('how much can i spend')
  ) {
    return `Based on your income, expenses, and upcoming bills, you can safely spend about ${formatCurrency(computed.safeToSpend)} for the rest of this month. ${computed.remainingBills > 0 ? `You still have ${formatCurrency(computed.remainingBills)} in upcoming bills.` : ''}`;
  }

  // Monthly summary
  if (
    lower.includes('this month') ||
    lower.includes('summary') ||
    lower.includes('buwan')
  ) {
    const saved = computed.totalIncome - computed.totalExpenses;
    return `This month so far:\n\n• Income: ${formatCurrency(computed.totalIncome)}\n• Expenses: ${formatCurrency(computed.totalExpenses)}\n• Net: ${formatCurrency(saved)}\n• Balance: ${formatCurrency(computed.totalBalance)}\n\n${saved > 0 ? "You're in the green! Keep it up." : 'Spending exceeds income — consider cutting back on non-essentials.'}`;
  }

  // Kuripot score
  if (
    lower.includes('kuripot') ||
    lower.includes('score') ||
    lower.includes('grade') ||
    lower.includes('how am i doing')
  ) {
    return `Your Kuripot Score is ${computed.kuripotScore}/100 (${computed.kuripotGrade}). ${computed.kuripotScore >= 80 ? 'Excellent discipline!' : computed.kuripotScore >= 60 ? 'Good — keep improving your savings rate.' : "There's room to improve. Focus on budgeting and reducing unnecessary expenses."}`;
  }

  // Subscriptions
  if (
    (lower.includes('subscription') ||
      lower.includes('subs') ||
      lower.includes('netflix')) &&
    !lower.includes('bill')
  ) {
    const { subscriptions } = store;
    if (subscriptions.length === 0) {
      return `You don't have any subscriptions tracked. Add them in the Finance tab to keep track.`;
    }
    const active = subscriptions.filter((s) => s.isActive);
    const totalMonthly = active.reduce((s, sub) => s + sub.amount, 0);
    const names = active
      .slice(0, 5)
      .map((s) => s.name)
      .join(', ');
    return `You have ${active.length} active subscription${active.length !== 1 ? 's' : ''} totaling ${formatCurrency(totalMonthly)}/month. ${names ? `Including: ${names}.` : ''}`;
  }

  // Credit cards
  if (lower.includes('credit card') || lower.includes(' card') || lower.includes(' cc')) {
    const { cards } = store;
    if (cards.length === 0) {
      return `You haven't added any credit cards. Track them in the Finance tab to monitor utilization.`;
    }
    const totalBalance = cards.reduce((s, c) => s + (c.outstandingBalance ?? 0), 0);
    const totalLimit = cards.reduce((s, c) => s + (c.creditLimit ?? 0), 0);
    const utilization =
      totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
    return `You have ${cards.length} credit card${cards.length !== 1 ? 's' : ''} with ${formatCurrency(totalBalance)} balance across ${formatCurrency(totalLimit)} total limit (${utilization}% utilization). ${utilization > 30 ? 'Try to keep utilization below 30%.' : 'Good utilization rate!'}`;
  }

  // Utang
  if (
    lower.includes('utang') ||
    lower.includes('owe') ||
    lower.includes('lend') ||
    lower.includes('sino may utang')
  ) {
    const { utangs } = store;
    if (utangs.length === 0) {
      return `No utang records found. Use the Utang tracker to log money you've lent or borrowed.`;
    }
    const lent = utangs.filter((u) => u.type === 'lent' && u.status !== 'settled');
    const borrowed = utangs.filter(
      (u) => u.type === 'borrowed' && u.status !== 'settled',
    );
    const lentTotal = lent.reduce((s, u) => s + u.amount, 0);
    const borrowedTotal = borrowed.reduce((s, u) => s + u.amount, 0);
    return `Utang summary:\n\n• Lent out: ${formatCurrency(lentTotal)} (${lent.length} people)\n• Borrowed: ${formatCurrency(borrowedTotal)} (${borrowed.length} people)\n\n${
      lent.length > 0
        ? `People who owe you: ${lent
            .slice(0, 3)
            .map((u) => u.personName)
            .join(', ')}${lent.length > 3 ? '...' : ''}.`
        : ''
    }`;
  }

  // Wishlist
  if (
    lower.includes('wishlist') ||
    lower.includes('gusto ko') ||
    lower.includes('want to buy')
  ) {
    const { wishlistItems } = store;
    const active = wishlistItems.filter((w) => !w.isPurchased);
    if (active.length === 0) {
      return `Your wishlist is empty! Add items you're saving for in the Gusto Ko section.`;
    }
    const totalCost = active.reduce((s, w) => s + w.targetAmount, 0);
    const topItem = active[0];
    return `You have ${active.length} item${active.length !== 1 ? 's' : ''} on your wishlist totaling ${formatCurrency(totalCost)}. ${topItem ? `Top priority: "${topItem.name}" at ${formatCurrency(topItem.targetAmount)}.` : ''}`;
  }

  // Bills due soon
  if (
    lower.includes('due') ||
    lower.includes('upcoming') ||
    lower.includes('next bill') ||
    lower.includes('bayarin')
  ) {
    const { recurringBills } = store;
    const active = recurringBills.filter((b) => b.isActive);
    if (active.length === 0) {
      return `You don't have any active recurring bills. Add them to get due-date reminders!`;
    }
    const today = new Date().getDate();
    const upcoming = active
      .filter((b) => {
        const due = b.dueDay ?? 0;
        return due >= today && due <= today + 7;
      })
      .sort((a, b) => (a.dueDay ?? 0) - (b.dueDay ?? 0));

    if (upcoming.length === 0) {
      return `No bills due in the next 7 days. Your next bill cycle starts after the ${today}th.`;
    }
    const list = upcoming
      .map((b) => `• ${b.name}: ${formatCurrency(b.amount)} (due day ${b.dueDay})`)
      .join('\n');
    return `Bills due in the next 7 days:\n\n${list}`;
  }

  // Weekly spending
  if (
    lower.includes('this week') ||
    lower.includes('linggo') ||
    lower.includes('weekly')
  ) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const weekTxns = store.transactions.filter(
      (t) => t.type === 'expense' && t.date >= weekAgo,
    );
    const weekTotal = weekTxns.reduce((s, t) => s + t.amount, 0);
    const catMap: Record<string, number> = {};
    weekTxns.forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    return `You've spent ${formatCurrency(weekTotal)} this week across ${weekTxns.length} transactions. ${topCat ? `Top category: ${topCat[0]}.` : ''}`;
  }

  // Spending anomaly
  if (lower.includes('unusual') || lower.includes('spike') || lower.includes('anomaly')) {
    if (computed.anomaly) {
      return `Spending anomaly detected in ${computed.anomaly.category} — you're spending ${computed.anomaly.ratio}x more than your average this month. Consider reviewing these expenses.`;
    }
    return `No spending anomalies detected this month. Your spending patterns look normal!`;
  }

  // Spending (today)
  if (lower.includes('spend') || lower.includes('spent') || lower.includes('gastos')) {
    const today = new Date().toISOString().slice(0, 10);
    const todayTxns = store.transactions.filter(
      (t) => t.type === 'expense' && t.date.slice(0, 10) === today,
    );
    const todayTotal = todayTxns.reduce((sum, t) => sum + t.amount, 0);
    if (todayTxns.length === 0) {
      return `You haven't recorded any expenses today yet. Tap the + button to log your first transaction!`;
    }
    const catMap: Record<string, number> = {};
    todayTxns.forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    return `You've spent ${formatCurrency(todayTotal)} today across ${todayTxns.length} transaction${todayTxns.length !== 1 ? 's' : ''}. ${topCat ? `Your top category is ${topCat[0]}.` : ''}`;
  }

  // Budget
  if (lower.includes('budget') || lower.includes('badyet')) {
    const { budgets } = store;
    if (budgets.length === 0) {
      return `You haven't set up any budgets yet. Head to Insights > Budgets to create one!`;
    }
    const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
    const pct = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;
    const topBudget = [...budgets].sort(
      (a, b) => b.spent / b.amount - a.spent / a.amount,
    )[0];
    return `Your overall budget utilization is at ${pct}%. You've spent ${formatCurrency(totalSpent)} out of ${formatCurrency(totalBudgeted)}. ${topBudget ? `${topBudget.name} is your most used budget at ${Math.round((topBudget.spent / topBudget.amount) * 100)}%.` : ''}`;
  }

  // Goals / Savings
  if (
    lower.includes('save') ||
    lower.includes('saving') ||
    lower.includes('goal') ||
    lower.includes('ipon')
  ) {
    const { goals } = store;
    if (goals.length === 0) {
      return `You haven't created any savings goals yet. Set one up in Insights > Goals to start tracking!`;
    }
    const topGoal = [...goals].sort(
      (a, b) => b.currentAmount / b.targetAmount - a.currentAmount / a.targetAmount,
    )[0]!;
    const pct = Math.round((topGoal.currentAmount / topGoal.targetAmount) * 100);
    return `You have ${goals.length} active goal${goals.length !== 1 ? 's' : ''}. "${topGoal.name}" is ${pct}% complete (${formatCurrency(topGoal.currentAmount)} / ${formatCurrency(topGoal.targetAmount)}).`;
  }

  // Bills (general)
  if (lower.includes('bill')) {
    const { recurringBills } = store;
    const active = recurringBills.filter((b) => b.isActive);
    if (active.length === 0) {
      return `You don't have any active recurring bills. Add them in the Bills section to get reminders!`;
    }
    const totalMonthly = active.reduce((s, b) => s + b.amount, 0);
    return `You have ${active.length} active bill${active.length !== 1 ? 's' : ''} totaling ${formatCurrency(totalMonthly)}/month.`;
  }

  // Accounts / Net worth
  if (
    lower.includes('account') ||
    lower.includes('balance') ||
    lower.includes('net worth')
  ) {
    const { accounts } = store;
    if (accounts.length === 0) {
      return `You haven't added any accounts yet. Add your bank accounts, wallets, or cash in the Finance tab.`;
    }
    const total = accounts.reduce((s, a) => s + a.balance, 0);
    return `You have ${accounts.length} account${accounts.length !== 1 ? 's' : ''} with a total balance of ${formatCurrency(total)}.`;
  }

  // Help
  if (lower.includes('help') || lower.includes('what can you')) {
    return `I can help you with:\n\n• Spending summary ("How much did I spend today?")\n• Safe to spend ("How much can I spend?")\n• Kuripot score ("What's my score?")\n• Budget status ("How's my budget?")\n• Goal progress ("How are my savings?")\n• Bill reminders ("What bills are due?")\n• Subscriptions ("What subs do I have?")\n• Credit cards ("My credit cards")\n• Utang tracker ("Sino may utang?")\n• Wishlist ("What's on my wishlist?")\n• Weekly spending ("This week")\n• Anomaly detection ("Any unusual spending?")\n\nJust ask me anything about your finances!`;
  }

  // Default
  return `That's a great question! I'm still learning — this feature will be fully powered by AI soon. In the meantime, try asking about your spending, budgets, goals, kuripot score, or bills!`;
}

const SUGGESTED_CHIPS = [
  'How much can I spend?',
  'My Kuripot Score',
  'Bills due soon',
  "What's my balance?",
  'This week spending',
  'Sino may utang?',
];

export default function AIChatScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const forecast = useFinanceForecast();
  const kuripot = useKuripotScore();
  const summary = useFinanceSummary();

  const computed: ComputedInsights = useMemo(
    () => ({
      safeToSpend: forecast.safeToSpend,
      remainingBills: forecast.remainingBills,
      forecastStatus: forecast.status,
      kuripotScore: kuripot.kuripotScore.score,
      kuripotGrade: kuripot.kuripotScore.grade,
      savingsRate: kuripot.kuripotScore.factors.savingsRate,
      anomaly: kuripot.anomaly?.detected
        ? { category: kuripot.anomaly.categoryLabel, ratio: kuripot.anomaly.ratio }
        : null,
      totalIncome: summary.totalIncome,
      totalExpenses: summary.totalExpenses,
      totalBalance: summary.totalBalance,
    }),
    [forecast, kuripot, summary],
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hi! I'm Neemo AI, your personal finance assistant. Ask me anything about your spending, budgets, goals, or bills!`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(
    (overrideText?: string) => {
      const trimmed = (overrideText ?? input).trim();
      if (!trimmed || isTyping) return;
      hapticLight();

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);
      setShowChips(false);

      setTimeout(() => {
        const store = useFinanceStore.getState();
        const responseText = generateResponse(trimmed, store, computed);
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: responseText,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsTyping(false);
      }, 1200);
    },
    [input, isTyping, computed],
  );

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === 'user';
      return (
        <View
          className={`mb-3 max-w-[80%] rounded-2xl px-4 py-3 ${
            isUser ? 'ml-auto rounded-br-sm' : 'mr-auto rounded-bl-sm'
          }`}
          style={{
            backgroundColor: isUser ? colors.primary : colors.surfaceTertiary,
          }}
          accessibilityRole="text"
          accessibilityLabel={`${isUser ? 'You' : 'Neemo'}: ${item.text}`}
        >
          <Text
            variant="body"
            style={{
              color: isUser ? colors.textInverse : colors.text,
              lineHeight: 22,
            }}
          >
            {item.text}
          </Text>
        </View>
      );
    },
    [colors],
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-3"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          className="mr-3 h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surfaceTertiary }}
        >
          <Icon name="chatbubble-ellipses" size={18} color="#f58560" />
        </View>
        <View className="flex-1">
          <Text variant="body" className="font-sans-semibold">
            Neemo AI
          </Text>
          <Text variant="caption" style={{ fontSize: 11, color: colors.success }}>
            Online
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close chat"
          className="rounded-full p-1.5"
          style={{ backgroundColor: colors.surfaceTertiary }}
        >
          <Icon name="close" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            <>
              {isTyping && <TypingIndicator colors={colors} />}
              {showChips && messages.length <= 1 && (
                <View className="mt-2">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                  >
                    {SUGGESTED_CHIPS.map((chip) => (
                      <Pressable
                        key={chip}
                        onPress={() => handleSend(chip)}
                        accessibilityRole="button"
                        accessibilityLabel={chip}
                        className="rounded-full border px-3 py-2"
                        style={{
                          borderColor: colors.border,
                          backgroundColor: colors.surface,
                        }}
                      >
                        <Text
                          variant="caption"
                          style={{ color: colors.primary, fontSize: 12 }}
                        >
                          {chip}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          }
        />

        {/* Input Bar */}
        <View
          className="flex-row items-end px-3 py-2"
          style={{
            gap: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <View
            className="flex-1 rounded-2xl border px-4 py-2"
            style={{
              maxHeight: 100,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <TextInput
              placeholder="Ask Neemo anything..."
              value={input}
              onChangeText={setInput}
              multiline
              accessibilityLabel="Message input"
              className="font-[Inter-Regular] text-sm"
              style={{ color: colors.text, maxHeight: 80 }}
              placeholderTextColor={colors.textTertiary}
              onSubmitEditing={() => handleSend()}
              blurOnSubmit={false}
            />
          </View>
          <Pressable
            onPress={() => handleSend()}
            disabled={!input.trim() || isTyping}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            className="mb-0.5 h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor:
                input.trim() && !isTyping ? colors.primary : colors.border,
            }}
          >
            <Icon
              name="send"
              size={18}
              color={input.trim() && !isTyping ? '#FFFFFF' : colors.textTertiary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
