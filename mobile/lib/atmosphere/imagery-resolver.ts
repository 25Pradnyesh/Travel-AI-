/**
 * VAMO Mobile — Curated Destination Imagery & Atmosphere Resolver
 *
 * Implements the sharp photo-first discovery atmosphere:
 * 1. Resolves destination photography from verified remote place photos (Google Places / Reel hero).
 * 2. If no remote photo exists, matches against bundled manifest photography (free, offline).
 * 3. Fallback to bundled discovery photography.
 * 4. Resolves photographer attribution ONLY for remote photos requiring attribution.
 *    Bundled/default photos NEVER show a credit pill.
 */

import { PlaceAtmosphereInput } from '@/types/atmosphere';
import { analysisStore } from '@/lib/api/analysis-store';
import {
  BUNDLED_BACKGROUNDS,
  findBundledBackgroundForPlace,
} from './background-manifest';

/**
 * Default travel discovery photograph bundled locally.
 * Guarantees 0ms cold-start display and 100% offline reliability.
 */
export const DEFAULT_DISCOVERY_IMAGE = BUNDLED_BACKGROUNDS[0].source;

/**
 * Resolves the best available destination photograph for the given place input.
 * Priority:
 * 1. Verified remote hero photo (from Google Places or Reel analysis)
 * 2. Bundled photo matching manifest.place (city, else country/region) - free, offline
 * 3. Fallback image or default bundled image
 */
export function resolveDestinationImage(
  place?: PlaceAtmosphereInput | null,
  fallbackImage?: string | number | null
): string | number | null {
  if (!place) {
    return fallbackImage || DEFAULT_DISCOVERY_IMAGE;
  }

  // 1. Explicit verified hero photo from place model (remote)
  if (
    place.heroPhotoUrl &&
    typeof place.heroPhotoUrl === 'string' &&
    place.heroPhotoUrl.trim().length > 0
  ) {
    const resolved = analysisStore.resolvePhotoUrl(place.heroPhotoUrl);
    if (resolved && resolved.trim().length > 0) {
      return resolved;
    }
  }

  // 2. Offline bundled photo matching manifest.place (city, landmark, region, or country)
  const matchedBundled = findBundledBackgroundForPlace(place);
  if (matchedBundled) {
    return matchedBundled.source;
  }

  // 3. Fallback: on a destination screen, return ONLY null so a place-tinted gradient is rendered.
  // Never show another place's photo or a random discovery image!
  return null;
}


/**
 * Resolves author attribution for active photo.
 * RULE: Bundled/default photos show NO credit pill anywhere.
 * Credit pills appear ONLY for remote photos whose license requires attribution.
 */
export function resolvePhotoAttribution(
  place?: PlaceAtmosphereInput | null,
  photoAuthor?: string[] | string | null
): string | null {
  // Bundled photos never have attribution
  if (!place || !place.heroPhotoUrl) {
    return null;
  }

  if (photoAuthor) {
    if (Array.isArray(photoAuthor)) {
      const joined = photoAuthor.filter(Boolean).join(', ');
      if (joined.trim()) return joined.trim();
    } else if (typeof photoAuthor === 'string' && photoAuthor.trim()) {
      return photoAuthor.trim();
    }
  }

  return null;
}
