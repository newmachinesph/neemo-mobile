/**
 * Apps Hub Screen
 *
 * Shows all built-in financial tools and Filipino planners as an app grid.
 */

import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';
import { SectionHeader } from '@ui/components/SectionHeader';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { palette } from '@theme/colors';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AppsHubScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {/* Header */}
      <StaggeredFadeIn index={0}>
        <View className="px-4 pb-2 pt-4">
          <Text variant="h2">Apps</Text>
          <Text variant="caption" className="mt-0.5">
            Financial tools & planners
          </Text>
        </View>
      </StaggeredFadeIn>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Financial Tools */}
        <StaggeredFadeIn index={1}>
          <SectionHeader title="Financial Tools" className="px-4" />
          <View className="flex-row flex-wrap gap-4 px-4 pt-1 mb-4">
            {(
              [
                {
                  id: 'govt-calc',
                  name: 'Govt Calculator',
                  icon: 'calculator-outline',
                  color: palette.primary[600],
                  route: '/govt-calculator',
                },
                {
                  id: 'tax-tools',
                  name: 'Tax Tools',
                  icon: 'document-text-outline',
                  color: '#3B82F6',
                  route: '/tax-tools',
                },
                {
                  id: 'loan-calc',
                  name: 'Loan Calc',
                  icon: 'cash-outline',
                  color: '#F59E0B',
                  route: '/loan-calculator',
                },
                {
                  id: 'cc-optimizer',
                  name: 'CC Optimizer',
                  icon: 'card-outline',
                  color: '#8B5CF6',
                  route: '/credit-card-optimizer',
                },
                {
                  id: 'what-if',
                  name: 'What If',
                  icon: 'help-circle-outline',
                  color: '#6366F1',
                  route: '/what-if-scenarios',
                },
                {
                  id: 'assets',
                  name: 'Assets',
                  icon: 'cube-outline',
                  color: '#D97706',
                  route: '/manage-assets',
                },
              ] as {
                id: string;
                name: string;
                icon: string;
                color: string;
                route: string;
              }[]
            ).map((tool) => (
              <Pressable
                key={tool.id}
                onPress={() => router.push(tool.route as any)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${tool.name}`}
                className="w-[72px] items-center active:opacity-70"
              >
                <View
                  className="mb-1.5 h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: tool.color }}
                >
                  <Icon
                    name={tool.icon as React.ComponentProps<typeof Icon>['name']}
                    size={26}
                    color="#FFFFFF"
                  />
                </View>
                <Text variant="caption" className="text-center text-xs" numberOfLines={1}>
                  {tool.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </StaggeredFadeIn>

        {/* Filipino Planners */}
        <StaggeredFadeIn index={2}>
          <SectionHeader title="Filipino Planners" className="px-4" />
          <View className="flex-row flex-wrap gap-4 px-4 pt-1 mb-4">
            {(
              [
                {
                  id: '13th-month',
                  name: '13th Month',
                  icon: 'cash-outline',
                  color: '#F59E0B',
                  route: '/thirteenth-month',
                },
                {
                  id: 'fiesta',
                  name: 'Fiesta',
                  icon: 'musical-notes-outline',
                  color: '#EC4899',
                  route: '/fiesta-planner',
                },
                {
                  id: 'aguinaldo',
                  name: 'Aguinaldo',
                  icon: 'gift-outline',
                  color: '#EF4444',
                  route: '/aguinaldo-tracker',
                },
                {
                  id: 'balikbayan',
                  name: 'Balikbayan',
                  icon: 'airplane-outline',
                  color: '#3B82F6',
                  route: '/balikbayan-tracker',
                },
              ] as {
                id: string;
                name: string;
                icon: string;
                color: string;
                route: string;
              }[]
            ).map((tool) => (
              <Pressable
                key={tool.id}
                onPress={() => router.push(tool.route as any)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${tool.name}`}
                className="w-[72px] items-center active:opacity-70"
              >
                <View
                  className="mb-1.5 h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: tool.color }}
                >
                  <Icon
                    name={tool.icon as React.ComponentProps<typeof Icon>['name']}
                    size={26}
                    color="#FFFFFF"
                  />
                </View>
                <Text variant="caption" className="text-center text-xs" numberOfLines={1}>
                  {tool.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </StaggeredFadeIn>

        {/* More Features */}
        <StaggeredFadeIn index={3}>
          <SectionHeader title="More Features" className="px-4" />
          <View className="flex-row flex-wrap gap-4 px-4 pt-1 mb-4">
            {(
              [
                {
                  id: 'challenges',
                  name: 'Challenges',
                  icon: 'trophy-outline',
                  color: '#22C55E',
                  route: '/savings-challenges',
                },
                {
                  id: 'templates',
                  name: 'Templates',
                  icon: 'copy-outline',
                  color: '#6366F1',
                  route: '/transaction-templates',
                },
                {
                  id: 'year-review',
                  name: 'Year Review',
                  icon: 'star-outline',
                  color: '#F97316',
                  route: '/year-review',
                },
                {
                  id: 'inflation',
                  name: 'Inflation',
                  icon: 'trending-up-outline',
                  color: '#EF4444',
                  route: '/lifestyle-inflation',
                },
                {
                  id: 'wishlist',
                  name: 'Wishlist',
                  icon: 'heart-outline',
                  color: '#EC4899',
                  route: '/wishlist',
                },
              ] as {
                id: string;
                name: string;
                icon: string;
                color: string;
                route: string;
              }[]
            ).map((tool) => (
              <Pressable
                key={tool.id}
                onPress={() => router.push(tool.route as any)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${tool.name}`}
                className="w-[72px] items-center active:opacity-70"
              >
                <View
                  className="mb-1.5 h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: tool.color }}
                >
                  <Icon
                    name={tool.icon as React.ComponentProps<typeof Icon>['name']}
                    size={26}
                    color="#FFFFFF"
                  />
                </View>
                <Text variant="caption" className="text-center text-xs" numberOfLines={1}>
                  {tool.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </StaggeredFadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}
