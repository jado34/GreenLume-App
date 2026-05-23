import { Colors } from '../constants/colors';

export type Rank = 'Seedling' | 'Sprout' | 'Sapling' | 'Tree' | 'Forest';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  glow: string;
}

export const THEMES: Record<Rank, ThemeColors> = {
  Seedling: {
    primary: '#84cc16',
    primaryDark: '#65a30d',
    primaryLight: '#bef264',
    glow: 'rgba(132, 204, 22, 0.3)',
  },
  Sprout: {
    primary: '#10b981',
    primaryDark: '#047857',
    primaryLight: '#6ee7b7',
    glow: 'rgba(16, 185, 129, 0.3)',
  },
  Sapling: {
    primary: '#2e7d32',
    primaryDark: '#1b5e20',
    primaryLight: '#66bb6a',
    glow: 'rgba(46, 125, 50, 0.3)',
  },
  Tree: {
    primary: '#065f46',
    primaryDark: '#064e3b',
    primaryLight: '#10b981',
    glow: 'rgba(6, 95, 70, 0.4)',
  },
  Forest: {
    primary: '#022c22',
    primaryDark: '#011c15',
    primaryLight: '#059669',
    glow: 'rgba(5, 150, 105, 0.5)',
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
