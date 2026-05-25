import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const NOTIFICATION_KEYS = {
  ENABLED: 'gs_notifications_enabled',
  TIME: 'gs_notification_time',
};

// Set up background notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notifications = {
  async registerForPushNotificationsAsync(userId: string): Promise<string | null> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // Get the token that uniquely identifies this device
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '997f041d-533a-467b-bebd-f92df48f7005'
      });
      
      const token = tokenData.data;
      console.log('Push Token Generated:', token);

      // Save token to Supabase
      if (token && userId) {
        await supabase.from('push_tokens').upsert({
          user_id: userId,
          token: token,
          platform: Platform.OS
        }, { onConflict: 'token' });
      }

      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
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
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      const isEnabled = await this.isEnabled();
      if (!isEnabled) return;

      const time = await this.getReminderTime();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to log your impact! 🌍",
          body: "Don't break your streak! Your virtual plants need watering.",
        },
        trigger: {
          hour: time.hour,
          minute: time.minute,
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
        },
      });
    } catch (err) {
      console.error('Failed to schedule local notification:', err);
    }
  },

  async cancelAll(): Promise<void> {
    await this.setEnabled(false);
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (err) {
      console.error('Failed to cancel notifications', err);
    }
  },
};