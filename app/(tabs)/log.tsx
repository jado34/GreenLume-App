// Actions Screen — Figma Pixel-Perfect Actions List matching Screenshot 1
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { ACTIONS, ACTION_CATEGORIES, ActionCategory, ActionDefinition } from '../../constants/actions';
import { Typography } from '../../constants/typography';
import { useUserData, useLogActionMutation, useRemoveActionMutation } from '../../hooks/useUserData';
import ConfettiOverlay from '../../components/ConfettiOverlay';

const CATEGORY_META: Record<string, { title: string; subtitle: string }> = {
  transport: { title: 'Transport', subtitle: 'Save energy, reduce emissions' },
  energy: { title: 'Energy', subtitle: 'Save energy, reduce emissions' },
  water: { title: 'Water', subtitle: 'Conserve water & protect resources' },
  food: { title: 'Food', subtitle: 'Sustainable eating & plant meals' },
  shopping: { title: 'Shopping', subtitle: 'Reduce waste & choose reusables' },
};

export default function ActionsScreen() {
  const [activeCategory, setActiveCategory] = useState<ActionCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showToastBanner, setShowToastBanner] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<ActionDefinition | null>(null);

  const { data: userData } = useUserData();
  const { mutateAsync: logActionAsync } = useLogActionMutation();
  const { mutateAsync: removeActionAsync } = useRemoveActionMutation();

  const todayLogged = new Set(userData?.todayActions || []);

  const filtered = useMemo(() => {
    return ACTIONS.filter((a) => {
      const matchCat = activeCategory === 'all' || a.category === activeCategory;
      const matchSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [searchQuery, activeCategory]);

  // Group actions by category
  const groupedActions = useMemo(() => {
    const map: Record<string, ActionDefinition[]> = {};
    filtered.forEach((action) => {
      const catKey = action.category || 'transport';
      if (!map[catKey]) map[catKey] = [];
      map[catKey].push(action);
    });
    return map;
  }, [filtered]);

  const handleActionClick = (action: ActionDefinition) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (todayLogged.has(action.id)) {
      removeActionAsync({ points: action.points, actionId: action.id });
      Toast.show({
        type: 'info',
        text1: 'Action Removed ✓',
        text2: `"${action.name}" undone.`,
      });
      return;
    }

    // Open confirmation modal
    setActionToConfirm(action);
  };

  const executeLogAction = async () => {
    if (!actionToConfirm) return;
    const target = actionToConfirm;
    setActionToConfirm(null);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logActionAsync({ points: target.points, actionIds: [target.id] });

    setShowToastBanner(true);
    setTimeout(() => {
      setShowToastBanner(false);
    }, 2800);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />

      {/* Confetti Particle Burst */}
      <ConfettiOverlay visible={showToastBanner} onAnimationEnd={() => setShowToastBanner(false)} />

      {/* Action Logged Success Toast (Screenshot 2) */}
      {showToastBanner && (
        <View style={styles.toastOverlay}>
          <View style={styles.toastCard}>
            <View style={styles.toastCheckCircle}>
              <Ionicons name="checkmark" size={20} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toastTitle}>Great Job!</Text>
              <Text style={styles.toastSubtitle}>Action logged successfully</Text>
            </View>
          </View>
        </View>
      )}

      {/* Top Header Bar: Back arrow, Title "Actions", 3-dots menu */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Actions</Text>

        <TouchableOpacity style={styles.iconBtn} onPress={() => Toast.show({ type: 'info', text1: 'Actions Options' })} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search actions"
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.filterPill, activeCategory === 'all' && styles.filterPillActive]}
            onPress={() => setActiveCategory('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, activeCategory === 'all' && styles.filterPillTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          {ACTION_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Grouped Actions List */}
        {Object.keys(groupedActions).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>No actions found</Text>
          </View>
        ) : (
          Object.entries(groupedActions).map(([catKey, actionList]) => {
            const meta = CATEGORY_META[catKey] || {
              title: catKey.charAt(0).toUpperCase() + catKey.slice(1),
              subtitle: 'Save energy, reduce emissions',
            };

            return (
              <View key={catKey} style={styles.categorySection}>
                {/* Category Section Header */}
                <View style={styles.categoryHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.categoryTitle}>{meta.title}</Text>
                    <Text style={styles.categorySubtitle}>{meta.subtitle}</Text>
                  </View>

                  <TouchableOpacity onPress={() => setActiveCategory(catKey as any)}>
                    <Text style={styles.seeAllText}>See all</Text>
                  </TouchableOpacity>
                </View>

                {/* Cards in this Category */}
                <View style={styles.cardsStack}>
                  {actionList.map((action) => {
                    const isDone = todayLogged.has(action.id);
                    return (
                      <TouchableOpacity
                        key={action.id}
                        style={[styles.actionCard, isDone && styles.actionCardDone]}
                        onPress={() => handleActionClick(action)}
                        activeOpacity={0.85}
                      >
                        {/* Left Icon Circle */}
                        <View style={styles.actionIconCircle}>
                          <Ionicons name={action.icon as any} size={20} color="#334155" />
                        </View>

                        {/* Title & Description */}
                        <View style={styles.actionTextWrap}>
                          <Text style={styles.actionName}>{action.name}</Text>
                          <Text style={styles.actionDescription} numberOfLines={2}>
                            {action.description}
                          </Text>
                        </View>

                        {/* Right Points */}
                        <Text style={styles.actionPoints}>{action.points}pts</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Action Confirmation Modal */}
      <Modal visible={actionToConfirm !== null} transparent animationType="fade">
        <Pressable style={styles.confirmModalBackdrop} onPress={() => setActionToConfirm(null)}>
          <Pressable style={styles.confirmModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.confirmModalHeader}>
              <View style={styles.confirmModalIconCircle}>
                <Ionicons name={(actionToConfirm?.icon as any) || 'flash'} size={24} color="#2D7A40" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.confirmModalTitle}>{actionToConfirm?.name}</Text>
                <Text style={styles.confirmModalPoints}>+{actionToConfirm?.points}pts</Text>
              </View>
            </View>

            <Text style={styles.confirmModalDescription}>
              {actionToConfirm?.description}
            </Text>
            <Text style={styles.confirmModalSubtext}>
              Would you like to log this action and add +{actionToConfirm?.points} points to your total impact today?
            </Text>

            <View style={styles.confirmModalBtnRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setActionToConfirm(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmModalBtn}
                onPress={executeLogAction}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmModalBtnText}>Confirm & Log</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  toastOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40,
    left: 20,
    right: 20,
    zIndex: 99999,
    elevation: 99999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  toastCheckCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2D7A40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 16,
    color: '#0f172a',
  },
  toastSubtitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 13,
    color: '#475569',
    marginTop: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 48 : StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 28,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 18,
    color: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 50,
    paddingHorizontal: 14,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    color: '#0f172a',
    height: '100%',
  },
  filterScrollView: {
    marginVertical: 12,
  },
  filterContent: {
    gap: 8,
    paddingRight: 8,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  filterPillActive: {
    backgroundColor: '#2D7A40',
  },
  filterPillText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontFamily: Typography.fontFamily.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  categorySection: {
    marginTop: 20,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 18,
    color: '#0f172a',
  },
  categorySubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  seeAllText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    color: '#2D7A40',
  },
  cardsStack: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  actionCardDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  actionName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 15,
    color: '#0f172a',
  },
  actionDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 18,
  },
  actionPoints: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: '#2D7A40',
  },
  confirmModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmModalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  confirmModalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  confirmModalTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 18,
    color: '#0f172a',
  },
  confirmModalPoints: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: '#2D7A40',
    marginTop: 2,
  },
  confirmModalDescription: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 8,
  },
  confirmModalSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 20,
  },
  confirmModalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelModalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtnText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 15,
    color: '#475569',
  },
  confirmModalBtn: {
    flex: 1.4,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2D7A40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 15,
    color: '#ffffff',
  },
});
