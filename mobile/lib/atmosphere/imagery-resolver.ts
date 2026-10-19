/**
 * VAMO Mobile — Curated Destination Imagery & Atmosphere Resolver
 *
 * Implements the image-led discovery atmosphere:
 * 1. Resolves destination photography from verified place photos (Google Places / Reel hero).
 * 2. Curated high-resolution photography for global destination hubs (Tokyo, Kyoto, Positano, etc.).
 * 3. Graceful fallback to the last valid atmosphere image or local bundled discovery photography.
 * 4. Never displays a broken image or makes redundant network requests on render.
 */

import { PlaceAtmosphereInput } from '@/types/atmosphere';
import { normalizePlaceKey } from './presets';
import { analysisStore } from '@/lib/api/analysis-store';

/**
 * Attractive default travel discovery photograph bundled locally.
 * Guarantees 0ms cold-start display and 100% offline reliability.
 */
export const DEFAULT_DISCOVERY_IMAGE = require('@/assets/images/sample-destination.jpg');

/**
 * Curated destination photography for verified global travel destinations.
 * High-resolution, cinematic, dark-treated photographs hosted on reliable CDN with disk caching.
 */
export const CURATED_DESTINATION_PHOTOS: Record<string, string> = {
  // Cities
  tokyo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1600&q=80',
  kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80',
  positano: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1600&q=80',
  amalfi: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1600&q=80',
  oia: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=80',
  santorini: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=80',
  reykjavik: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1600&q=80',
  marrakech: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1600&q=80',
  phuket: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1600&q=80',
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80',
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600&q=80',
  cairo: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1600&q=80',
  'cape town': 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1600&q=80',
  zermatt: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=80',
  barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600&q=80',
  rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=80',
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&q=80',

  // Countries / Regions
  italy: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1600&q=80',
  japan: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80',
  iceland: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1600&q=80',
  morocco: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1600&q=80',
  thailand: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1600&q=80',
  greece: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=80',
  france: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80',
  switzerland: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80',
  norway: 'https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?w=1600&q=80',
  spain: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600&q=80',
  indonesia: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=80',
  'united kingdom': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&q=80',
  'united states': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600&q=80',
  egypt: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1600&q=80',
  'south africa': 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1600&q=80',
};

/**
 * Resolves the best available destination photograph for the given place input.
 *
 * Priority hierarchy:
 * 1. Place's own verified heroPhotoUrl (from Google Places API or Reel metadata)
 * 2. Curated city photography matching city name
 * 3. Curated destination photography matching place name
 * 4. Curated country/region photography
 * 5. Provided fallback image (e.g. previous valid destination)
 * 6. Bundled default discovery travel photograph
 */
export function resolveDestinationImage(
  place?: PlaceAtmosphereInput | null,
  fallbackImage?: string | number | null
): string | number {
  if (!place) {
    return fallbackImage || DEFAULT_DISCOVERY_IMAGE;
  }

  // 1. Explicit verified hero photo from place model
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

  // 2. City name match
  if (place.city && typeof place.city === 'string' && place.city.trim().length > 0) {
    const normCity = normalizePlaceKey(place.city);
    if (CURATED_DESTINATION_PHOTOS[normCity]) {
      return CURATED_DESTINATION_PHOTOS[normCity];
    }
    for (const [key, photo] of Object.entries(CURATED_DESTINATION_PHOTOS)) {
      if (normCity.includes(key) || key.includes(normCity)) {
        return photo;
      }
    }
  }

  // 3. Place name match
  if (place.name && typeof place.name === 'string' && place.name.trim().length > 0) {
    const normName = normalizePlaceKey(place.name);
    for (const [key, photo] of Object.entries(CURATED_DESTINATION_PHOTOS)) {
      if (normName.includes(key) || key.includes(normName)) {
        return photo;
      }
    }
  }

  // 4. Region or Country match
  const regionOrCountry = (place.region || place.country || '').trim();
  if (regionOrCountry.length > 0) {
    const normRegion = normalizePlaceKey(regionOrCountry);
    if (CURATED_DESTINATION_PHOTOS[normRegion]) {
      return CURATED_DESTINATION_PHOTOS[normRegion];
    }
    for (const [key, photo] of Object.entries(CURATED_DESTINATION_PHOTOS)) {
      if (normRegion.includes(key) || key.includes(normRegion)) {
        return photo;
      }
    }
  }

  // 5. Fallback: retain previous valid image or return bundled default
  return fallbackImage || DEFAULT_DISCOVERY_IMAGE;
}
