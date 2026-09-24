/**
 * Travel AI Mobile Utility Functions
 */

export const INSTAGRAM_REEL_REGEX =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels)\/([A-Za-z0-9_-]+)/i;

export function validateReelUrl(url: string): { isValid: boolean; error?: string } {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Paste an Instagram Reel URL first.' };
  }
  if (!INSTAGRAM_REEL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid public Instagram Reel URL.' };
  }
  return { isValid: true };
}

export function formatDistance(distanceKm?: number | null): string | null {
  if (distanceKm == null || isNaN(distanceKm) || distanceKm < 0) return null;
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export function formatCoordinates(lat?: number | null, lng?: number | null): string | null {
  if (lat == null || lng == null) return null;
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}
