import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { storage } from '../utils/storage';
import { useQueryClient } from '@tanstack/react-query';
import { USER_DATA_QUERY_KEY } from '../hooks/useUserData';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import Purchases from 'react-native-purchases';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const PREMIUM_FEATURES = [
  {
    id: '1',
    icon: 'leaf',
    title: 'Detailed Impact Analytics',
    desc: 'Unlock deep insights and personalized charts detailing your precise carbon offset over time.',
    color: '#10b981', // Emerald
  },
  {
    id: '2',
    icon: 'planet',
    title: 'Double Carbon Offsets',
    desc: 'For every action you log, we will double the contribution to real-world verified carbon offset projects.',
    color: '#0ea5e9', // Blue
  },
  {
    id: '3',
    icon: 'trophy',
    title: 'VIP Quests & Badges',
    desc: 'Access exclusive, high-tier challenges and earn animated, glowing profile badges.',
    color: '#f59e0b', // Amber/Gold
  },
  {
    id: '4',
    icon: 'people',
    title: 'Custom Squads',
    desc: 'Create private leaderboards and compete directly with your friends and family.',
    color: '#8b5cf6', // Purple
  },
  {
    id: '5',
    icon: 'paw',
    title: 'Digital Eco-Pets',
    desc: 'Adopt a pet that levels up and grows happier as you log real-world green actions.',
    color: '#ec4899', // Pink
  },
];

export default function PremiumScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const queryClient = useQueryClient();

  const handleSubscribe = async () => {
    try {
      // Show the RevenueCat Paywall automatically, bypassing if they already have it!
      // FIX #13: IMPORTANT — Verify that "GreenLume Pro" exactly matches your entitlement
      // identifier in the RevenueCat dashboard. A mismatch will break subscription detection.
      const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: "GreenLume Pro"
      });

      // If they bought it or restored it successfully, or already had it
      if (paywallResult === PAYWALL_RESULT.PURCHASED || paywallResult === PAYWALL_RESULT.RESTORED || paywallResult === PAYWALL_RESULT.NOT_PRESENTED) {
        // Double check the customer info to be certain
        const customerInfo = await Purchases.getCustomerInfo();
        if (typeof customerInfo.entitlements.active['GreenLume Pro'] !== "undefined") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await storage.setPremium(true);
          queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY });

          Toast.show({
            type: 'success',
            text1: 'Earth+ Unlocked! 🎉',
            text2: 'Welcome to the premium experience.',
            position: 'top',
          });

          router.back();
        }
      }
    } catch (error: any) {
      if (error && !error.userCancelled) {
        Toast.show({
          type: 'error',
          text1: 'Purchase Failed',
          text2: error.message || 'An error occurred during purchase.',
          position: 'top',
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Dark Background */}
      <LinearGradient
        colors={['#052008', '#0b390e', '#114f14']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: 'rgba(16, 185, 129, 0.15)' }]} />
      <View style={[styles.orb, { bottom: -50, left: -100, backgroundColor: 'rgba(245, 158, 11, 0.1)' }]} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Close Button — FIX #30: Add accessibilityLabel and Role */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
          accessibilityLabel="Close premium screen"
          accessibilityRole="button"
        >
          <View style={styles.closeIconBg}>
            <Ionicons name="close" size={24} color={Colors.white} />
          </View>
        </TouchableOpacity>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.crownContainer}>
              <Ionicons name="star" size={48} color="#f59e0b" />
            </View>
            <Text style={styles.title}>GreenLume <Text style={styles.titleHighlight}>Earth+</Text></Text>
            <Text style={styles.subtitle}>Amplify your impact and unlock the ultimate sustainability experience.</Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View key={feature.id} style={styles.featureCard}>
                <View style={[styles.iconContainer, { backgroundColor: `${feature.color}15` }]}>
                  <Ionicons name={feature.icon as any} size={26} color={feature.color} />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing & CTA */}
          <View style={styles.pricingContainer}>
            <Text style={styles.price}>$1.99 <Text style={styles.pricePeriod}>/ month</Text></Text>
            <Text style={styles.cancelText}>Cancel anytime. Billed monthly.</Text>
            
            <TouchableOpacity style={styles.ctaButton} onPress={handleSubscribe} activeOpacity={0.9}>
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>Unlock Earth+ Now</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#052008',
  },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    zIndex: 10,
  },
  closeIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  title: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 32,
    color: Colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  titleHighlight: {
    color: '#f59e0b',
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.md,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    gap: 20,
    marginBottom: 40,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.white,
    marginBottom: 4,
  },
  featureDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
  pricingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  price: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 40,
    color: Colors.white,
    marginBottom: 4,
  },
  pricePeriod: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.md,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  cancelText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 24,
  },
  ctaButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  ctaText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.white,
  },
});
