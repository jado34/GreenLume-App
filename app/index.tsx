// Splash Screen — Animated brand intro, then routes to auth or home
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { storage } from '../utils/storage';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(-0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const orb1Scale = useRef(new Animated.Value(0.8)).current;
  const orb2Scale = useRef(new Animated.Value(1.2)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, damping: 15, stiffness: 120, useNativeDriver: true }),
      Animated.spring(logoRotate, { toValue: 0, damping: 15, stiffness: 120, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Tagline fade in
    setTimeout(() => {
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 400);

    // Loading text
    setTimeout(() => {
      Animated.timing(loadingOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 600);

    // Progress bar
    setTimeout(() => {
      Animated.timing(progressWidth, { toValue: width * 0.6, duration: 2200, useNativeDriver: false }).start();
    }, 700);

    // Pulsing orbs
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb1Scale, { toValue: 1.2, duration: 2000, useNativeDriver: true }),
          Animated.timing(orb2Scale, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(orb1Scale, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
          Animated.timing(orb2Scale, { toValue: 1.2, duration: 2000, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Navigate after 3 seconds
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

    return () => clearTimeout(timer);
  }, []);

  const spin = logoRotate.interpolate({
    inputRange: [-0.5, 0],
    outputRange: ['-180deg', '0deg'],
  });

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <LinearGradient colors={['#1b5e20', '#2e7d32', '#388e3c']} style={StyleSheet.absoluteFill} />

      {/* Decorative orbs */}
      <Animated.View style={[styles.orb1, { transform: [{ scale: orb1Scale }] }]} />
      <Animated.View style={[styles.orb2, { transform: [{ scale: orb2Scale }] }]} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { rotate: spin }],
          },
        ]}
      >
        <Image
          source={require('../assets/images/logo_white.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Small actions. Real impact. Every day.
      </Animated.Text>

      {/* Progress area */}
      <Animated.View style={[styles.loadingArea, { opacity: loadingOpacity }]}>
        <Text style={styles.loadingText}>Preparing your dashboard...</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  orb2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  logoContainer: {
    marginBottom: 32,
    shadowColor: Colors.primaryLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
  },
  logo: {
    width: 260,
    height: 120,
  },
  tagline: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.lg,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 60,
    paddingHorizontal: 40,
  },
  loadingArea: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
  },
  progressTrack: {
    width: width * 0.6,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 2,
  },
});
