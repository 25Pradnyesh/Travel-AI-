/**
 * VAMO — Glass Blur Design Tokens & Tuner Configuration
 *
 * Authoritative single place for tuning glassmorphic visual parameters.
 * Variants:
 *  - 'dark': Info panels, Location Details overview, dossier rows, contrast cards
 *  - 'frosted': Accents, chips, search inputs, secondary chrome
 *  - 'tabBar': Floating navigation bar pill
 *  - 'sheet': Bottom modal cartography sheets
 *
 * GlassView reads ONLY from this configuration.
 * Profile > Preferences maps "Glass blur" Low / Medium / High to GLASS_PRESETS.
 * Low also applies on reduce-transparency or low-end devices.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getContrastRatio, rgbToHex } from '@/lib/atmosphere/contrast';

export type GlassVariant = 'dark' | 'frosted' | 'tabBar' | 'sheet';
export type GlassBlurPreset = 'low' | 'medium' | 'high';

export interface GlassVariantConfig {
  blurIntensity: number; // 0 - 100
  fillAlpha: number;     // 0.0 - 1.0 (translucent background fill opacity)
  borderAlpha: number;   // 0.0 - 1.0 (translucent hairline border opacity)
  tint: 'dark' | 'light' | 'default';
}

export const STORAGE_KEY_GLASS_BLUR = '@vamo_glass_blur_preset';

/**
 * GLASS_PRESETS
 * Presets for Low, Medium, High blur levels selectable in Profile > Preferences.
 * Low also automatically applies when reduce-transparency is enabled or on low-end devices.
 */
export const GLASS_PRESETS: Record<GlassBlurPreset, Record<GlassVariant, GlassVariantConfig>> = {
  low: {
    dark: {
      blurIntensity: 25,
      fillAlpha: 0.90,
      borderAlpha: 0.14,
      tint: 'dark',
    },
    frosted: {
      blurIntensity: 20,
      fillAlpha: 0.18,
      borderAlpha: 0.24,
      tint: 'light',
    },
    tabBar: {
      blurIntensity: 30,
      fillAlpha: 0.92,
      borderAlpha: 0.16,
      tint: 'dark',
    },
    sheet: {
      blurIntensity: 30,
      fillAlpha: 0.92,
      borderAlpha: 0.16,
      tint: 'dark',
    },
  },
  medium: {
    dark: {
      blurIntensity: 55,
      fillAlpha: 0.82,
      borderAlpha: 0.14,
      tint: 'dark',
    },
    frosted: {
      blurIntensity: 40,
      fillAlpha: 0.12,
      borderAlpha: 0.22,
      tint: 'light',
    },
    tabBar: {
      blurIntensity: 75,
      fillAlpha: 0.88,
      borderAlpha: 0.16,
      tint: 'dark',
    },
    sheet: {
      blurIntensity: 70,
      fillAlpha: 0.88,
      borderAlpha: 0.16,
      tint: 'dark',
    },
  },
  high: {
    dark: {
      blurIntensity: 85,
      fillAlpha: 0.74,
      borderAlpha: 0.16,
      tint: 'dark',
    },
    frosted: {
      blurIntensity: 60,
      fillAlpha: 0.10,
      borderAlpha: 0.24,
      tint: 'light',
    },
    tabBar: {
      blurIntensity: 90,
      fillAlpha: 0.82,
      borderAlpha: 0.20,
      tint: 'dark',
    },
    sheet: {
      blurIntensity: 85,
      fillAlpha: 0.82,
      borderAlpha: 0.20,
      tint: 'dark',
    },
  },
};

/**
 * GLASS_CONFIG
 * Authoritative default values per variant (Medium baseline).
 * Edit these values directly by hand or paste updated values from /dev/glass.
 */
export const GLASS_CONFIG: Record<GlassVariant, GlassVariantConfig> = {
  dark: {
    blurIntensity: 55,
    fillAlpha: 0.82,
    borderAlpha: 0.14,
    tint: 'dark',
  },
  frosted: {
    blurIntensity: 40,
    fillAlpha: 0.12,
    borderAlpha: 0.22,
    tint: 'light',
  },
  tabBar: {
    blurIntensity: 75,
    fillAlpha: 0.88,
    borderAlpha: 0.16,
    tint: 'dark',
  },
  sheet: {
    blurIntensity: 70,
    fillAlpha: 0.88,
    borderAlpha: 0.16,
    tint: 'dark',
  },
};

/**
 * Returns the effective GlassVariantConfig for a variant given an optional preset level.
 */
export function getGlassConfig(
  variant: GlassVariant,
  preset?: GlassBlurPreset
): GlassVariantConfig {
  if (preset && GLASS_PRESETS[preset]?.[variant]) {
    return GLASS_PRESETS[preset][variant];
  }
  return GLASS_CONFIG[variant] ?? GLASS_CONFIG.dark;
}

/**
 * Returns formatted CSS RGBA background and border strings.
 */
export function getGlassColors(
  variant: GlassVariant,
  config?: GlassVariantConfig
): { backgroundColor: string; borderColor: string } {
  const cfg = config ?? GLASS_CONFIG[variant] ?? GLASS_CONFIG.dark;
  const isFrosted = variant === 'frosted';

  const fillRgb = isFrosted ? '251, 244, 227' : '8, 14, 18';
  const borderRgb = '251, 244, 227';

  return {
    backgroundColor: `rgba(${fillRgb}, ${cfg.fillAlpha.toFixed(2)})`,
    borderColor: `rgba(${borderRgb}, ${cfg.borderAlpha.toFixed(2)})`,
  };
}

/**
 * Computes contrast ratio of Ivory Mist (#FBF4E3) against composited glass fill.
 * Used by the /dev/glass tuner to trigger WCAG AA (< 4.5:1) warnings.
 */
export function calculateIvoryContrast(
  variant: GlassVariant,
  fillAlpha: number,
  bgMode: 'current' | 'white' | 'dark'
): { contrastRatio: number; passesAA: boolean; compositedHex: string } {
  const IVORY_HEX = '#FBF4E3';

  // Base fill color: frosted is light ivory, all others are deep dark onyx
  const fillR = variant === 'frosted' ? 251 : 8;
  const fillG = variant === 'frosted' ? 244 : 14;
  const fillB = variant === 'frosted' ? 227 : 18;

  // Background color depending on mode
  let bgR = 8;
  let bgG = 18;
  let bgB = 24;

  if (bgMode === 'white') {
    bgR = 255;
    bgG = 255;
    bgB = 255;
  } else if (bgMode === 'dark') {
    bgR = 5;
    bgG = 11;
    bgB = 14;
  }

  // Alpha composition: result = fill * alpha + bg * (1 - alpha)
  const a = Math.max(0, Math.min(1, fillAlpha));
  const compR = Math.round(fillR * a + bgR * (1 - a));
  const compG = Math.round(fillG * a + bgG * (1 - a));
  const compB = Math.round(fillB * a + bgB * (1 - a));

  const compositedHex = rgbToHex(compR, compG, compB);
  const ratio = getContrastRatio(IVORY_HEX, compositedHex);

  return {
    contrastRatio: Number(ratio.toFixed(2)),
    passesAA: ratio >= 4.5,
    compositedHex,
  };
}

/**
 * Storage helpers for Profile > Preferences
 */
export async function getStoredGlassBlurPreset(): Promise<GlassBlurPreset> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_GLASS_BLUR);
    if (val === 'low' || val === 'medium' || val === 'high') {
      return val;
    }
    return 'medium';
  } catch {
    return 'medium';
  }
}

export async function setStoredGlassBlurPreset(preset: GlassBlurPreset): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_GLASS_BLUR, preset);
  } catch {
    // Non-fatal
  }
}
