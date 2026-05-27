/**
 * GreenLume Design System Tokens
 * Generated automatically from design-tokens.tokens.json
 * Date: 2026-05-27
 */

/**
 * Primitive Color Palette containing raw brand colors and shades.
 */
export const PrimitiveColors = {
  "keyColors": {
    "primaryColour": "#2e7d32",
    "secondaryColor": "#66bb6a",
    "tertiaryColour": "#8d6e63",
    "neutral": "#fafafa",
    "accent": "#aeea00",
    "error": "#e53935",
    "warning": "#ffc107",
    "success": "#00c853"
  },
  "palette": {
    "primary": {
      "primary0": "#000000",
      "primary10": "#0e250f",
      "primary20": "#1b4b1e",
      "primary30": "#29702d",
      "primary40": "#37953c",
      "primary50": "#45ba4b",
      "primary60": "#6ac86f",
      "primary70": "#8fd693",
      "primary80": "#b4e4b7",
      "primary90": "#daf1db",
      "primary95": "#ecf8ed",
      "primary98": "#f8fcf8",
      "primary99": "#fbfefb",
      "primary100": "#ffffff"
    },
    "secondary": {
      "secondary0": "#000000",
      "secondary10": "#102311",
      "secondary20": "#1f4721",
      "secondary30": "#2f6a32",
      "secondary40": "#3f8d42",
      "secondary50": "#4eb153",
      "secondary60": "#72c075",
      "secondary70": "#95d098",
      "secondary80": "#b8e0ba",
      "secondary90": "#dcefdd",
      "secondary95": "#edf7ee",
      "secondary98": "#f8fcf8",
      "secondary99": "#fbfdfc",
      "secondary100": "#ffffff"
    },
    "tertiary": {
      "tertiary0": "#000000",
      "tertiary10": "#1e1715",
      "tertiary20": "#3c2f2a",
      "tertiary30": "#5a463f",
      "tertiary40": "#785d54",
      "tertiary50": "#967569",
      "tertiary60": "#ab9087",
      "tertiary70": "#c0aca5",
      "tertiary80": "#d5c8c3",
      "tertiary90": "#eae3e1",
      "tertiary95": "#f4f1f0",
      "tertiary98": "#fbf9f9",
      "tertiary99": "#fdfcfc",
      "tertiary100": "#ffffff"
    },
    "neutral": {
      "neutral0": "#000000",
      "neutral10": "#191919",
      "neutral20": "#333333",
      "neutral30": "#4c4c4c",
      "neutral40": "#666666",
      "neutral50": "#808080",
      "neutral60": "#999999",
      "neutral70": "#b3b3b3",
      "neutral80": "#cccccc",
      "neutral90": "#e6e6e6",
      "neutral95": "#f2f2f2",
      "neutral98": "#fafafa",
      "neutral99": "#fcfcfc",
      "neutral100": "#ffffff"
    },
    "accent": {
      "accent0": "#000000",
      "accent10": "#263300",
      "accent20": "#4c6600",
      "accent30": "#729900",
      "accent40": "#98cc00",
      "accent50": "#beff00",
      "accent60": "#cbff33",
      "accent70": "#d8ff66",
      "accent80": "#e5ff99",
      "accent90": "#f2ffcc",
      "accent95": "#f8ffe5",
      "accent98": "#fcfff5",
      "accent99": "#fefffa",
      "accent100": "#ffffff"
    },
    "error": {
      "error0": "#000000",
      "error10": "#2d0706",
      "error20": "#5a0d0c",
      "error30": "#881411",
      "error40": "#b51b17",
      "error50": "#e2221d",
      "error60": "#e84e4a",
      "error70": "#ee7a77",
      "error80": "#f3a6a5",
      "error90": "#f9d3d2",
      "error95": "#fce9e8",
      "error98": "#fef6f6",
      "error99": "#fefbfa",
      "error100": "#ffffff"
    },
    "warning": {
      "warning0": "#000000",
      "warning10": "#332600",
      "warning20": "#664c00",
      "warning30": "#997300",
      "warning40": "#cc9900",
      "warning50": "#ffbf00",
      "warning60": "#ffcc33",
      "warning70": "#ffd966",
      "warning80": "#ffe599",
      "warning90": "#fff2cc",
      "warning95": "#fff9e5",
      "warning98": "#fffcf5",
      "warning99": "#fffefa",
      "warning100": "#ffffff"
    },
    "success": {
      "success0": "#000000",
      "success10": "#003315",
      "success20": "#00662a",
      "success30": "#00993f",
      "success40": "#00cc55",
      "success50": "#00ff6a",
      "success60": "#33ff88",
      "success70": "#66ffa5",
      "success80": "#99ffc3",
      "success90": "#ccffe1",
      "success95": "#e5fff0",
      "success98": "#f5fff9",
      "success99": "#fafffc",
      "success100": "#ffffff"
    }
  }
} as const;

/**
 * Color Roles mapping semantic roles (e.g. primary, error, success) to resolved primitive colors.
 */
export const ColorRoles = {
  "primaryColor": {
    "primaryColorRole": "#37953c",
    "onPrimaryColorRole": "#29702d",
    "primaryContainerRole": "#daf1db"
  },
  "secondaryColor": {
    "secondaryColorRole": "#3f8d42",
    "onSecondaryColorRole": "#ffffff",
    "secondaryContainerColorRole": "#dcefdd",
    "onSecondaryContainerColorRole": "#2f6a32"
  },
  "tertiaryColor": {
    "tetiaryColorRole": "#785d54",
    "onTetiaryColorRole": "#ffffff",
    "tetiaryContainerColorRole": "#eae3e1",
    "onTetiaryContainerColorRole": "#5a463f"
  },
  "neutralColor": {
    "nuetralColorRole": "#4c4c4c",
    "onNuetralColorRole": "#e6e6e6",
    "nuetralContainerColorRole": "#666666",
    "onNuetralContainerColorRole": "#fafafa"
  },
  "accentColor": {
    "accentColorRole": "#4c6600",
    "onAccentColorRole": "#f2ffcc",
    "accentContainerColorRole": "#e5ff99",
    "onAccentContainerColorRole": "#263300"
  },
  "errorColor": {
    "errorColorRole": "#b51b17",
    "onErrorColorRole": "#ffffff",
    "errorContainerColorRole": "#f9d3d2",
    "onErrorContainerColorRole": "#881411"
  },
  "successColor": {
    "successColorRole": "#00993f",
    "onSuccessColorRole": "#ccffe1",
    "successContainerColorRole": "#66ffa5",
    "onSuccessContainerColorRole": "#00662a"
  },
  "warningColor": {
    "warningColorRole": "#ffbf00",
    "onWarningColorRole": "#fff2cc",
    "warningContainerColorRole": "#ffcc33",
    "onWarningContainerColorRole": "#fff9e5"
  }
} as const;

/**
 * Layout Grid definitions for tablet and mobile viewports.
 */
export const Grid = {
  "tabletGrid": {
    "pattern": "columns",
    "gutterSize": 16,
    "alignment": "stretch",
    "count": 8,
    "offset": 32
  },
  "mobileGrid": {
    "pattern": "columns",
    "gutterSize": 16,
    "alignment": "stretch",
    "count": 4,
    "offset": 16
  }
} as const;

/**
 * Typography Style Presets optimized and typed for React Native's StyleSheet.
 * FontFamily values are automatically mapped to Expo-loaded font names,
 * and fontWeight is omitted to prevent font rendering bugs on Android.
 */
export const TypographyStyles = {
  "display2xl": {
    "regular": {
      "fontFamily": "PlusJakartaSans_400Regular",
      "fontSize": 72,
      "lineHeight": 88,
      "letterSpacing": -1.44
    },
    "medium": {
      "fontFamily": "PlusJakartaSans_500Medium",
      "fontSize": 72,
      "lineHeight": 88,
      "letterSpacing": -1.44
    },
    "semibold": {
      "fontFamily": "PlusJakartaSans_600SemiBold",
      "fontSize": 72,
      "lineHeight": 88,
      "letterSpacing": -1.44
    },
    "bold": {
      "fontFamily": "PlusJakartaSans_700Bold",
      "fontSize": 72,
      "lineHeight": 88,
      "letterSpacing": -1.44
    }
  },
  "displayXl": {
    "regular": {
      "fontFamily": "PlusJakartaSans_400Regular",
      "fontSize": 60,
      "lineHeight": 72,
      "letterSpacing": -1.2
    },
    "medium": {
      "fontFamily": "PlusJakartaSans_500Medium",
      "fontSize": 60,
      "lineHeight": 72,
      "letterSpacing": -1.2
    },
    "semibold": {
      "fontFamily": "PlusJakartaSans_600SemiBold",
      "fontSize": 60,
      "lineHeight": 72,
      "letterSpacing": -1.2
    },
    "bold": {
      "fontFamily": "PlusJakartaSans_700Bold",
      "fontSize": 60,
      "lineHeight": 72,
      "letterSpacing": -1.2
    }
  },
  "displayLg": {
    "regular": {
      "fontFamily": "PlusJakartaSans_400Regular",
      "fontSize": 48,
      "lineHeight": 60,
      "letterSpacing": -0.96
    },
    "medium": {
      "fontFamily": "PlusJakartaSans_500Medium",
      "fontSize": 48,
      "lineHeight": 60,
      "letterSpacing": -0.96
    },
    "semibold": {
      "fontFamily": "PlusJakartaSans_600SemiBold",
      "fontSize": 48,
      "lineHeight": 60,
      "letterSpacing": -0.96
    },
    "bold": {
      "fontFamily": "PlusJakartaSans_700Bold",
      "fontSize": 48,
      "lineHeight": 60,
      "letterSpacing": -0.96
    }
  },
  "displayMd": {
    "regular": {
      "fontFamily": "PlusJakartaSans_400Regular",
      "fontSize": 36,
      "lineHeight": 44,
      "letterSpacing": -0.72
    },
    "medium": {
      "fontFamily": "PlusJakartaSans_500Medium",
      "fontSize": 36,
      "lineHeight": 44,
      "letterSpacing": -0.72
    },
    "semibold": {
      "fontFamily": "PlusJakartaSans_600SemiBold",
      "fontSize": 36,
      "lineHeight": 44,
      "letterSpacing": -0.72
    },
    "bold": {
      "fontFamily": "PlusJakartaSans_700Bold",
      "fontSize": 36,
      "lineHeight": 44,
      "letterSpacing": -0.72
    }
  },
  "displaySm": {
    "regular": {
      "fontFamily": "PlusJakartaSans_400Regular",
      "fontSize": 30,
      "lineHeight": 36,
      "letterSpacing": 0
    },
    "medium": {
      "fontFamily": "PlusJakartaSans_500Medium",
      "fontSize": 30,
      "lineHeight": 36,
      "letterSpacing": 0
    },
    "semibold": {
      "fontFamily": "PlusJakartaSans_600SemiBold",
      "fontSize": 30,
      "lineHeight": 36,
      "letterSpacing": 0
    },
    "bold": {
      "fontFamily": "PlusJakartaSans_700Bold",
      "fontSize": 30,
      "lineHeight": 36,
      "letterSpacing": 0
    }
  },
  "textXl": {
    "regular": {
      "fontFamily": "PlusJakartaSans_400Regular",
      "fontSize": 20,
      "lineHeight": 30,
      "letterSpacing": 0
    },
    "medium": {
      "fontFamily": "PlusJakartaSans_500Medium",
      "fontSize": 20,
      "lineHeight": 30,
      "letterSpacing": 0
    },
    "semibold": {
      "fontFamily": "PlusJakartaSans_600SemiBold",
      "fontSize": 20,
      "lineHeight": 30,
      "letterSpacing": 0
    },
    "bold": {
      "fontFamily": "PlusJakartaSans_700Bold",
      "fontSize": 20,
      "lineHeight": 30,
      "letterSpacing": 0
    }
  },
  "textLg": {
    "regular": {
      "fontFamily": "PlusJakartaSans_400Regular",
      "fontSize": 18,
      "lineHeight": 28,
      "letterSpacing": 0
    },
    "medium": {
      "fontFamily": "PlusJakartaSans_500Medium",
      "fontSize": 18,
      "lineHeight": 28,
      "letterSpacing": 0
    },
    "semibold": {
      "fontFamily": "PlusJakartaSans_600SemiBold",
      "fontSize": 18,
      "lineHeight": 28,
      "letterSpacing": 0
    },
    "bold": {
      "fontFamily": "PlusJakartaSans_700Bold",
      "fontSize": 18,
      "lineHeight": 28,
      "letterSpacing": 0
    }
  },
  "textMd": {
    "regular": {
      "fontFamily": "PlusJakartaSans_400Regular",
      "fontSize": 16,
      "lineHeight": 24,
      "letterSpacing": 0
    },
    "medium": {
      "fontFamily": "PlusJakartaSans_500Medium",
      "fontSize": 16,
      "lineHeight": 24,
      "letterSpacing": 0
    },
    "semibold": {
      "fontFamily": "PlusJakartaSans_600SemiBold",
      "fontSize": 16,
      "lineHeight": 24,
      "letterSpacing": 0
    },
    "bold": {
      "fontFamily": "PlusJakartaSans_700Bold",
      "fontSize": 16,
      "lineHeight": 24,
      "letterSpacing": 0
    }
  },
  "textSm": {
    "regular": {
      "fontFamily": "PlusJakartaSans_400Regular",
      "fontSize": 14,
      "lineHeight": 20,
      "letterSpacing": 0
    },
    "medium": {
      "fontFamily": "PlusJakartaSans_500Medium",
      "fontSize": 14,
      "lineHeight": 20,
      "letterSpacing": 0
    },
    "semibold": {
      "fontFamily": "PlusJakartaSans_600SemiBold",
      "fontSize": 14,
      "lineHeight": 20,
      "letterSpacing": 0
    },
    "bold": {
      "fontFamily": "PlusJakartaSans_700Bold",
      "fontSize": 14,
      "lineHeight": 20,
      "letterSpacing": 0
    }
  },
  "textXs": {
    "regular": {
      "fontFamily": "PlusJakartaSans_400Regular",
      "fontSize": 12,
      "lineHeight": 18,
      "letterSpacing": 0
    },
    "medium": {
      "fontFamily": "PlusJakartaSans_500Medium",
      "fontSize": 12,
      "lineHeight": 18,
      "letterSpacing": 0
    },
    "semibold": {
      "fontFamily": "PlusJakartaSans_600SemiBold",
      "fontSize": 12,
      "lineHeight": 18,
      "letterSpacing": 0
    },
    "bold": {
      "fontFamily": "PlusJakartaSans_700Bold",
      "fontSize": 12,
      "lineHeight": 18,
      "letterSpacing": 0
    }
  }
} as const;
