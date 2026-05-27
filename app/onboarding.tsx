// Onboarding — 3-slide swipeable carousel with Lottie animations
import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { storage } from '../utils/storage';
import { analytics } from '../utils/analytics';
import { Colors } from '../constants/colors';
import { Typography, Shadows } from '../constants/typography';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Build Sustainable Habits',
    description: 'Small daily actions add up to real environmental impact. Log what you do, every day.',
    animation: require('../assets/animations/man_running.json'),
    bg: '#f0fdf4',
  },
  {
    title: 'Track Your Impact',
    description: 'See exactly how your choices make a difference — in CO₂ saved, water conserved, and plastic avoided.',
    animation: require('../assets/animations/environmental_waste.json'),
    bg: '#eff6ff',
  },
  {
    title: 'Earn Achievements',
    description: 'Celebrate milestones, unlock badges, build streaks. Every step forward is worth celebrating.',
    animation: require('../assets/animations/Trophy.json'),
    bg: '#fefce8',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goToSlide = (index: number) => {
    // FIX #33: Add haptic feedback for slide navigation
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goToSlide(currentIndex + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await storage.setOnboardingDone();
      analytics.track('onboarding_completed');
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    await storage.setOnboardingDone();
    analytics.track('onboarding_skipped');
    router.replace('/(tabs)');
  };

  const handleScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      {/* Background tint per slide */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: SLIDES[currentIndex].bg }]} />

      {/* Back button — FIX #18: On first slide, go to /auth not /(tabs) */}
      <TouchableOpacity style={styles.backButton} onPress={() => {
        if (currentIndex > 0) {
          goToSlide(currentIndex - 1);
        } else {
          // First slide: go back to auth instead of bypassing auth wall
          router.replace('/auth');
        }
      }} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>

      {/* Skip button */}
      <TouchableOpacity style={styles.skip} onPress={handleSkip} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={[styles.slide, { width }]}>
            {/* Lottie */}
            <View style={styles.animationContainer}>
              <LottieView
                source={slide.animation}
                autoPlay
                loop
                style={styles.lottie}
              />
            </View>

            {/* Text */}
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDescription}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.footer}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
              <View
                style={[
                  styles.dot,
                  i === currentIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextText}>
            {currentIndex < SLIDES.length - 1 ? 'Next' : 'Get Started'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  backButton: { position: 'absolute', top: 52, left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  skip: { position: 'absolute', top: 56, right: 24, zIndex: 10 },
  skipText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md, color: Colors.textSecondary },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 60 },
  animationContainer: { width: width * 0.75, height: height * 0.38, marginBottom: 40 },
  lottie: { width: '100%', height: '100%' },
  slideTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize['3xl'],
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 33,
  },
  slideDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  footer: { paddingHorizontal: 32, paddingBottom: 56, alignItems: 'center', gap: 28 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { borderRadius: 5, height: 8 },
  dotActive: { width: 24, backgroundColor: Colors.primary },
  dotInactive: { width: 8, backgroundColor: Colors.neutral300 },
  nextButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: 14, height: 54,
    width: '100%', gap: 8, ...Shadows.greenGlow,
  },
  nextText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.white },
});
