import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { storage, UserData } from '../../utils/storage';
import { Colors } from '../../constants/colors';
import { Typography, Shadows } from '../../constants/typography';
import { getDynamicTheme } from '../../utils/theme';

const { width } = Dimensions.get('window');

const COMMUNITY_FORESTS = [
  { id: '1', name: 'Amazon Guardians', members: 1240, trees: 4500, color: '#059669', emoji: '🐆' },
  { id: '2', name: 'Urban Greenery', members: 850, trees: 2100, color: '#3b82f6', emoji: '🏢' },
  { id: '3', name: 'Plastic-Free Ocean', members: 3200, trees: 8900, color: '#0ea5e9', emoji: '🐳' },
];

export default function ForestsScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [points, setPoints] = useState(0);

  useFocusEffect(useCallback(() => {
    storage.getUserData().then(d => {
      setUserData(d);
      setPoints(d.totalPoints);
    });
  }, []));

  const theme = getDynamicTheme(points);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={[theme.primaryDark, theme.primary]} style={styles.header}>
          <Text style={styles.headerTitle}>Community Forests</Text>
          <Text style={styles.headerSub}>Join forces and grow together</Text>
          
          {/* FIX #12: Mark global stats as placeholder until real data is connected */}
          <View style={styles.globalStats}>
            <View style={styles.globalStatItem}>
              <Text style={styles.globalStatVal}>125k</Text>
              <Text style={styles.globalStatLab}>Active Users</Text>
            </View>
            <View style={styles.globalStatDivider} />
            <View style={styles.globalStatItem}>
              <Text style={styles.globalStatVal}>1.2M</Text>
              <Text style={styles.globalStatLab}>Trees Saved</Text>
            </View>
          </View>
          <Text style={{ fontFamily: Typography.fontFamily.regular, fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 6 }}>Live data coming soon</Text>
        </LinearGradient>

        {/* My Forest (Selection) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Join a Shared Forest</Text>
          <Text style={styles.sectionDesc}>Collaborate with others to reach massive environmental milestones.</Text>
          
          <View style={styles.forestGrid}>
            {COMMUNITY_FORESTS.map((forest) => (
              <TouchableOpacity 
                key={forest.id} 
                style={[styles.forestCard, { borderColor: forest.color + '20' }]}
                activeOpacity={0.8}
                onPress={() => Toast.show({ type: 'info', text1: `Joining ${forest.name}...`, text2: 'Community features coming soon!' })}
                accessibilityLabel={`Join ${forest.name} community. ${forest.members} members.`}
                accessibilityRole="button"
              >
                <View style={[styles.forestIcon, { backgroundColor: forest.color + '15' }]}>
                  <Text style={{ fontSize: 32 }}>{forest.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.forestName}>{forest.name}</Text>
                  <Text style={styles.forestMeta}>{forest.members} members • {forest.trees} trees saved</Text>
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: '65%', backgroundColor: forest.color }]} />
                    </View>
                    <Text style={styles.progressLabel}>Goal: 10k trees (65%)</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Global Impact Snapshot */}
        <View style={styles.section}>
          <View style={styles.banner}>
            <LinearGradient 
              colors={['#1e293b', '#0f172a']} 
              style={styles.bannerBg}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Planetary Pulse 🌍</Text>
              <Text style={styles.bannerText}>Today, the GreenLume community avoided 4,200kg of CO₂.</Text>
              <TouchableOpacity style={styles.bannerBtn} onPress={() => router.push('/nursery' as any)}>
                <Text style={styles.bannerBtnText}>View My Contribution</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral50 },
  header: { paddingTop: 56, paddingBottom: 32, paddingHorizontal: 20 },
  headerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['3xl'], color: Colors.white, marginBottom: 4 },
  headerSub: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.75)', marginBottom: 24 },
  globalStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 20 },
  globalStatItem: { flex: 1, alignItems: 'center' },
  globalStatVal: { fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.fontSize['2xl'], color: Colors.white },
  globalStatLab: { fontFamily: Typography.fontFamily.medium, fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  globalStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  section: { padding: 20 },
  sectionTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.textPrimary, marginBottom: 6 },
  sectionDesc: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: 20 },
  forestGrid: { gap: 12 },
  forestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 20, padding: 16, gap: 16, ...Shadows.sm, borderWidth: 1 },
  forestIcon: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  forestName: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.md, color: Colors.textPrimary, marginBottom: 2 },
  forestMeta: { fontFamily: Typography.fontFamily.medium, fontSize: 10, color: Colors.textMuted, marginBottom: 8 },
  progressContainer: { gap: 4 },
  progressTrack: { height: 6, backgroundColor: Colors.neutral100, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontFamily: Typography.fontFamily.medium, fontSize: 10, color: Colors.textSecondary },
  banner: { height: 160, borderRadius: 24, overflow: 'hidden', position: 'relative' },
  bannerBg: { ...StyleSheet.absoluteFillObject },
  bannerContent: { padding: 24, flex: 1, justifyContent: 'center' },
  bannerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.white, marginBottom: 8 },
  bannerText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  bannerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  bannerBtnText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.sm, color: Colors.white },
});
