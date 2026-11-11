/**
 * Travel AI Mobile Utility Functions
 */

export const INSTAGRAM_REEL_OR_POST_REGEX =
  /^https?:\/\/(?:www\.|m\.)?instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i;

export interface ReelValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
}

/**
 * Extracts the first Instagram URL from arbitrary text (reel, reels, p, share forms),
 * strips tracking parameters (igsh, utm_*), collapses whitespace, and caps length at 300 chars.
 * Returns null if no matching Instagram URL is found.
 */
export function extractInstagramUrl(rawText: string): string | null {
  if (!rawText || typeof rawText !== 'string') return null;

  // Collapse whitespace
  const collapsed = rawText.replace(/\s+/g, ' ').trim();
  if (!collapsed) return null;

  // Match first Instagram URL (reel, reels, p, share forms)
  const match = collapsed.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\/(?:reel|reels|p|share(?:\/(?:reel|p))?)\/([A-Za-z0-9_-]+)(?:\/[^\s]*)?/i
  );

  if (!match) return null;

  let url = match[0].trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Strip tracking parameters (?igsh=..., utm_*, etc.) and hash fragments
  url = url.split('?')[0].split('#')[0];

  // Ensure trailing slash
  if (!url.endsWith('/')) {
    url = `${url}/`;
  }

  // Cap at 300 characters
  if (url.length > 300) {
    url = url.slice(0, 300);
  }

  return url;
}

export function validateReelUrl(url: string): ReelValidationResult {
  let trimmed = (url || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Paste an Instagram link first.' };
  }

  // Auto-prepend https:// if user pasted without protocol
  if (/^(?:www\.|m\.)?instagram\.com/i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  // Handle /share/ links
  if (/instagram\.com\/share(?:\/|$)/i.test(trimmed)) {
    return {
      isValid: false,
      error: 'Instagram share links (instagram.com/share/...) are not supported. Please open the post in Instagram and copy the direct Reel or Post link.',
    };
  }

  // Handle stories or tv
  if (/instagram\.com\/(?:stories|tv)\//i.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please provide an Instagram Reel or Post link, not a story or TV link.',
    };
  }

  // Handle profile links
  if (
    /instagram\.com\/[A-Za-z0-9_.-]+\/?$/i.test(trimmed) &&
    !/instagram\.com\/(?:reel|reels|p)\//i.test(trimmed)
  ) {
    return {
      isValid: false,
      error: 'Please provide a direct Reel or Post link, not a user profile.',
    };
  }

  if (!INSTAGRAM_REEL_OR_POST_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Enter a valid public Instagram Reel or Post URL.' };
  }

  // Strip tracking params and trailing query
  const cleanUrl = trimmed.split('?')[0].split('#')[0];
  const normalized = cleanUrl.endsWith('/') ? cleanUrl : `${cleanUrl}/`;

  return { isValid: true, normalizedUrl: normalized };
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
