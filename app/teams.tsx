import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { useUserData, useJoinTeamMutation } from '../hooks/useUserData';
import { Colors } from '../constants/colors';
import { Typography, Shadows } from '../constants/typography';
import { storage } from '../utils/storage';
import { useQueryClient } from '@tanstack/react-query';
import { USER_DATA_QUERY_KEY } from '../hooks/useUserData';

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

  const handleJoinTeam = () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) return;

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
  };

  const handleCreateSquad = async () => {
    if (!squadName.trim()) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await storage.createCustomSquad(squadName.trim());
      setSquadName('');
      queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY });
      Toast.show({
        type: 'success',
        text1: 'Squad Created! 👥',
        text2: `Your custom squad is ready to share.`,
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to create squad' });
    }
  };

  const handleLeaveSquad = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await storage.leaveCustomSquad();
      queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY });
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
                <Text style={styles.statValue}>{userData.totalPoints + 15400}</Text>
                <Text style={styles.statUnit}>Points</Text>
              </View>
            </View>

            <View style={styles.leaderboardCard}>
              <Text style={styles.leaderboardTitle}>Team Leaderboard</Text>
              
              <View style={styles.leaderboardRow}>
                <Text style={styles.rankText}>1</Text>
                <View style={styles.avatarPlaceholder}><Text>A</Text></View>
                <Text style={styles.playerName}>Alex M.</Text>
                <Text style={styles.playerPoints}>4,200</Text>
              </View>
              
              <View style={styles.leaderboardRow}>
                <Text style={styles.rankText}>2</Text>
                <View style={styles.avatarPlaceholder}><Text>S</Text></View>
                <Text style={styles.playerName}>Sarah T.</Text>
                <Text style={styles.playerPoints}>3,850</Text>
              </View>
              
              <View style={[styles.leaderboardRow, styles.currentUserRow]}>
                <Text style={styles.rankText}>3</Text>
                <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.primary }]}><Text style={{ color: '#fff' }}>Y</Text></View>
                <Text style={styles.playerName}>You</Text>
                <Text style={styles.playerPoints}>{userData.totalPoints}</Text>
              </View>
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
          
          {!isPremium ? (
            /* Free tier lock screen */
            <TouchableOpacity 
              style={styles.lockedCard} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/premium');
              }}
              activeOpacity={0.9}
            >
              <LinearGradient colors={['#052008', '#0b390e']} style={styles.lockedGradient}>
                <View style={styles.lockHeader}>
                  <Ionicons name="lock-closed" size={22} color="#fbbf24" />
                  <Text style={styles.lockedBadge}>Earth+ Feature</Text>
                </View>
                <Text style={styles.lockedTitle}>Create a Custom Squad</Text>
                <Text style={styles.lockedDesc}>
                  Upgrade to Earth+ Premium to create custom leaderboards, invite your friends, and compete in personal circles!
                </Text>
                <View style={styles.lockedBtn}>
                  <Text style={styles.lockedBtnText}>Upgrade to Earth+ ($1.99/mo)</Text>
                  <Ionicons name="arrow-forward" size={16} color="#052008" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : userData.customSquadName ? (
            /* Premium Dashboard */
            <View style={styles.dashboardContainer}>
              <View style={[styles.teamBadge, { backgroundColor: 'rgba(14, 165, 233, 0.1)' }]}>
                <Ionicons name="people" size={48} color="#0ea5e9" />
              </View>
              <Text style={styles.companyName}>{userData.customSquadName}</Text>
              <Text style={[styles.teamSubtitle, { color: '#0ea5e9' }]}>Invite Code: {userData.customSquadCode}</Text>
              
              <TouchableOpacity 
                style={[styles.joinButton, { backgroundColor: '#0ea5e9', marginBottom: 16, flexDirection: 'row', gap: 8 }]} 
                onPress={() => Share.share({ message: `Join my GreenLume Custom Squad! Use code: ${userData.customSquadCode} to compete with me.`, title: 'GreenLume Custom Squad' })}
              >
                <Ionicons name="share-social-outline" size={18} color="#fff" />
                <Text style={styles.joinButtonText}>Share Invite Code</Text>
              </TouchableOpacity>
              
              <View style={styles.leaderboardCard}>
                <Text style={styles.leaderboardTitle}>Squad Leaderboard</Text>
                
                <View style={styles.leaderboardRow}>
                  <Text style={styles.rankText}>1</Text>
                  <View style={[styles.avatarPlaceholder, { backgroundColor: '#0ea5e9' }]}><Text style={{ color: '#fff' }}>Y</Text></View>
                  <Text style={styles.playerName}>You</Text>
                  <Text style={[styles.playerPoints, { color: '#0ea5e9' }]}>{userData.totalPoints}</Text>
                </View>
                
                <View style={styles.leaderboardRow}>
                  <Text style={styles.rankText}>2</Text>
                  <View style={styles.avatarPlaceholder}><Text>S</Text></View>
                  <Text style={styles.playerName}>Sarah T. (Pending)</Text>
                  <Text style={styles.playerPoints}>-</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.joinButton, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.error, marginTop: 16 }]} 
                onPress={handleLeaveSquad}
              >
                <Text style={[styles.joinButtonText, { color: Colors.error }]}>Leave Custom Squad</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Premium Create Squad Form */
            <View style={styles.createSquadCard}>
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
});
