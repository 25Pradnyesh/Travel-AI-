/**
 * VAMO Mobile — Atmospheric Contrast & Relative Luminance Engine
 *
 * Implements WCAG 2.1 Relative Luminance and Contrast Ratio algorithms
 * to mathematically verify and clamp all adaptive atmosphere palettes.
 *
 * Requirements:
 * - Ivory Mist (#FBF4E3) normal text on Mid: >= 4.5:1
 * - Ivory Mist (#FBF4E3) normal text on Bottom: >= 4.5:1
 * - Large Display text on Top: >= 3.0:1
 * - Racing Red (#EB2627) CTA on Bottom: >= 3.0:1
 * - Racing Red (#EB2627) Pin on Map Canvas (#0B171F): >= 3.0:1
 */

import { AtmospherePalette } from '@/types/atmosphere';

export const ATMOSPHERE_TOKENS = {
  ivoryMist: '#FBF4E3',
  onyx: '#0C0C0C',
  racingRed: '#EB2627',
  icyBlue: '#A6DCF8',
  mapCanvas: '#0B171F',
} as const;

export function srgbToLinear(c: number): number {
  const norm = c / 255.0;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(c: number): number {
  return c <= 0.0031308
    ? Math.round(c * 12.92 * 255.0)
    : Math.round((1.055 * Math.pow(c, 1.0 / 2.4) - 0.055) * 255.0);
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;
  const num = parseInt(full, 16);
  if (isNaN(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (val: number) => clamp(val).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastAuditResult {
  ivoryOnTop: number;
  ivoryOnMid: number;
  ivoryOnBottom: number;
  redOnBottom: number;
  redOnMapCanvas: number;
  passIvoryTop: boolean;
  passIvoryMid: boolean;
  passIvoryBottom: boolean;
  passRedBottom: boolean;
  passRedMap: boolean;
  allPassed: boolean;
}

export function auditPaletteContrast(palette: AtmospherePalette): ContrastAuditResult {
  const ivoryOnTop = getContrastRatio(ATMOSPHERE_TOKENS.ivoryMist, palette.top);
  const ivoryOnMid = getContrastRatio(ATMOSPHERE_TOKENS.ivoryMist, palette.mid);
  const ivoryOnBottom = getContrastRatio(ATMOSPHERE_TOKENS.ivoryMist, palette.bottom);
  const redOnBottom = getContrastRatio(ATMOSPHERE_TOKENS.racingRed, palette.bottom);
  const redOnMapCanvas = getContrastRatio(ATMOSPHERE_TOKENS.racingRed, ATMOSPHERE_TOKENS.mapCanvas);

  const passIvoryTop = ivoryOnTop >= 3.0;
  const passIvoryMid = ivoryOnMid >= 4.5;
  const passIvoryBottom = ivoryOnBottom >= 4.5;
  const passRedBottom = redOnBottom >= 3.0;
  const passRedMap = redOnMapCanvas >= 3.0;

  return {
    ivoryOnTop,
    ivoryOnMid,
    ivoryOnBottom,
    redOnBottom,
    redOnMapCanvas,
    passIvoryTop,
    passIvoryMid,
    passIvoryBottom,
    passRedBottom,
    passRedMap,
    allPassed: passIvoryTop && passIvoryMid && passIvoryBottom && passRedBottom && passRedMap,
  };
}

/**
 * Progressively clamps a color stop towards darker tones until target contrast is satisfied.
 */
function darkenUntilContrast(
  targetHex: string,
  comparisonHex: string,
  minContrast: number,
  maxIterations = 20
): string {
  let [r, g, b] = hexToRgb(targetHex);
  let iterations = 0;

  while (getContrastRatio(comparisonHex, rgbToHex(r, g, b)) < minContrast && iterations < maxIterations) {
    r = Math.floor(r * 0.90);
    g = Math.floor(g * 0.90);
    b = Math.floor(b * 0.90);
    iterations++;
  }

  return rgbToHex(r, g, b);
}

/**
 * Clamps an entire palette to guarantee that all WCAG 2.1 contrast rules are satisfied.
 */
export function clampPalette(palette: AtmospherePalette): AtmospherePalette {
  let { top, mid, bottom, glow } = palette;

  // 1. Ensure Top achieves >= 3.0:1 contrast against Ivory Mist
  if (getContrastRatio(ATMOSPHERE_TOKENS.ivoryMist, top) < 3.0) {
    top = darkenUntilContrast(top, ATMOSPHERE_TOKENS.ivoryMist, 3.0);
  }

  // 2. Ensure Mid achieves >= 4.5:1 contrast against Ivory Mist
  if (getContrastRatio(ATMOSPHERE_TOKENS.ivoryMist, mid) < 4.5) {
    mid = darkenUntilContrast(mid, ATMOSPHERE_TOKENS.ivoryMist, 4.5);
  }

  // 3. Ensure Bottom achieves >= 4.5:1 against Ivory Mist and >= 3.0:1 against Racing Red
  if (getContrastRatio(ATMOSPHERE_TOKENS.ivoryMist, bottom) < 4.5) {
    bottom = darkenUntilContrast(bottom, ATMOSPHERE_TOKENS.ivoryMist, 4.5);
  }
  if (getContrastRatio(ATMOSPHERE_TOKENS.racingRed, bottom) < 3.0) {
    bottom = darkenUntilContrast(bottom, ATMOSPHERE_TOKENS.racingRed, 3.0);
  }

  return { top, mid, bottom, glow };
}
