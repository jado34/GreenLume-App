// GreenLume Color System — Nature-Inspired Palette

export const Colors = {
  // Primary Brand Colors
  primary: '#2e7d32',       // Deep Forest Green
  primaryDark: '#1b5e20',   // Darker green
  primaryLight: '#66bb6a',  // Light Green
  accent: '#a5d6a7',        // Soft Mint Green

  // Background Shades
  primary95: '#f1f8f4',     // Very Light Green Background
  primary90: '#e8f5e9',     // Light green tint

  // Neutral colors
  white: '#ffffff',
  neutral50: '#f5f5f5',
  neutral100: '#f0f0f0',
  neutral200: '#e0e0e0',
  neutral300: '#bdbdbd',
  neutral400: '#9e9e9e',

  // Text
  textPrimary: '#1a1a1a',
  textSecondary: '#5a5a5a',
  textMuted: '#999999',
  textWhite: '#ffffff',

  // Status Colors
  success: '#4caf50',
  successLight: '#e8f5e9',
  warning: '#ff9800',
  warningLight: '#fff8e1',
  error: '#f44336',
  errorLight: '#ffebee',
  info: '#2196f3',
  infoLight: '#e3f2fd',

  // Category Colors
  transport: '#3b82f6',     // Blue
  food: '#10b981',          // Emerald
  waste: '#8b5cf6',         // Purple
  energy: '#f59e0b',        // Amber
  water: '#06b6d4',         // Cyan
  shopping: '#ec4899',      // Pink

  // Rank / Level Colors
  rankStarter: '#84cc16',   // Lime green
  rankWarrior: '#22c55e',   // Green
  rankHero: '#16a34a',      // Forest green
  rankGuardian: '#3b82f6',  // Blue
  rankLegend: '#8b5cf6',    // Purple

  // Glassmorphism
  glassBackground: 'rgba(255, 255, 255, 0.15)',
  glassBorder: 'rgba(255, 255, 255, 0.25)',

  // Chart Colors
  chartGreen: '#2e7d32',
  chartBlue: '#3b82f6',
  chartOrange: '#f59e0b',
  chartPurple: '#8b5cf6',
  chartEmerald: '#10b981',
  chartRed: '#ef4444',
} as const;

// Gradient presets
export const Gradients = {
  primary: ['#2e7d32', '#66bb6a'] as const,
  primaryDark: ['#1b5e20', '#2e7d32'] as const,
  card: ['#f1f8f4', '#e8f5e9'] as const,
  rankStarter: ['#84cc16', '#65a30d'] as const,
  rankWarrior: ['#22c55e', '#16a34a'] as const,
  rankHero: ['#166534', '#15803d'] as const,
  rankGuardian: ['#1d4ed8', '#3b82f6'] as const,
  rankLegend: ['#6d28d9', '#8b5cf6'] as const,
  premium: ['#0f172a', '#1e293b', '#334155'] as const,
  gold: ['#fbbf24', '#f59e0b'] as const,
} as const;
