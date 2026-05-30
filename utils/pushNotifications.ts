/**
 * GreenLume — Push Notification Scheduling Engine
 *
 * Manages daily streak reminder push notifications.
 * - Schedules a daily notification at a user-chosen time
 * - Cancels/reschedules when the user changes their reminder time
 * - Cancels automatically when the user has already logged today
 * - Requests permissions gracefully on first use
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const REMINDER_TIME_KEY = 'gs_daily_reminder_time';  // "HH:MM" string e.g. "20:00"
const REMINDER_ID_KEY   = 'gs_daily_reminder_id';    // identifier returned by scheduleNotification
const REMINDER_ON_KEY   = 'gs_daily_reminder_on';    // 'true' | 'false'

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Permission
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Requests push notification permissions.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: 'Daily Reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─────────────────────────────────────────────────────────────────────────────
// Reminder Preferences
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the stored reminder time as "HH:MM", defaults to "20:00" */
export async function getReminderTime(): Promise<string> {
  return (await AsyncStorage.getItem(REMINDER_TIME_KEY)) || '20:00';
}

/** Returns whether the daily reminder is enabled */
export async function isReminderEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(REMINDER_ON_KEY);
  return val !== 'false'; // Defaults to enabled
}

// ─────────────────────────────────────────────────────────────────────────────
// Scheduling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schedules (or reschedules) the daily streak reminder.
 * Pass `streak` so the message is personalised.
 */
export async function scheduleDailyReminder(
  timeStr: string,
  streak: number = 0
): Promise<void> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    // Cancel any existing reminder first
    await cancelDailyReminder();

    const [hourStr, minStr] = timeStr.split(':');
    const hour   = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    const body = streak >= 7
      ? `🔥 You have a ${streak}-day streak! Don't break it — log an eco-action today!`
      : streak >= 3
      ? `🌿 ${streak} days and counting! Log today's green action to keep your streak alive.`
      : `🌱 Small daily actions = big environmental impact. Log one eco-action today!`;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌍 GreenLume Daily Reminder',
        body,
        data: { type: 'daily_reminder' },
        ...(Platform.OS === 'android' ? { channelId: 'daily-reminder' } : {}),
      },
      trigger: {
        hour,
        minute,
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
      },
    });

    await AsyncStorage.multiSet([
      [REMINDER_TIME_KEY, timeStr],
      [REMINDER_ID_KEY, id],
      [REMINDER_ON_KEY, 'true'],
    ]);
  } catch (err) {
    console.warn('[PushNotifications] scheduleDailyReminder error:', err);
  }
}

/** Cancels the daily reminder and persists the disabled state */
export async function cancelDailyReminder(): Promise<void> {
  try {
    const existingId = await AsyncStorage.getItem(REMINDER_ID_KEY);
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
      await AsyncStorage.removeItem(REMINDER_ID_KEY);
    }
    await AsyncStorage.setItem(REMINDER_ON_KEY, 'false');
  } catch {}
}

/**
 * Called from the Profile screen toggle.
 * If enabling: schedules at stored time (or default 20:00).
 * If disabling: cancels.
 */
export async function setReminderEnabled(
  enabled: boolean,
  streak: number = 0
): Promise<void> {
  if (enabled) {
    const time = await getReminderTime();
    await scheduleDailyReminder(time, streak);
  } else {
    await cancelDailyReminder();
  }
}

/**
 * Updates the reminder time without toggling the enabled state.
 * Only reschedules if reminders are currently on.
 */
export async function updateReminderTime(
  newTime: string,
  streak: number = 0
): Promise<void> {
  const enabled = await isReminderEnabled();
  await AsyncStorage.setItem(REMINDER_TIME_KEY, newTime);
  if (enabled) {
    await scheduleDailyReminder(newTime, streak);
  }
}
