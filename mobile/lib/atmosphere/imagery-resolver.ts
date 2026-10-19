/**
 * VAMO Mobile — Curated Destination Imagery & Atmosphere Resolver
 *
 * Implements the sharp photo-first discovery atmosphere:
 * 1. Resolves destination photography from verified place photos (Google Places / Reel hero).
 * 2. Curated high-resolution photography for global destination hubs (Tokyo, Kyoto, Positano, etc.).
 * 3. Graceful fallback to bundled discovery photography (never empty or dark gradient).
 * 4. Resolves Google Places / photographer attribution for persistent UI display.
 */

import { PlaceAtmosphereInput } from '@/types/atmosphere';
import { normalizePlaceKey } from './presets';
import { analysisStore } from '@/lib/api/analysis-store';
import { BUNDLED_LOCAL_PHOTOS } from './background-manifest';

/**
 * Default travel discovery photograph bundled locally.
 * Guarantees 0ms cold-start display and 100% offline reliability.
 */
export const DEFAULT_DISCOVERY_IMAGE = BUNDLED_LOCAL_PHOTOS[0].source;

/**
 * Curated destination photography for verified global travel destinations.
 * High-resolution, cinematic, sharp photographs hosted on reliable CDN with disk caching.
 */
export const CURATED_DESTINATION_PHOTOS: Record<string, { url: string; photographer: string }> = {
  // Cities
  tokyo: {
    url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1600&q=80',
    photographer: 'Aleksandr Popelier',
  },
  kyoto: {
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80',
    photographer: 'Su San Lee',
  },
  positano: {
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1600&q=80',
    photographer: 'Ricardo Gomez Angel',
  },
  amalfi: {
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1600&q=80',
    photographer: 'Ricardo Gomez Angel',
  },
  oia: {
    url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=80',
    photographer: 'Mathew Schwartz',
  },
  santorini: {
    url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=80',
    photographer: 'Mathew Schwartz',
  },
  reykjavik: {
    url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1600&q=80',
    photographer: 'Davide Cantelli',
  },
  marrakech: {
    url: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1600&q=80',
    photographer: 'Annie Spratt',
  },
  phuket: {
    url: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1600&q=80',
    photographer: 'Bradley Prentice',
  },
  paris: {
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80',
    photographer: 'Chris Karidis',
  },
  'new york': {
    url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600&q=80',
    photographer: 'Patrick Tomasso',
  },
  cairo: {
    url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1600&q=80',
    photographer: 'Spencer Davis',
  },
  'cape town': {
    url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1600&q=80',
    photographer: 'Kimon Maritz',
  },
  zermatt: {
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80',
    photographer: 'Kalvis Petersons',
  },
  bali: {
    url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=80',
    photographer: 'Oliver Sjöström',
  },
  barcelona: {
    url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600&q=80',
    photographer: 'Logan Armstrong',
  },
  rome: {
    url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=80',
    photographer: 'Christopher Czermak',
  },
  london: {
    url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&q=80',
    photographer: 'Eva Dang',
  },

  // Countries / Regions
  italy: {
    url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1600&q=80',
    photographer: 'Ricardo Gomez Angel',
  },
  japan: {
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80',
    photographer: 'Su San Lee',
  },
  iceland: {
    url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1600&q=80',
    photographer: 'Davide Cantelli',
  },
  morocco: {
    url: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1600&q=80',
    photographer: 'Annie Spratt',
  },
  thailand: {
    url: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1600&q=80',
    photographer: 'Bradley Prentice',
  },
  greece: {
    url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=80',
    photographer: 'Mathew Schwartz',
  },
  france: {
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80',
    photographer: 'Chris Karidis',
  },
  switzerland: {
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80',
    photographer: 'Kalvis Petersons',
  },
  norway: {
    url: 'https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?w=1600&q=80',
    photographer: 'Tobias Tullius',
  },
  spain: {
    url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600&q=80',
    photographer: 'Logan Armstrong',
  },
  indonesia: {
    url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=80',
    photographer: 'Oliver Sjöström',
  },
};

/**
 * Resolves the best available destination photograph for the given place input.
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
      return CURATED_DESTINATION_PHOTOS[normCity].url;
    }
    for (const [key, photoObj] of Object.entries(CURATED_DESTINATION_PHOTOS)) {
      if (normCity.includes(key) || key.includes(normCity)) {
        return photoObj.url;
      }
    }
  }

  // 3. Place name match
  if (place.name && typeof place.name === 'string' && place.name.trim().length > 0) {
    const normName = normalizePlaceKey(place.name);
    for (const [key, photoObj] of Object.entries(CURATED_DESTINATION_PHOTOS)) {
      if (normName.includes(key) || key.includes(normName)) {
        return photoObj.url;
      }
    }
  }

  // 4. Region or Country match
  const regionOrCountry = (place.region || place.country || '').trim();
  if (regionOrCountry.length > 0) {
    const normRegion = normalizePlaceKey(regionOrCountry);
    if (CURATED_DESTINATION_PHOTOS[normRegion]) {
      return CURATED_DESTINATION_PHOTOS[normRegion].url;
    }
    for (const [key, photoObj] of Object.entries(CURATED_DESTINATION_PHOTOS)) {
      if (normRegion.includes(key) || key.includes(normRegion)) {
        return photoObj.url;
      }
    }
  }

  // 5. Fallback: retain previous valid image or return bundled default
  return fallbackImage || DEFAULT_DISCOVERY_IMAGE;
}

/**
 * Resolves the author attribution for the active photo (Google Places or curated).
 */
export function resolvePhotoAttribution(
  place?: PlaceAtmosphereInput | null,
  photoAuthor?: string[] | string | null
): string | null {
  if (photoAuthor) {
    if (Array.isArray(photoAuthor)) {
      const joined = photoAuthor.filter(Boolean).join(', ');
      if (joined.trim()) return joined.trim();
    } else if (typeof photoAuthor === 'string' && photoAuthor.trim()) {
      return photoAuthor.trim();
    }
  }

  if (!place) return null;

  const checkKeys = [place.city, place.name, place.region, place.country];
  for (const k of checkKeys) {
    if (k && typeof k === 'string' && k.trim()) {
      const norm = normalizePlaceKey(k);
      for (const [key, photoObj] of Object.entries(CURATED_DESTINATION_PHOTOS)) {
        if (norm.includes(key) || key.includes(norm)) {
          return photoObj.photographer;
        }
      }
    }
  }

  return null;
}
