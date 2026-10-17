/**
 * VAMO Mobile — Deterministic Fallback Atmosphere Generator
 *
 * Generates reproducible, organic, high-contrast atmospheric color palettes
 * from any real uncatalogued place string (e.g. unknown country or remote city).
 *
 * Guarantees:
 * - Stable across app reboots, OS versions, and devices for the same normalized string.
 * - Avoids intense red/orange-red hues on broad background fields.
 * - Lightness and saturation are strictly clamped and verified via WCAG 2.1 contrast formulas.
 * - Zero external dependencies.
 */

import { AtmospherePalette } from '@/types/atmosphere';
import { clampPalette } from './contrast';
import { normalizePlaceKey } from './presets';

/**
 * 32-bit djb2 string hashing algorithm.
 */
export function hashString(str: string): number {
  let hash = 5381;
  const s = str.trim();
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (val: number) => {
    const hex = Math.round((val + m) * 255).toString(16);
    return hex.padStart(2, '0');
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Generates a deterministic palette from an uncatalogued place string.
 */
export function generateDeterministicPalette(placeString: string): AtmospherePalette {
  const normalized = normalizePlaceKey(placeString);
  const hash = hashString(normalized || 'unknown_place');

  // Base hue (0..359)
  const rawHue = hash % 360;

  // Clamping rule: Steer large background areas away from intense red/orange-red (345° to 25°)
  // If in the warm red zone, shift into golden-amber/mineral or slate-teal (+45°)
  const hue = rawHue >= 345 || rawHue <= 25 ? (rawHue + 45) % 360 : rawHue;
  const satSeed = ((hash >> 8) % 100) / 100.0;

  // Top stop: L in 0.16..0.21, S in 0.25..0.45
  const topS = 0.25 + satSeed * 0.20;
  const topL = 0.16 + (((hash >> 4) % 100) / 100.0) * 0.05;
  const top = hslToHex(hue, topS, topL);

  // Mid stop: L in 0.09..0.13, S in 0.18..0.35
  const midS = 0.18 + satSeed * 0.17;
  const midL = 0.09 + (((hash >> 12) % 100) / 100.0) * 0.04;
  const mid = hslToHex(hue, midS, midL);

  // Bottom stop: L in 0.035..0.055, S in 0.10..0.22
  const botS = 0.10 + satSeed * 0.12;
  const botL = 0.035 + (((hash >> 16) % 100) / 100.0) * 0.02;
  const bottom = hslToHex(hue, botS, botL);

  // Glow: L in 0.30..0.40, S in 0.35..0.55
  const glowS = 0.35 + satSeed * 0.20;
  const glowL = 0.30 + (((hash >> 20) % 100) / 100.0) * 0.10;
  const glow = hslToHex(hue, glowS, glowL);

  // Pass through safety clamp to guarantee contrast >= 4.5:1 on mid/bottom and >= 3:1 on top
  return clampPalette({ top, mid, bottom, glow });
}
