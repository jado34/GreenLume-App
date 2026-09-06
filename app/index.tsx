// Splash Screen — Animated brand intro with custom background & progress percentage
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { storage } from '../utils/storage';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1.1, damping: 14, stiffness: 100, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();

    // Tagline fade in
    setTimeout(() => {
      Animated.timing(taglineOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 300);

    // Progress area fade in
    setTimeout(() => {
      Animated.timing(loadingOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 500);

    // Track percentage state as animation runs
    const listenerId = progressAnim.addListener(({ value }) => {
      setPercentage(Math.min(100, Math.max(0, Math.round(value))));
    });

    // Start progress bar animation from 0 to 100%
    setTimeout(() => {
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 2200,
        useNativeDriver: false,
      }).start();
    }, 400);

    // Navigation trigger after 3 seconds
    const timer = setTimeout(async () => {
      const isAuth = await storage.isAuthenticated();
      const isOnboarding = await storage.isOnboardingDone();
      if (isAuth && isOnboarding) {
        router.replace('/(tabs)');
      } else if (isAuth) {
        router.replace('/onboarding');
      } else {
        router.replace('/auth');
      }
    }, 3000);

    return () => {
      progressAnim.removeListener(listenerId);
      clearTimeout(timer);
    };
  }, []);

  const progressWidthPercent = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <ImageBackground
      source={require('../assets/images/splash_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Subtle top & bottom shadow gradient for contrast */}
      <LinearGradient
        colors={['rgba(255,255,255,0.45)', 'transparent', 'rgba(0,0,0,0.3)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Brand Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../assets/images/logo_color.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Bottom Loading Section */}
      <Animated.View style={[styles.bottomSection, { opacity: loadingOpacity }]}>
        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Growing a better tomorrow...
        </Animated.Text>

        {/* Progress Bar + Percentage Row */}
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidthPercent }]} />
          </View>
          <Text style={styles.percentText}>{percentage}%</Text>
        </View>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    marginTop: height * 0.20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: width * 0.86,
    height: 150,
  },
  bottomSection: {
    marginBottom: height * 0.08,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 28,
  },
  tagline: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.lg,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  progressTrack: {
    width: width * 0.62,
    height: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#15803d',
    borderRadius: 6,
  },
  percentText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: '#15803d',
    minWidth: 42,
    textAlign: 'left',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

