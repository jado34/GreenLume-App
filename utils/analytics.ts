// PostHog analytics integration completely disabled to resolve native startup crash.
// If you want to configure PostHog in the future:
// 1. Install posthog-react-native
// 2. Define process.env.EXPO_PUBLIC_POSTHOG_API_KEY
// 3. Re-import and initialize PostHog here.

export const posthog = null;

export const analytics = {
  identify: (userId: string, traits?: Record<string, any>) => {
    // No-op - analytics disabled
  },
  reset: () => {
    // No-op - analytics disabled
  },
  track: (event: string, properties?: Record<string, any>) => {
    // No-op - analytics disabled
  },
};

