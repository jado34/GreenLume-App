import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-or-publishable-key';

/**
 * Check whether Supabase credentials have been configured.
 * Returns false when the user hasn't created a .env file yet,
 * so the app can gracefully fall back to Guest Mode.
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://YOUR_PROJECT_ID.supabase.co' &&
    supabaseAnonKey !== 'your-anon-or-publishable-key'
  );
};

/**
 * The Supabase client — configured with AsyncStorage for session persistence
 * in React Native / Expo Go.
 *
 * If the environment variables are missing, this will still create a client
 * (with empty strings), but `isSupabaseConfigured()` will return false and
 * the auth screen will show a helpful message instead of crashing.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
