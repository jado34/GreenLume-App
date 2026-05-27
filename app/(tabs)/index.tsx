// Home Dashboard — Avatar header, working notifications, full-width 2-col quick actions
import { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, RefreshControl, Modal, Pressable, Image, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { storage, UserData } from '../../utils/storage';
import { Colors } from '../../constants/colors';
import { Typography, Shadows } from '../../constants/typography';
import { getDynamicTheme } from '../../utils/theme';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 52) / 2; // 2 cols, section padding 20×2, 1 gap of 12

const QUICK_ACTIONS = [
  { id: 'reusable_bag', name: 'Reusable Bag', points: 15, icon: 'bag-handle' as const, color: '#8b5cf6' },
  { id: 'public_transit', name: 'Public Transit', points: 25, icon: 'bus' as const, color: '#3b82f6' },
  { id: 'plant_meal', name: 'Plant Meal', points: 20, icon: 'leaf' as const, color: '#10b981' },
  { id: 'recycled', name: 'Recycled', points: 10, icon: 'refresh-circle' as const, color: '#06b6d4' },
  { id: 'no_plastic', name: 'Zero Plastic', points: 15, icon: 'water-outline' as const, color: '#0ea5e9' },
  { id: 'lights_off', name: 'Energy Saved', points: 8, icon: 'bulb-outline' as const, color: '#f59e0b' },
];

const WEEKLY_CHALLENGES = [
  { id: 'transport_week', title: 'Public Transport Week 🚌', goal: 'Use public transit 7 days', color: '#3b82f6', emoji: '🚌', actionKey: 'public_transit' },
  { id: 'plantbased_week', title: 'Plant-Based Week 🌱', goal: 'Eat plant-based meals for 7 days', color: '#10b981', emoji: '🌱', actionKey: 'plant_meal' },
  { id: 'zerowaste_week', title: 'Zero Waste Week ♻️', goal: 'Avoid single-use plastic for 7 days', color: '#8b5cf6', emoji: '♻️', actionKey: 'no_plastic' },
];

const NOTIFICATIONS = [
  { id: '1', icon: '🔥', title: 'Keep your streak going!', body: 'Log an action today to maintain your streak.', time: 'Just now' },
  { id: '2', icon: '🏆', title: 'Badge almost unlocked!', body: 'Log 1 more action to earn "First Steps" badge.', time: '2h ago' },
  { id: '3', icon: '🌍', title: 'Weekly Challenge started', body: 'Public Transport Week is live — join now!', time: '1d ago' },
  { id: '4', icon: '💚', title: 'You\'re making a difference!', body: 'Your actions have saved measurable CO₂ this week.', time: '2d ago' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const AVATAR_COLORS = ['#2e7d32','#1565c0','#6a1b9a','#c62828','#00838f','#f57f17'];
function getAvatarColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length || 0;
  return AVATAR_COLORS[idx];
}

export default function HomeScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userName, setUserName] = useState('');
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [todayLogged, setTodayLogged] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [needsWaterNudge, setNeedsWaterNudge] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    const data = await storage.getUserData();
    const name = await storage.getUserName();
    const avatar = await storage.getCustomAvatar();
    const premiumStatus = await storage.isPremium();
    setUserData(data);
    setUserName(name);
    setCustomAvatar(avatar);
    setIsPremium(premiumStatus);
    setTodayLogged(new Set(data.todayActions));
    
    // Check if any plants need water
    const thirsty = data.activeForest?.some(p => p.waterLevel <= 50 && p.stage !== 'withered');
    setNeedsWaterNudge(thirsty || false);

    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleQuickAction = async (action: typeof QUICK_ACTIONS[0]) => {
    if (todayLogged.has(action.id)) {
      // Undo action
      const updated = await storage.removeAction(action.points, action.id);
      setUserData(updated);
      setTodayLogged(new Set(updated.todayActions));
      Toast.show({ 
        type: 'info', 
        text1: 'Action removed ✓', 
        text2: `"${action.name}" has been undone.` 
      });
      return;
    }
    const updated = await storage.addPoints(action.points, [action.id]);
    setUserData(updated);
    setTodayLogged(new Set(updated.todayActions));
    Toast.show({ type: 'success', text1: `+${action.points} pts! 🎉`, text2: `${action.name} logged. Keep it up!` });
  };

  const getWeekProgress = (actionKey: string): number => {
    if (!userData) return 0;
    // FIX #5: Count distinct days this week the action was logged
    const weekKey = userData.lastWeekKey;
    if (!weekKey || !userData.weeklyActionLog?.[weekKey]?.[actionKey]) return 0;
    return userData.weeklyActionLog[weekKey][actionKey].length;
  };

  const points = userData?.todayPoints ?? 0;
  const streak = userData?.currentStreak ?? 0;
  const actionsLogged = userData?.todayActions?.length ?? 0;
  const avatarLetter = userName ? userName[0].toUpperCase() : 'G';
  const avatarColor = getAvatarColor(userName || 'G');

  const theme = getDynamicTheme(points);

  // FIX #31: Show loading indicator while data is first loading
  if (!userData) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginTop: 12 }}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <LinearGradient colors={[theme.primaryDark, theme.primary]} style={styles.header}>
          <View style={styles.headerTop}>
            {/* Avatar */}
            <TouchableOpacity 
              style={[styles.headerAvatar, !customAvatar && { backgroundColor: avatarColor }]} 
              onPress={() => router.push('/profile')}
              activeOpacity={0.8}
              accessibilityLabel="View my profile"
              accessibilityRole="button"
            >
              {customAvatar ? (
                <Image source={{ uri: customAvatar }} style={{ width: '100%', height: '100%', borderRadius: 21 }} />
              ) : (
                <Text style={styles.headerAvatarText}>{avatarLetter}</Text>
              )}
            </TouchableOpacity>
            {/* Notification Bell */}
            <TouchableOpacity 
              style={styles.bell} 
              onPress={() => setShowNotifications(true)}
              accessibilityLabel="Open notifications"
              accessibilityRole="button"
            >
              <Ionicons name="notifications" size={22} color="rgba(255,255,255,0.9)" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
          <Text style={styles.greeting}>{getGreeting()}, {userName} 👋</Text>

          {/* Stats Card */}
          <View style={[
            styles.statsCard, 
            { backgroundColor: theme.statsCardBg },
            points >= 1000 && { shadowColor: theme.primary, shadowOpacity: 0.4, shadowRadius: 15, elevation: 12 }
          ]}>
            <View style={styles.statItem} accessibilityLabel={`${points} Green Score points today`}>
              <Text style={[styles.statNumber, { color: theme.statsTextColor }]}>{points.toLocaleString()}</Text>
              <Text style={[styles.statLabel, { color: theme.statsLabelColor }]}>Today's{'\n'}Points</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.statsDividerColor }]} />
            <View style={styles.statItem} accessibilityLabel={`${streak} day streak`}>
              <Text style={[styles.statNumber, { color: theme.statsTextColor }]}>🔥 {streak}</Text>
              <Text style={[styles.statLabel, { color: theme.statsLabelColor }]}>Day Streak</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.statsDividerColor }]} />
            <View style={styles.statItem} accessibilityLabel={`${actionsLogged} Actions Taken today`}>
              <Text style={[styles.statNumber, { color: theme.statsTextColor }]}>🍃 {actionsLogged}</Text>
              <Text style={[styles.statLabel, { color: theme.statsLabelColor }]}>Today's{'\n'}Actions</Text>
            </View>
          </View>
        </LinearGradient>

        <Animated.View style={{ opacity: fadeIn }}>
          
          {/* Nudge Banner (Loss Aversion) */}
          {needsWaterNudge && (
            <TouchableOpacity 
              style={{ marginHorizontal: 20, marginTop: 24, backgroundColor: '#fef2f2', borderColor: '#ef4444', borderWidth: 2, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#ef4444', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}
              onPress={() => router.push('/nursery' as any)}
              activeOpacity={0.9}
              accessibilityLabel="Emergency: Plants need watering. Tap to go to your nursery."
              accessibilityRole="alert"
            >
              <Text style={{ fontSize: 36, marginRight: 14 }}>🚨</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.fontSize.md, color: '#b91c1c', marginBottom: 2 }}>EMERGENCY NUDGE</Text>
                <Text style={{ fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: '#dc2626', lineHeight: 20 }}>Your plants are drying up! Tap here to water them before they wither completely.</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/log')}>
                <Text style={styles.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map((action) => {
                const done = todayLogged.has(action.id);
                return (
                  <TouchableOpacity
                    key={action.id}
                    style={[styles.quickCard, done && { backgroundColor: action.color, borderColor: action.color }]}
                    onPress={() => handleQuickAction(action)}
                    activeOpacity={0.85}
                    accessibilityLabel={`Log ${action.name} action, worth ${action.points} points`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: done }}
                  >
                    <View style={[styles.quickIcon, done ? { backgroundColor: 'rgba(255,255,255,0.25)' } : { backgroundColor: `${action.color}18` }]}>
                      <Ionicons name={done ? 'checkmark' : action.icon} size={22} color={done ? Colors.white : action.color} />
                    </View>
                    <Text style={[styles.quickName, done && { color: Colors.white }]} numberOfLines={2}>{action.name}</Text>
                    <Text style={[styles.quickPoints, done && { color: 'rgba(255,255,255,0.85)' }]}>+{action.points} pts</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Weekly Challenges */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Challenges</Text>
            <View style={{ gap: 12 }}>
              {WEEKLY_CHALLENGES.map((challenge) => {
                const progress = getWeekProgress(challenge.actionKey);
                const pct = Math.round((progress / 7) * 100);
                return (
                  <TouchableOpacity 
                    key={challenge.id} 
                    style={styles.challengeCard}
                    activeOpacity={0.8}
                    onPress={() => Toast.show({ type: 'info', text1: challenge.title, text2: challenge.goal })}
                  >
                    <View style={styles.challengeHeader}>
                      <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.challengeLabel}>WEEKLY CHALLENGE</Text>
                        <Text style={styles.challengeTitle}>{challenge.title}</Text>
                        <Text style={styles.challengeGoal}>{progress} of 7 days complete</Text>
                      </View>
                      <Text style={[styles.challengePct, { color: challenge.color }]}>{pct}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: challenge.color }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* AI Coach Insights (Premium or Locked) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>AI Eco-Coach</Text>
              <Ionicons name="sparkles" size={18} color="#0ea5e9" />
            </View>
            <TouchableOpacity 
              style={[styles.challengeCard, { borderColor: '#0ea5e9', backgroundColor: '#f0f9ff' }]}
              activeOpacity={0.8}
              onPress={() => isPremium ? router.push('/ai-coach' as any) : router.push('/premium' as any)}
            >
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeEmoji}>🤖</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.challengeLabel, { color: '#0ea5e9' }]}>
                    {isPremium ? 'PREMIUM UNLOCKED' : 'SMART INSIGHTS'}
                  </Text>
                  <Text style={styles.challengeTitle}>
                    {isPremium ? 'View Daily Coaching' : 'Unlock Personalized Tips'}
                  </Text>
                  <Text style={styles.challengeGoal}>
                    {isPremium ? 'Your AI has analyzed your recent actions' : 'Discover how to double your impact'}
                  </Text>
                </View>
                <View style={{ backgroundColor: '#e0f2fe', padding: 8, borderRadius: 12 }}>
                  <Ionicons name={isPremium ? "arrow-forward" : "lock-closed"} size={20} color="#0ea5e9" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { marginBottom: 24 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Impact This Week</Text>
              <TouchableOpacity onPress={() => router.push('/nursery' as any)}>
                <Text style={styles.seeAll}>View Forest 🌲</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.impactRow} 
              onPress={() => router.push('/nursery' as any)}
              activeOpacity={0.9}
            >
              {[
                { icon: 'cloud-outline', label: 'CO₂ Saved', value: `${((points / 100) * 0.8).toFixed(1)}kg`, color: '#10b981' },
                { icon: 'water-outline', label: 'Water Saved', value: `${Math.floor(points * 0.5)}L`, color: '#06b6d4' },
                { icon: 'refresh-circle-outline', label: 'Plastic Avoided', value: `${Math.floor(actionsLogged * 0.3)} items`, color: '#8b5cf6' },
              ].map((item) => (
                <View key={item.label} style={styles.impactCard}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                  <Text style={[styles.impactValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={styles.impactLabel}>{item.label}</Text>
                </View>
              ))}
            </TouchableOpacity>
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
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {NOTIFICATIONS.map((n, i) => (
              <TouchableOpacity
                key={n.id}
                style={[styles.notifItem, i < NOTIFICATIONS.length - 1 && styles.notifItemBorder]}
                activeOpacity={0.7}
                accessibilityLabel={`${n.title}: ${n.body}. ${n.time}`}
                accessibilityRole="button"
              >
                <View style={styles.notifIconWrap}>
                  <Text style={{ fontSize: 22 }}>{n.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  <Text style={styles.notifBody} numberOfLines={2}>{n.body}</Text>
                  <Text style={styles.notifTime}>{n.time}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.notifClearBtn} onPress={() => { setShowNotifications(false); Toast.show({ type: 'success', text1: 'Notifications cleared ✓' }); }}>
              <Text style={styles.notifClearText}>Mark all as read</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral50 },
  header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  headerAvatarText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.white },
  bell: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1.5, borderColor: '#2e7d32' },
  greeting: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl, color: 'rgba(255,255,255,0.95)', marginBottom: 20 },
  statsCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'], color: Colors.white },
  statLabel: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs, color: 'rgba(255, 255, 255, 0.95)', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)' },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  // FIX #16: Remove marginBottom from sectionTitle to avoid double spacing when inside sectionHeader
  sectionTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.textPrimary },
  seeAll: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.primary },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    width: CARD_SIZE, backgroundColor: Colors.white,
    borderRadius: 14, padding: 12, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.neutral200, ...Shadows.sm,
  },
  quickIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  quickName: { fontFamily: Typography.fontFamily.semiBold, fontSize: 10, color: Colors.textPrimary, textAlign: 'center' },
  quickPoints: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs, color: Colors.primary },
  challengeCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, ...Shadows.sm, borderWidth: 1, borderColor: Colors.neutral200 },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  challengeEmoji: { fontSize: 32 },
  challengeLabel: { fontFamily: Typography.fontFamily.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: 2 },
  challengeTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.textPrimary },
  challengeGoal: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  challengePct: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl },
  progressTrack: { height: 6, backgroundColor: Colors.neutral100, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  impactRow: { flexDirection: 'row', gap: 10 },
  impactCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, ...Shadows.sm, borderWidth: 1, borderColor: Colors.neutral200 },
  impactValue: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg },
  impactLabel: { fontFamily: Typography.fontFamily.regular, fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  // Notification Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  notifPanel: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  notifHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.neutral300, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  notifPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.neutral100 },
  notifPanelTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.textPrimary },
  notifItem: { flexDirection: 'row', gap: 14, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'flex-start' },
  notifItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.neutral100 },
  notifIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary90, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, color: Colors.textPrimary, marginBottom: 2 },
  notifBody: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  notifTime: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 4 },
  notifClearBtn: { marginHorizontal: 20, marginTop: 16, paddingVertical: 14, backgroundColor: Colors.primary90, borderRadius: 14, alignItems: 'center' },
  notifClearText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, color: Colors.primary },
});
