import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase, isSupabaseConfigured } from './supabase';
import { storage } from './storage';
import { makeRedirectUri } from 'expo-auth-session';

const REDIRECT_URL = makeRedirectUri({
  path: 'auth/callback',
});
console.log('--- SUPABASE REDIRECT URL TO ADD: ---');
console.log(REDIRECT_URL);
console.log('---------------------------------------');

export async function signInWithGoogle(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    Alert.alert(
      'Setup Required',
      'Please configure Supabase in .env file',
      [{ text: 'OK' }]
    );
    return false;
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: REDIRECT_URL,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error('OAuth error:', error.message);
      Alert.alert('Error', error.message);
      return false;
    }

    if (!data?.url) {
      Alert.alert('Error', 'Could not get auth URL');
      return false;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URL);

    if (result.type === 'success' && result.url) {
      await handleAuthCallback(result.url);
      return true;
    }

    return false;
  } catch (err: any) {
    console.error('Auth error:', err);
    Alert.alert('Sign In Failed', err?.message || 'Please try again');
    return false;
  }
}

async function handleAuthCallback(url: string) {
  try {
    const urlObj = new URL(url);
    
    const hashParams = new URLSearchParams(urlObj.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    const code = urlObj.searchParams.get('code');

    if (accessToken && refreshToken) {
      const { data: sessionData, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) throw error;

      const user = sessionData?.session?.user;
      if (user) {
        await saveUserInfo(user);
      }
    } else if (code) {
      const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) throw error;

      const user = sessionData?.session?.user;
      if (user) {
        await saveUserInfo(user);
      }
    }
  } catch (err) {
    console.error('Callback error:', err);
  }
}

async function saveUserInfo(user: any) {
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User';
  const userId = user.id;

  await storage.setAuthenticated(displayName, 'google', userId);
  await storage.setSupabaseUserMeta({
    email: user.email || '',
    avatarUrl: user.user_metadata?.avatar_url || '',
    provider: 'google',
  });

  router.replace('/onboarding');
}