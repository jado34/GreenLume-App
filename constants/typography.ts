import { TypographyStyles } from './design-tokens';

// GreenLume Typography System mapped to brand Design Tokens
export const Typography = {
  // Font Family
  fontFamily: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
  },

  // Font Sizes mapped to new tokens
  fontSize: {
    xs: TypographyStyles.textXs.regular.fontSize,       // 12px
    sm: TypographyStyles.textXs.regular.fontSize,       // 12px
    base: TypographyStyles.textSm.regular.fontSize,     // 14px
    md: TypographyStyles.textSm.regular.fontSize,       // 14px
    lg: TypographyStyles.textMd.regular.fontSize,       // 16px
    xl: TypographyStyles.textLg.regular.fontSize,       // 18px
    '2xl': TypographyStyles.textXl.regular.fontSize,     // 20px
    '3xl': TypographyStyles.textXl.regular.fontSize,     // 20px
    '4xl': TypographyStyles.displaySm.regular.fontSize,  // 30px
    '5xl': TypographyStyles.displaySm.regular.fontSize,  // 30px
    '6xl': TypographyStyles.displayMd.regular.fontSize,  // 36px
    '7xl': TypographyStyles.displayLg.regular.fontSize,  // 48px
  },

  // Line Heights (using multipliers from brand token ratios)
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.8,
  },
} as const;

// Spacing system (4px base grid)
export const Spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// Border Radius
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// Shadows
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 10,
  },
  greenGlow: {
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;
