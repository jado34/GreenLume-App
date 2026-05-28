import PostHog from 'posthog-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_CONSENT_KEY = 'gs_analytics_consent';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || 'dummy_key';
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

export const posthog = new PostHog(apiKey, {
  host,
  enable: !!process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
});

/**
 * Check if the user has consented to analytics tracking.
 * Defaults to true (opted in) if no preference has been set yet.
 */
async function hasConsent(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ANALYTICS_CONSENT_KEY);
    return value !== 'false';
  } catch {
    return true;
  }
}

export const analytics = {
  identify: (userId: string, traits?: Record<string, any>) => {
    try {
      posthog.identify(userId, traits);
    } catch (e) {
      console.warn('Analytics identify error:', e);
    }
  },

  reset: () => {
    try {
      posthog.reset();
    } catch (e) {
      console.warn('Analytics reset error:', e);
    }
  },

  track: async (event: string, properties?: Record<string, any>) => {
    try {
      const consent = await hasConsent();
      if (!consent) return;
      posthog.capture(event, properties);
    } catch (e) {
      console.warn('Analytics track error:', e);
    }
  },

  setConsent: async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(ANALYTICS_CONSENT_KEY, enabled ? 'true' : 'false');
      if (!enabled) {
        posthog.optOut();
      } else {
        posthog.optIn();
      }
    } catch (e) {
      console.warn('Analytics setConsent error:', e);
    }
  },
};
