// Onboarding — Custom Figma-designed flow with top-left headline, full-bleed background images, and single ImageBackground card
import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, ImageBackground, Image, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { storage } from '../utils/storage';
import { analytics } from '../utils/analytics';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    step: 1,
    title: 'Every\nAction Matters',
    highlightWord: 'choice',
    descriptionPrefix: 'Every ',
    descriptionSuffix: ' you make today shapes a greener tomorrow.',
    bgImage: require('../assets/images/onboarding_bg_1.png'),
    icon: 'leaf-outline' as const,
  },
  {
    step: 2,
    title: 'Your Actions,\nA Greener Future.',
    highlightWord: 'count.',
    descriptionPrefix: 'Every choice matters. Track, Grow and make everyday ',
    descriptionSuffix: '',
    bgImage: require('../assets/images/onboarding_bg_2.jpg'),
    icon: 'leaf-outline' as const,
  },
  {
    step: 3,
    title: 'Grow\nTogether',
    highlightWord: 'massive impact.',
    descriptionPrefix: 'Together we turn small actions into a ',
    descriptionSuffix: '',
    bgImage: require('../assets/images/onboarding_bg_3.jpg'),
    icon: 'leaf-outline' as const,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goToSlide = (index: number) => {
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
      router.replace('/auth');
    }
  };

  const handleSkip = async () => {
    await storage.setOnboardingDone();
    analytics.track('onboarding_skipped');
    router.replace('/auth');
  };

  const handleScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Main horizontal carousel */}
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
          <ImageBackground
            key={index}
            source={slide.bgImage}
            style={[styles.slideBg, { width, height }]}
            resizeMode="cover"
          >
            {/* Dark green tint overlay asset */}
            <Image
              source={require('../assets/images/onboarding_bg_overlay.png')}
              style={[StyleSheet.absoluteFillObject, { opacity: slide.step === 3 ? 0.05 : 0.20 }]}
              resizeMode="cover"
            />

            {/* Header Controls: Step Badge & Skip */}
            <View style={styles.headerRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepText}>{slide.step}</Text>
              </View>

              {slide.step < 3 && (
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Headline Title at top left over background */}
            <View style={styles.titleContainer}>
              <Text style={styles.headlineTitle}>{slide.title}</Text>
            </View>

            {/* Step 3 Custom Floating Challenge Card & Feature Chips Overlay */}
            {slide.step === 3 ? (
              <View style={styles.step3OverlayContainer}>
                {/* Community Challenge Floating Card */}
                <View style={styles.challengeCard}>
                  <View style={styles.challengeHeaderRow}>
                    <View style={styles.challengeIconWrap}>
                      <Ionicons name="people" size={20} color="#15803d" />
                      <View style={styles.heartBadge}>
                        <Ionicons name="heart" size={10} color="#ffffff" />
                      </View>
                    </View>
                    <View style={{ flex: 1, paddingLeft: 12 }}>
                      <Text style={styles.challengeTitle}>Community Challenge</Text>
                      <Text style={styles.challengeSubtitle}>Plant 1,000 trees together</Text>
                    </View>
                    <Text style={{ fontSize: 32 }}>🌳</Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '45%' }]} />
                  </View>

                  {/* Progress Stats Row */}
                  <View style={styles.progressStatsRow}>
                    <Text style={styles.progressStatsText}>450/1,000 trees planted</Text>
                    <Text style={styles.progressPercentText}>45%</Text>
                  </View>
                </View>

                {/* 4 Feature Chips */}
                <View style={styles.chipsRow}>
                  <View style={styles.chipPill}>
                    <Ionicons name="stopwatch-outline" size={14} color="#15803d" />
                    <Text style={styles.chipText}>Challenges</Text>
                  </View>
                  <View style={styles.chipPill}>
                    <Ionicons name="trophy-outline" size={14} color="#15803d" />
                    <Text style={styles.chipText}>Rewards</Text>
                  </View>
                  <View style={styles.chipPill}>
                    <Ionicons name="people-outline" size={14} color="#15803d" />
                    <Text style={styles.chipText}>Community</Text>
                  </View>
                  <View style={styles.chipPill}>
                    <Ionicons name="gift-outline" size={14} color="#15803d" />
                    <Text style={styles.chipText}>Achievements</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {/* Bottom Card using onboarding_card_shape.png directly as ImageBackground */}
            <ImageBackground
              source={require('../assets/images/onboarding_card_shape.png')}
              style={styles.cardImageBg}
              resizeMode="cover"
            >
              {/* Content Row: Icon Box + Copy */}
              <View style={styles.cardContentRow}>
                {/* Green Leaf Icon Box */}
                <View style={styles.iconBox}>
                  <Ionicons name={slide.icon} size={26} color="#15803d" />
                </View>

                {/* Card Description with Highlighted Word */}
                <Text style={styles.cardDescription}>
                  {slide.descriptionPrefix}
                  <Text style={styles.highlightText}>{slide.highlightWord}</Text>
                  {slide.descriptionSuffix}
                </Text>
              </View>

              {/* Bottom Controls Row: Dots + Next Button */}
              <View style={styles.cardFooterRow}>
                {/* Pagination Dots */}
                <View style={styles.dotsRow}>
                  {SLIDES.map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => goToSlide(i)} activeOpacity={0.7}>
                      <View
                        style={[
                          styles.dot,
                          i === currentIndex ? styles.dotActive : styles.dotInactive,
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Next / Get Started Button */}
                <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
                  <Text style={styles.nextButtonText}>
                    {currentIndex < SLIDES.length - 1 ? 'Next' : 'Get Started'}
                  </Text>
                  {currentIndex < SLIDES.length - 1 && (
                    <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </ImageBackground>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  slideBg: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 28,
    zIndex: 10,
  },
  stepBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: '#15803d',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: '#15803d',
  },
  titleContainer: {
    paddingHorizontal: 28,
    marginTop: 20,
    zIndex: 10,
  },
  headlineTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 36,
    lineHeight: 44,
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  step3OverlayContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
    zIndex: 10,
  },
  challengeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  challengeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heartBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#65a30d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  challengeTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 15,
    color: '#0f172a',
  },
  challengeSubtitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4d7c0f',
    borderRadius: 4,
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStatsText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    color: '#334155',
  },
  progressPercentText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    color: '#4d7c0f',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,
    color: '#1e293b',
  },
  cardImageBg: {
    width: width,
    height: Math.max(230, height * 0.30),
    paddingHorizontal: 28,
    paddingTop: 52,
    paddingBottom: 36,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDescription: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.md,
    lineHeight: 24,
    color: '#1e293b',
  },
  highlightText: {
    fontFamily: Typography.fontFamily.bold,
    color: '#15803d',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 8,
    backgroundColor: '#15803d',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#cbd5e1',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803d',
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: '#ffffff',
  },
});






