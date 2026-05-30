/**
 * GreenLume — In-App Notification Engine
 *
 * Stores and generates real, event-driven notifications based on what the user
 * actually does inside the app. Every notification here has a real cause:
 *   - Earning a badge
 *   - Reaching a streak milestone
 *   - Crossing a points threshold
 *   - Ranking up
 *   - Plants getting thirsty or withering
 *   - First action of the day (positive reinforcement)
 *
 * Notifications are stored in AsyncStorage and deduped per day so users
 * never see the same notification twice in one day.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserData } from './storage';
import { BADGES, getRankInfo } from './badges';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

const NOTIF_KEY = 'gs_in_app_notifications';
const MAX_NOTIFICATIONS = 25; // Rolling window — oldest are dropped

export type NotificationType =
  | 'streak'
  | 'badge'
  | 'points_milestone'
  | 'rank_up'
  | 'plant_thirsty'
  | 'plant_withered'
  | 'daily_nudge'
  | 'welcome';

export interface InAppNotification {
  id: string;
  type: NotificationType;
  icon: string;   // emoji character
  title: string;
  body: string;
  timestamp: string; // ISO 8601 string
  read: boolean;
}

export type RichNotification = InAppNotification & { timeAgo: string };

// ─────────────────────────────────────────────────────────────────────────────
// Time formatter
// ─────────────────────────────────────────────────────────────────────────────

export function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1)   return 'Just now';
  if (diffMins < 60)  return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)   return `${diffDays}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Store — AsyncStorage CRUD
// ─────────────────────────────────────────────────────────────────────────────

export const notificationStore = {
  /** Raw read — used internally */
  async getRaw(): Promise<InAppNotification[]> {
    try {
      const raw = await AsyncStorage.getItem(NOTIF_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as InAppNotification[];
    } catch {
      return [];
    }
  },

  /** Read for display — enriches each item with a formatted `timeAgo` string */
  async getAll(): Promise<RichNotification[]> {
    const notifs = await notificationStore.getRaw();
    return notifs.map(n => ({ ...n, timeAgo: formatTimeAgo(n.timestamp) }));
  },

  /**
   * Adds a new notification.
   * Deduplicates: same type + same title on the same calendar day = silently ignored.
   */
  async add(notif: Omit<InAppNotification, 'id' | 'timestamp' | 'read'>): Promise<void> {
    try {
      const existing = await notificationStore.getRaw();
      const today = new Date().toISOString().split('T')[0];
      const isDuplicate = existing.some(
        n => n.type === notif.type && n.title === notif.title && n.timestamp.startsWith(today)
      );
      if (isDuplicate) return;

      const newNotif: InAppNotification = {
        ...notif,
        id: `${notif.type}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
      };

      const updated = [newNotif, ...existing].slice(0, MAX_NOTIFICATIONS);
      await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
    } catch { /* silent fail — never crash the main app flow */ }
  },

  /** Mark every notification as read */
  async markAllRead(): Promise<void> {
    try {
      const existing = await notificationStore.getRaw();
      const updated = existing.map(n => ({ ...n, read: true }));
      await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
    } catch {}
  },

  /** Returns true if at least one notification is unread */
  async hasUnread(): Promise<boolean> {
    const notifs = await notificationStore.getRaw();
    return notifs.some(n => !n.read);
  },

  /** Full wipe — used for account deletion or reset */
  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(NOTIF_KEY);
  },

  /** Adds the one-time welcome notification on first use */
  async addWelcomeIfEmpty(): Promise<void> {
    const existing = await notificationStore.getRaw();
    if (existing.length === 0) {
      await notificationStore.add({
        type: 'welcome',
        icon: '💚',
        title: 'Welcome to GreenLume!',
        body: 'Start logging your first green action to earn points, build your streak, and grow your virtual forest. Every habit counts!',
      });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Smart Notification Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyses the diff between prevData and newData to generate meaningful,
 * context-rich notifications. Call this after every significant state change.
 *
 * @param newData   The updated UserData after the action was applied
 * @param prevData  A snapshot of UserData BEFORE the change
 * @param actionCounts  The per-action usage counts (for badge logic)
 */
export async function generateSmartNotifications(
  newData: UserData,
  prevData: Partial<UserData>,
  actionCounts: Record<string, number> = {}
): Promise<void> {
  const tasks: Promise<void>[] = [];

  // ── 1. STREAK MILESTONES ────────────────────────────────────────────────
  const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 100];
  const prevStreak = prevData.currentStreak ?? 0;
  if (
    newData.currentStreak > prevStreak &&
    STREAK_MILESTONES.includes(newData.currentStreak)
  ) {
    const s = newData.currentStreak;
    tasks.push(
      notificationStore.add({
        type: 'streak',
        icon: '🔥',
        title: `${s}-Day Streak! 🔥`,
        body:
          s >= 30
            ? `Incredible! A ${s}-day streak puts you among the top eco-champions. You're building habits that last a lifetime!`
            : s >= 7
            ? `A full week of green living! Your ${s}-day streak is inspiring — keep the momentum going.`
            : `${s} days in a row! Small daily actions compound into massive environmental impact. You've got this!`,
      })
    );
  }

  // ── 2. NEW BADGE UNLOCKS ────────────────────────────────────────────────
  const prevBadges = new Set(prevData.earnedBadges ?? []);
  const newlyEarned = newData.earnedBadges.filter(id => !prevBadges.has(id));
  for (const badgeId of newlyEarned) {
    const badge = BADGES.find(b => b.id === badgeId);
    if (badge) {
      tasks.push(
        notificationStore.add({
          type: 'badge',
          icon: '🏆',
          title: `Badge Unlocked: ${badge.name}!`,
          body: `${badge.description}. You earned +${badge.points} bonus GreenLume points for this achievement!`,
        })
      );
    }
  }

  // ── 3. POINTS MILESTONES ────────────────────────────────────────────────
  const POINT_MILESTONES = [50, 100, 250, 500, 1000, 2000, 5000];
  const prevPoints = prevData.totalPoints ?? 0;
  for (const milestone of POINT_MILESTONES) {
    if (prevPoints < milestone && newData.totalPoints >= milestone) {
      tasks.push(
        notificationStore.add({
          type: 'points_milestone',
          icon: '⭐',
          title: `${milestone.toLocaleString()} GreenLume Points!`,
          body: `You've reached a major milestone — ${milestone.toLocaleString()} points through real eco-actions. Your impact is measurable and growing every day!`,
        })
      );
      break; // Only one milestone notification per action call
    }
  }

  // ── 4. RANK UP ──────────────────────────────────────────────────────────
  if (prevData.totalPoints !== undefined) {
    const prevRank = getRankInfo(prevData.totalPoints);
    const newRank = getRankInfo(newData.totalPoints);
    if (prevRank.name !== newRank.name) {
      const gap = newRank.nextPoints - newData.totalPoints;
      tasks.push(
        notificationStore.add({
          type: 'rank_up',
          icon: newRank.emoji,
          title: `Ranked up to ${newRank.name}! ${newRank.emoji}`,
          body:
            newRank.nextPoints > 0
              ? `You're now a ${newRank.name}! Just ${gap.toLocaleString()} more points to unlock ${newRank.nextRank} rank.`
              : `You've reached the highest rank — ${newRank.name}! You're a true champion of sustainability!`,
        })
      );
    }
  }

  // ── 5. PLANTS THIRSTY ───────────────────────────────────────────────────
  const thirsty = newData.activeForest.filter(
    p => p.waterLevel <= 30 && p.stage !== 'withered'
  );
  const prevThirsty = (prevData.activeForest ?? []).filter(
    p => p.waterLevel <= 30 && p.stage !== 'withered'
  );
  if (thirsty.length > 0 && thirsty.length > prevThirsty.length) {
    tasks.push(
      notificationStore.add({
        type: 'plant_thirsty',
        icon: '💧',
        title:
          thirsty.length === 1
            ? '1 plant is getting thirsty!'
            : `${thirsty.length} plants need water!`,
        body: `Visit your Virtual Nursery to water your plants before they wither. Log more eco-actions to earn water droplets!`,
      })
    );
  }

  // ── 6. PLANTS WITHERED ──────────────────────────────────────────────────
  const witheredNow = newData.activeForest.filter(p => p.stage === 'withered').length;
  const witheredBefore = (prevData.activeForest ?? []).filter(
    p => p.stage === 'withered'
  ).length;
  if (witheredNow > witheredBefore) {
    tasks.push(
      notificationStore.add({
        type: 'plant_withered',
        icon: '🥀',
        title: 'A plant has withered!',
        body: `One of your nursery plants ran out of water. Log daily green actions to earn droplets and plant new seeds to restore your forest.`,
      })
    );
  }

  // ── 7. FIRST ACTION OF THE DAY (positive reinforcement) ─────────────────
  const prevTodayCount = (prevData.todayActions ?? []).length;
  if (prevTodayCount === 0 && newData.todayActions.length > 0) {
    tasks.push(
      notificationStore.add({
        type: 'daily_nudge',
        icon: '🌿',
        title: 'Great start to your day! 🌱',
        body: `Your first green action is logged! Every action builds your streak, grows your forest, and saves real CO₂.`,
      })
    );
  }

  await Promise.all(tasks);
}
