import { Colors } from '../constants/colors';

export type Rank = 'Seedling' | 'Sprout' | 'Sapling' | 'Tree' | 'Forest';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  glow: string;
  statsTextColor: string;
  statsLabelColor: string;
  statsDividerColor: string;
  statsCardBg: string;
}

export const THEMES: Record<Rank, ThemeColors> = {
  Seedling: {
    primary: '#84cc16',
    primaryDark: '#65a30d',
    primaryLight: '#bef264',
    glow: 'rgba(132, 204, 22, 0.3)',
    statsTextColor: '#808080',               // Mapped to design tokens neutral50 (#808080)
    statsLabelColor: '#808080',              // Mapped to design tokens neutral50 (#808080)
    statsDividerColor: 'rgba(128, 128, 128, 0.15)',
    statsCardBg: 'rgba(255, 255, 255, 0.3)',
  },
  Sprout: {
    primary: '#10b981',
    primaryDark: '#047857',
    primaryLight: '#6ee7b7',
    glow: 'rgba(16, 185, 129, 0.3)',
    statsTextColor: '#808080',               // Mapped to design tokens neutral50 (#808080)
    statsLabelColor: '#808080',              // Mapped to design tokens neutral50 (#808080)
    statsDividerColor: 'rgba(128, 128, 128, 0.15)',
    statsCardBg: 'rgba(255, 255, 255, 0.3)',
  },
  Sapling: {
    primary: '#2e7d32',
    primaryDark: '#1b5e20',
    primaryLight: '#66bb6a',
    glow: 'rgba(46, 125, 50, 0.3)',
    statsTextColor: '#ffffff',               // Opaque white
    statsLabelColor: 'rgba(255, 255, 255, 0.85)',
    statsDividerColor: 'rgba(255, 255, 255, 0.25)',
    statsCardBg: 'rgba(255, 255, 255, 0.15)',
  },
  Tree: {
    primary: '#065f46',
    primaryDark: '#064e3b',
    primaryLight: '#10b981',
    glow: 'rgba(6, 95, 70, 0.4)',
    statsTextColor: '#ffffff',
    statsLabelColor: 'rgba(255, 255, 255, 0.85)',
    statsDividerColor: 'rgba(255, 255, 255, 0.25)',
    statsCardBg: 'rgba(255, 255, 255, 0.15)',
  },
  Forest: {
    primary: '#022c22',
    primaryDark: '#011c15',
    primaryLight: '#059669',
    glow: 'rgba(5, 150, 105, 0.5)',
    statsTextColor: '#ffffff',
    statsLabelColor: 'rgba(255, 255, 255, 0.85)',
    statsDividerColor: 'rgba(255, 255, 255, 0.25)',
    statsCardBg: 'rgba(255, 255, 255, 0.15)',
  },
};

export function getRank(points: number): Rank {
  if (points >= 2000) return 'Forest';
  if (points >= 1000) return 'Tree';
  if (points >= 500) return 'Sapling';
  if (points >= 100) return 'Sprout';
  return 'Seedling';
}

export function getDynamicTheme(points: number): ThemeColors {
  const rank = getRank(points);
  return THEMES[rank];
}
