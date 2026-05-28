import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../utils/supabase';
import { storage } from '../../utils/storage';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function AuthCallback() {
  const router = useRouter();
  const url = Linking.useURL();

  useEffect(() => {
    if (url) {
      handleUrl(url);
    } else {
      checkActiveSession();
    }
  }, [url]);

  const checkActiveSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[AuthCallback] Active session found, routing to onboarding');
        router.replace('/onboarding');
      } else {
        // Wait briefly in case it's a slow session update, then fallback to login
        const timer = setTimeout(() => {
          router.replace('/auth');
        }, 2000);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error('[AuthCallback] Session check error:', err);
      router.replace('/auth');
    }
  };

  const handleUrl = async (redirectUrl: string) => {
    try {
      console.log('[AuthCallback] Handling redirect URL:', redirectUrl);

      // Robust param extractor using regex to avoid URLSearchParams dependency issues
      const getParam = (source: string, name: string) => {
        const match = source.match(new RegExp(`[?&#]${name}=([^&]+)`));
        return match ? decodeURIComponent(match[1]) : null;
      };

      const accessToken = getParam(redirectUrl, 'access_token');
      const refreshToken = getParam(redirectUrl, 'refresh_token');
      const code = getParam(redirectUrl, 'code');

      if (accessToken && refreshToken) {
        console.log('[AuthCallback] Found session tokens in URL');
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) throw error;
        
        const user = data.session?.user;
        if (user) {
          const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User';
          await storage.setAuthenticated(displayName, 'google', user.id);
          await storage.setSupabaseUserMeta({
            email: user.email || '',
            avatarUrl: user.user_metadata?.avatar_url || '',
            provider: 'google',
          });
        }
        router.replace('/onboarding');
      } else if (code) {
        console.log('[AuthCallback] Found authorization code in URL');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        const user = data.session?.user;
        if (user) {
          const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User';
          await storage.setAuthenticated(displayName, 'google', user.id);
          await storage.setSupabaseUserMeta({
            email: user.email || '',
            avatarUrl: user.user_metadata?.avatar_url || '',
            provider: 'google',
          });
        }
        router.replace('/onboarding');
      } else {
        await checkActiveSession();
      }
    } catch (error) {
      console.error('[AuthCallback] Error handling auth redirect:', error);
      router.replace('/auth');
    }
  };

  return (
    <LinearGradient
      colors={[Colors.primaryDark || '#29702d', Colors.primary || '#37953c']}
      style={styles.container}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.text}>Completing sign in...</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
});
