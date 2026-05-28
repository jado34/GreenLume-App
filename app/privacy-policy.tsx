import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

export default function PrivacyPolicyScreen() {
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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: May 2026</Text>

          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            GreenLume collects minimal data to provide our sustainability tracking service:
          </Text>
          <Text style={styles.bullet}>• Display name you provide</Text>
          <Text style={styles.bullet}>• Sustainability actions you log</Text>
          <Text style={styles.bullet}>• Points and streak data</Text>
          <Text style={styles.bullet}>• Account credentials (if using Google sign-in)</Text>

          <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
          <Text style={styles.paragraph}>
            Your data is used solely to:
          </Text>
          <Text style={styles.bullet}>• Track and calculate your GreenLume points</Text>
          <Text style={styles.bullet}>• Maintain your streaks and achievements</Text>
          <Text style={styles.bullet}>• Show your impact statistics</Text>
          <Text style={styles.bullet}>• Sync your progress across devices</Text>

          <Text style={styles.sectionTitle}>3. Data Storage & Security</Text>
          <Text style={styles.paragraph}>
            Your data is stored securely using industry-standard encryption. We implement
            appropriate technical and organizational measures to protect your personal
            information against unauthorized access, alteration, or destruction.
          </Text>

          <Text style={styles.sectionTitle}>4. Data Sharing</Text>
          <Text style={styles.paragraph}>
            We do NOT sell, trade, or transfer your personal information to
            outside parties. Your data is used only for providing GreenLume
            services and is never shared with third-party advertisers.
          </Text>

          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to:
          </Text>
          <Text style={styles.bullet}>• Access your personal data</Text>
          <Text style={styles.bullet}>• Request data deletion</Text>
          <Text style={styles.bullet}>• Export your data</Text>
          <Text style={styles.bullet}>• Close your account</Text>

          <Text style={styles.sectionTitle}>6. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            GreenLume is not intended for children under 13. We do not knowingly
            collect information from children under 13.
          </Text>

          <Text style={styles.sectionTitle}>7. Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this privacy policy from time to time. We will notify
            you of any material changes by posting the new policy on this page and
            updating the "Last Updated" date.
          </Text>

          <Text style={styles.sectionTitle}>9. Analytics & Third-Party Services</Text>
          <Text style={styles.paragraph}>
            To improve GreenLume, we use PostHog — a product analytics platform — to collect
            anonymous, aggregated data about how users interact with the app. This includes:
          </Text>
          <Text style={styles.bullet}>• Habits logged (e.g. "ride_pool", "aesthetic_flask")</Text>
          <Text style={styles.bullet}>• Onboarding completion or skip events</Text>
          <Text style={styles.bullet}>• Premium paywall views and subscription events</Text>
          <Text style={styles.paragraph}>
            This data is used solely to understand which features are working and to improve
            the app experience. It is NOT sold or shared with advertisers. You can opt out
            of analytics at any time from the Privacy section in your Profile settings.
          </Text>
          <Text style={styles.paragraph}>
            PostHog processes data in accordance with GDPR and applicable Nigerian data
            protection regulations (NDPA 2023 / NDPR). Learn more at posthog.com/privacy.
          </Text>

          <Text style={styles.sectionTitle}>10. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <Text style={styles.link}>support@greenlume.app</Text>
          </Text>

          <View style={styles.divider} />

          <Text style={styles.footer}>
            By using GreenLume, you agree to the collection and use of
            information in accordance with this policy.
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