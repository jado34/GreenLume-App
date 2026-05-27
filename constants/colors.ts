import { PrimitiveColors, ColorRoles } from './design-tokens';

// GreenLume Color System — Nature-Inspired Palette mapped to brand Design Tokens
export const Colors = {
  // Primary Brand Colors
  primary: ColorRoles.primaryColor.primaryColorRole,             // New brand primary green (#37953c)
  primaryDark: ColorRoles.primaryColor.onPrimaryColorRole,       // Darker brand green (#29702d)
  primaryLight: PrimitiveColors.palette.primary.primary60,       // Medium brand green (#6ac86f)
  accent: ColorRoles.accentColor.accentContainerColorRole,       // Brand light accent (#e5ff99)

  // Background Shades
  primary95: PrimitiveColors.palette.primary.primary95,          // Very Light Green Background (#ecf8ed)
  primary90: ColorRoles.primaryColor.primaryContainerRole,       // Light green tint (#daf1db)

  // Neutral colors
  white: PrimitiveColors.palette.neutral.neutral100,             // #ffffff
  neutral50: PrimitiveColors.palette.neutral.neutral98,          // #fafafa
  neutral100: PrimitiveColors.palette.neutral.neutral95,         // #f2f2f2
  neutral200: PrimitiveColors.palette.neutral.neutral90,         // #e6e6e6
  neutral300: PrimitiveColors.palette.neutral.neutral80,         // #cccccc
  neutral400: PrimitiveColors.palette.neutral.neutral70,         // #b3b3b3

  // Text
  textPrimary: ColorRoles.neutralColor.nuetralColorRole,          // #4c4c4c
  textSecondary: PrimitiveColors.palette.neutral.neutral50,      // #808080
  textMuted: PrimitiveColors.palette.neutral.neutral60,          // #999999
  textWhite: PrimitiveColors.palette.neutral.neutral100,         // #ffffff

  // Status Colors
  success: ColorRoles.successColor.successColorRole,             // Brand success green (#00993f)
  successLight: PrimitiveColors.palette.success.success95,       // Light green tint (#e5fff0)
  warning: ColorRoles.warningColor.warningColorRole,             // Brand warning gold (#ffbf00)
  warningLight: PrimitiveColors.palette.warning.warning95,       // Light gold tint (#fff9e5)
  error: ColorRoles.errorColor.errorColorRole,                   // Brand error red (#b51b17)
  errorLight: PrimitiveColors.palette.error.error95,             // Light red tint (#fce9e8)
  info: '#2196f3',                                               // Fallback blue
  infoLight: '#e3f2fd',

  // Category Colors
  transport: '#3b82f6',     // Blue
  food: ColorRoles.successColor.successColorRole,                // Brand success green
  waste: '#8b5cf6',         // Purple
  energy: ColorRoles.warningColor.warningColorRole,              // Brand warning gold
  water: '#06b6d4',         // Cyan
  shopping: '#ec4899',      // Pink

  // Rank / Level Colors
  rankStarter: '#84cc16',   // Lime green
  rankWarrior: ColorRoles.successColor.successColorRole,
  rankHero: ColorRoles.primaryColor.primaryColorRole,
  rankGuardian: '#3b82f6',  // Blue
  rankLegend: '#8b5cf6',    // Purple

  // Glassmorphism
  glassBackground: 'rgba(255, 255, 255, 0.15)',
  glassBorder: 'rgba(255, 255, 255, 0.25)',

  // Chart Colors
  chartGreen: ColorRoles.primaryColor.primaryColorRole,
  chartBlue: '#3b82f6',
  chartOrange: ColorRoles.warningColor.warningColorRole,
  chartPurple: '#8b5cf6',
  chartEmerald: ColorRoles.successColor.successColorRole,
  chartRed: ColorRoles.errorColor.errorColorRole,
} as const;

// Gradient presets
export const Gradients = {
  primary: [ColorRoles.primaryColor.primaryColorRole, PrimitiveColors.palette.primary.primary60] as const,
  primaryDark: [ColorRoles.primaryColor.onPrimaryColorRole, ColorRoles.primaryColor.primaryColorRole] as const,
  card: [PrimitiveColors.palette.primary.primary95, ColorRoles.primaryColor.primaryContainerRole] as const,
  rankStarter: ['#84cc16', '#65a30d'] as const,
  rankWarrior: [ColorRoles.successColor.successColorRole, ColorRoles.primaryColor.primaryColorRole] as const,
  rankHero: [ColorRoles.primaryColor.onPrimaryColorRole, ColorRoles.primaryColor.primaryColorRole] as const,
  rankGuardian: ['#1d4ed8', '#3b82f6'] as const,
  rankLegend: ['#6d28d9', '#8b5cf6'] as const,
  premium: ['#0f172a', '#1e293b', '#334155'] as const,
  gold: [ColorRoles.warningColor.warningColorRole, ColorRoles.warningColor.warningContainerColorRole] as const,
} as const;
