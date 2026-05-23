import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { LogBox } from 'react-native';

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

WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Listen for Supabase auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Supabase Auth]', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user;
          const displayName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email ||
            'User';
          const provider =
            user.app_metadata?.provider || 'supabase';

          await storage.setAuthenticated(displayName, provider, user.id);
          await storage.setSupabaseUserMeta({
            email: user.email || '',
            avatarUrl: user.user_metadata?.avatar_url || '',
            provider,
          });

          await storage.restoreFromSupabase();
        }

        if (event === 'SIGNED_OUT') {
          await storage.signOut();
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
  );
}
