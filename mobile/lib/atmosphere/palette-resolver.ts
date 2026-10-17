/**
 * VAMO Mobile — Five-Tier Adaptive Atmosphere Palette Resolver
 *
 * Implements strict resolution priority:
 * 1. Extracted palette from hero photo (Tier 1 - future native extraction interface)
 * 2. Curated City Preset (Tier 2 - e.g. Positano, Kyoto, Reykjavik, Marrakech, Phuket, Oia)
 * 3. Curated Country Preset (Tier 3 - e.g. Italy, Japan, Iceland, Morocco, Thailand, Greece)
 * 4. Deterministic Hashed Fallback (Tier 4 - uncatalogued real country/city string)
 * 5. VAMO Default Atmosphere (Tier 5 - cold start / no place context)
 *
 * Place-Data Integrity Rules:
 * - Uses ONLY real city/country fields present in the analysis or storage models.
 * - Never fabricates, infers, or guesses a city or country from coordinates or captions.
 * - If only real country is known, resolves country preset.
 * - If country is uncatalogued, derives deterministic fallback.
 * - If neither is available, cleanly uses VAMO default.
 */

import {
  AtmospherePalette,
  PlaceAtmosphereInput,
  ResolvedAtmosphere,
} from '@/types/atmosphere';
import {
  findCityPreset,
  findCountryPreset,
  VAMO_DEFAULT_PRESET,
} from './presets';
import { generateDeterministicPalette } from './deterministic';
import { clampPalette } from './contrast';

/**
 * Resolves the adaptive atmosphere for a given place input according to the 5-tier priority hierarchy.
 */
export function resolveAtmosphere(input?: PlaceAtmosphereInput | null): ResolvedAtmosphere {
  if (!input) {
    return {
      palette: VAMO_DEFAULT_PRESET,
      tier: 'system_default',
      isFallback: true,
    };
  }

  // ---------------------------------------------------------------------------
  // Tier 1: Extracted Palette from Hero Photography (Future native extractor interface)
  // ---------------------------------------------------------------------------
  if (input.extractedPalette) {
    const ext = input.extractedPalette;
    if (ext.darkVibrant || ext.dominant || ext.vibrant) {
      const top = ext.darkVibrant || ext.vibrant || ext.dominant || VAMO_DEFAULT_PRESET.top;
      const mid = ext.darkMuted || ext.muted || VAMO_DEFAULT_PRESET.mid;
      const bottom = ext.dominant || VAMO_DEFAULT_PRESET.bottom;
      const glow = ext.vibrant || ext.lightMuted || VAMO_DEFAULT_PRESET.glow;

      return {
        palette: clampPalette({ top, mid, bottom, glow }),
        tier: 'extracted_photo',
        isFallback: false,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Tier 2: Curated City Preset
  // ---------------------------------------------------------------------------
  if (input.city && typeof input.city === 'string' && input.city.trim().length > 0) {
    const cityPreset = findCityPreset(input.city);
    if (cityPreset) {
      return {
        palette: cityPreset,
        tier: 'city_preset',
        matchedKey: cityPreset.name,
        isFallback: false,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Tier 3: Curated Country Preset
  // ---------------------------------------------------------------------------
  if (input.country && typeof input.country === 'string' && input.country.trim().length > 0) {
    const countryPreset = findCountryPreset(input.country);
    if (countryPreset) {
      return {
        palette: countryPreset,
        tier: 'country_preset',
        matchedKey: countryPreset.name,
        isFallback: false,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Tier 4: Deterministic Hashed Fallback (Real Country or City exists but uncatalogued)
  // ---------------------------------------------------------------------------
  const rawFallbackString = (input.country || input.city || '').trim();
  if (rawFallbackString.length > 0) {
    return {
      palette: generateDeterministicPalette(rawFallbackString),
      tier: 'deterministic_fallback',
      matchedKey: rawFallbackString,
      isFallback: true,
    };
  }

  // ---------------------------------------------------------------------------
  // Tier 5: VAMO System Default Atmosphere
  // ---------------------------------------------------------------------------
  return {
    palette: VAMO_DEFAULT_PRESET,
    tier: 'system_default',
    isFallback: true,
  };
}

/**
 * Convenience helper to resolve only the palette stops.
 */
export function resolvePalette(input?: PlaceAtmosphereInput | null): AtmospherePalette {
  return resolveAtmosphere(input).palette;
}
