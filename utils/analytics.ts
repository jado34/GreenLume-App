import PostHog from 'posthog-react-native';

// Safely initialize PostHog, checking if we have a key so the app doesn't crash locally
const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || 'dummy_key';
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

export const posthog = new PostHog(apiKey, {
  host,
  enable: !!process.env.EXPO_PUBLIC_POSTHOG_API_KEY, // Disable if no key is provided
});

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
  track: (event: string, properties?: Record<string, any>) => {
    try {
      posthog.capture(event, properties);
    } catch (e) {
      console.warn('Analytics track error:', e);
    }
  },
};
