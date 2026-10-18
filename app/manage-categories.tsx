import { useState, useRef, useMemo, useCallback } from 'react';
import { View, Pressable, Alert, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';
import { ScreenContainer } from '@ui/components/ScreenContainer';
import { Text } from '@ui/components/Text';
import { Button } from '@ui/components/Button';
import { Icon, type IconName } from '@ui/components/Icon';
import { Card } from '@ui/components/Card';
import { ListItem } from '@ui/components/ListItem';
import { Divider } from '@ui/components/Divider';
import { Badge } from '@ui/components/Badge';
import { StaggeredFadeIn } from '@ui/components/StaggeredFadeIn';
import { useTheme } from '@theme/ThemeProvider';
import { hapticLight } from '@lib/utils/haptics';
import { TRANSACTION_CATEGORIES, CATEGORY_MAP, SUBCATEGORIES } from '@lib/constants/finance';
import { useFinanceStore } from '@/src/features/finance';
import { AddCustomCategorySheet } from '@/src/features/finance/components/AddCustomCategorySheet';
import { AddCustomSubcategorySheet } from '@/src/features/finance/components/AddCustomSubcategorySheet';
import { ManageSavedPayeesSheet } from '@/src/features/finance/components/ManageSavedPayeesSheet';
import { ManageSavedTagsSheet } from '@/src/features/finance/components/ManageSavedTagsSheet';
import type { CustomCategory, CustomSubcategory } from '@/src/features/finance/types/finance.types';

const TABS = ['Categories', 'Subcats', 'Payees', 'Tags'] as const;
type Tab = (typeof TABS)[number];

export default function ManageCategoriesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('Categories');

  const customCategories = useFinanceStore((s) => s.customCategories);
  const customSubcategories = useFinanceStore((s) => s.customSubcategories);
  const savedPayees = useFinanceStore((s) => s.savedPayees);
  const savedTags = useFinanceStore((s) => s.savedTags);
  const deleteCustomCategory = useFinanceStore((s) => s.deleteCustomCategory);
  const deleteCustomSubcategory = useFinanceStore((s) => s.deleteCustomSubcategory);
  const addSavedPayee = useFinanceStore((s) => s.addSavedPayee);
  const addSavedTag = useFinanceStore((s) => s.addSavedTag);

  const addCategoryRef = useRef<GorhomBottomSheetModal>(null);
  const addSubcategoryRef = useRef<GorhomBottomSheetModal>(null);
  const managePayeesRef = useRef<GorhomBottomSheetModal>(null);
  const manageTagsRef = useRef<GorhomBottomSheetModal>(null);

  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<CustomSubcategory | null>(null);
  const [newPayeeName, setNewPayeeName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Built-in subcategory count
  const builtInSubcatCount = useMemo(
    () => Object.values(SUBCATEGORIES).reduce((sum, arr) => sum + arr.length, 0),
    [],
  );

  const headerLeft = useCallback(() => null, []);
  const headerRight = useCallback(() => (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      className="mr-2"
      accessibilityRole="button"
      accessibilityLabel="Close screen"
    >
      <Icon name="close" size={24} color={colors.text} />
    </Pressable>
  ), [colors.text, router]);
  const headerTitleStyle = useMemo(() => ({ fontFamily: 'Inter-SemiBold' as const, fontSize: 17 }), []);
  const headerStyle = useMemo(() => ({ backgroundColor: colors.background }), [colors.background]);
  const screenOptions = useMemo(() => ({
    headerShown: true,
    title: 'Manage Categories',
    headerTitleStyle,
    headerLeft,
    headerRight,
    headerShadowVisible: false,
    headerStyle,
    headerTintColor: colors.text,
  }), [headerTitleStyle, headerLeft, headerRight, headerStyle, colors.text]);

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <ScreenContainer edges={['bottom', 'left', 'right']}>

      {/* Tabs */}
      <StaggeredFadeIn index={1}>
        <View className="mb-4 flex-row gap-2">
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => { hapticLight(); setActiveTab(tab); }}
              className={`flex-1 items-center rounded-xl py-2.5 border ${
                activeTab === tab
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-neutral-200 dark:border-neutral-700'
              }`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab }}
              accessibilityLabel={`${tab} tab`}
            >
              <Text
                variant="caption"
                className={`font-sans-semibold ${activeTab === tab ? 'text-white' : ''}`}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
      </StaggeredFadeIn>

      {/* Categories Tab */}
      {activeTab === 'Categories' && (
        <>
          <StaggeredFadeIn index={2}>
            <Button
              variant="outline"
              onPress={() => {
                setEditingCategory(null);
                addCategoryRef.current?.present();
              }}
              className="mb-4"
              leftIcon={<Icon name="add" size={18} color={colors.primary} />}
            >
              Add Custom Category
            </Button>
          </StaggeredFadeIn>

          {customCategories.length > 0 && (
            <StaggeredFadeIn index={3}>
              <Card className="mb-3 px-0">
                <Text variant="label" className="mb-2 px-4">
                  Custom ({customCategories.length})
                </Text>
                {customCategories.map((cat, idx) => (
                  <View key={cat.id}>
                    {idx > 0 && <Divider className="mx-4" />}
                    <ListItem
                      title={cat.label}
                      subtitle={cat.type === 'income' ? 'Income' : 'Expense'}
                      leftIcon={<Icon name={cat.icon as IconName} size={20} color={cat.color} />}
                      rightElement={
                        <View className="flex-row items-center gap-3">
                          <Pressable
                            onPress={() => {
                              hapticLight();
                              setEditingCategory(cat);
                              addCategoryRef.current?.present();
                            }}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel={`Edit ${cat.label}`}
                          >
                            <Icon name="pencil-outline" size={18} color={colors.primary} />
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              hapticLight();
                              Alert.alert('Delete Category', `Remove "${cat.label}" and its subcategories?`, [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: () => deleteCustomCategory(cat.id) },
                              ]);
                            }}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel={`Delete ${cat.label}`}
                          >
                            <Icon name="trash-outline" size={18} color={colors.danger} />
                          </Pressable>
                        </View>
                      }
                      showChevron={false}
                    />
                  </View>
                ))}
              </Card>
            </StaggeredFadeIn>
          )}

          <StaggeredFadeIn index={4}>
            <Card className="mb-3 px-0">
              <Text variant="label" className="mb-2 px-4">
                Built-in ({TRANSACTION_CATEGORIES.length})
              </Text>
              {TRANSACTION_CATEGORIES.map((cat, idx) => (
                <View key={cat.id}>
                  {idx > 0 && <Divider className="mx-4" />}
                  <ListItem
                    title={cat.label}
                    leftIcon={<Icon name={cat.icon as IconName} size={20} color={cat.color} />}
                    rightElement={<Badge variant="neutral">Built-in</Badge>}
                    showChevron={false}
                  />
                </View>
              ))}
            </Card>
          </StaggeredFadeIn>
        </>
      )}

      {/* Subcategories Tab */}
      {activeTab === 'Subcats' && (
        <>
          <StaggeredFadeIn index={2}>
            <Button
              variant="outline"
              onPress={() => {
                setEditingSubcategory(null);
                addSubcategoryRef.current?.present();
              }}
              className="mb-4"
              leftIcon={<Icon name="add" size={18} color={colors.primary} />}
            >
              Add Subcategory
            </Button>
          </StaggeredFadeIn>

          {customSubcategories.length > 0 && (
            <StaggeredFadeIn index={3}>
              <Card className="mb-3 px-0">
                <Text variant="label" className="mb-2 px-4">
                  Custom ({customSubcategories.length})
                </Text>
                {customSubcategories.map((subcat, idx) => {
                  const parent = CATEGORY_MAP.get(subcat.parentCategoryId) ?? customCategories.find((c) => c.id === subcat.parentCategoryId);
                  return (
                    <View key={subcat.id}>
                      {idx > 0 && <Divider className="mx-4" />}
                      <ListItem
                        title={subcat.label}
                        subtitle={parent?.label ?? 'Unknown'}
                        rightElement={
                          <View className="flex-row items-center gap-3">
                            <Pressable
                              onPress={() => {
                                hapticLight();
                                setEditingSubcategory(subcat);
                                addSubcategoryRef.current?.present();
                              }}
                              hitSlop={8}
                              accessibilityRole="button"
                              accessibilityLabel={`Edit ${subcat.label}`}
                            >
                              <Icon name="pencil-outline" size={18} color={colors.primary} />
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                hapticLight();
                                Alert.alert('Delete', `Remove "${subcat.label}"?`, [
                                  { text: 'Cancel', style: 'cancel' },
                                  { text: 'Delete', style: 'destructive', onPress: () => deleteCustomSubcategory(subcat.id) },
                                ]);
                              }}
                              hitSlop={8}
                              accessibilityRole="button"
                              accessibilityLabel={`Delete ${subcat.label}`}
                            >
                              <Icon name="trash-outline" size={18} color={colors.danger} />
                            </Pressable>
                          </View>
                        }
                        showChevron={false}
                      />
                    </View>
                  );
                })}
              </Card>
            </StaggeredFadeIn>
          )}

          <StaggeredFadeIn index={4}>
            <Card className="px-0">
              <Text variant="label" className="mb-2 px-4">
                Built-in ({builtInSubcatCount})
              </Text>
              {Object.entries(SUBCATEGORIES).map(([parentId, subs]) => {
                const parent = CATEGORY_MAP.get(parentId);
                return subs.map((sub, idx) => (
                  <View key={sub.id}>
                    {idx > 0 && <Divider className="mx-4" />}
                    <ListItem
                      title={sub.label}
                      subtitle={parent?.label ?? parentId}
                      rightElement={<Badge variant="neutral">Built-in</Badge>}
                      showChevron={false}
                    />
                  </View>
                ));
              })}
            </Card>
          </StaggeredFadeIn>
        </>
      )}

      {/* Payees Tab */}
      {activeTab === 'Payees' && (
        <>
          {/* Add Payee inline form */}
          <StaggeredFadeIn index={2}>
            <View className="mb-4 flex-row items-center gap-2">
              <View className="flex-1 flex-row items-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5">
                <Icon name="person-outline" size={18} color={colors.textTertiary} />
                <TextInput
                  className="ml-2 flex-1 font-sans text-sm text-neutral-900 dark:text-neutral-100"
                  placeholder="Add a payee..."
                  placeholderTextColor={colors.textTertiary}
                  value={newPayeeName}
                  onChangeText={setNewPayeeName}
                  onSubmitEditing={() => {
                    const name = newPayeeName.trim();
                    if (!name) return;
                    if (savedPayees.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
                      Alert.alert('Duplicate', 'This payee already exists.');
                      return;
                    }
                    addSavedPayee({ name, isFavorite: false });
                    setNewPayeeName('');
                  }}
                  returnKeyType="done"
                />
              </View>
              <Pressable
                onPress={() => {
                  hapticLight();
                  const name = newPayeeName.trim();
                  if (!name) return;
                  if (savedPayees.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
                    Alert.alert('Duplicate', 'This payee already exists.');
                    return;
                  }
                  addSavedPayee({ name, isFavorite: false });
                  setNewPayeeName('');
                }}
                className="h-11 w-11 items-center justify-center rounded-xl bg-primary-500"
                accessibilityRole="button"
                accessibilityLabel="Add payee"
              >
                <Icon name="add" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          </StaggeredFadeIn>

          {savedPayees.length > 0 && (
            <StaggeredFadeIn index={3}>
              <Button
                variant="outline"
                onPress={() => { hapticLight(); managePayeesRef.current?.present(); }}
                className="mb-4"
                leftIcon={<Icon name="settings-outline" size={18} color={colors.primary} />}
              >
                Manage Payees
              </Button>
            </StaggeredFadeIn>
          )}

          <StaggeredFadeIn index={4}>
            <Card className="px-0">
              <Text variant="label" className="mb-2 px-4">
                Saved Payees ({savedPayees.length})
              </Text>
              {savedPayees.length === 0 ? (
                <View className="px-4 py-6">
                  <Text variant="caption" className="text-center text-neutral-500">
                    No payees yet. Add one above or they will be saved automatically from transactions.
                  </Text>
                </View>
              ) : (
                [...savedPayees]
                  .sort((a, b) => {
                    if (a.isFavorite && !b.isFavorite) return -1;
                    if (!a.isFavorite && b.isFavorite) return 1;
                    return b.useCount - a.useCount;
                  })
                  .map((payee, idx) => (
                    <View key={payee.id}>
                      {idx > 0 && <Divider className="mx-4" />}
                      <ListItem
                        title={payee.name}
                        subtitle={`Used ${payee.useCount} time${payee.useCount !== 1 ? 's' : ''}`}
                        leftIcon={
                          payee.isFavorite
                            ? <Icon name="star" size={18} color={colors.warning} />
                            : <Icon name="star-outline" size={18} color={colors.border} />
                        }
                        showChevron={false}
                      />
                    </View>
                  ))
              )}
            </Card>
          </StaggeredFadeIn>
        </>
      )}

      {/* Tags Tab */}
      {activeTab === 'Tags' && (
        <>
          {/* Add Tag inline form */}
          <StaggeredFadeIn index={2}>
            <View className="mb-4 flex-row items-center gap-2">
              <View className="flex-1 flex-row items-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5">
                <Icon name="pricetag-outline" size={18} color={colors.textTertiary} />
                <TextInput
                  className="ml-2 flex-1 font-sans text-sm text-neutral-900 dark:text-neutral-100"
                  placeholder="Add a tag..."
                  placeholderTextColor={colors.textTertiary}
                  value={newTagName}
                  onChangeText={setNewTagName}
                  onSubmitEditing={() => {
                    const name = newTagName.trim().replace(/^#/, '');
                    if (!name) return;
                    if (savedTags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
                      Alert.alert('Duplicate', 'This tag already exists.');
                      return;
                    }
                    addSavedTag({ name });
                    setNewTagName('');
                  }}
                  returnKeyType="done"
                />
              </View>
              <Pressable
                onPress={() => {
                  hapticLight();
                  const name = newTagName.trim().replace(/^#/, '');
                  if (!name) return;
                  if (savedTags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
                    Alert.alert('Duplicate', 'This tag already exists.');
                    return;
                  }
                  addSavedTag({ name });
                  setNewTagName('');
                }}
                className="h-11 w-11 items-center justify-center rounded-xl bg-primary-500"
                accessibilityRole="button"
                accessibilityLabel="Add tag"
              >
                <Icon name="add" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          </StaggeredFadeIn>

          {savedTags.length > 0 && (
            <StaggeredFadeIn index={3}>
              <Button
                variant="outline"
                onPress={() => { hapticLight(); manageTagsRef.current?.present(); }}
                className="mb-4"
                leftIcon={<Icon name="settings-outline" size={18} color={colors.primary} />}
              >
                Manage Tags
              </Button>
            </StaggeredFadeIn>
          )}

          <StaggeredFadeIn index={4}>
            <Card className="px-0">
              <Text variant="label" className="mb-2 px-4">
                Saved Tags ({savedTags.length})
              </Text>
              {savedTags.length === 0 ? (
                <View className="px-4 py-6">
                  <Text variant="caption" className="text-center text-neutral-500">
                    No tags yet. Add one above or they will be saved automatically from transactions.
                  </Text>
                </View>
              ) : (
                [...savedTags]
                  .sort((a, b) => b.useCount - a.useCount)
                  .map((tag, idx) => (
                    <View key={tag.id}>
                      {idx > 0 && <Divider className="mx-4" />}
                      <ListItem
                        title={`#${tag.name}`}
                        subtitle={`Used ${tag.useCount} time${tag.useCount !== 1 ? 's' : ''}`}
                        leftIcon={<Icon name="pricetag-outline" size={18} color={colors.primary} />}
                        showChevron={false}
                      />
                    </View>
                  ))
              )}
            </Card>
          </StaggeredFadeIn>
        </>
      )}

      {/* Bottom Sheets */}
      <AddCustomCategorySheet
        sheetRef={addCategoryRef}
        editItem={editingCategory}
        onDismiss={() => setEditingCategory(null)}
      />
      <AddCustomSubcategorySheet
        sheetRef={addSubcategoryRef}
        editItem={editingSubcategory}
        onDismiss={() => setEditingSubcategory(null)}
      />
      <ManageSavedPayeesSheet sheetRef={managePayeesRef} />
      <ManageSavedTagsSheet sheetRef={manageTagsRef} />
    </ScreenContainer>
    </>
  );
}
