/**
 * GreenLume — Referral System
 *
 * Generates unique referral codes, shares them, validates incoming codes
 * at signup, and awards +50 GreenLume Points to both referrer and referee.
 *
 * Code format: GL + first 3 chars of username (uppercase) + 4 random alphanum
 * Example: GLADI7X2K
 *
 * The referral code is stored in AsyncStorage AND in the Supabase leaderboard
 * row so it can be looked up when a new user enters it.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share } from 'react-native';

const REFERRAL_CODE_KEY     = 'gs_referral_code';
const REFERRAL_PENDING_KEY  = 'gs_pending_referral_code'; // code entered by new user at signup

const REFERRAL_BONUS_POINTS = 50;

// ─────────────────────────────────────────────────────────────────────────────
// Code Generation
// ─────────────────────────────────────────────────────────────────────────────

function generateCode(name: string): string {
  const prefix = 'GL';
  const namePart = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I to avoid confusion
  let random = '';
  for (let i = 0; i < 5; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}${namePart}${random}`;
}

/**
 * Returns the user's referral code.
 * Generates and stores one on first call.
 */
export async function getMyReferralCode(name: string): Promise<string> {
  const existing = await AsyncStorage.getItem(REFERRAL_CODE_KEY);
  if (existing) return existing;

  const code = generateCode(name);
  await AsyncStorage.setItem(REFERRAL_CODE_KEY, code);

  // Store in Supabase if available so it's discoverable
  try {
    const { supabase, isSupabaseConfigured } = require('./supabase');
    const { storage } = require('./storage');
    if (isSupabaseConfigured()) {
      const userId = await storage.getUserId();
      if (userId) {
        await supabase.from('leaderboard').update({ referral_code: code }).eq('user_id', userId);
      }
    }
  } catch {}

  return code;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sharing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Opens the native share sheet with a WhatsApp-optimised message.
 */
export async function shareReferralCode(code: string, name: string): Promise<void> {
  const message =
    `Hey! 👋 I've been using GreenLume to track my eco-habits and it's 🔥\n\n` +
    `Join me and we both get +${REFERRAL_BONUS_POINTS} GreenLume Points! 🌿\n\n` +
    `Enter my invite code when you sign up:\n` +
    `*${code}*\n\n` +
    `Download here: https://greenlume.app`;

  await Share.share({ message, title: `${name} invited you to GreenLume 🌍` });
}

// ─────────────────────────────────────────────────────────────────────────────
// Pending Referral (stored before signup completes)
// ─────────────────────────────────────────────────────────────────────────────

/** Called from auth.tsx when a new user enters a referral code during signup */
export async function savePendingReferralCode(code: string): Promise<void> {
  await AsyncStorage.setItem(REFERRAL_PENDING_KEY, code.trim().toUpperCase());
}

/** Returns the pending referral code (entered during signup) if any */
export async function getPendingReferralCode(): Promise<string | null> {
  return AsyncStorage.getItem(REFERRAL_PENDING_KEY);
}

/** Clears the pending referral code after it has been processed */
export async function clearPendingReferralCode(): Promise<void> {
  await AsyncStorage.removeItem(REFERRAL_PENDING_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
// Referral Redemption
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Called after a new user account is created.
 * Looks up the referral code in Supabase, awards +50 points to both users,
 * and clears the pending code.
 *
 * Safe to call even if offline or Supabase isn't configured — it will
 * award points locally to the new user and retry the referrer award later.
 */
export async function redeemReferralCode(newUserId: string): Promise<boolean> {
  try {
    const code = await getPendingReferralCode();
    if (!code) return false;

    const { storage } = require('./storage');

    // Don't allow self-referral
    const myCode = await AsyncStorage.getItem(REFERRAL_CODE_KEY);
    if (myCode === code) return false;

    // Award bonus points to the new user immediately (local-first)
    await storage.addPoints(REFERRAL_BONUS_POINTS, ['referral_bonus']);
    await clearPendingReferralCode();

    // Try to award points to the referrer via Supabase
    try {
      const { supabase, isSupabaseConfigured } = require('./supabase');
      if (isSupabaseConfigured()) {
        // Find the referrer by code
        const { data: referrer } = await supabase
          .from('leaderboard')
          .select('user_id, total_points')
          .eq('referral_code', code)
          .single();

        if (referrer?.user_id) {
          await supabase
            .from('leaderboard')
            .update({ total_points: (referrer.total_points || 0) + REFERRAL_BONUS_POINTS })
            .eq('user_id', referrer.user_id);
        }
      }
    } catch {}

    return true;
  } catch (err) {
    console.warn('[Referral] redeemReferralCode error:', err);
    return false;
  }
}
