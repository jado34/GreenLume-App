// Achievements Screen — New level progression: Seedling→Sprout→Sapling→Tree→Forest
import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { storage, UserData } from '../../utils/storage';
import { BADGES, BadgeDefinition } from '../../utils/badges';
import { Colors } from '../../constants/colors';
import { Typography, Shadows } from '../../constants/typography';

const LEVELS = [
  { name: 'Seedling', emoji: '🌱', pts: 0, color: '#84cc16', desc: 'Just getting started' },
  { name: 'Sprout',   emoji: '🌿', pts: 100, color: '#22c55e', desc: 'Growing stronger' },
  { name: 'Sapling',  emoji: '🌳', pts: 500, color: '#16a34a', desc: 'Making an impact' },
  { name: 'Tree',     emoji: '🌲', pts: 1000, color: '#3b82f6', desc: 'Standing tall' },
  { name: 'Forest',   emoji: '🏞️', pts: 2000, color: '#8b5cf6', desc: 'Ecosystem builder' },
];

export default function AchievementsScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [actionCounts, setActionCounts] = useState<Record<string, number>>({});
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);

  useFocusEffect(useCallback(() => {
    storage.getUserData().then(setUserData);
    storage.getActionCounts().then(setActionCounts);
  }, []));

  const earned = userData?.earnedBadges ?? [];
  const totalPts = userData?.totalPoints ?? 0;
  const pct = Math.round((earned.length / BADGES.length) * 100);

  const currentLevel = [...LEVELS].reverse().find(l => totalPts >= l.pts) ?? LEVELS[0];
  const nextLevel = LEVELS[LEVELS.findIndex(l => l.name === currentLevel.name) + 1];
  const progressToNext = nextLevel
    ? Math.min(100, Math.round(((totalPts - currentLevel.pts) / (nextLevel.pts - currentLevel.pts)) * 100))
    : 100;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral50 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#1b5e20', '#2e7d32']} style={styles.header}>
          <Text style={styles.headerTitle}>Achievements</Text>
          <Text style={styles.headerSub}>Your badge collection</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressCount}>{earned.length} / {BADGES.length}</Text>
              <Text style={styles.progressPct}>Badges Earned</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.progressLabel}>Collection {pct}% complete</Text>
          </View>
        </LinearGradient>

        {/* Level Path */}
        <View style={styles.levelSection}>
          <Text style={styles.sectionTitle}>Level Progression</Text>

          {/* Current level hero card */}
          <LinearGradient
            colors={[currentLevel.color, `${currentLevel.color}99`]}
            style={styles.currentLevelCard}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Text style={styles.currentLevelEmoji}>{currentLevel.emoji}</Text>
            <View>
              <Text style={styles.currentLevelName}>{currentLevel.name}</Text>
              <Text style={styles.currentLevelDesc}>{currentLevel.desc}</Text>
            </View>
            <View style={styles.currentLevelPts}>
              <Text style={styles.currentLevelPtsText}>{totalPts} pts</Text>
            </View>
          </LinearGradient>

          {/* Progress to next */}
          {nextLevel && (
            <View style={styles.nextLevelRow}>
              <Text style={styles.nextLevelLabel}>Progress to {nextLevel.emoji} {nextLevel.name}</Text>
              <Text style={styles.nextLevelPct}>{progressToNext}%</Text>
            </View>
          )}
          {nextLevel && (
            <View style={styles.nextProgressTrack}>
              <View style={[styles.nextProgressFill, { width: `${progressToNext}%`, backgroundColor: nextLevel.color }]} />
            </View>
          )}

          {/* Scrollable level bubbles */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 20 }}>
            <View style={styles.levelPath}>
              {LEVELS.map((level, i) => {
                const unlocked = totalPts >= level.pts;
                const isCurrent = level.name === currentLevel.name;
                return (
                  <View 
                    key={level.name} 
                    style={styles.levelItem}
                    accessibilityLabel={`Level: ${level.name}. Requirement: ${level.pts} points. ${unlocked ? 'Unlocked' : 'Locked'}`}
                    accessibilityRole="header"
                  >
                    {i > 0 && (
                      <View style={[styles.levelConnector, unlocked && { backgroundColor: level.color }]} />
                    )}
                    <View style={[
                      styles.levelBubble,
                      unlocked && { backgroundColor: level.color, borderColor: level.color },
                      isCurrent && styles.levelBubbleCurrent,
                    ]}>
                      <Text style={{ fontSize: 24 }}>{level.emoji}</Text>
                    </View>
                    <Text style={[styles.levelName, (isCurrent || unlocked) && { color: level.color, fontFamily: Typography.fontFamily.bold }]}>
                      {level.name}
                    </Text>
                    <Text style={styles.levelPts}>{level.pts > 0 ? `${level.pts} pts` : 'Start'}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Badge Grid */}
        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>All Badges</Text>
          <View style={styles.badgeGrid}>
            {BADGES.map((badge) => {
              const isEarned = earned.includes(badge.id);
              return (
                <TouchableOpacity
                  key={badge.id}
                  style={[styles.badgeCard, isEarned && { borderColor: badge.color }]}
                  onPress={() => setSelectedBadge(badge)}
                  activeOpacity={0.85}
                  accessibilityLabel={`${badge.name}: ${badge.description}. ${isEarned ? 'Earned' : 'Locked'}`}
                  accessibilityRole="button"
                >
                  {isEarned && (
                    <View style={[styles.earnedDot, { backgroundColor: badge.color }]} />
                  )}
                  <View style={[styles.badgeIcon, { backgroundColor: isEarned ? `${badge.color}20` : Colors.neutral100 }]}>
                    <Ionicons name={badge.icon as any} size={28} color={isEarned ? badge.color : Colors.neutral300} />
                    {!isEarned && (
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={12} color={Colors.neutral400} />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.badgeName, !isEarned && styles.badgeNameLocked]} numberOfLines={2}>{badge.name}</Text>
                  {isEarned
                    ? <Text style={[styles.badgePoints, { color: badge.color }]}>+{badge.points} pts</Text>
                    : userData && <Text style={styles.badgeProgress} numberOfLines={1}>{badge.progressText(userData, actionCounts)}</Text>
                  }
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Badge Detail Modal */}
      <Modal visible={selectedBadge !== null} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedBadge(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {selectedBadge && (() => {
              const isEarned = earned.includes(selectedBadge.id);
              return (
                <>
                  <View style={[styles.modalIconWrap, { backgroundColor: `${selectedBadge.color}20` }]}>
                    <Ionicons name={selectedBadge.icon as any} size={48} color={isEarned ? selectedBadge.color : Colors.neutral300} />
                  </View>
                  {isEarned && <Text style={styles.modalUnlocked}>✨ Achievement Unlocked!</Text>}
                  <Text style={styles.modalName}>{selectedBadge.name}</Text>
                  <Text style={styles.modalDesc}>{selectedBadge.description}</Text>
                  {!isEarned && userData && (
                    <View style={styles.modalProgressWrap}>
                      <Text style={styles.modalProgressText}>{selectedBadge.progressText(userData, actionCounts)}</Text>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: '40%', backgroundColor: selectedBadge.color }]} />
                      </View>
                    </View>
                  )}
                  <Text style={[styles.modalPts, { color: selectedBadge.color }]}>+{selectedBadge.points} bonus points</Text>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: isEarned ? selectedBadge.color : Colors.primary }]} onPress={() => setSelectedBadge(null)}>
                    <Text style={styles.modalBtnText}>Awesome!</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  headerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['3xl'], color: Colors.white, marginBottom: 4 },
  headerSub: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.75)', marginBottom: 20 },
  progressCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16 },
  progressHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10 },
  progressCount: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['4xl'], color: Colors.white },
  progressPct: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, color: 'rgba(255,255,255,0.8)' },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: 6, backgroundColor: Colors.white, borderRadius: 3 },
  progressLabel: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  levelSection: { padding: 20, paddingBottom: 8 },
  sectionTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.textPrimary, marginBottom: 14 },
  currentLevelCard: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  currentLevelEmoji: { fontSize: 44 },
  currentLevelName: { fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.fontSize['2xl'], color: Colors.white },
  currentLevelDesc: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.8)' },
  currentLevelPts: { marginLeft: 'auto' as any, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  currentLevelPtsText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.md, color: Colors.white },
  nextLevelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  nextLevelLabel: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  nextLevelPct: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.sm, color: Colors.primary },
  nextProgressTrack: { height: 8, backgroundColor: Colors.neutral200, borderRadius: 4, overflow: 'hidden' },
  nextProgressFill: { height: 8, borderRadius: 4 },
  levelPath: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4, paddingBottom: 8 },
  levelItem: { alignItems: 'center', width: 88 },
  levelConnector: { position: 'absolute', top: 28, right: '50%', width: 88, height: 3, backgroundColor: Colors.neutral200, zIndex: -1 },
  levelBubble: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.neutral100, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 2, borderColor: Colors.neutral200 },
  levelBubbleCurrent: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, transform: [{ scale: 1.1 }] },
  levelName: { fontFamily: Typography.fontFamily.medium, fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  levelPts: { fontFamily: Typography.fontFamily.regular, fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  badgesSection: { paddingHorizontal: 20, paddingTop: 8 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: { width: '30%', backgroundColor: Colors.white, borderRadius: 14, padding: 12, alignItems: 'center', gap: 6, ...Shadows.sm, borderWidth: 1.5, borderColor: Colors.neutral200, position: 'relative' },
  earnedDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  badgeIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  lockOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.neutral200, borderRadius: 8, padding: 2 },
  badgeName: { fontFamily: Typography.fontFamily.semiBold, fontSize: 11, color: Colors.textPrimary, textAlign: 'center' },
  badgeNameLocked: { color: Colors.textMuted },
  badgePoints: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs },
  badgeProgress: { fontFamily: Typography.fontFamily.regular, fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalCard: { backgroundColor: Colors.white, borderRadius: 24, padding: 28, alignItems: 'center', width: '100%', ...Shadows.xl },
  modalIconWrap: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalUnlocked: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, color: Colors.primary, marginBottom: 8 },
  modalName: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'], color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  modalDesc: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  modalProgressWrap: { width: '100%', marginBottom: 16 },
  modalProgressText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: 8, textAlign: 'center' },
  modalPts: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, marginBottom: 20 },
  modalBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  modalBtnText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.white },
});
