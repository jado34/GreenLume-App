// Home Dashboard — Figma Pixel-Perfect Home Screen matching design screenshot
import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
  Modal,
  Pressable,
  Image,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { storage, UserData } from '../../utils/storage';
import { notificationStore, RichNotification } from '../../utils/inAppNotifications';
import { Typography } from '../../constants/typography';
import ConfettiOverlay from '../../components/ConfettiOverlay';

const { width } = Dimensions.get('window');
const GRID_CARD_WIDTH = (width - 52) / 2;

const HOME_ACTIONS = [
  {
    id: 'lights_off',
    title: 'Save Energy',
    subtitle: 'Turn off unused lights',
    points: 15,
    icon: 'flash' as const,
    iconBg: '#EBF5FF',
    iconColor: '#007AFF',
  },
  {
    id: 'plant_meal',
    title: 'Food',
    subtitle: 'Eat a plant based meal',
    points: 15,
    icon: 'nutrition' as const,
    iconBg: '#FFF7ED',
    iconColor: '#D97706',
  },
  {
    id: 'no_plastic',
    title: 'Plastics',
    subtitle: 'Choose a reusable plastic',
    points: 15,
    icon: 'water' as const,
    iconBg: '#F3E8FF',
    iconColor: '#9333EA',
  },
  {
    id: 'carpooled',
    title: 'Carpooled',
    subtitle: 'Reduce carbon footprints',
    points: 15,
    icon: 'car-sport' as const,
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
  },
];

export default function HomeScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userName, setUserName] = useState('Adaeze');
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [todayLogged, setTodayLogged] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<RichNotification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const fadeIn = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    const data = await storage.getUserData();
    const name = await storage.getUserName();
    const avatar = await storage.getCustomAvatar();

    await notificationStore.addWelcomeIfEmpty();
    const realNotifs = await notificationStore.getAll();
    const unread = await notificationStore.hasUnread();

    setUserData(data);
    if (name) setUserName(name);
    setCustomAvatar(avatar);
    setNotifications(realNotifs);
    setHasUnread(unread);
    setTodayLogged(new Set(data.todayActions));

    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleActionClick = async (action: typeof HOME_ACTIONS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (todayLogged.has(action.id)) {
      const updated = await storage.removeAction(action.points, action.id);
      setUserData(updated);
      setTodayLogged(new Set(updated.todayActions));
      Toast.show({
        type: 'info',
        text1: 'Action Removed ✓',
        text2: `"${action.title}" undone.`,
      });
      return;
    }

    const updated = await storage.addPoints(action.points, [action.id]);
    setUserData(updated);
    setTodayLogged(new Set(updated.todayActions));

    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
    }, 2800);
  };

  const points = userData?.todayPoints ?? 15;
  const streak = userData?.currentStreak ?? 5;
  const actionsLogged = userData?.todayActions?.length ?? 1;

  if (!userData) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#2D7A40" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />

      {/* Confetti Animation Burst */}
      <ConfettiOverlay visible={showCelebration} onAnimationEnd={() => setShowCelebration(false)} />

      {/* Floating Action Logged Success Banner (Screenshot 2) */}
      {showCelebration && (
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D7A40" />}
      >
        <Animated.View style={{ opacity: fadeIn }}>
          {/* Header Row: User Avatar, Greeting, Streak Pill & Bell */}
          <View style={styles.headerRow}>
            <View style={styles.userInfoRow}>
              {/* User Avatar */}
              <TouchableOpacity
                style={styles.avatarWrap}
                onPress={() => router.push('/profile')}
                activeOpacity={0.8}
              >
                {customAvatar ? (
                  <Image source={{ uri: customAvatar }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarLetter}>{userName[0]?.toUpperCase() || 'A'}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Greeting & Name */}
              <View style={styles.userTextWrap}>
                <Text style={styles.greetingText}>Good Morning</Text>
                <View style={styles.nameRow}>
                  <Text style={styles.userNameText}>{userName}</Text>
                  <Text style={styles.leafIcon}>🌿</Text>
                </View>
              </View>

              {/* Streak Pill */}
              <View style={styles.streakPill}>
                <Text style={styles.streakText}>🔥 {streak} days streak</Text>
              </View>
            </View>

            {/* Bell Notification Button */}
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => setShowNotifications(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color="#0f172a" />
              {hasUnread && <View style={styles.bellDot} />}
            </TouchableOpacity>
          </View>

          {/* Today's Impact Green Banner Card (Pixel-Perfect Match for Screenshot) */}
          <View style={styles.impactCardContainer}>
            <View style={styles.impactHeaderRow}>
              <Text style={styles.impactTitle}>Today's Impact</Text>
              <TouchableOpacity onPress={() => Toast.show({ type: 'info', text1: "Today's Impact", text2: "Calculated based on eco actions logged today." })}>
                <Ionicons name="information-circle-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* 3 White Inner Stat Cards */}
            <View style={styles.statCardsRow}>
              {/* Card 1: CO2 Saved */}
              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, { backgroundColor: '#E7F6E7' }]}>
                  <Ionicons name="leaf" size={22} color="#4A8834" />
                </View>
                <Text style={styles.statValue}>0.8kg</Text>
                <Text style={styles.statLabel}>CO2 saved</Text>
              </View>

              {/* Card 2: Items Avoided */}
              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, { backgroundColor: '#E4F5E6' }]}>
                  <Ionicons name="sync" size={22} color="#388E3C" />
                </View>
                <Text style={styles.statValue}>2</Text>
                <Text style={styles.statLabel}>items avoided</Text>
              </View>

              {/* Card 3: Water Saved */}
              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, { backgroundColor: '#E0F7FA' }]}>
                  <Ionicons name="water" size={22} color="#00838F" />
                </View>
                <Text style={styles.statValue}>5L</Text>
                <Text style={styles.statLabel}>water saved</Text>
              </View>
            </View>
          </View>

          {/* Plan a Sustainable Week Banner Card */}
          <TouchableOpacity
            style={styles.weeklyBannerCard}
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/log')}
          >
            <View style={styles.weeklyBannerContent}>
              <Text style={styles.weeklyBannerTitle}>Plan a sustainable week</Text>
              <Text style={styles.weeklyBannerSubtitle}>Set goals and track your habits.</Text>
            </View>

            <View style={styles.weeklyBannerRightGroup}>
              <Image
                source={require('../../assets/images/plant_potted.png')}
                style={styles.weeklyPlantImage}
                resizeMode="contain"
              />
              <View style={styles.weeklyBannerArrowBtn}>
                <Ionicons name="arrow-forward" size={20} color="#2D7A40" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Log Actions Section Header */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Log Actions</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/log')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* 2x2 Grid of Quick Actions */}
          <View style={styles.gridContainer}>
            {HOME_ACTIONS.map((item) => {
              const isLogged = todayLogged.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.gridCard, isLogged && styles.gridCardActive]}
                  onPress={() => handleActionClick(item)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.gridPointsText}>+{item.points}pts</Text>

                  <View style={[styles.gridIconCircle, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon} size={24} color={item.iconColor} />
                  </View>

                  <Text style={styles.gridCardTitle}>{item.title}</Text>
                  <Text style={styles.gridCardSubtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowNotifications(false)}>
          <Pressable style={styles.notifPanel} onPress={(e) => e.stopPropagation()}>
            <View style={styles.notifHandle} />
            <View style={styles.notifPanelHeader}>
              <Text style={styles.notifPanelTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.notifEmptyState}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>🔔</Text>
                <Text style={styles.notifEmptyTitle}>No notifications yet</Text>
                <Text style={styles.notifEmptyBody}>
                  Action updates and streak rewards will appear here.
                </Text>
              </View>
            ) : (
              notifications.map((n, i) => (
                <View key={n.id || i} style={styles.notifItem}>
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{n.icon || '🌿'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    <Text style={styles.notifBody}>{n.body}</Text>
                  </View>
                </View>
              ))
            )}
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
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 52 : StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 36,
    paddingHorizontal: 20,
    paddingBottom: 36,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2D7A40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 18,
    color: '#ffffff',
  },
  userTextWrap: {
    marginRight: 10,
  },
  greetingText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    color: '#64748b',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userNameText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 16,
    color: '#0f172a',
  },
  leafIcon: {
    fontSize: 14,
  },
  streakPill: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'center',
  },
  streakText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 11,
    color: '#D97706',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  impactCardContainer: {
    backgroundColor: '#28783C',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#28783C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  impactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  impactTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 18,
    color: '#ffffff',
  },
  statCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  weeklyBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#236533',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 24,
    overflow: 'hidden',
  },
  weeklyBannerContent: {
    flex: 1,
    paddingRight: 8,
  },
  weeklyBannerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 17,
    color: '#ffffff',
    marginBottom: 4,
  },
  weeklyBannerSubtitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  weeklyBannerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyPlantImage: {
    width: 68,
    height: 68,
    marginRight: -10,
    zIndex: 1,
  },
  weeklyBannerArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 17,
    color: '#0f172a',
  },
  viewAllText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: '#2D7A40',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  gridCard: {
    width: (width - 54) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  gridCardActive: {
    borderColor: '#2D7A40',
    backgroundColor: '#F0FDF4',
  },
  gridPointsText: {
    position: 'absolute',
    top: 14,
    right: 14,
    fontFamily: Typography.fontFamily.bold,
    fontSize: 13,
    color: '#2D7A40',
  },
  gridIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  gridCardTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 16,
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  gridCardSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 17,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  notifPanel: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  notifHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  notifPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  notifPanelTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 18,
    color: '#0f172a',
  },
  notifEmptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  notifEmptyTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 4,
  },
  notifEmptyBody: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  notifTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: '#0f172a',
  },
  notifBody: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    color: '#64748b',
  },
});

