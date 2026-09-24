/**
 * TRAVEL AI — Mobile Design System Tokens
 *
 * Grounded in the Travel AI editorial / Swiss design aesthetic:
 * warm canvas, pure surfaces, sharp monochrome contrasts,
 * restrained borders, and intentional semantic status accents.
 */

import { Platform, TextStyle, ViewStyle } from 'react-native';

export const Colors = {
  // Surface tokens
  canvas: '#F7F7F5',       // Primary screen canvas (Warm Alabaster)
  surface: '#FFFFFF',      // Cards, sheets, and elevated containers
  surfaceSubtle: '#F0F0ED',// Subdued card backgrounds / pill backgrounds
  surfaceDark: '#111111',  // Primary buttons & high-emphasis dark blocks
  surfaceDarkElevated: '#181818',

  // Text tokens
  textPrimary: '#111111',  // Primary high-contrast editorial text
  textSecondary: '#666666',// Descriptive supporting text
  textMuted: '#8A8A8A',    // Metadata, timestamps, captions
  textInverse: '#F7F7F5',  // Text on dark surfaces

  // Border & divider tokens
  borderSubtle: '#E5E5E2', // Hairline neutral borders
  borderFocus: '#111111',  // Active/focused borders
  borderAccent: '#C2CBD3', // Subtle slate border highlight

  // Semantic verification tokens (matches backend ResponseBuilder)
  verified: '#2D6A4F',        // Forest green (VERIFIED)
  verifiedSurface: 'rgba(45, 106, 79, 0.08)',
  verifiedBorder: 'rgba(45, 106, 79, 0.20)',

  partial: '#B5651D',         // Warm amber (PARTIAL)
  partialSurface: 'rgba(181, 101, 29, 0.08)',
  partialBorder: 'rgba(181, 101, 29, 0.20)',

  aiUnverified: '#666666',    // Slate gray (LOCATION IDENTIFIED - AI UNVERIFIED)
  aiUnverifiedSurface: '#F0F0ED',
  aiUnverifiedBorder: '#E5E5E2',

  algorithmic: '#8A8A8A',     // Muted gray (ALGORITHMIC PLACEMENT / SKIPPED)
  algorithmicSurface: '#F0F0ED',
  algorithmicBorder: '#E5E5E2',

  error: '#C1292E',           // Muted crimson (ERROR / TIMEOUT / FAILED)
  errorSurface: 'rgba(193, 41, 46, 0.06)',
  errorBorder: 'rgba(193, 41, 46, 0.20)',

  info: '#4A6FA5',            // Subtle cobalt info accent
  infoSurface: 'rgba(74, 111, 165, 0.08)',
  infoBorder: 'rgba(74, 111, 165, 0.20)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  massive: 64,
} as const;

export const Radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  full: 9999,
} as const;

export const TouchTarget = {
  minWidth: Platform.OS === 'ios' ? 44 : 48,
  minHeight: Platform.OS === 'ios' ? 44 : 48,
} as const;

const sansFontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const monoFontFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const Typography: Record<string, TextStyle> = {
  display: {
    fontFamily: sansFontFamily,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: Colors.textPrimary,
  },
  h1: {
    fontFamily: sansFontFamily,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.6,
    color: Colors.textPrimary,
  },
  h2: {
    fontFamily: sansFontFamily,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: Colors.textPrimary,
  },
  h3: {
    fontFamily: sansFontFamily,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: Colors.textPrimary,
  },
  body: {
    fontFamily: sansFontFamily,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.textPrimary,
  },
  bodySmall: {
    fontFamily: sansFontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  caption: {
    fontFamily: sansFontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  label: {
    fontFamily: sansFontFamily,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  mono: {
    fontFamily: monoFontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
};

export const Shadows: Record<string, ViewStyle> = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
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
  Typography,
  Shadows,
  Duration,
};
