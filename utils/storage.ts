import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_DATA: 'gs_user_data',
  AUTHENTICATED: 'gs_authenticated',
  USER_NAME: 'gs_user_name',
  AUTH_METHOD: 'gs_auth_method',
  USER_ID: 'gs_user_id',
  ONBOARDING_DONE: 'gs_onboarding_done',
  TODAY_ACTIONS: 'gs_today_actions',
  JOIN_DATE: 'gs_join_date',
  EARNED_BADGES: 'gs_earned_badges',
  LONGEST_STREAK: 'gs_longest_streak',
  CUSTOM_ACTIONS: 'gs_custom_actions',
  ACTION_COUNTS: 'gs_action_counts',
  SUPABASE_META: 'gs_supabase_meta',
  CUSTOM_AVATAR: 'gs_custom_avatar',
  SYNC_PENDING: 'gs_sync_pending',
  IS_PREMIUM: 'gs_is_premium',
  ANALYTICS_CONSENT: 'gs_analytics_consent',
};

export type PlantStage = 'seed' | 'sprout' | 'sapling' | 'tree' | 'withered';

export interface Plant {
  id: string;
  stage: PlantStage;
  waterLevel: number; // 0 to 100
  plantedAt: string;
  lastWatered: string;
  waterCountAtStage?: number;
}

export interface UserData {
  totalPoints: number;
  coins: number;
  waterDroplets: number;
  inventorySeeds: number;
  activeForest: Plant[];
  actionsLogged: number;
  currentStreak: number;
  lastLogDate: string | null;
  todayActions: string[];
  todayPoints: number;
  earnedBadges: string[];
  longestStreak: number;
  isPremium: boolean;
  lastFreeCoachTipDate: string | null;
  teamId: string | null;
  companyName: string | null;
  customSquadName: string | null;
  customSquadCode: string | null;
  isEsgAdmin?: boolean;
  // Weekly action log: maps ISO Monday date (week key) -> {actionId: daysLogged[]}
  weeklyActionLog: Record<string, Record<string, string[]>>;
  lastWeekKey: string | null;
}

const DEFAULT_USER_DATA: UserData = {
  totalPoints: 0,
  coins: 50, // Starting bonus
  waterDroplets: 5, // Starting bonus
  inventorySeeds: 0,
  activeForest: [],
  actionsLogged: 0,
  currentStreak: 0,
  lastLogDate: null,
  todayActions: [],
  todayPoints: 0,
  earnedBadges: [],
  longestStreak: 0,
  isPremium: false,
  lastFreeCoachTipDate: null,
  teamId: null,
  companyName: null,
  customSquadName: null,
  customSquadCode: null,
  isEsgAdmin: false,
  weeklyActionLog: {},
  lastWeekKey: null,
};

/** Returns the Monday of the current ISO week as YYYY-MM-DD */
function getWeekKey(): string {
  const d = new Date();
  const day = d.getDay() || 7; // Mon=1..Sun=7
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().split('T')[0];
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export const storage = {
  // --- Auth ---
  async setAuthenticated(name: string, method: string, userId: string): Promise<void> {
    await AsyncStorage.multiSet([
      [KEYS.AUTHENTICATED, 'true'],
      [KEYS.USER_NAME, name],
      [KEYS.AUTH_METHOD, method],
      [KEYS.USER_ID, userId],
    ]);
    // Set join date only once
    const existing = await AsyncStorage.getItem(KEYS.JOIN_DATE);
    if (!existing) {
      await AsyncStorage.setItem(KEYS.JOIN_DATE, new Date().toISOString());
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.AUTHENTICATED);
    return value === 'true';
  },

  async isOnboardingDone(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
    return value === 'true';
  },

  async setOnboardingDone(): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
  },

  async getUserName(): Promise<string> {
    return (await AsyncStorage.getItem(KEYS.USER_NAME)) || 'User';
  },

  async updateUserName(name: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_NAME, name);
    await storage.syncToSupabase();
  },

  async getAuthMethod(): Promise<string> {
    return (await AsyncStorage.getItem(KEYS.AUTH_METHOD)) || 'guest';
  },

  async getUserId(): Promise<string> {
    return (await AsyncStorage.getItem(KEYS.USER_ID)) || '';
  },

  async getJoinDate(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.JOIN_DATE);
  },

  // --- Premium State ---
  async isPremium(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.IS_PREMIUM);
    return value === 'true';
  },

  async setPremium(status: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.IS_PREMIUM, status ? 'true' : 'false');
    const data = await this.getUserData();
    data.isPremium = status;
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
    await storage.syncToSupabase();
  },

  /**
   * Restores user progress from Supabase after login.
   * This ensures points, streaks, and actions are not lost when signing back in.
   */
  async restoreFromSupabase(force = false): Promise<void> {
    try {
      const { supabase, isSupabaseConfigured } = require('./supabase');
      if (!isSupabaseConfigured()) return;

      // Only restore if force is true OR if there is no local user data yet
      const localData = await AsyncStorage.getItem(KEYS.USER_DATA);
      if (localData && !force) {
        console.log('[Storage] Local data already exists. Skipping restore to protect local progress.');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        console.log('[Storage] No remote progress found to restore.');
        return;
      }

      // Check if deep progress backup is available
      if (data.raw_user_data) {
        try {
          const raw = typeof data.raw_user_data === 'string'
            ? JSON.parse(data.raw_user_data)
            : data.raw_user_data;

          if (raw.userData) {
            await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(raw.userData));
          }
          if (raw.actionCounts) {
            await AsyncStorage.setItem(KEYS.ACTION_COUNTS, JSON.stringify(raw.actionCounts));
          }
          if (raw.customAvatar) {
            await AsyncStorage.setItem(KEYS.CUSTOM_AVATAR, raw.customAvatar);
          }
          await AsyncStorage.setItem(KEYS.USER_NAME, data.display_name || user.email);
          console.log('[Storage] Deep progress restored from Supabase ✓');
          return;
        } catch (parseErr) {
          console.warn('[Storage] Failed to parse deep progress backup:', parseErr);
        }
      }

      // Populate local storage with basic statistics from remote database row
      // FIX #3: Do NOT derive coins from total_points — they are separate currencies.
      const userData: UserData = {
        totalPoints: data.total_points || 0,
        coins: 50, // Default starting coins — coins aren't tracked remotely yet
        waterDroplets: 5, // Default starting water droplets
        inventorySeeds: 0,
        activeForest: [],
        actionsLogged: data.actions_logged || 0,
        currentStreak: data.current_streak || 0,
        lastLogDate: data.last_log_date || null,
        todayActions: [], // Today's actions aren't typically persisted in remote profiles yet
        todayPoints: 0,
        earnedBadges: data.earned_badges || [], // Requires badges column in DB
        longestStreak: data.longest_streak || data.current_streak || 0,
        isPremium: (await AsyncStorage.getItem(KEYS.IS_PREMIUM)) === 'true',
        lastFreeCoachTipDate: null,
        teamId: data.team_id || null,
        companyName: data.company_name || null,
        customSquadName: null,
        customSquadCode: null,
        isEsgAdmin: false,
        weeklyActionLog: {},
        lastWeekKey: null,
      };

      await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(userData));
      await AsyncStorage.setItem(KEYS.USER_NAME, data.display_name || user.email);
      console.log('[Storage] Basic progress restored from Supabase ✓');
    } catch (err) {
      console.error('[Storage] Restoration error:', err);
    }
  },

  /**
   * Syncs local progress to Supabase leaderboard.
   * On failure (e.g. offline), sets a SYNC_PENDING flag so the next
   * app launch can retry automatically via flushPendingSync().
   */
  async syncToSupabase(): Promise<void> {
    try {
      const { supabase, isSupabaseConfigured } = require('./supabase');
      if (!isSupabaseConfigured()) return;

      const [data, name, userId] = await Promise.all([
        storage.getUserData(),
        storage.getUserName(),
        storage.getUserId(),
      ]);

      if (!userId) return;

      // Bundle all deep progress state
      const actionCounts = await storage.getActionCounts();
      const customAvatar = await storage.getCustomAvatar();
      const rawUserData = {
        userData: data,
        actionCounts,
        customAvatar,
      };

      const { error } = await supabase.from('leaderboard').upsert({
        user_id: userId,
        display_name: name,
        total_points: data.totalPoints,
        current_streak: data.currentStreak,
        actions_logged: data.actionsLogged,
        raw_user_data: rawUserData,
      }, { onConflict: 'user_id' });

      if (error) throw error;

      // Clear the pending flag on success
      await AsyncStorage.removeItem(KEYS.SYNC_PENDING);
      console.log('[Storage] Deep progress synced to Supabase ✓');
    } catch (err) {
      // Flag the failure so we retry next time the app opens with connectivity
      await AsyncStorage.setItem(KEYS.SYNC_PENDING, 'true');
      console.warn('[Storage] Sync failed (offline?). Will retry on next launch.', err);
    }
  },

  /**
   * Called on app startup. If a previous sync failed (offline),
   * this retries it silently in the background.
   */
  async flushPendingSync(): Promise<void> {
    try {
      const pending = await AsyncStorage.getItem(KEYS.SYNC_PENDING);
      if (pending === 'true') {
        console.log('[Storage] Pending sync detected. Retrying...');
        await storage.syncToSupabase();
      }
    } catch (err) {
      console.warn('[Storage] flushPendingSync error:', err);
    }
  },

  // --- User Data ---
  async getUserData(): Promise<UserData> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.USER_DATA);
      if (!raw) return { ...DEFAULT_USER_DATA };
      const data = JSON.parse(raw) as UserData;
      
      // Ensure new properties exist for backward compat
      if (data.coins === undefined) data.coins = data.totalPoints || 50;
      if (data.waterDroplets === undefined) data.waterDroplets = data.actionsLogged || 5;
      if (data.inventorySeeds === undefined) data.inventorySeeds = 0;
      if (!data.activeForest) data.activeForest = [];
      if (data.todayPoints === undefined) data.todayPoints = 0;
      if (data.isPremium === undefined) data.isPremium = (await AsyncStorage.getItem(KEYS.IS_PREMIUM)) === 'true';
      if (data.lastFreeCoachTipDate === undefined) data.lastFreeCoachTipDate = null;
      if (data.teamId === undefined) data.teamId = null;
      if (data.companyName === undefined) data.companyName = null;
      if (data.customSquadName === undefined) data.customSquadName = null;
      if (data.customSquadCode === undefined) data.customSquadCode = null;
      if (data.isEsgAdmin === undefined) data.isEsgAdmin = false;
      if (!data.weeklyActionLog) data.weeklyActionLog = {};
      if (data.lastWeekKey === undefined) data.lastWeekKey = null;

      // Game Engine Loop: Calculate withering based on time passed
      const now = new Date();
      let hasChanges = false;

      // Reset weekly log on new week
      const currentWeekKey = getWeekKey();
      if (data.lastWeekKey !== currentWeekKey) {
        data.weeklyActionLog = {};
        data.lastWeekKey = currentWeekKey;
        hasChanges = true;
      }

      data.activeForest = data.activeForest.map(plant => {

        if (plant.stage === 'withered') return plant; // Already dead
        const lastW = new Date(plant.lastWatered);
        const hoursPassed = Math.abs(now.getTime() - lastW.getTime()) / (1000 * 60 * 60);
        
        // Every 24 hours, drop water by 50.
        // If > 48 hours without water, it dies.
        if (hoursPassed >= 48) {
          hasChanges = true;
          return { ...plant, stage: 'withered', waterLevel: 0 };
        } else if (hoursPassed >= 24 && plant.waterLevel > 50) {
          hasChanges = true;
          return { ...plant, waterLevel: plant.waterLevel - 50 };
        }
        return plant;
      });

      // Reset today's actions if it's a new day
      const today = getTodayString();
      if (data.lastLogDate !== today) {
        if (data.todayActions.length > 0 || data.todayPoints > 0) {
          data.todayActions = [];
          data.todayPoints = 0;
          hasChanges = true;
        }
        
        // Reset streak if a day was missed (more than 1 day gap)
        if (data.lastLogDate !== null && data.lastLogDate !== getPreviousDay() && data.currentStreak > 0) {
          data.currentStreak = 0;
          // FIX #2: Also reset lastLogDate so this block doesn't trigger again on next load
          data.lastLogDate = today;
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
      }
      return data;
    } catch {
      return { ...DEFAULT_USER_DATA };
    }
  },

  async addPoints(points: number, actionIds: string[]): Promise<UserData> {
    const data = await storage.getUserData();
    const today = getTodayString();
    const weekKey = getWeekKey();
    
    // Update streak
    if (data.lastLogDate === today) {
      // Already logged today, just add points
    } else if (data.lastLogDate === getPreviousDay()) {
      // Consecutive day
      data.currentStreak += 1;
    } else {
      // Missed a day or first time logging
      data.currentStreak = 1;
    }

    // Track longest streak
    if (data.currentStreak > data.longestStreak) {
      data.longestStreak = data.currentStreak;
    }

    data.totalPoints += points;
    data.todayPoints += points;
    data.coins += points; // 1 point = 1 coin
    data.waterDroplets += actionIds.length; // 1 action = 1 water droplet
    data.actionsLogged += actionIds.length;
    data.lastLogDate = today;
    data.todayActions = [...new Set([...data.todayActions, ...actionIds])];

    // FIX #5: Track which days each action was logged this week
    if (!data.weeklyActionLog[weekKey]) data.weeklyActionLog[weekKey] = {};
    for (const id of actionIds) {
      if (!data.weeklyActionLog[weekKey][id]) data.weeklyActionLog[weekKey][id] = [];
      if (!data.weeklyActionLog[weekKey][id].includes(today)) {
        data.weeklyActionLog[weekKey][id].push(today);
      }
    }
    data.lastWeekKey = weekKey;

    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));

    // Optional: Automatic background sync
    storage.syncToSupabase();

    // Increment per-action counts for badge tracking
    const counts = await storage.getActionCounts();
    for (const id of actionIds) {
      counts[id] = (counts[id] || 0) + 1;
    }
    await AsyncStorage.setItem(KEYS.ACTION_COUNTS, JSON.stringify(counts));

    return data;
  },

  async removeAction(points: number, actionId: string): Promise<UserData> {
    const data = await storage.getUserData();
    const today = getTodayString();
    
    // Only allow removing if it was logged today
    if (!data.todayActions.includes(actionId)) {
      return data;
    }

    // Update streak reversal
    if (data.todayActions.length === 1) {
      // Removing the only action today
      if (data.currentStreak > 0) {
        data.currentStreak -= 1;
      }
      // Revert lastLogDate to yesterday so logging again today increments streak
      data.lastLogDate = getPreviousDay();
    }

    data.totalPoints = Math.max(0, data.totalPoints - points);
    data.todayPoints = Math.max(0, (data.todayPoints || 0) - points);
    data.coins = Math.max(0, data.coins - points);
    data.waterDroplets = Math.max(0, data.waterDroplets - 1);
    data.actionsLogged = Math.max(0, data.actionsLogged - 1);
    data.todayActions = data.todayActions.filter(id => id !== actionId);

    // If no actions left today, we might want to set lastLogDate to yesterday
    // handled above in length === 1 check

    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
    storage.syncToSupabase();

    // Decrement per-action counts
    const counts = await storage.getActionCounts();
    if (counts[actionId] > 0) {
      counts[actionId] -= 1;
      await AsyncStorage.setItem(KEYS.ACTION_COUNTS, JSON.stringify(counts));
    }

    return data;
  },

  async updateUserData(partial: Partial<UserData>): Promise<void> {
    const data = await storage.getUserData();
    const updated = { ...data, ...partial };
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(updated));
    await storage.syncToSupabase();
  },

  async earnBadges(badgeIds: string[]): Promise<void> {
    const data = await storage.getUserData();
    const updated = [...new Set([...data.earnedBadges, ...badgeIds])];
    data.earnedBadges = updated;
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
    await storage.syncToSupabase();
  },

  // --- Game Engine Mechanics ---
  async buySeed(): Promise<boolean> {
    const data = await storage.getUserData();
    if (data.coins >= 50) {
      data.coins -= 50;
      data.inventorySeeds += 1;
      await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
      await storage.syncToSupabase();
      return true;
    }
    return false;
  },

  async plantSeed(): Promise<boolean> {
    const data = await storage.getUserData();
    if (data.inventorySeeds > 0 && data.activeForest.length < 16) {
      data.inventorySeeds -= 1;
      const now = new Date().toISOString();
      data.activeForest.push({
        id: Math.random().toString(36).substring(7),
        stage: 'seed',
        waterLevel: 100, // Starts fully watered
        plantedAt: now,
        lastWatered: now,
        waterCountAtStage: 0,
      });
      await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
      await storage.syncToSupabase();
      return true;
    }
    return false;
  },

  async waterPlant(plantId: string): Promise<boolean> {
    const data = await storage.getUserData();
    if (data.waterDroplets > 0) {
      const pIdx = data.activeForest.findIndex(p => p.id === plantId);
      if (pIdx > -1 && data.activeForest[pIdx].stage !== 'withered') {
        const plant = data.activeForest[pIdx];
        data.waterDroplets -= 1;
        plant.waterLevel = 100;
        plant.lastWatered = new Date().toISOString();
        
        // Growth mechanic
        const currentCount = plant.waterCountAtStage || 0;
        const newCount = currentCount + 1;
        const stages: PlantStage[] = ['seed', 'sprout', 'sapling', 'tree'];
        const currentStageIdx = stages.indexOf(plant.stage);
        
        if (newCount >= 2) {
          if (currentStageIdx < stages.length - 1) {
            plant.stage = stages[currentStageIdx + 1];
          }
          plant.waterCountAtStage = 0; // reset for next stage
        } else {
          plant.waterCountAtStage = newCount;
        }

        data.activeForest[pIdx] = plant;
        await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
        await storage.syncToSupabase();
        return true;
      }
    }
    return false;
  },

  async devSimulateTime(): Promise<void> {
    const data = await storage.getUserData();
    const past = new Date();
    past.setDate(past.getDate() - 3); // 3 days ago
    
    // Dry up the forest
    data.activeForest = data.activeForest.map(p => ({
      ...p,
      lastWatered: past.toISOString(),
      waterLevel: 0,
      stage: 'withered'
    }));

    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
    await storage.syncToSupabase();
  },

  // --- Action Counts ---
  async getActionCounts(): Promise<Record<string, number>> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.ACTION_COUNTS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  // --- Supabase User Meta ---
  async setSupabaseUserMeta(meta: { email: string; avatarUrl: string; provider: string }): Promise<void> {
    await AsyncStorage.setItem(KEYS.SUPABASE_META, JSON.stringify(meta));
  },

  async getSupabaseUserMeta(): Promise<{ email: string; avatarUrl: string; provider: string } | null> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.SUPABASE_META);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // --- Custom Avatar ---
  async setCustomAvatar(uri: string | null): Promise<void> {
    if (uri) {
      await AsyncStorage.setItem(KEYS.CUSTOM_AVATAR, uri);
    } else {
      await AsyncStorage.removeItem(KEYS.CUSTOM_AVATAR);
    }
  },

  async getCustomAvatar(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.CUSTOM_AVATAR);
    } catch {
      return null;
    }
  },

  // --- Sign Out ---
  async signOut(): Promise<void> {
    // FIX #14: Also clear IS_PREMIUM and CUSTOM_AVATAR so next user doesn't inherit them
    await AsyncStorage.multiRemove([
      KEYS.AUTHENTICATED,
      KEYS.USER_NAME,
      KEYS.AUTH_METHOD,
      KEYS.USER_ID,
      KEYS.ONBOARDING_DONE,
      KEYS.USER_DATA,
      KEYS.JOIN_DATE,
      KEYS.ACTION_COUNTS,
      KEYS.SUPABASE_META,
      KEYS.IS_PREMIUM,
      KEYS.CUSTOM_AVATAR,
      KEYS.SYNC_PENDING,
    ]);
  },

  // --- Analytics Consent ---
  async getAnalyticsConsent(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.ANALYTICS_CONSENT);
    // Default to true (opted in) if no preference has been set
    return value !== 'false';
  },

  async setAnalyticsConsent(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.ANALYTICS_CONSENT, enabled ? 'true' : 'false');
  },

  // --- Custom Squads (Earth+ Feature) ---
  async createCustomSquad(name: string): Promise<UserData> {
    const data = await this.getUserData();
    const code = 'LUME-' + Math.floor(1000 + Math.random() * 9000);
    data.customSquadName = name;
    data.customSquadCode = code;
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
    await storage.syncToSupabase();
    return data;
  },

  async joinCustomSquad(name: string, code: string): Promise<UserData> {
    const data = await this.getUserData();
    data.customSquadName = name;
    data.customSquadCode = code;
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
    await storage.syncToSupabase();
    return data;
  },

  async leaveCustomSquad(): Promise<UserData> {
    const data = await this.getUserData();
    data.customSquadName = null;
    data.customSquadCode = null;
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
    await storage.syncToSupabase();
    return data;
  },

  // --- Export ---
  async exportData(): Promise<object> {
    const data = await storage.getUserData();
    const name = await storage.getUserName();
    const method = await storage.getAuthMethod();
    const joinDate = await storage.getJoinDate();
    return {
      exportedAt: new Date().toISOString(),
      user: { name, authMethod: method, joinDate },
      stats: data,
    };
  },
};

function getPreviousDay(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
