import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { LogBox, Platform } from 'react-native';
import Purchases from 'react-native-purchases';

LogBox.ignoreLogs([
  'Android Push notifications (remote notifications) functionality provided by expo-notifications was removed',
  'expo-notifications: Android Push notifications'
]);
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import 'react-native-url-polyfill/auto';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { toastConfig } from '../components/ToastConfig';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { storage } from '../utils/storage';
import { notifications } from '../utils/notifications';
import { queryClient, asyncStoragePersister } from '../utils/queryClient';
import { posthog, analytics } from '../utils/analytics';

WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync();

function SafePostHogProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Initialize RevenueCat
  useEffect(() => {
    const initPurchases = async () => {
      try {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
        let apiKey = '';
        if (Platform.OS === 'ios') {
          apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
        } else if (Platform.OS === 'android') {
          apiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || ''; 
        }
        
        if (apiKey) {
          Purchases.configure({ apiKey });
        }
      } catch (error) {
        console.error('Error initializing RevenueCat:', error);
      }
    };
    
    initPurchases();
  }, []);

  // Listen for Supabase auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Supabase Auth]', event, session?.user?.email);

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          const user = session.user;
          const displayName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email ||
            'User';
          
          analytics.identify(user.id, { email: user.email, name: displayName });
          const provider =
            user.app_metadata?.provider || 'supabase';

          await storage.setAuthenticated(displayName, provider, user.id);
          await storage.setSupabaseUserMeta({
            email: user.email || '',
            avatarUrl: user.user_metadata?.avatar_url || '',
            provider,
          });

          await storage.restoreFromSupabase();

          // Auto-upgrade developer account to Premium in the database
          if (user.email === 'olawuwoadegoke16@gmail.com') {
            console.log('[Storage] Auto-upgrading owner account to Premium');
            await storage.setPremium(true);
            await storage.syncToSupabase();
            
            // Invalidate queries so that UI screens (like index.tsx, profile.tsx) update
            const { USER_DATA_QUERY_KEY } = require('../hooks/useUserData');
            queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY });
          }
          
          try {
            await Purchases.logIn(user.id);
          } catch (e) {
            console.error('[RevenueCat] Login error:', e);
          }
          
          // Request and save Expo Push Token for remote notifications
          await notifications.registerForPushNotificationsAsync(user.id);
        }

        if (event === 'SIGNED_OUT') {
          analytics.reset();
          await storage.signOut();
          try {
            await Purchases.logOut();
          } catch (e) {
            console.error('[RevenueCat] Logout error:', e);
          }
        }
      }
    );

    supabase.auth.startAutoRefresh();

    return () => {
      subscription.unsubscribe();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      notifications.isEnabled().then((enabled) => {
        if (enabled) notifications.scheduleDailyReminder();
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafePostHogProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="levelup" options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
            <Stack.Screen name="monthly-report" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
            <Stack.Screen name="custom-action" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
            <Stack.Screen name="impact-map" options={{ animation: 'fade_from_bottom' }} />
            <Stack.Screen name="privacy-policy" />
            <Stack.Screen name="terms-of-service" />
            <Stack.Screen name="leaderboard" />
            <Stack.Screen name="premium" options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
            <Stack.Screen name="ai-coach" options={{ animation: 'fade' }} />
          </Stack>
          <Toast config={toastConfig} />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
    </SafePostHogProvider>
  );
}
