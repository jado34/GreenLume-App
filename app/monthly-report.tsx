import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { storage, UserData } from '../utils/storage';
import { getRankInfo } from '../utils/badges';
import { Colors } from '../constants/colors';
import { Typography, Shadows } from '../constants/typography';

const { width } = Dimensions.get('window');
const MONTH = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const CATEGORY_DATA = [
  { name: 'Transport', icon: 'bus', color: '#3b82f6', pct: 30 },
  { name: 'Food', icon: 'leaf', color: '#10b981', pct: 25 },
  { name: 'Waste', icon: 'refresh-circle', color: '#8b5cf6', pct: 20 },
  { name: 'Energy', icon: 'bulb', color: '#f59e0b', pct: 15 },
  { name: 'Water', icon: 'water', color: '#06b6d4', pct: 10 },
];

export default function MonthlyReportScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userName, setUserName] = useState('');
  const viewShotRef = useRef<ViewShot>(null);

  useFocusEffect(useCallback(() => {
    Promise.all([storage.getUserData(), storage.getUserName()]).then(([data, name]) => {
      setUserData(data);
      setUserName(name);
    });
  }, []));

  const shareImpact = async () => {
    if (!viewShotRef.current?.capture) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await viewShotRef.current.capture();
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Share your GreenLume Impact!',
          mimeType: 'image/png',
        });
      } else {
        Toast.show({ type: 'error', text1: 'Sharing not available on this device' });
      }
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Failed to share impact snapshot' });
    }
  };

  const pts = userData?.totalPoints ?? 0;
  const actions = userData?.actionsLogged ?? 0;
  const streak = userData?.longestStreak ?? 0;
  const badges = userData?.earnedBadges.length ?? 0;
  const co2 = ((pts / 100) * 1.2).toFixed(1);
  const water = Math.floor(pts * 0.6);
  const plastic = Math.floor(actions * 0.4);
  const rank = getRankInfo(pts);

  // Simulated chart data
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: [
        Math.max(0, pts - 1500),
        Math.max(0, pts - 1100),
        Math.max(0, pts - 700),
        Math.max(0, pts - 400),
        Math.max(0, pts - 100),
        pts,
      ]
    }]
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.5,
    decimalPlaces: 0,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: Colors.primary,
    },
    labelColor: () => Colors.textSecondary,
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral50 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* We wrap the top portion in ViewShot so they can share it nicely formatted */}
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
          <LinearGradient colors={['#1b5e20', '#2e7d32']} style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={shareImpact} style={styles.shareBtn}>
                <Ionicons name="share-social" size={20} color={Colors.primary} />
                <Text style={styles.shareText}>Share</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.headerContent}>
              <Text style={styles.headerMonth}>{MONTH}</Text>
              <Text style={styles.headerTitle}>Monthly Report</Text>
              <Text style={styles.headerSub}>Hello {userName} — here's your impact</Text>
            </View>

            {/* Rank card */}
            <View style={styles.rankCard}>
              <Text style={styles.rankEmoji}>{rank.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rankName}>{rank.name}</Text>
                <Text style={styles.rankSub}>
                  {rank.nextPoints > 0 ? `${rank.nextPoints - pts} pts to ${rank.nextRank}` : '🏆 Maximum rank!'}
                </Text>
              </View>
              <Text style={styles.rankPts}>{pts} pts</Text>
            </View>
          </LinearGradient>

          {/* Stats Grid */}
          <View style={[styles.statsGrid, { backgroundColor: Colors.neutral50 }]}>
            {[
              { label: 'Total Points', value: pts.toLocaleString(), icon: 'star', color: Colors.primary, bg: Colors.primary90 },
              { label: 'Actions', value: actions.toString(), icon: 'checkmark-circle', color: '#10b981', bg: '#d1fae5' },
              { label: 'Best Streak', value: `${streak}d`, icon: 'flame', color: '#f97316', bg: '#ffedd5' },
              { label: 'Badges', value: badges.toString(), icon: 'trophy', color: '#8b5cf6', bg: '#ede9fe' },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon as any} size={20} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </ViewShot>

        {/* Dynamic Line Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 6-Month Progress</Text>
          <View style={styles.chartCard}>
            <LineChart
              data={lineChartData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
              withInnerLines={false}
              withOuterLines={false}
            />
          </View>
        </View>

        {/* Environmental Impact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 Environmental Impact</Text>
          <View style={{ gap: 12 }}>
            {[
              { label: 'CO₂ Avoided', value: `${co2} kg`, sub: `≈ ${Math.max(1, Math.floor(parseFloat(co2) / 4))} day(s) without a car`, icon: 'cloudy-outline', color: '#10b981', pct: Math.min(100, pts / 20) },
              { label: 'Water Conserved', value: `${water} L`, sub: `≈ ${Math.max(1, Math.floor(water / 150))} day(s) of household use`, icon: 'water-outline', color: '#06b6d4', pct: Math.min(100, water / 10) },
              { label: 'Plastic Avoided', value: `${plastic} items`, sub: `Kept out of the ocean`, icon: 'trash-outline', color: '#8b5cf6', pct: Math.min(100, plastic * 5) },
            ].map((item) => (
              <View key={item.label} style={styles.impactCard}>
                <View style={[styles.impactIcon, { backgroundColor: `${item.color}18` }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.impactLabel}>{item.label}</Text>
                  <Text style={[styles.impactValue, { color: item.color }]}>{item.value}</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.max(4, item.pct)}%`, backgroundColor: item.color }]} />
                  </View>
                  <Text style={styles.impactSub}>{item.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📂 Category Breakdown</Text>
          <View style={styles.chartCard}>
            {CATEGORY_DATA.map((cat) => (
              <View key={cat.name} style={styles.catRow}>
                <View style={[styles.catIcon, { backgroundColor: `${cat.color}18` }]}>
                  <Ionicons name={cat.icon as any} size={16} color={cat.color} />
                </View>
                <Text style={styles.catName}>{cat.name}</Text>
                <View style={styles.catTrack}>
                  <View style={[styles.catFill, { width: `${cat.pct}%`, backgroundColor: cat.color }]} />
                </View>
                <Text style={[styles.catPct, { color: cat.color }]}>{cat.pct}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, ...Shadows.sm },
  shareText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.sm, color: Colors.primary },
  headerContent: { marginBottom: 20 },
  headerMonth: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  headerTitle: { fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.fontSize['4xl'], color: Colors.white, marginBottom: 4 },
  headerSub: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.75)' },
  rankCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16 },
  rankEmoji: { fontSize: 36 },
  rankName: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.white },
  rankSub: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.7)' },
  rankPts: { fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.fontSize['2xl'], color: Colors.white },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 },
  statCard: { width: (width - 56) / 2, backgroundColor: Colors.white, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, ...Shadows.sm, borderWidth: 1, borderColor: Colors.neutral200 },
  statIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['3xl'] },
  statLabel: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.textPrimary, marginBottom: 14 },
  impactCard: { flexDirection: 'row', gap: 14, backgroundColor: Colors.white, borderRadius: 16, padding: 16, ...Shadows.sm, borderWidth: 1, borderColor: Colors.neutral200 },
  impactIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  impactLabel: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  impactValue: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, marginBottom: 8 },
  impactSub: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 4 },
  progressTrack: { height: 6, backgroundColor: Colors.neutral100, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  chartCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, ...Shadows.sm, borderWidth: 1, borderColor: Colors.neutral200, alignItems: 'center' },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, width: '100%' },
  catIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  catName: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, width: 72 },
  catTrack: { flex: 1, height: 10, backgroundColor: Colors.neutral100, borderRadius: 5, overflow: 'hidden' },
  catFill: { height: 10, borderRadius: 5 },
  catPct: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.sm, width: 38, textAlign: 'right' },
});
