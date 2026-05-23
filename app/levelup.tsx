// Level Up Screen — Full screen celebration moment
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { Typography, Shadows } from '../constants/typography';

const { width } = Dimensions.get('window');

export default function LevelUpScreen() {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 100, useNativeDriver: true }),
      Animated.timing(confettiOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1b5e20', '#2e7d32', '#388e3c']} style={StyleSheet.absoluteFill} />

      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <Animated.View style={[styles.content, { opacity }]}>
        {/* Badge */}
        <Animated.View style={[styles.badge, { transform: [{ scale }] }]}>
          <Text style={styles.badgeEmoji}>🌟</Text>
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: confettiOpacity }]}>Level Up!</Animated.Text>
        <Animated.Text style={[styles.subTitle, { opacity: confettiOpacity }]}>
          You're now an{'\n'}Earth Guardian 🌟
        </Animated.Text>

        {/* Level path */}
        <Animated.View style={[styles.pathCard, { opacity: confettiOpacity }]}>
          {[
            { name: 'Seedling 🌱', active: false },
            { name: 'Sprout 🌿', active: false },
            { name: 'Sapling 🌳', active: false },
            { name: 'Tree 🌲', active: true },
            { name: 'Forest 🏞️', active: false },
          ].map((level, i) => (
            <View key={level.name} style={[styles.levelRow, level.active && styles.levelRowActive]}>
              <Text style={[styles.levelText, level.active && styles.levelTextActive]}>{level.name}</Text>
              {level.active && <Text style={styles.currentLabel}>Current</Text>}
            </View>
          ))}
        </Animated.View>

        <Animated.View style={{ opacity: confettiOpacity, width: '100%' }}>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')} activeOpacity={0.85}>
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
  badge: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 28, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  badgeEmoji: { fontSize: 60 },
  title: { fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.fontSize['5xl'], color: Colors.white, marginBottom: 8 },
  subTitle: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 28, marginBottom: 32 },
  pathCard: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, width: '100%', padding: 16, marginBottom: 32, gap: 4 },
  levelRow: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelRowActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  levelText: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, color: 'rgba(255,255,255,0.6)' },
  levelTextActive: { fontFamily: Typography.fontFamily.bold, color: Colors.white },
  currentLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, color: '#a5d6a7', backgroundColor: 'rgba(165,214,167,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  button: { backgroundColor: Colors.white, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', ...Shadows.xl },
  buttonText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.primary },
});
