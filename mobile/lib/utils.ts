/**
 * Travel AI Mobile Utility Functions
 */

export const INSTAGRAM_REEL_REGEX =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels)\/([A-Za-z0-9_-]+)/i;

export interface ReelValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
}

export function validateReelUrl(url: string): ReelValidationResult {
  let trimmed = (url || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Paste an Instagram Reel URL first.' };
  }

  // Auto-prepend https:// if user pasted without protocol
  if (/^(?:www\.)?instagram\.com/i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  if (!INSTAGRAM_REEL_REGEX.test(trimmed)) {
    if (/instagram\.com\/(?:p|stories|tv)\//i.test(trimmed)) {
      return {
        isValid: false,
        error: 'Please provide an Instagram Reel link, not a photo post or story.',
      };
    }
    if (
      /instagram\.com\/[A-Za-z0-9_.-]+\/?$/i.test(trimmed) &&
      !/instagram\.com\/(?:reel|reels)/i.test(trimmed)
    ) {
      return {
        isValid: false,
        error: 'Please provide a direct Reel link, not a user profile.',
      };
    }
    return { isValid: false, error: 'Enter a valid public Instagram Reel URL.' };
  }

  return { isValid: true, normalizedUrl: trimmed };
}

export function formatDistance(distanceKm?: number | null | string): string | null {
  if (distanceKm == null) return null;
  const num = typeof distanceKm === 'string' ? parseFloat(distanceKm) : distanceKm;
  if (!Number.isFinite(num) || num < 0) return null;
  if (num < 1) {
    return `${Math.round(num * 1000)} m`;
  }
  return `${num.toFixed(1)} km`;
}

export function formatCoordinates(
  lat?: number | null | string,
  lng?: number | null | string
): string | null {
  if (lat == null || lng == null) return null;
  const numLat = typeof lat === 'string' ? parseFloat(lat) : lat;
  const numLng = typeof lng === 'string' ? parseFloat(lng) : lng;
  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return null;
  if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) return null;
  if (Math.abs(numLat) < 0.0001 && Math.abs(numLng) < 0.0001) return null;

  const latDir = numLat >= 0 ? 'N' : 'S';
  const lngDir = numLng >= 0 ? 'E' : 'W';
  return `${Math.abs(numLat).toFixed(4)}° ${latDir}, ${Math.abs(numLng).toFixed(4)}° ${lngDir}`;
}
