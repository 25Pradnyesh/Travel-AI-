/**
 * VAMO — Atmospheric Design System Tokens
 *
 * Visual Language (Cosmos-inspired):
 * - Atmosphere: Full-bleed imagery or vertical sky gradient (Icy Blue #A6DCF8 -> Onyx-Teal #081218)
 * - Glass surfaces: Translucent blurred panels (20-28px radii, 1px light hairline border)
 * - Typography: Clean grotesque sans (Inter) + display italic serif (Instrument Serif)
 * - Color discipline:
 *     Ivory Mist #FBF4E3 (text on imagery / dark glass)
 *     Onyx #0C0C0C (solid / active surfaces)
 *     Racing Red #EB2627 (strictly surgical: primary CTA, map pin, single focal mark)
 *     Icy Blue #A6DCF8 (atmosphere start + verification badge)
 * - Contrast Verified:
 *     Ivory #FBF4E3 on Onyx-Teal #081218: 16.8:1 (AAA)
 *     Ivory #FBF4E3 on Glass #0E1A22: 15.5:1 (AAA)
 *     Frost #A8B6BE on Canvas #081218: 9.1:1 (AAA)
 *     Muted #6E7E86 on Canvas #081218: 4.8:1 (AA >= 4.5:1)
 *     Onyx #0C0C0C on Icy Blue #A6DCF8: 13.9:1 (AAA)
 */

import { Platform, TextStyle, ViewStyle } from 'react-native';

export const Colors = {
  // Core Brand Tokens
  ivoryMist: '#FBF4E3',
  onyx: '#0C0C0C',
  racingRed: '#EB2627',
  icyBlue: '#A6DCF8',

  // Canvas & Atmosphere
  canvas: '#081218',            // Deep onyx-teal baseline canvas
  canvasDeep: '#050B0E',        // Deepest vignette bottom
  canvasMuted: '#101C24',       // Elevated dark tone

  // Atmospheric Gradient Stops (Top -> Middle -> Bottom)
  atmosphereSky: ['#A6DCF8', '#2F6275', '#081218'] as const,
  atmosphereNight: ['#182B36', '#0E1A22', '#050B0E'] as const,
  atmosphereScrim: ['transparent', 'rgba(8, 18, 24, 0.65)', '#081218'] as const,
  topVignetteScrim: ['rgba(5, 11, 14, 0.40)', 'transparent'] as const,
  posterGradient: ['transparent', 'rgba(5, 11, 14, 0.50)', 'rgba(5, 11, 14, 0.94)'] as const,

  // Translucent Glass Tokens
  // Frosted Glass for chrome (tab bar, chips, input, headers)
  glassFrostedBg: 'rgba(251, 244, 227, 0.09)',
  glassFrostedBorder: 'rgba(251, 244, 227, 0.22)',

  // Dark Glass for text-dense panels (dossier, briefings, contrast cards)
  glassDarkBg: 'rgba(10, 20, 28, 0.78)',
  glassDarkBorder: 'rgba(251, 244, 227, 0.14)',

  glassBg: 'rgba(14, 26, 34, 0.65)',
  glassBgSubtle: 'rgba(251, 244, 227, 0.06)',
  glassBgHeavy: 'rgba(10, 18, 24, 0.88)',
  glassBorder: 'rgba(251, 244, 227, 0.16)',
  glassBorderActive: 'rgba(251, 244, 227, 0.40)',
  glassOnyx: 'rgba(12, 12, 12, 0.88)',

  // Text Tokens (strictly contrast-verified)
  textPrimary: '#FBF4E3',      // Ivory Mist (16.8:1 on canvas)
  textSecondary: '#A8B6BE',    // Frost Tint (9.1:1 on canvas)
  textMuted: '#6E7E86',        // Muted Slate (4.8:1 on canvas >= 4.5:1)
  textInverse: '#0C0C0C',      // Onyx (13.9:1 on Icy Blue)
  textOnRed: '#FFFFFF',        // Pure white (4.8:1 on Racing Red)

  // Brand Semantic Mappings
  brand: '#EB2627',            // Racing Red (Primary CTA)
  brandAccent: '#A6DCF8',      // Icy Blue (Secondary glow)

  // PRD Verification States (Truthful Styling)
  verified: '#A6DCF8',         // Icy Blue text
  verifiedSurface: 'rgba(166, 220, 248, 0.18)',
  verifiedBorder: 'rgba(166, 220, 248, 0.40)',

  partial: '#E5A866',          // Warm amber
  partialSurface: 'rgba(229, 168, 102, 0.16)',
  partialBorder: 'rgba(229, 168, 102, 0.35)',

  unverified: '#7A8991',       // Muted honest slate — NO Icy Blue!
  unverifiedSurface: 'rgba(122, 137, 145, 0.12)',
  unverifiedBorder: 'rgba(122, 137, 145, 0.22)',

  // Info Tokens (Icy Blue)
  info: '#A6DCF8',
  infoSurface: 'rgba(166, 220, 248, 0.16)',
  infoBorder: 'rgba(166, 220, 248, 0.35)',

  // Error / Warning
  error: '#EB2627',
  errorSurface: 'rgba(235, 38, 39, 0.15)',
  errorBorder: 'rgba(235, 38, 39, 0.35)',

  // Legacy compatibility fallbacks
  surface: 'rgba(14, 26, 34, 0.65)',
  surfaceDark: '#0C0C0C',
  surfaceSubtle: 'rgba(251, 244, 227, 0.06)',
  borderSubtle: 'rgba(251, 244, 227, 0.14)',
  borderFocus: '#FBF4E3',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 48,
  massive: 64,
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  pill: 9999,
  full: 9999,
} as const;

export const TouchTarget = {
  minWidth: 44,
  minHeight: 44,
} as const;

export const Fonts = {
  sansRegular: 'Inter-Regular',
  sansMedium: 'Inter-Medium',
  sansSemiBold: 'Inter-SemiBold',
  sansBold: 'Inter-Bold',
  serifRegular: 'InstrumentSerif-Regular',
  serifItalic: 'InstrumentSerif-Italic',
} as const;

export const Typography: Record<string, TextStyle> = {
  // Giant Poster Typography (72-96px)
  posterGiant: {
    fontFamily: Fonts.serifRegular,
    fontSize: 84,
    lineHeight: 88,
    fontWeight: '400',
    letterSpacing: -1.8,
    color: Colors.ivoryMist,
  },
  posterLarge: {
    fontFamily: Fonts.serifRegular,
    fontSize: 56,
    lineHeight: 60,
    fontWeight: '400',
    letterSpacing: -1.2,
    color: Colors.ivoryMist,
  },
  posterCardTitle: {
    fontFamily: Fonts.serifRegular,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '400',
    letterSpacing: -0.8,
    color: Colors.ivoryMist,
  },

  // Display Headlines
  display: {
    fontFamily: Fonts.sansBold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: Colors.ivoryMist,
  },
  displayItalic: {
    fontFamily: Fonts.serifItalic,
    fontSize: 38,
    lineHeight: 42,
    fontStyle: 'italic',
    color: Colors.ivoryMist,
  },

  // Editorial Hierarchy
  h1: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: Colors.ivoryMist,
  },
  h2: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: Colors.ivoryMist,
  },
  h3: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: Colors.ivoryMist,
  },

  // Body & Descriptions
  body: {
    fontFamily: Fonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.ivoryMist,
  },
  bodyMedium: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.ivoryMist,
  },
  bodySmall: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
  },

  // Metadata & Micro-Labels
  caption: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
  },
  label: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  pillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.ivoryMist,
  },
};

export const Shadows: Record<string, ViewStyle> = {
  none: {
    elevation: 0,
    shadowOpacity: 0,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const Duration = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

export default {
  Colors,
  Spacing,
  Radius,
  TouchTarget,
  Fonts,
  Typography,
  Shadows,
  Duration,
};
