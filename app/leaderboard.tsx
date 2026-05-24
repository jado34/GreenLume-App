import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { storage, UserData } from '../utils/storage';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { Colors } from '../constants/colors';
import { Typography, Shadows } from '../constants/typography';

const { width } = Dimensions.get('window');

interface LeaderboardEntry {
  rank: number;
  display_name: string;
  total_points: number;
  current_streak: number;
  avatar_color: string;
}

const MOCK_COMPANY_USERS: Record<string, Omit<LeaderboardEntry, 'rank'>[]> = {
  'Google Inc.': [
    { display_name: 'Sarah Chen', total_points: 4850, current_streak: 22, avatar_color: '#0f9d58' },
    { display_name: 'David Miller', total_points: 3920, current_streak: 15, avatar_color: '#4285f4' },
    { display_name: 'Elena Rostova', total_points: 3100, current_streak: 12, avatar_color: '#f4b400' },
    { display_name: 'Marcus Brody', total_points: 2450, current_streak: 8, avatar_color: '#db4437' },
  ],
  'Microsoft Corp.': [
    { display_name: 'Satya N.', total_points: 5200, current_streak: 30, avatar_color: '#f25022' },
    { display_name: 'Amy Hood', total_points: 4100, current_streak: 18, avatar_color: '#7fba00' },
    { display_name: 'Brad Smith', total_points: 3800, current_streak: 14, avatar_color: '#00a4ef' },
  ],
  'Apple Inc.': [
    { display_name: 'Tim Cook', total_points: 6100, current_streak: 40, avatar_color: '#333333' },
    { display_name: 'Craig F.', total_points: 5400, current_streak: 29, avatar_color: '#8e8e93' },
    { display_name: 'Lisa Jackson', total_points: 4900, current_streak: 25, avatar_color: '#34c759' },
  ],
  'Acme Corporation': [
    { display_name: 'Wile E. Coyote', total_points: 2900, current_streak: 9, avatar_color: '#e65100' },
    { display_name: 'Road Runner', total_points: 5800, current_streak: 35, avatar_color: '#00838f' },
  ]
};

const DEFAULT_GLOBAL_MOCK: LeaderboardEntry[] = [
  { rank: 1, display_name: 'EcoWarrior', total_points: 15420, current_streak: 45, avatar_color: '#2e7d32' },
  { rank: 2, display_name: 'GreenChampion', total_points: 12850, current_streak: 38, avatar_color: '#1565c0' },
  { rank: 3, display_name: 'PlanetSaver', total_points: 11200, current_streak: 32, avatar_color: '#6a1b9a' },
  { rank: 4, display_name: 'SustainabilityPro', total_points: 9850, current_streak: 28, avatar_color: '#c62828' },
  { rank: 5, display_name: 'NatureLover', total_points: 8200, current_streak: 21, avatar_color: '#00838f' },
];

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<'global' | 'company' | 'squad'>('global');
  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userName, setUserName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchGlobalLeaderboard = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setGlobalEntries(DEFAULT_GLOBAL_MOCK);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('display_name, total_points, current_streak, avatar_color')
        .order('total_points', { ascending: false })
        .limit(50);

      if (error) throw error;

      const ranked = (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      })) as LeaderboardEntry[];

      setGlobalEntries(ranked);
    } catch (err) {
      console.error('Leaderboard error:', err);
      Toast.show({ type: 'error', text1: 'Failed to load leaderboard' });
    } finally {
      setLoading(false);
    }
  }, []);

  const syncLeaderboardSilently = async (data: UserData, name: string) => {
    if (!isSupabaseConfigured() || !data || !name) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const avatarColors = ['#2e7d32', '#1565c0', '#6a1b9a', '#c62828', '#00838f', '#e65100'];
      const avatarColor = avatarColors[name.charCodeAt(0) % avatarColors.length];

      await supabase.from('leaderboard').upsert({
        user_id: user.id,
        display_name: name,
        total_points: data.totalPoints,
        current_streak: data.currentStreak,
        actions_logged: data.actionsLogged,
        avatar_color: avatarColor,
      }, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('Silent score sync failed:', err);
    }
  };

  useFocusEffect(useCallback(() => {
    const init = async () => {
      const [data, name] = await Promise.all([
        storage.getUserData(),
        storage.getUserName(),
      ]);
      setUserData(data);
      setUserName(name);

      if (data && name) {
        await syncLeaderboardSilently(data, name);
      }
      await fetchGlobalLeaderboard();
    };

    setLoading(true);
    init();
  }, [fetchGlobalLeaderboard]));

  const onRefresh = async () => {
    setRefreshing(true);
    const [data, name] = await Promise.all([
      storage.getUserData(),
      storage.getUserName(),
    ]);
    setUserData(data);
    setUserName(name);

    if (data && name) {
      await syncLeaderboardSilently(data, name);
    }
    await fetchGlobalLeaderboard();
    setRefreshing(false);
  };

  // Compute active tab entries dynamically
  const activeEntries = useMemo<LeaderboardEntry[]>(() => {
    if (!userData) return [];

    const userPoints = userData.totalPoints;
    const userStreak = userData.currentStreak;
    const userAvatarColor = Colors.primary;

    if (activeTab === 'global') {
      // Check if user is already in global entries
      const inList = globalEntries.some(e => e.display_name === userName);
      if (inList) return globalEntries;

      // Otherwise append user to list and sort
      const list = [
        ...globalEntries,
        { rank: 99, display_name: userName, total_points: userPoints, current_streak: userStreak, avatar_color: userAvatarColor }
      ];
      return list
        .sort((a, b) => b.total_points - a.total_points)
        .map((e, idx) => ({ ...e, rank: idx + 1 }));
    }

    if (activeTab === 'company') {
      const company = userData.companyName;
      if (!company) return [];

      const companyMocks = MOCK_COMPANY_USERS[company] || [];
      const list = [
        ...companyMocks,
        { display_name: userName, total_points: userPoints, current_streak: userStreak, avatar_color: userAvatarColor }
      ];
      return list
        .sort((a, b) => b.total_points - a.total_points)
        .map((e, idx) => ({ ...e, rank: idx + 1 }));
    }

    if (activeTab === 'squad') {
      const squad = userData.customSquadName;
      if (!squad || !userData.isPremium) return [];

      const list = [
        { display_name: 'Sarah T. (Pending)', total_points: 0, current_streak: 0, avatar_color: '#9e9e9e' },
        { display_name: 'Dave M.', total_points: userPoints > 1000 ? Math.floor(userPoints * 0.8) : 800, current_streak: Math.max(1, userStreak - 2), avatar_color: '#3b82f6' },
        { display_name: userName, total_points: userPoints, current_streak: userStreak, avatar_color: userAvatarColor }
      ];
      return list
        .sort((a, b) => b.total_points - a.total_points)
        .map((e, idx) => ({ ...e, rank: idx + 1 }));
    }

    return [];
  }, [activeTab, globalEntries, userData, userName]);

  const handleTabChange = (tab: 'global' | 'company' | 'squad') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'G';

  // Podium components mapping
  const podiumData = useMemo(() => {
    const topThree = activeEntries.slice(0, 3);
    const podium: (LeaderboardEntry | null)[] = [null, null, null]; // [2nd, 1st, 3rd]
    
    topThree.forEach(entry => {
      if (entry.rank === 1) podium[1] = entry;
      else if (entry.rank === 2) podium[0] = entry;
      else if (entry.rank === 3) podium[2] = entry;
    });

    return podium;
  }, [activeEntries]);

  const listData = useMemo(() => {
    return activeEntries.slice(3);
  }, [activeEntries]);

  // Current User Stat Card Info
  const currentUserRank = useMemo(() => {
    const foundIdx = activeEntries.findIndex(e => e.display_name === userName);
    return foundIdx !== -1 ? foundIdx + 1 : null;
  }, [activeEntries, userName]);

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Eco-Leaderboards</Text>
          <TouchableOpacity 
            style={styles.syncBtn} 
            onPress={onRefresh}
            accessibilityLabel="Refresh leaderboard"
            accessibilityRole="button"
          >
            <Ionicons name="sync" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Brand Segment Tabs */}
        <View style={styles.tabContainer}>
          {[
            { id: 'global', label: 'Global', icon: 'globe-outline' },
            { id: 'company', label: 'Company', icon: 'business-outline' },
            { id: 'squad', label: 'Custom Squad', icon: 'people-outline' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => handleTabChange(tab.id as any)}
              >
                <Ionicons name={tab.icon as any} size={16} color={isActive ? Colors.primary : Colors.white} />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {/* Main Body */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching rankings...</Text>
          </View>
        ) : activeTab === 'company' && !userData?.companyName ? (
          /* Empty/No Team State */
          <View style={styles.stateCard}>
            <View style={[styles.stateIconContainer, { backgroundColor: 'rgba(46, 125, 50, 0.1)' }]}>
              <Ionicons name="business-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.stateTitle}>Not in a Corporate Team</Text>
            <Text style={styles.stateDesc}>
              Link your profile to your company ESG challenges to compete directly with coworkers and log collective corporate impacts!
            </Text>
            <TouchableOpacity 
              style={styles.stateActionBtn}
              onPress={() => router.push('/teams')}
            >
              <Text style={styles.stateActionBtnText}>Join Company Team</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'squad' && !userData?.isPremium ? (
          /* Locked Premium State */
          <View style={styles.stateCard}>
            <LinearGradient colors={['#052008', '#0b390e']} style={styles.premiumLockGradient}>
              <View style={styles.lockBadgeRow}>
                <Ionicons name="lock-closed" size={20} color="#fbbf24" />
                <Text style={styles.lockBadgeText}>Earth+ Feature</Text>
              </View>
              <Text style={[styles.stateTitle, { color: Colors.white, marginTop: 12 }]}>Squad Leaderboards</Text>
              <Text style={[styles.stateDesc, { color: 'rgba(255, 255, 255, 0.75)' }]}>
                Upgrade to Earth+ Premium to launch custom squads, generate invite codes, and compete on private circles with friends and family.
              </Text>
              <TouchableOpacity 
                style={[styles.stateActionBtn, { backgroundColor: '#fbbf24', borderWidth: 0 }]}
                onPress={() => router.push('/premium')}
              >
                <Text style={[styles.stateActionBtnText, { color: '#052008' }]}>Unlock Earth+ ($1.99/mo)</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : activeTab === 'squad' && userData?.isPremium && !userData?.customSquadName ? (
          /* Premium but no squad created */
          <View style={styles.stateCard}>
            <View style={[styles.stateIconContainer, { backgroundColor: 'rgba(14, 165, 233, 0.1)' }]}>
              <Ionicons name="people-outline" size={48} color="#0ea5e9" />
            </View>
            <Text style={styles.stateTitle}>No Active Squad</Text>
            <Text style={styles.stateDesc}>
              You haven't launched or joined a custom squad yet. Create one on the Teams dashboard to share your private invite code!
            </Text>
            <TouchableOpacity 
              style={[styles.stateActionBtn, { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' }]}
              onPress={() => router.push('/teams')}
            >
              <Text style={styles.stateActionBtnText}>Setup Custom Squad</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Render Active Leaderboard */
          <View>
            {/* Top 3 Podiums */}
            <View style={styles.podiumWrapper}>
              {podiumData.map((entry, index) => {
                if (!entry) {
                  // Fallback placeholder if less than 3 players
                  return <View key={`empty-${index}`} style={styles.emptyPodiumCard} />;
                }

                const isFirst = entry.rank === 1;
                const isSecond = entry.rank === 2;
                const isThird = entry.rank === 3;
                
                let rankColor = '#666';
                let podiumHeight = 140;
                let bgGradient = [Colors.white, Colors.white];

                if (isFirst) {
                  rankColor = '#fbbf24';
                  podiumHeight = 180;
                } else if (isSecond) {
                  rankColor = '#cbd5e1';
                  podiumHeight = 150;
                } else if (isThird) {
                  rankColor = '#b45309';
                  podiumHeight = 135;
                }

                return (
                  <View 
                    key={entry.rank} 
                    style={[
                      styles.podiumCard, 
                      { height: podiumHeight }, 
                      isFirst && styles.firstPodiumCard
                    ]}
                  >
                    {/* Crown / Trophy Overlay for Rank 1 */}
                    {isFirst && (
                      <View style={styles.crownOverlay}>
                        <Ionicons name="trophy" size={24} color="#fbbf24" />
                      </View>
                    )}

                    <View style={[styles.podiumAvatar, { backgroundColor: entry.avatar_color, borderColor: rankColor }]}>
                      <Text style={styles.podiumAvatarText}>{getInitials(entry.display_name)}</Text>
                      <View style={[styles.rankMedal, { backgroundColor: rankColor }]}>
                        <Text style={styles.rankMedalText}>{entry.rank}</Text>
                      </View>
                    </View>

                    <Text style={styles.podiumName} numberOfLines={1}>{entry.display_name}</Text>
                    <Text style={[styles.podiumPoints, isFirst && { fontSize: 18 }]}>{entry.total_points.toLocaleString()}</Text>
                    <Text style={styles.podiumStreak}>🔥 {entry.current_streak}d</Text>
                  </View>
                );
              })}
            </View>

            {/* List for Rank 4+ */}
            {listData.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Runner-Ups</Text>
                {listData.map((entry) => {
                  const isSelf = entry.display_name === userName;
                  return (
                    <View 
                      key={entry.rank} 
                      style={[
                        styles.listItem, 
                        isSelf && styles.listSelfItem
                      ]}
                    >
                      <Text style={styles.listRank}>{getRankEmoji(entry.rank)}</Text>
                      <View style={[styles.listAvatar, { backgroundColor: entry.avatar_color }]}>
                        <Text style={styles.listAvatarText}>{getInitials(entry.display_name)}</Text>
                      </View>
                      <View style={styles.listInfo}>
                        <View style={styles.nameRow}>
                          <Text style={[styles.listName, isSelf && { fontFamily: Typography.fontFamily.bold }]}>
                            {entry.display_name}
                          </Text>
                          {isSelf && (
                            <View style={styles.selfBadge}>
                              <Text style={styles.selfBadgeText}>YOU</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.listStreak}>🔥 {entry.current_streak} day streak</Text>
                      </View>
                      <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>{entry.total_points.toLocaleString()} pts</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Current User Static Floating Bar at the bottom */}
        {userData && currentUserRank !== null && !loading && (
          <View style={styles.floatingUserBar}>
            <View style={styles.floatingUserInfo}>
              <View style={[styles.floatingRankBadge, currentUserRank <= 3 && { backgroundColor: '#fbbf24' }]}>
                <Text style={styles.floatingRankText}>{getRankEmoji(currentUserRank)}</Text>
              </View>
              <View style={[styles.listAvatar, { backgroundColor: Colors.primary, width: 36, height: 36, borderRadius: 18 }]}>
                <Text style={[styles.listAvatarText, { fontSize: 13 }]}>{getInitials(userName)}</Text>
              </View>
              <Text style={styles.floatingUserName} numberOfLines={1}>Your Ranking</Text>
            </View>
            <View style={styles.floatingUserStats}>
              <Text style={styles.floatingUserPoints}>{userData.totalPoints.toLocaleString()} pts</Text>
              <Text style={styles.floatingUserStreak}>🔥 {userData.currentStreak}d</Text>
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.white,
  },
  syncBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 20,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: Colors.white,
  },
  tabText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 12,
    color: Colors.white,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 16,
  },
  loadingText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  
  /* Empty States / Locks */
  stateCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Shadows.md,
    marginTop: 40,
    overflow: 'hidden',
  },
  premiumLockGradient: {
    padding: 24,
    width: width - 32 - 48, // Accommodate scroll margins
    alignItems: 'center',
    borderRadius: 24,
    margin: -24, // bleed layout colors
  },
  lockBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  lockBadgeText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    color: '#fbbf24',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stateIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stateTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  stateDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  stateActionBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    ...Shadows.sm,
  },
  stateActionBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
  },

  /* Podium Styles */
  podiumWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginVertical: 24,
    gap: 8,
  },
  podiumCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Shadows.sm,
    position: 'relative',
  },
  firstPodiumCard: {
    borderWidth: 2,
    borderColor: '#fbbf24',
    ...Shadows.md,
    zIndex: 1,
  },
  crownOverlay: {
    position: 'absolute',
    top: -18,
    alignSelf: 'center',
    zIndex: 10,
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 8,
    position: 'relative',
  },
  podiumAvatarText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 13,
    color: Colors.white,
  },
  rankMedal: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankMedalText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    color: Colors.white,
  },
  podiumName: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 11,
    color: Colors.textPrimary,
    textAlign: 'center',
    maxWidth: 70,
  },
  podiumPoints: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 15,
    color: Colors.primary,
    marginTop: 2,
  },
  podiumStreak: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 1,
  },
  emptyPodiumCard: {
    flex: 1,
    height: 130,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },

  /* Runner-Ups List */
  listSection: {
    marginTop: 12,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Shadows.sm,
  },
  listSelfItem: {
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
    borderColor: 'rgba(46, 125, 50, 0.2)',
    borderWidth: 1.5,
  },
  listRank: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    width: 28,
    textAlign: 'center',
  },
  listAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listAvatarText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    color: Colors.white,
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listName: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  selfBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selfBadgeText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 8,
    color: Colors.white,
  },
  listStreak: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  pointsBadge: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pointsText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
  },

  /* Floating Bar */
  floatingUserBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a2f0c',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 20,
    ...Shadows.lg,
  },
  floatingUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingRankBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  floatingRankText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    color: Colors.white,
  },
  floatingUserName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.white,
  },
  floatingUserStats: {
    alignItems: 'flex-end',
  },
  floatingUserPoints: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: '#fbbf24',
  },
  floatingUserStreak: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
});