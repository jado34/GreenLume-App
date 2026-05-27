import { UserData } from './storage';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // Ionicons name
  color: string;
  points: number;
  requirement: (data: UserData, actionCounts: Record<string, number>) => boolean;
  progressText: (data: UserData, actionCounts: Record<string, number>) => string;
}

export const BADGES: BadgeDefinition[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your very first green action',
    icon: 'leaf',
    color: '#84cc16',
    points: 10,
    requirement: (data) => data.actionsLogged >= 1,
    progressText: (data) => `${Math.min(data.actionsLogged, 1)} / 1 action`,
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day logging streak',
    icon: 'flame',
    color: '#f97316',
    points: 50,
    requirement: (data) => data.currentStreak >= 7 || data.longestStreak >= 7,
    progressText: (data) => `${Math.min(data.longestStreak, 7)} / 7 days`,
  },
  {
    id: 'month_master',
    name: 'Month Master',
    description: 'Maintain a 30-day logging streak',
    icon: 'calendar',
    color: '#8b5cf6',
    points: 200,
    requirement: (data) => data.longestStreak >= 30,
    progressText: (data) => `${Math.min(data.longestStreak, 30)} / 30 days`,
  },
  {
    id: 'point_pioneer',
    name: 'Point Pioneer',
    description: 'Earn 500 total GreenLume points',
    icon: 'star',
    color: '#f59e0b',
    points: 100,
    requirement: (data) => data.totalPoints >= 500,
    progressText: (data) => `${Math.min(data.totalPoints, 500)} / 500 pts`,
  },
  {
    id: 'greenlume_hero',
    name: 'GreenLume Hero',
    description: 'Earn 1,000 total GreenLume points',
    icon: 'trophy',
    color: '#f59e0b',
    points: 300,
    requirement: (data) => data.totalPoints >= 1000,
    progressText: (data) => `${Math.min(data.totalPoints, 1000)} / 1000 pts`,
  },
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Log actions every day for 7 consecutive days',
    icon: 'sparkles',
    color: '#eab308',
    points: 150,
    requirement: (data) => data.longestStreak >= 7,
    progressText: (data) => `${Math.min(data.longestStreak, 7)} / 7 days`,
  },
  {
    id: 'transport_champ',
    name: 'Transport Champion',
    description: 'Log 20 public transport actions',
    icon: 'bus',
    color: '#3b82f6',
    points: 100,
    requirement: (_, ac) => (ac['public_transit'] || 0) + (ac['cycle'] || 0) + (ac['walk'] || 0) >= 20,
    progressText: (_, ac) => `${Math.min((ac['public_transit'] || 0) + (ac['cycle'] || 0) + (ac['walk'] || 0), 20)} / 20`,
  },
  {
    id: 'food_hero',
    name: 'Food Hero',
    description: 'Log 30 plant-based meals',
    icon: 'nutrition',
    color: '#10b981',
    points: 150,
    requirement: (_, ac) => (ac['plant_meal'] || 0) + (ac['meatless_monday'] || 0) >= 30,
    progressText: (_, ac) => `${Math.min((ac['plant_meal'] || 0) + (ac['meatless_monday'] || 0), 30)} / 30`,
  },
  {
    id: 'waste_warrior',
    name: 'Waste Warrior',
    description: 'Log 25 recycling or zero-waste actions',
    icon: 'refresh-circle',
    color: '#8b5cf6',
    points: 100,
    requirement: (_, ac) => (ac['recycled'] || 0) + (ac['no_plastic'] || 0) + (ac['reusable_bag'] || 0) >= 25,
    progressText: (_, ac) => `${Math.min((ac['recycled'] || 0) + (ac['no_plastic'] || 0) + (ac['reusable_bag'] || 0), 25)} / 25`,
  },
  {
    id: 'energy_saver',
    name: 'Energy Saver',
    description: 'Log 20 energy-saving actions',
    icon: 'flash',
    color: '#eab308',
    points: 100,
    requirement: (_, ac) => (ac['lights_off'] || 0) + (ac['air_dry'] || 0) + (ac['unplug'] || 0) + (ac['natural_light'] || 0) >= 20,
    progressText: (_, ac) => `${Math.min((ac['lights_off'] || 0) + (ac['air_dry'] || 0) + (ac['unplug'] || 0) + (ac['natural_light'] || 0), 20)} / 20`,
  },
  {
    id: 'water_guardian',
    name: 'Water Guardian',
    description: 'Log 15 water-saving actions',
    icon: 'water',
    color: '#06b6d4',
    points: 75,
    requirement: (_, ac) => (ac['short_shower'] || 0) + (ac['fix_tap'] || 0) + (ac['reuse_water'] || 0) + (ac['full_machine'] || 0) >= 15,
    progressText: (_, ac) => `${Math.min((ac['short_shower'] || 0) + (ac['fix_tap'] || 0) + (ac['reuse_water'] || 0) + (ac['full_machine'] || 0), 15)} / 15`,
  },
  {
    id: 'eco_legend',
    name: 'Eco Legend',
    description: 'Earn all 11 other badges',
    icon: 'ribbon',
    color: '#8b5cf6',
    points: 500,
    requirement: (data) => data.earnedBadges.length >= 11,
    progressText: (data) => `${Math.min(data.earnedBadges.length, 11)} / 11 badges`,
  },
];

export function checkBadgeUnlocks(
  data: UserData,
  actionCounts: Record<string, number> = {}
): BadgeDefinition[] {
  return BADGES.filter(
    (badge) =>
      !data.earnedBadges.includes(badge.id) &&
      badge.requirement(data, actionCounts)
  );
}

export function getRankInfo(points: number): { name: string; emoji: string; nextRank: string; nextPoints: number; color: string } {
  if (points >= 2000) return { name: 'Forest',   emoji: '🏞️', nextRank: 'Max Rank',  nextPoints: 0,    color: '#8b5cf6' };
  if (points >= 1000) return { name: 'Tree',     emoji: '🌲', nextRank: 'Forest',    nextPoints: 2000, color: '#3b82f6' };
  if (points >= 500)  return { name: 'Sapling',  emoji: '🌳', nextRank: 'Tree',      nextPoints: 1000, color: '#16a34a' };
  if (points >= 100)  return { name: 'Sprout',   emoji: '🌿', nextRank: 'Sapling',   nextPoints: 500,  color: '#22c55e' };
  return                     { name: 'Seedling', emoji: '🌱', nextRank: 'Sprout',    nextPoints: 100,  color: '#84cc16' };
}
