// Profile Screen — Avatar + working Edit Profile modal
import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Share, Modal, Pressable, TextInput, KeyboardAvoidingView, Platform, Switch, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { storage, UserData } from '../../utils/storage';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { getRankInfo, BADGES } from '../../utils/badges';
import { notifications } from '../../utils/notifications';
import { Colors } from '../../constants/colors';
import { Typography, Shadows } from '../../constants/typography';
import { getDynamicTheme } from '../../utils/theme';

const AVATAR_COLORS = ['#2e7d32','#1565c0','#6a1b9a','#c62828','#00838f','#e65100','#00695c'];
function getAvatarColor(name: string): string {
  const idx = (name.charCodeAt(0) || 71) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

interface SettingItem {
  icon: string;
  label: string;
  desc: string;
  color?: string;
  onPress: () => void;
  switch?: boolean;
}

export default function ProfileScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userName, setUserName] = useState('');
  const [authMethod, setAuthMethod] = useState('');
  const [joinDate, setJoinDate] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  // Edit Profile modal state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    const load = async () => {
      const [data, name, method, date, notifEnabled, avatar] = await Promise.all([
        storage.getUserData(),
        storage.getUserName(),
        storage.getAuthMethod(),
        storage.getJoinDate(),
        notifications.isEnabled(),
        storage.getCustomAvatar(),
      ]);
      setUserData(data);
      setUserName(name);
      setAuthMethod(method);
      setJoinDate(date);
      setNotificationsEnabled(notifEnabled);
      setCustomAvatar(avatar);
    };
    load();
  }, []));

  const pts = userData?.totalPoints ?? 0;
  const streak = userData?.currentStreak ?? 0;
  const actions = userData?.actionsLogged ?? 0;
  const earned = userData?.earnedBadges.length ?? 0;
  const longestStreak = userData?.longestStreak ?? 0;
  const rank = getRankInfo(pts);
  const theme = getDynamicTheme(pts);

  const initials = userName.split(' ').map((w) => w[0]?.toUpperCase()).slice(0, 2).join('') || 'G';
  const avatarColor = getAvatarColor(userName || 'Guest');

  const openEditProfile = () => {
    setEditName(userName);
    setShowEditProfile(true);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        setCustomAvatar(result.assets[0].uri);
        await storage.setCustomAvatar(result.assets[0].uri);
        Toast.show({ type: 'success', text1: 'Avatar updated!' });
      }
    } catch (error) {
      console.warn('Image picker error:', error);
      Toast.show({ type: 'error', text1: 'Failed to pick image' });
    }
  };

  const saveProfile = async () => {
    if (!editName.trim()) {
      Toast.show({ type: 'error', text1: 'Name required', text2: 'Please enter your name.' });
      return;
    }
    setSaving(true);
    await storage.updateUserName(editName.trim());
    setUserName(editName.trim());
    setSaving(false);
    setShowEditProfile(false);
    Toast.show({ type: 'success', text1: 'Profile updated! ✓', text2: `Welcome, ${editName.trim()}!` });
  };



  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          // Sign out of Supabase first (if configured)
          if (isSupabaseConfigured()) {
            try {
              await supabase.auth.signOut();
            } catch (err) {
              console.warn('Supabase sign-out error:', err);
            }
          }
          // Then clear local storage
          await storage.signOut();
          router.replace('/auth');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will:\n• Permanently delete your GreenLume account\n• Remove all your data from our servers\n• Sign you out of the app\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isSupabaseConfigured()) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase.auth.admin.deleteUser(user.id);
                }
              }
            } catch (err) {
              console.warn('Delete user error:', err);
            }
            await storage.signOut();
            Toast.show({ type: 'success', text1: 'Account deleted', text2: 'All your data has been removed.' });
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const hasPermission = await notifications.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
        return;
      }
    }
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    await notifications.setEnabled(newValue);
    if (newValue) {
      await notifications.scheduleDailyReminder();
      Toast.show({ type: 'success', text1: 'Reminders On!', text2: "You'll get daily reminders at 9 AM." });
    } else {
      await notifications.cancelAll();
      Toast.show({ type: 'info', text1: 'Reminders Off', text2: 'Daily reminders disabled.' });
    }
  };

  const accountSettings: SettingItem[] = [
    { icon: 'person-outline', label: 'Edit Profile', desc: 'Update your name & avatar', onPress: openEditProfile },
    {
      icon: 'notifications-outline',
      label: 'Daily Reminder',
      desc: notificationsEnabled ? 'On - 9:00 AM daily' : 'Off - Get reminded to act',
      onPress: toggleNotifications,
      switch: true,
    },
    {
      icon: 'shield-outline', label: 'Privacy & Security', desc: 'Control your data',
      onPress: () => router.push('/privacy-policy'),
    },
  ];

  const appSettings: SettingItem[] = [
    { icon: 'people-outline', label: 'My Team', desc: userData?.companyName ? `Linked to ${userData.companyName}` : 'Join a corporate team', onPress: () => router.push('/teams' as any) },
    { icon: 'map-outline', label: 'Local Eco-Map', desc: 'Find green spots near you', onPress: () => router.push('/local-map' as any) },
    { icon: 'trophy-outline', label: 'Leaderboard', desc: 'See how you rank', onPress: () => router.push('/leaderboard') },
    { icon: 'play-circle-outline', label: 'View Tutorial', desc: 'Learn how to use GreenLume', onPress: () => router.push('/onboarding') },
    { icon: 'server-outline', label: 'Data Sources', desc: 'EPA, UNEP & more', onPress: () => Toast.show({ type: 'info', text1: 'Data Sources', text2: 'Impact data sourced from EPA and UNEP datasets.' }) },
    { icon: 'bar-chart-outline', label: 'Monthly Report', desc: 'View your monthly summary', onPress: () => router.push('/monthly-report') },
    { icon: 'add-circle-outline', label: 'Custom Action', desc: 'Create your own eco-action', onPress: () => router.push('/custom-action') },
    { icon: 'document-text-outline', label: 'Privacy Policy', desc: 'How we handle your data', onPress: () => router.push('/privacy-policy') },
    { icon: 'shield-checkmark-outline', label: 'Terms of Service', desc: 'Your rights & responsibilities', onPress: () => router.push('/terms-of-service') },
    { icon: 'information-circle-outline', label: 'About GreenLume', desc: 'Version 1.0.0', onPress: () => Toast.show({ type: 'info', text1: 'GreenLume v1.0.0', text2: 'Made with 💚 for a sustainable future.' }) },
  ];

  const dangerSettings: SettingItem[] = [
    { icon: 'trash-outline', label: 'Delete Account', desc: 'Permanently remove all data', color: Colors.error, onPress: handleDeleteAccount },
  ];

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.settingsSection}>
      <Text style={styles.settingsSectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.settingsCard}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.settingsRow, i < items.length - 1 && styles.settingsRowBorder]}
            onPress={item.switch ? undefined : item.onPress}
            activeOpacity={item.switch ? 1 : 0.85}
            disabled={item.switch}
            accessibilityLabel={`${item.label}: ${item.desc}`}
            accessibilityRole={item.switch ? 'switch' : 'button'}
            accessibilityState={item.switch ? { checked: item.label === 'Daily Reminder' ? notificationsEnabled : false } : {}}
          >
            <View style={[styles.settingsIcon, item.color ? { backgroundColor: `${item.color}15` } : {}]}>
              <Ionicons name={item.icon as any} size={20} color={item.color ?? Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingsLabel, item.color ? { color: item.color } : {}]}>{item.label}</Text>
              <Text style={styles.settingsDesc}>{item.desc}</Text>
            </View>
            {item.switch ? (
              <Switch
                value={item.label === 'Daily Reminder' ? notificationsEnabled : false}
                onValueChange={toggleNotifications}
                trackColor={{ false: Colors.neutral300, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            ) : (
              <Ionicons name="chevron-forward" size={16} color={Colors.neutral300} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral50 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Premium Header */}
        <LinearGradient colors={[theme.primaryDark, theme.primary]} style={styles.header}>
          <View style={styles.authBadge}>
            <Text style={styles.authBadgeText}>{authMethod.charAt(0).toUpperCase() + authMethod.slice(1)} Mode</Text>
          </View>

          {/* Tappable Avatar */}
          <TouchableOpacity 
            style={[styles.avatar, !customAvatar && { backgroundColor: avatarColor }]} 
            onPress={openEditProfile} 
            activeOpacity={0.85}
            accessibilityLabel={`Change profile picture. Current name: ${userName}`}
            accessibilityRole="imagebutton"
          >
            {customAvatar ? (
              <Image source={{ uri: customAvatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={12} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{userName}</Text>
          <View style={styles.rankBadge}>
            <Text style={styles.rankEmoji}>{rank.emoji}</Text>
            <Text style={styles.rankText}>{rank.name}</Text>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { icon: 'trophy', label: 'GreenLume', value: pts.toLocaleString(), color: Colors.primary, bg: Colors.primary90 },
            { icon: 'flash', label: 'Streak', value: `${streak}d`, color: '#f59e0b', bg: '#fef3c7' },
            { icon: 'trending-up', label: 'Actions', value: actions.toLocaleString(), color: Colors.info, bg: Colors.infoLight },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Highlights */}
        <View style={styles.section}>
          <View style={styles.highlightsCard}>
            <Text style={styles.highlightsTitle}>Highlights</Text>
            {[
              { emoji: '🏆', label: 'Badges Earned', value: `${earned}/${BADGES.length}` },
              { emoji: '🔥', label: 'Longest Streak', value: `${longestStreak} days` },
              { emoji: '📅', label: 'Member Since', value: joinDate ? new Date(joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Today' },
            ].map((item) => (
              <View key={item.label} style={styles.highlightRow}>
                <Text style={styles.highlightEmoji}>{item.emoji}</Text>
                <Text style={styles.highlightLabel}>{item.label}</Text>
                <Text style={styles.highlightValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {renderSection('Account', accountSettings)}
        {renderSection('App', appSettings)}
        {renderSection('Data & Privacy', dangerSettings)}

        {/* Premium Banner */}
        <View style={styles.section}>
          <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.premiumBanner}>
            <Text style={styles.premiumIcon}>👑</Text>
            <Text style={styles.premiumTitle}>Earth+ Premium</Text>
            <Text style={styles.premiumDesc}>Unlock AI insights, real-world impact, and exclusive rewards</Text>
            <TouchableOpacity style={styles.premiumBtn} onPress={() => router.push('/premium' as any)}>
              <Text style={styles.premiumBtnText}>Upgrade Now →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={[styles.section, { marginBottom: 24 }]}>
          <TouchableOpacity 
            style={styles.signOutBtn} 
            onPress={handleSignOut}
            accessibilityLabel="Sign out of your account"
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
          <Text style={styles.footer}>Made with 💚 for a sustainable future</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEditProfile(false)}>
            <Pressable style={styles.editModal} onPress={(e) => e.stopPropagation()}>
              <View style={styles.editModalHandle} />
              <Text style={styles.editModalTitle}>Edit Profile</Text>

              {/* Avatar preview */}
              <TouchableOpacity style={[styles.editAvatar, !customAvatar && { backgroundColor: avatarColor }]} onPress={pickImage} activeOpacity={0.8}>
                {customAvatar ? (
                  <Image source={{ uri: customAvatar }} style={styles.editAvatarImage} />
                ) : (
                  <Text style={styles.editAvatarText}>{editName[0]?.toUpperCase() || initials}</Text>
                )}
                <View style={[styles.avatarEditBadge, { bottom: -4, right: 4, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="camera" size={16} color={Colors.white} />
                </View>
              </TouchableOpacity>
              <Text style={styles.editAvatarHint}>Tap to upload personal photo</Text>

              <Text style={styles.editLabel}>Display Name</Text>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={Colors.textMuted}
                maxLength={30}
              />

              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditProfile(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 60, paddingBottom: 32, alignItems: 'center' },
  authBadge: { position: 'absolute', top: 56, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  authBadgeText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs, color: Colors.white },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)', position: 'relative' },
  avatarText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['4xl'], color: Colors.white },
  avatarImage: { width: '100%', height: '100%', borderRadius: 45 },
  avatarEditBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 3 },
  name: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'], color: Colors.white, marginBottom: 8 },
  rankBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  rankEmoji: { fontSize: 16 },
  rankText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, color: Colors.white },
  statsGrid: { flexDirection: 'row', gap: 12, margin: 16 },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 12, alignItems: 'center', gap: 6, ...Shadows.sm, borderWidth: 1, borderColor: Colors.neutral200 },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'] },
  statLabel: { fontFamily: Typography.fontFamily.regular, fontSize: 10, color: Colors.textMuted },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  highlightsCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, ...Shadows.sm, borderWidth: 1, borderColor: Colors.neutral200 },
  highlightsTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.textPrimary, marginBottom: 14 },
  highlightRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.neutral100 },
  highlightEmoji: { fontSize: 20, marginRight: 12 },
  highlightLabel: { flex: 1, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md, color: Colors.textSecondary },
  highlightValue: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.md, color: Colors.textPrimary },
  settingsSection: { paddingHorizontal: 16, marginBottom: 16 },
  settingsSectionTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs, color: Colors.textMuted, letterSpacing: 1, marginBottom: 8 },
  settingsCard: { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', ...Shadows.sm, borderWidth: 1, borderColor: Colors.neutral200 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.neutral100 },
  settingsIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary90, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, color: Colors.textPrimary },
  settingsDesc: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 1 },
  premiumBanner: { borderRadius: 20, padding: 24, alignItems: 'center' },
  premiumIcon: { fontSize: 36, marginBottom: 8 },
  premiumTitle: { fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.fontSize['2xl'], color: Colors.white, marginBottom: 8 },
  premiumDesc: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 20 },
  premiumBtn: { backgroundColor: '#f59e0b', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  premiumBtnText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: '#0f172a' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: Colors.error, marginBottom: 16 },
  signOutText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, color: Colors.error },
  footer: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  // Edit Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  editModal: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  editModalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.neutral300, alignSelf: 'center', marginBottom: 20 },
  editModalTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'], color: Colors.textPrimary, marginBottom: 20, textAlign: 'center' },
  editAvatar: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  editAvatarText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['3xl'], color: Colors.white },
  editAvatarImage: { width: '100%', height: '100%', borderRadius: 40 },
  editAvatarHint: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted, textAlign: 'center', marginBottom: 20 },
  editLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: 8 },
  editInput: { backgroundColor: Colors.neutral50, borderRadius: 14, padding: 14, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.neutral200, marginBottom: 16 },
  editInputMulti: { height: 90, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.neutral100, alignItems: 'center' },
  cancelBtnText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, color: Colors.textSecondary },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center' },
  saveBtnText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.md, color: Colors.white },
});
