/**
 * Travel AI — External Maps Navigation Handoff
 *
 * Platform-aware external maps navigation launcher.
 * - iOS: Dispatches to Apple Maps (maps://) with web fallback
 * - Android: Dispatches to Google Maps (geo:) with web fallback
 * - Requires no API keys.
 */

import { Linking, Platform } from 'react-native';

export interface OpenMapsOptions {
  latitude?: number | null;
  longitude?: number | null;
  name?: string;
  formattedAddress?: string;
  fallbackUrl?: string;
}

/**
 * Validates whether latitude and longitude are valid numbers within geographic limits.
 */
export function isValidCoordinate(
  lat?: number | null | string,
  lng?: number | null | string
): lat is number {
  if (lat == null || lng == null) return false;
  const numLat = typeof lat === 'string' ? parseFloat(lat) : lat;
  const numLng = typeof lng === 'string' ? parseFloat(lng) : lng;
  return (
    typeof numLat === 'number' &&
    typeof numLng === 'number' &&
    Number.isFinite(numLat) &&
    Number.isFinite(numLng) &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLng >= -180 &&
    numLng <= 180 &&
    (Math.abs(numLat) > 0.0001 || Math.abs(numLng) > 0.0001) // Null Island exclusion
  );
}

/**
 * Opens the external maps application based on the user's platform.
 * Returns true if a map handler was successfully opened, false otherwise.
 */
export async function openInExternalMaps(options: OpenMapsOptions): Promise<boolean> {
  const { latitude, longitude, name, formattedAddress, fallbackUrl } = options;
  const hasValidCoords = isValidCoordinate(latitude, longitude);

  const query = name
    ? encodeURIComponent(name)
    : formattedAddress
    ? encodeURIComponent(formattedAddress)
    : '';

  // 1. iOS: Apple Maps scheme
  if (Platform.OS === 'ios') {
    let appleSchemeUrl = '';
    if (hasValidCoords) {
      appleSchemeUrl = `maps://?q=${query || 'Location'}&ll=${latitude},${longitude}`;
    } else if (query) {
      appleSchemeUrl = `maps://?q=${query}`;
    }

    if (appleSchemeUrl) {
      try {
        const canOpen = await Linking.canOpenURL(appleSchemeUrl);
        if (canOpen) {
          await Linking.openURL(appleSchemeUrl);
          return true;
        }
      } catch {
        // Fall back to web
      }
    }

    // Web fallback for Apple Maps / Google Maps
    const appleWebUrl = hasValidCoords
      ? `https://maps.apple.com/?q=${query || 'Location'}&ll=${latitude},${longitude}`
      : fallbackUrl || (query ? `https://maps.apple.com/?q=${query}` : '');

    if (appleWebUrl) {
      try {
        await Linking.openURL(appleWebUrl);
        return true;
      } catch {
        // Continue to generic fallback
      }
    }
  }

  // 2. Android: geo URI scheme or Google Maps intent
  if (Platform.OS === 'android') {
    let geoUri = '';
    if (hasValidCoords) {
      geoUri = `geo:${latitude},${longitude}?q=${latitude},${longitude}${query ? `(${query})` : ''}`;
    } else if (query) {
      geoUri = `geo:0,0?q=${query}`;
    }

    if (geoUri) {
      try {
        const canOpen = await Linking.canOpenURL(geoUri);
        if (canOpen) {
          await Linking.openURL(geoUri);
          return true;
        }
      } catch {
        // Fall back to web
      }
    }

    // Web fallback for Google Maps
    const googleWebUrl = hasValidCoords
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : fallbackUrl || (query ? `https://www.google.com/maps/search/?api=1&query=${query}` : '');

    if (googleWebUrl) {
      try {
        await Linking.openURL(googleWebUrl);
        return true;
      } catch {
        // Continue to generic fallback
      }
    }
  }

  // 3. Fallback for Web/other platforms or if native app schemes are unavailable
  const finalFallback =
    fallbackUrl ||
    (hasValidCoords
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : query
      ? `https://www.google.com/maps/search/?api=1&query=${query}`
      : '');

  if (finalFallback) {
    try {
      await Linking.openURL(finalFallback);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
