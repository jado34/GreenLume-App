import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

export default function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: April 2026</Text>

          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By downloading, installing, or using the GreenLume mobile application
            ("GreenLume" or "App"), you agree to be bound by these Terms of Service
            ("Terms"). If you do not agree to these Terms, do not use the App.
          </Text>

          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            GreenLume is a sustainability tracking app that helps users track their
            eco-friendly actions, earn GreenLume points, maintain streaks, and compete on
            leaderboards. The App provides a simple way to log daily environmental actions
            and visualize your positive impact on the planet.
          </Text>

          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            To use GreenLume, you may sign in using:
          </Text>
          <Text style={styles.bullet}>• Guest Mode (local data only)</Text>
          <Text style={styles.bullet}>• Google Sign-In (requires Google account)</Text>
          <Text style={styles.paragraph}>
            You are responsible for maintaining the confidentiality of your account
            credentials and for all activities that occur under your account.
          </Text>

          <Text style={styles.sectionTitle}>4. User Conduct</Text>
          <Text style={styles.paragraph}>
            When using GreenLume, you agree NOT to:
          </Text>
          <Text style={styles.bullet}>• Violate any applicable laws or regulations</Text>
          <Text style={styles.bullet}>• Infringe upon the rights of others</Text>
          <Text style={styles.bullet}>• Use the App for any unlawful purpose</Text>
          <Text style={styles.bullet}>• Attempt to hack, modify, or disrupt the App</Text>
          <Text style={styles.bullet}>• Create false or misleading content</Text>

          <Text style={styles.sectionTitle}>5. Sustainability Claims</Text>
          <Text style={styles.paragraph}>
            GreenLume provides estimated environmental impact calculations based on
            generalized EPA and UNEP data. These are for informational purposes only
            and may not reflect actual environmental savings. We make no warranties
            regarding the accuracy of impact estimates.
          </Text>

          <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All content, features, and functionality of GreenLume are owned
            by GreenLume and are protected by copyright, trademark, and
            other intellectual property laws. You may not copy, modify,
            or distribute our content without permission.
          </Text>

          <Text style={styles.sectionTitle}>7. Disclaimer of Warranties</Text>
          <Text style={styles.paragraph}>
            THE APP IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.
            WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING
            IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
            PARTICULAR PURPOSE.
          </Text>

          <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            GreenLume shall not be liable for any indirect, incidental,
            or consequential damages arising from your use of the App. Our
            total liability shall not exceed the amount you paid, if any,
            for the App.
          </Text>

          <Text style={styles.sectionTitle}>9. Termination</Text>
          <Text style={styles.paragraph}>
            We may terminate or suspend your access to the App immediately,
            without prior notice, for any violation of these Terms. Upon
            termination, you must cease all use of the App.
          </Text>

          <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these Terms at any time. Your
            continued use of the App after changes constitutes acceptance
            of the new Terms.
          </Text>

          <Text style={styles.sectionTitle}>11. Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms shall be governed by and construed in accordance
            with the laws of the jurisdiction in which GreenLume operates,
            without regard to its conflict of law provisions.
          </Text>

          <Text style={styles.sectionTitle}>12. Contact Information</Text>
          <Text style={styles.paragraph}>
            For questions about these Terms, please contact us at{' '}
            <Text style={styles.link}>support@greenlume.app</Text>
          </Text>

          <View style={styles.divider} />

          <Text style={styles.footer}>
            By using GreenLume, you acknowledge that you have read,
            understood, and agree to be bound by these Terms of Service.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral50 },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.neutral100,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.textPrimary },
  placeholder: { width: 40 },
  content: { padding: 20 },
  lastUpdated: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginBottom: 24 },
  sectionTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.textPrimary, marginBottom: 10, marginTop: 20 },
  paragraph: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  bullet: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, color: Colors.textSecondary, lineHeight: 26, paddingLeft: 8 },
  link: { color: Colors.primary, fontFamily: Typography.fontFamily.medium },
  divider: { height: 40 },
  footer: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', marginTop: 20 },
});