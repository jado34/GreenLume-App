// Level Up / Celebration Screen — fires for badge unlocks AND rank promotions
// Receives data via route params: type ('badge' | 'rank'), title, emoji, subtitle, points
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { Typography, Shadows } from '../constants/typography';

const { width } = Dimensions.get('window');

const RANK_PATH = [
  { name: 'Seedling 🌱', key: 'Seedling' },
  { name: 'Sprout 🌿',   key: 'Sprout'   },
  { name: 'Sapling 🌳',  key: 'Sapling'  },
  { name: 'Tree 🌲',     key: 'Tree'     },
  { name: 'Forest 🏞️',   key: 'Forest'   },
];

export default function LevelUpScreen() {
  const params = useLocalSearchParams<{
    type?: string;       // 'badge' | 'rank'
    title?: string;      // "Badge Unlocked: Week Warrior!" | "Ranked up to Tree!"
    emoji?: string;      // badge icon emoji or rank emoji
    subtitle?: string;   // description text
    points?: string;     // bonus points earned (string because params are always strings)
    rankName?: string;   // current rank name (for highlighting the path)
  }>();

  const type = params.type || 'rank';
  const title = params.title || 'Level Up!';
  const emoji = params.emoji || '🌟';
  const subtitle = params.subtitle || "You're growing stronger every day!";
  const bonusPoints = params.points ? parseInt(params.points, 10) : 0;
  const currentRankName = params.rankName || 'Tree';

  const scale          = useRef(new Animated.Value(0)).current;
  const opacity        = useRef(new Animated.Value(0)).current;
  const slideUp        = useRef(new Animated.Value(40)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(opacity,  { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, damping: 11, stiffness: 120, useNativeDriver: true }),
        Animated.spring(slideUp, { toValue: 0, damping: 15, stiffness: 100, useNativeDriver: true }),
      ]),
      Animated.timing(confettiOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleShare = async () => {
    try {
      const isBadge = type === 'badge';
      await Share.share({
        message: isBadge
          ? `🏆 I just unlocked the "${title.replace('Badge Unlocked: ', '').replace('!', '')}" badge on GreenLume — the green habit tracker! ${bonusPoints > 0 ? `+${bonusPoints} bonus points earned!` : ''} Download and join me 🌿 https://greenlume.app`
          : `🚀 I just levelled up to ${currentRankName} on GreenLume — the green habit tracker! Every eco-action counts. Join me 🌱 https://greenlume.app`,
      });
    } catch {}
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1b5e20', '#2e7d32', '#388e3c']} style={StyleSheet.absoluteFill} />

      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <Animated.View style={[styles.content, { opacity, transform: [{ translateY: slideUp }] }]}>
        {/* Main badge / rank emoji */}
        <Animated.View style={[styles.badge, { transform: [{ scale }] }]}>
          <Text style={styles.badgeEmoji}>{emoji}</Text>
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: confettiOpacity }]}>
          {type === 'badge' ? '🏆 Achievement!' : '🚀 Level Up!'}
        </Animated.Text>

        <Animated.Text style={[styles.subTitle, { opacity: confettiOpacity }]}>
          {title}
        </Animated.Text>

        {subtitle ? (
          <Animated.Text style={[styles.description, { opacity: confettiOpacity }]}>
            {subtitle}
          </Animated.Text>
        ) : null}

        {bonusPoints > 0 && (
          <Animated.View style={[styles.pointsPill, { opacity: confettiOpacity }]}>
            <Text style={styles.pointsPillText}>+{bonusPoints} GreenLume Points! ⭐</Text>
          </Animated.View>
        )}

        {/* Rank progression path — only for rank-up events */}
        {type === 'rank' && (
          <Animated.View style={[styles.pathCard, { opacity: confettiOpacity }]}>
            {RANK_PATH.map((level) => {
              const isActive = level.key === currentRankName;
              return (
                <View
                  key={level.key}
                  style={[styles.levelRow, isActive && styles.levelRowActive]}
                >
                  <Text style={[styles.levelText, isActive && styles.levelTextActive]}>
                    {level.name}
                  </Text>
                  {isActive && <Text style={styles.currentLabel}>Current</Text>}
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Actions */}
        <Animated.View style={[styles.actions, { opacity: confettiOpacity }]}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Text style={styles.shareButtonText}>Share Achievement 🌍</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Keep Growing →</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  circle1: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.06)' },
  circle2: { position: 'absolute', bottom: -80, left: -80, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.04)' },
  content: { alignItems: 'center', paddingHorizontal: 32, width: '100%' },
  badge: {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  badgeEmoji: { fontSize: 64 },
  title: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize['3xl'],
    color: Colors.white,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.lg,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
  },
  description: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  pointsPill: {
    backgroundColor: 'rgba(251,191,36,0.25)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.4)',
  },
  pointsPillText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: '#fef3c7',
  },
  pathCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    width: '100%',
    padding: 12,
    marginBottom: 24,
    gap: 2,
  },
  levelRow: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  levelRowActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  levelText: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, color: 'rgba(255,255,255,0.55)' },
  levelTextActive: { fontFamily: Typography.fontFamily.bold, color: Colors.white },
  currentLabel: {
    fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs,
    color: '#a5d6a7', backgroundColor: 'rgba(165,214,167,0.2)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  actions: { width: '100%', gap: 10 },
  shareButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, height: 50,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  shareButtonText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, color: Colors.white },
  button: {
    backgroundColor: Colors.white, borderRadius: 14, height: 54,
    alignItems: 'center', justifyContent: 'center', ...Shadows.xl,
  },
  buttonText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.primary },
});
