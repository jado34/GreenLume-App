import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Share, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { useUserData, useJoinTeamMutation } from '../hooks/useUserData';
import { Colors } from '../constants/colors';
import { Typography, Shadows } from '../constants/typography';
import { storage } from '../utils/storage';
import { useQueryClient } from '@tanstack/react-query';
import { USER_DATA_QUERY_KEY } from '../hooks/useUserData';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

const MOCK_TEAMS: Record<string, string> = {
  'GOOGLE': 'Google Inc.',
  'MSFT': 'Microsoft Corp.',
  'APPLE': 'Apple Inc.',
  'ACME': 'Acme Corporation',
};

export default function TeamsScreen() {
  const { data: userData } = useUserData();
  const queryClient = useQueryClient();
  const joinTeamMutation = useJoinTeamMutation();
  
  const [inviteCode, setInviteCode] = useState('');
  const [squadName, setSquadName] = useState('');
  const [squadInviteCode, setSquadInviteCode] = useState('');
  const [squadTab, setSquadTab] = useState<'create' | 'join'>('create');
  
  const [userName, setUserName] = useState('You');
  const [userId, setUserId] = useState('');
  const [squadMembers, setSquadMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [joiningSquad, setJoiningSquad] = useState(false);
  const [showAddSquadForm, setShowAddSquadForm] = useState(false);
  const [companyMembers, setCompanyMembers] = useState<any[]>([]);
  const [loadingCompanyMembers, setLoadingCompanyMembers] = useState(false);
  const [companyTotalPoints, setCompanyTotalPoints] = useState(0);

  const { squad } = useLocalSearchParams<{ squad?: string }>();
  const handledSquadCodeRef = useRef<string | null>(null);

  useEffect(() => {
    storage.getUserName().then(setUserName);
    storage.getUserId().then(setUserId);
  }, []);

  useEffect(() => {
    if (squad && userData) {
      const formattedCode = squad.trim().toUpperCase();
      if (handledSquadCodeRef.current === formattedCode) return;
      
      const alreadyJoined = (userData.customSquads || []).some(s => s.code === formattedCode);
      if (alreadyJoined) {
        if (userData.customSquadCode !== formattedCode) {
          storage.selectActiveSquad(formattedCode).then(() => {
            queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY });
            Toast.show({
              type: 'success',
              text1: 'Switched Squad',
              text2: `Switched active squad to "${formattedCode}".`,
            });
          });
        } else {
          Toast.show({
            type: 'info',
            text1: 'Already in Squad',
            text2: 'You are already viewing this squad.',
          });
        }
        handledSquadCodeRef.current = formattedCode;
        return;
      }
      
      handledSquadCodeRef.current = formattedCode;
      
      Alert.alert(
        "Join Custom Squad",
        `Would you like to join the squad "${formattedCode}"?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Join Squad", 
            onPress: () => handleJoinSquad(formattedCode) 
          }
        ]
      );
    }
  }, [squad, userData]);

  const fetchSquadMembers = useCallback(async (code: string) => {
    if (!isSupabaseConfigured()) {
      setSquadMembers([
        { display_name: userName, total_points: userData?.totalPoints || 0, current_streak: userData?.currentStreak || 0, avatar_color: Colors.primary }
      ]);
      return;
    }
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('user_id, display_name, total_points, current_streak, avatar_color')
        .contains('raw_user_data', { userData: { customSquads: [{ code }] } })
        .order('total_points', { ascending: false });

      if (error) throw error;
      setSquadMembers(data || []);
    } catch (err) {
      console.error('[Teams] Error fetching squad members:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, [userData?.totalPoints, userData?.currentStreak, userName]);

  const fetchCompanyMembers = useCallback(async (teamId: string) => {
    if (!isSupabaseConfigured()) {
      const mocks = [
        { display_name: 'Alex M.', total_points: 4200, current_streak: 15, avatar_color: Colors.primary },
        { display_name: 'Sarah T.', total_points: 3850, current_streak: 9, avatar_color: Colors.info },
        { display_name: userName, total_points: userData?.totalPoints || 0, current_streak: userData?.currentStreak || 0, avatar_color: Colors.primaryDark },
      ].sort((a, b) => b.total_points - a.total_points);
      
      setCompanyMembers(mocks);
      setCompanyTotalPoints(mocks.reduce((sum, m) => sum + m.total_points, 0));
      return;
    }

    setLoadingCompanyMembers(true);
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('user_id, display_name, total_points, current_streak, avatar_color')
        .eq('team_id', teamId)
        .order('total_points', { ascending: false });

      if (error) throw error;
      
      const list = data || [];
      const hasSelf = list.some(item => item.user_id === userId || item.display_name === userName);
      if (!hasSelf && userData) {
        list.push({
          user_id: userId,
          display_name: userName,
          total_points: userData.totalPoints,
          current_streak: userData.currentStreak,
          avatar_color: Colors.primaryDark
        });
        list.sort((a, b) => b.total_points - a.total_points);
      }

      setCompanyMembers(list);
      setCompanyTotalPoints(list.reduce((sum, item) => sum + (item.total_points || 0), 0));
    } catch (err) {
      console.error('[Teams] Error fetching company members:', err);
    } finally {
      setLoadingCompanyMembers(false);
    }
  }, [userData?.totalPoints, userData?.currentStreak, userName, userId, userData]);

  useFocusEffect(
    useCallback(() => {
      if (userData?.customSquadCode) {
        fetchSquadMembers(userData.customSquadCode);
      }
      if (userData?.teamId) {
        fetchCompanyMembers(userData.teamId);
      }
    }, [userData?.customSquadCode, userData?.teamId, fetchSquadMembers, fetchCompanyMembers])
  );

  const handleJoinTeam = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) return;

    if (!isSupabaseConfigured()) {
      const companyName = MOCK_TEAMS[code];
      if (!companyName) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Code',
          text2: 'Please check your company invite code and try again.',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      joinTeamMutation.mutate({ teamId: code, companyName });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: `Joined ${companyName}!`,
        text2: 'Your impact now counts towards your team.',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', code)
        .single();

      if (error || !data) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Code',
          text2: 'No organization found matching this code.',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      const companyName = data.name;
      joinTeamMutation.mutate({ teamId: code, companyName });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: `Joined ${companyName}!`,
        text2: 'Your impact now counts towards your company.',
      });
      setInviteCode('');
    } catch (err) {
      console.error('[Teams] Join company error:', err);
      Toast.show({
        type: 'error',
        text1: 'Connection Error',
        text2: 'Failed to connect to organization server.',
      });
    }
  };

  const handleCreateSquad = async () => {
    if (!squadName.trim()) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await storage.createCustomSquad(squadName.trim());
      setSquadName('');
      queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY });
      await storage.syncToSupabase();
      Toast.show({
        type: 'success',
        text1: 'Squad Created! 👥',
        text2: `Your custom squad is ready to share.`,
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to create squad' });
    }
  };

  const handleJoinSquad = async (codeParam?: string) => {
    const code = (codeParam || squadInviteCode).trim().toUpperCase();
    if (!code) return;

    if (!isSupabaseConfigured()) {
      Toast.show({
        type: 'error',
        text1: 'Database Offline',
        text2: 'Custom squads require an active database connection.',
      });
      return;
    }

    // Check if user is already in this squad locally
    const alreadyJoined = (userData?.customSquads || []).some(s => s.code === code);
    if (alreadyJoined) {
      await storage.selectActiveSquad(code);
      queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY });
      Toast.show({
        type: 'success',
        text1: 'Switched Active Squad',
        text2: `You are now viewing this squad.`,
      });
      setSquadInviteCode('');
      return;
    }

    setJoiningSquad(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('raw_user_data')
        .contains('raw_user_data', { userData: { customSquads: [{ code }] } })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Invite Code',
          text2: 'No squad was found matching this code.',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      const raw = data[0].raw_user_data as any;
      const squadsList = raw?.userData?.customSquads || [];
      const squadObj = squadsList.find((s: any) => s.code === code);
      const squadName = squadObj?.name || raw?.userData?.customSquadName || 'Custom Squad';

      await storage.joinCustomSquad(squadName, code);
      queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY });
      await storage.syncToSupabase();

      Toast.show({
        type: 'success',
        text1: `Joined ${squadName}! 👥`,
        text2: 'You are now part of the squad.',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSquadInviteCode('');
    } catch (err) {
      console.error('Error joining squad:', err);
      Toast.show({
        type: 'error',
        text1: 'Join Failed',
        text2: 'An error occurred while joining the squad.',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setJoiningSquad(false);
    }
  };

  const handleLeaveSquad = async (code?: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await storage.leaveCustomSquad(code);
      queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY });
      await storage.syncToSupabase();
      Toast.show({
        type: 'info',
        text1: 'Left squad',
        text2: 'You have left the custom squad.',
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to leave squad' });
    }
  };

  if (!userData) return null;

  const isPremium = userData.isPremium;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GreenLume Teams</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- SECTION 1: CORPORATE TEAMS --- */}
        {userData.teamId && userData.companyName ? (
          /* Active Corporate Team Dashboard */
          <View style={styles.dashboardContainer}>
            <View style={styles.sectionHeaderWrap}>
              <Ionicons name="business" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Company Team</Text>
            </View>
            
            <View style={styles.teamBadge}>
              <Ionicons name="business" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.companyName}>{userData.companyName}</Text>
            <Text style={styles.teamSubtitle}>You are contributing to this team!</Text>

            <View style={styles.statsCard}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Your Contribution</Text>
                <Text style={styles.statValue}>{userData.totalPoints}</Text>
                <Text style={styles.statUnit}>Points</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Team Total</Text>
                <Text style={styles.statValue}>
                  {loadingCompanyMembers ? '...' : companyTotalPoints.toLocaleString()}
                </Text>
                <Text style={styles.statUnit}>Points</Text>
              </View>
            </View>

            <View style={styles.leaderboardCard}>
              <Text style={styles.leaderboardTitle}>Team Leaderboard</Text>
              
              {loadingCompanyMembers ? (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
              ) : (
                companyMembers.map((member, idx) => {
                  const isCurrentUser = member.user_id === userId || member.display_name === userName;
                  const avatarColor = member.avatar_color || Colors.primary;
                  const initials = member.display_name ? member.display_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() : 'U';
                  return (
                    <View key={member.user_id || idx} style={[styles.leaderboardRow, isCurrentUser && styles.currentUserRow]}>
                      <Text style={styles.rankText}>{idx + 1}</Text>
                      <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
                        <Text style={{ color: '#fff', fontSize: 12, fontFamily: Typography.fontFamily.bold }}>{initials}</Text>
                      </View>
                      <Text style={[styles.playerName, isCurrentUser && { fontFamily: Typography.fontFamily.bold }]}>
                        {member.display_name || 'Anonymous Employee'} {isCurrentUser && '(You)'}
                      </Text>
                      <Text style={styles.playerPoints}>{member.total_points.toLocaleString()}</Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        ) : (
          /* Join Corporate Team UI */
          <View style={styles.joinContainer}>
            <View style={styles.sectionHeaderWrap}>
              <Ionicons name="business" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Company Team</Text>
            </View>
            
            <View style={styles.iconContainer}>
              <Ionicons name="business-outline" size={54} color={Colors.primary} />
            </View>
            <Text style={styles.joinTitle}>Join Your Company</Text>
            <Text style={styles.joinDesc}>
              Enter your corporate invite code to link your account to your company's ESG dashboard and compete with coworkers!
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="key" size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter Invite Code (e.g., GOOGLE)"
                placeholderTextColor={Colors.textMuted}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity 
              style={[styles.joinButton, !inviteCode && styles.joinButtonDisabled]} 
              onPress={handleJoinTeam}
              disabled={!inviteCode}
            >
              <Text style={styles.joinButtonText}>Join Team</Text>
            </TouchableOpacity>
            {/* FIX #7: Removed mock invite code hint that was exposing test data in production */}
          </View>
        )}

        <View style={styles.sectionDivider} />

        {/* --- SECTION 2: CUSTOM SQUADS (EARTH+ PREMIUM) --- */}
        <View style={{ marginTop: 12 }}>
          <View style={styles.sectionHeaderWrap}>
            <Ionicons name="people" size={20} color={Colors.info} />
            <Text style={styles.sectionTitle}>Custom Squads</Text>
          </View>
          
          {userData.customSquads && userData.customSquads.length > 0 ? (
            /* Joined Custom Squads Dashboard */
            <View style={{ gap: 16 }}>
              <Text style={[styles.leaderboardTitle, { marginBottom: 4, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }]}>My Squads</Text>
              
              {userData.customSquads.map((squadItem) => {
                const isActive = userData.customSquadCode === squadItem.code;
                return (
                  <TouchableOpacity
                    key={squadItem.code}
                    activeOpacity={0.9}
                    onPress={() => {
                      if (!isActive) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        storage.selectActiveSquad(squadItem.code).then(() => {
                          queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY });
                        });
                      }
                    }}
                    style={[
                      styles.squadCardItem,
                      isActive && styles.squadCardItemActive
                    ]}
                  >
                    <View style={styles.squadCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={[styles.squadIconContainer, { width: 44, height: 44, borderRadius: 22, marginBottom: 0, backgroundColor: isActive ? 'rgba(14, 165, 233, 0.1)' : Colors.neutral100 }]}>
                          <Ionicons name="people" size={20} color={isActive ? '#0ea5e9' : Colors.textSecondary} />
                        </View>
                        <View>
                          <Text style={[styles.squadCardName, isActive && { fontFamily: Typography.fontFamily.bold, color: '#0ea5e9' }]}>
                            {squadItem.name}
                          </Text>
                          <Text style={styles.squadCardCode}>Code: {squadItem.code}</Text>
                        </View>
                      </View>
                      {isActive && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>ACTIVE VIEW</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.squadCardActions}>
                      <TouchableOpacity
                        style={[styles.squadActionBtn, { backgroundColor: isActive ? '#0ea5e9' : Colors.neutral100 }]}
                        onPress={() => Share.share({
                          message: `Join my GreenLume Custom Squad "${squadItem.name}" to compete with me! Click this link to join directly: greenlume://teams?squad=${squadItem.code} (or enter code: ${squadItem.code} in the app)`,
                          title: `GreenLume - ${squadItem.name}`
                        })}
                      >
                        <Ionicons name="share-social-outline" size={14} color={isActive ? '#fff' : Colors.textPrimary} />
                        <Text style={[styles.squadActionBtnText, { color: isActive ? '#fff' : Colors.textPrimary }]}>Share Link</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.squadActionBtn, { borderWidth: 1, borderColor: Colors.error, backgroundColor: 'transparent' }]}
                        onPress={() => {
                          Alert.alert(
                            "Leave Squad",
                            `Are you sure you want to leave "${squadItem.name}"?`,
                            [
                              { text: "Cancel", style: "cancel" },
                              { text: "Leave", style: "destructive", onPress: () => handleLeaveSquad(squadItem.code) }
                            ]
                          );
                        }}
                      >
                        <Ionicons name="log-out-outline" size={14} color={Colors.error} />
                        <Text style={[styles.squadActionBtnText, { color: Colors.error }]}>Leave</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Active Leaderboard */}
              {userData.customSquadCode && (
                <View style={styles.leaderboardCard}>
                  <Text style={styles.leaderboardTitle}>Squad Leaderboard: {userData.customSquadName}</Text>
                  
                  {loadingMembers ? (
                    <ActivityIndicator size="small" color="#0ea5e9" style={{ marginVertical: 20 }} />
                  ) : (
                    squadMembers.map((member, idx) => {
                      const isCurrentUser = member.user_id === userId || member.display_name === userName;
                      const avatarColor = member.avatar_color || '#0ea5e9';
                      const initials = member.display_name ? member.display_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() : 'U';
                      return (
                        <View key={member.user_id || idx} style={[styles.leaderboardRow, isCurrentUser && styles.currentUserRowBlue]}>
                          <Text style={styles.rankText}>{idx + 1}</Text>
                          <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
                            <Text style={{ color: '#fff', fontSize: 12, fontFamily: Typography.fontFamily.bold }}>{initials}</Text>
                          </View>
                          <Text style={[styles.playerName, isCurrentUser && { fontFamily: Typography.fontFamily.bold }]}>
                            {member.display_name || 'Anonymous User'} {isCurrentUser && '(You)'}
                          </Text>
                          <Text style={[styles.playerPoints, { color: '#0ea5e9' }]}>{member.total_points}</Text>
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              {/* Join/Create another squad button/section */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAddSquadForm(!showAddSquadForm);
                }}
                style={styles.addSquadToggleBtn}
              >
                <Ionicons name={showAddSquadForm ? "close-circle-outline" : "add-circle-outline"} size={20} color="#0ea5e9" />
                <Text style={styles.addSquadToggleText}>
                  {showAddSquadForm ? "Hide Setup Form" : "Join / Create Another Squad"}
                </Text>
              </TouchableOpacity>

              {showAddSquadForm && (
                <View style={styles.createSquadCard}>
                  <View style={styles.squadTabContainer}>
                    <TouchableOpacity
                      style={[styles.squadTabButton, squadTab === 'create' && styles.squadTabButtonActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSquadTab('create');
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={16} color={squadTab === 'create' ? '#0ea5e9' : Colors.textSecondary} />
                      <Text style={[styles.squadTabText, squadTab === 'create' && styles.squadTabTextActive]}>Create</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.squadTabButton, squadTab === 'join' && styles.squadTabButtonActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSquadTab('join');
                      }}
                    >
                      <Ionicons name="enter-outline" size={16} color={squadTab === 'join' ? '#0ea5e9' : Colors.textSecondary} />
                      <Text style={[styles.squadTabText, squadTab === 'join' && styles.squadTabTextActive]}>Join</Text>
                    </TouchableOpacity>
                  </View>

                  {squadTab === 'create' ? (
                    <>
                      <Text style={styles.squadCardTitle}>Launch Custom Squad</Text>
                      <Text style={styles.squadCardDesc}>Compete directly with your friends or family by launching a custom squad.</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="chatbubbles-outline" size={20} color={Colors.textMuted} />
                        <TextInput
                          style={styles.input}
                          placeholder="Squad Name (e.g. Eco Warriors)"
                          placeholderTextColor={Colors.textMuted}
                          value={squadName}
                          onChangeText={setSquadName}
                          maxLength={25}
                        />
                      </View>
                      <TouchableOpacity 
                        style={[styles.joinButton, { backgroundColor: '#0ea5e9' }, !squadName && styles.joinButtonDisabled]} 
                        onPress={handleCreateSquad}
                        disabled={!squadName}
                      >
                        <Text style={styles.joinButtonText}>Create Squad</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.squadCardTitle}>Enter Invite Code</Text>
                      <Text style={styles.squadCardDesc}>Enter a friend's squad code to join their custom circle.</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="key-outline" size={20} color={Colors.textMuted} />
                        <TextInput
                          style={styles.input}
                          placeholder="Invite Code (e.g. LUME-1234)"
                          placeholderTextColor={Colors.textMuted}
                          value={squadInviteCode}
                          onChangeText={setSquadInviteCode}
                          autoCapitalize="characters"
                          maxLength={15}
                        />
                      </View>
                      <TouchableOpacity 
                        style={[styles.joinButton, { backgroundColor: '#0ea5e9' }, (!squadInviteCode || joiningSquad) && styles.joinButtonDisabled]} 
                        onPress={() => handleJoinSquad()}
                        disabled={!squadInviteCode || joiningSquad}
                      >
                        <Text style={styles.joinButtonText}>
                          {joiningSquad ? 'Joining...' : 'Join Squad'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          ) : (
            /* Setup Forms (when no squads are joined) */
            <View style={{ gap: 16 }}>
              <View style={styles.createSquadCard}>
                <View style={styles.squadTabContainer}>
                  <TouchableOpacity
                    style={[styles.squadTabButton, squadTab === 'create' && styles.squadTabButtonActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSquadTab('create');
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={squadTab === 'create' ? '#0ea5e9' : Colors.textSecondary} />
                    <Text style={[styles.squadTabText, squadTab === 'create' && styles.squadTabTextActive]}>Create</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.squadTabButton, squadTab === 'join' && styles.squadTabButtonActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSquadTab('join');
                    }}
                  >
                    <Ionicons name="enter-outline" size={16} color={squadTab === 'join' ? '#0ea5e9' : Colors.textSecondary} />
                    <Text style={[styles.squadTabText, squadTab === 'join' && styles.squadTabTextActive]}>Join</Text>
                  </TouchableOpacity>
                </View>

                {squadTab === 'create' ? (
                  <>
                    <View style={styles.squadIconContainer}>
                      <Ionicons name="people" size={40} color="#0ea5e9" />
                    </View>
                    <Text style={styles.squadCardTitle}>Launch Custom Squad</Text>
                    <Text style={styles.squadCardDesc}>Compete directly with your friends or family by launching a custom squad.</Text>
                    
                    <View style={styles.inputContainer}>
                      <Ionicons name="chatbubbles-outline" size={20} color={Colors.textMuted} />
                      <TextInput
                        style={styles.input}
                        placeholder="Squad Name (e.g. Eco Warriors)"
                        placeholderTextColor={Colors.textMuted}
                        value={squadName}
                        onChangeText={setSquadName}
                        maxLength={25}
                      />
                    </View>

                    <TouchableOpacity 
                      style={[styles.joinButton, { backgroundColor: '#0ea5e9' }, !squadName && styles.joinButtonDisabled]} 
                      onPress={handleCreateSquad}
                      disabled={!squadName}
                    >
                      <Text style={styles.joinButtonText}>Create Squad</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={[styles.squadIconContainer, { backgroundColor: 'rgba(14, 165, 233, 0.1)' }]}>
                      <Ionicons name="enter" size={40} color="#0ea5e9" />
                    </View>
                    <Text style={styles.squadCardTitle}>Enter Invite Code</Text>
                    <Text style={styles.squadCardDesc}>Enter a friend's squad code to join their custom circle.</Text>
                    
                    <View style={styles.inputContainer}>
                      <Ionicons name="key-outline" size={20} color={Colors.textMuted} />
                      <TextInput
                        style={styles.input}
                        placeholder="Invite Code (e.g. LUME-1234)"
                        placeholderTextColor={Colors.textMuted}
                        value={squadInviteCode}
                        onChangeText={setSquadInviteCode}
                        autoCapitalize="characters"
                        maxLength={15}
                      />
                    </View>

                    <TouchableOpacity 
                      style={[styles.joinButton, { backgroundColor: '#0ea5e9' }, (!squadInviteCode || joiningSquad) && styles.joinButtonDisabled]} 
                      onPress={() => handleJoinSquad()}
                      disabled={!squadInviteCode || joiningSquad}
                    >
                      <Text style={styles.joinButtonText}>
                        {joiningSquad ? 'Joining...' : 'Join Squad'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}
        </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
  },
  sectionHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 24,
  },
  joinContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  joinTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  joinDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    ...Shadows.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    marginLeft: 12,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  joinButtonDisabled: {
    backgroundColor: Colors.neutral300,
  },
  joinButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.white,
  },
  hintText: {
    marginTop: 12,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  dashboardContainer: {
    alignItems: 'center',
  },
  teamBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  companyName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  teamSubtitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    marginBottom: 24,
    marginTop: 4,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Shadows.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 12,
  },
  statLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  statValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statUnit: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
  },
  leaderboardCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Shadows.sm,
  },
  leaderboardTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  currentUserRow: {
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
  },
  rankText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    width: 24,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  playerName: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  playerPoints: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
  },
  
  /* Custom Squad Styles */
  lockedCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  lockedGradient: {
    padding: 24,
  },
  lockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  lockedBadge: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    color: '#fbbf24',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lockedTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.white,
    marginBottom: 8,
  },
  lockedDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 20,
    marginBottom: 20,
  },
  lockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fbbf24',
    paddingVertical: 12,
    borderRadius: 12,
  },
  lockedBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: '#052008',
  },
  
  createSquadCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Shadows.md,
  },
  squadIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  squadCardTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  squadCardDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  currentUserRowBlue: {
    backgroundColor: 'rgba(14, 165, 233, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
  },
  squadTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
    padding: 4,
    gap: 4,
    marginBottom: 20,
    width: '100%',
  },
  squadTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  squadTabButtonActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  squadTabText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  squadTabTextActive: {
    color: '#0ea5e9',
  },
  squadCardItem: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Shadows.sm,
  },
  squadCardItemActive: {
    borderColor: '#0ea5e9',
    borderWidth: 2,
    ...Shadows.md,
  },
  squadCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  squadCardName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  squadCardCode: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: '#0ea5e9',
  },
  squadCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  squadActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  squadActionBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  addSquadToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#0ea5e9',
    borderStyle: 'dashed',
    borderRadius: 16,
    marginTop: 8,
  },
  addSquadToggleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: '#0ea5e9',
  },
});
