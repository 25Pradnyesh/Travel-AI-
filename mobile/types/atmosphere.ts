/**
 * VAMO Mobile — Adaptive Place Atmosphere Data Contracts
 *
 * Defines the core models for dynamic, place-aware atmospheric color systems:
 * - 3-stop vertical gradient stops (top, mid, bottom) + ambient glow
 * - 5-tier resolution priority hierarchy
 * - Future-proof image color extraction interface without native dependencies
 * - Input place parameters for deterministic derivation and preset matching
 */

export interface AtmospherePalette {
  /** Top gradient stop: celestial horizon tone (0% to ~35%) */
  top: string;
  /** Mid gradient stop: mid-elevation atmosphere (35% to ~70%) */
  mid: string;
  /** Bottom gradient stop: grounded nocturnal bedrock (70% to 100%) */
  bottom: string;
  /** Ambient diffuse glow color for header and background lighting */
  glow: string;
}

export type ResolverTier =
  | 'extracted_photo'
  | 'city_preset'
  | 'country_preset'
  | 'deterministic_fallback'
  | 'system_default';

/**
 * Clean, typed interface for future hero photo color extraction.
 * Enables Tier 1 resolution without coupling to native libraries in Stage D1.
 */
export interface ExtractedPalette {
  dominant?: string;
  vibrant?: string;
  darkVibrant?: string;
  muted?: string;
  darkMuted?: string;
  lightMuted?: string;
}

export interface ImagePaletteExtractor {
  extractPalette(imageUrl: string): Promise<ExtractedPalette | null>;
}

export interface PlaceAtmosphereInput {
  city?: string | null;
  region?: string | null;
  country?: string | null;
  name?: string | null;
  place_id?: string | null;
  heroPhotoUrl?: string | null;
  extractedPalette?: ExtractedPalette | null;
}

export interface ResolvedAtmosphere {
  palette: AtmospherePalette;
  tier: ResolverTier;
  matchedKey?: string;
  isFallback: boolean;
}

export interface PresetDefinition extends AtmospherePalette {
  name: string;
  scope: 'city' | 'country' | 'system';
  rationale: string;
}
