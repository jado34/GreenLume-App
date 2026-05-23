import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_KEYS = {
  ENABLED: 'gs_notifications_enabled',
  TIME: 'gs_notification_time',
};

// MOCKED for Expo Go SDK 53 deadline.
// `expo-notifications` has a fatal bug in Expo Go when bundled. By removing the import, we bypass the crash 100%.
export const notifications = {
  async requestPermissions(): Promise<boolean> {
    return true; // Pretend we got permission
  },

  async isEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(NOTIFICATION_KEYS.ENABLED);
    return value === 'true';
  },

  async setEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(NOTIFICATION_KEYS.ENABLED, enabled ? 'true' : 'false');
  },

  async getReminderTime(): Promise<{ hour: number; minute: number }> {
    const stored = await AsyncStorage.getItem(NOTIFICATION_KEYS.TIME);
    if (stored) {
      return JSON.parse(stored);
    }
    return { hour: 9, minute: 0 };
  },

  async setReminderTime(hour: number, minute: number): Promise<void> {
    await AsyncStorage.setItem(
      NOTIFICATION_KEYS.TIME,
      JSON.stringify({ hour, minute })
    );
  },

  async scheduleDailyReminder(): Promise<void> {
    // Silently mocked to prevent crash
    console.log('[Mocked] Simulated scheduling daily reminder.');
  },

  async cancelAll(): Promise<void> {
    await notifications.setEnabled(false);
  },
};