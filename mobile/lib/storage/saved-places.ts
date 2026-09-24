/**
 * Travel AI — Local Saved Places Storage
 *
 * Lightweight, offline persistence layer for bookmarked destinations and POIs.
 * Uses @react-native-async-storage/async-storage with an in-memory cache and
 * reactive subscriber notification.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BestGuess, NearbyPlace } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';

const STORAGE_KEY = '@travel_ai_saved_places_v1';

export interface SavedPlace {
  id: string;
  name: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  category?: string;
  rating?: number;
  review_count?: number;
  distance?: number | null;
  photo?: string;
  maps_url?: string;
  tags?: string[];
  saved_at: number;
}

export type SaveablePlaceInput =
  | SavedPlace
  | NearbyPlace
  | (BestGuess & { category?: string; distance_km?: number | null });

// In-memory cache for synchronous reads and responsive rendering
let memoryCache: SavedPlace[] = [];
let memoryCacheMap = new Map<string, SavedPlace>();
let isLoaded = false;
let initPromise: Promise<SavedPlace[]> | null = null;
let persistQueue = Promise.resolve();
const listeners = new Set<(places: SavedPlace[]) => void>();

function notifyListeners() {
  memoryCacheMap = new Map(memoryCache.map((p) => [p.id, p]));
  const snapshot = [...memoryCache];
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // Ignore listener error
    }
  });
}

function persistCacheToStorage(): Promise<void> {
  persistQueue = persistQueue.then(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
    } catch {
      // Storage write error tolerated in memory
    }
  });
  return persistQueue;
}

/**
 * Normalizes input place into canonical SavedPlace structure.
 */
export function normalizeToSavedPlace(
  input: SaveablePlaceInput,
  photoOverride?: string
): SavedPlace {
  const isBestGuess = 'why' in input || 'confidence' in input;
  const isNearby = 'distance_km' in input;
  const isExistingSaved = 'saved_at' in input;

  const rawId =
    (input as any).place_id ||
    (input as any).id ||
    input.name;

  const id =
    typeof rawId === 'string' && rawId.trim()
      ? rawId.trim()
      : `place_${Date.now()}`;

  const rawName = input.name;
  const name = typeof rawName === 'string' && rawName.trim() ? rawName.trim() : 'Saved Location';

  const rawAddress =
    (input as any).formatted_address ||
    (input as any).address;
  const address = typeof rawAddress === 'string' ? rawAddress.trim() : '';

  const rawLat = input.latitude;
  const rawLng = input.longitude;
  const latitude = typeof rawLat === 'number' && Number.isFinite(rawLat) ? rawLat : null;
  const longitude = typeof rawLng === 'number' && Number.isFinite(rawLng) ? rawLng : null;

  let category = 'Highlight';
  if (typeof (input as any).category === 'string' && (input as any).category.trim()) {
    category = (input as any).category.trim();
  } else if (isBestGuess) {
    category = 'Primary Destination';
  }

  const rawRating = typeof input.rating === 'number' ? input.rating : typeof (input as any).rating === 'string' ? parseFloat((input as any).rating) : 0;
  const rating = Number.isFinite(rawRating) && rawRating >= 0 ? Math.min(rawRating, 5) : 0;

  const rawReviewCount =
    typeof (input as any).user_ratings_total === 'number'
      ? (input as any).user_ratings_total
      : typeof (input as any).review_count === 'number'
      ? (input as any).review_count
      : 0;
  const reviewCount = Number.isFinite(rawReviewCount) && rawReviewCount >= 0 ? Math.floor(rawReviewCount) : 0;

  const rawDist =
    isNearby && (input as NearbyPlace).distance_km != null
      ? (input as NearbyPlace).distance_km
      : (input as any).distance;
  const distance = typeof rawDist === 'number' && Number.isFinite(rawDist) && rawDist >= 0 ? rawDist : null;

  let photo = photoOverride;
  if (!photo && typeof (input as any).photo === 'string') {
    photo = (input as any).photo;
  } else if (!photo && Array.isArray((input as any).photos) && (input as any).photos[0]?.url) {
    photo = (input as any).photos[0].url;
  }

  const rawMapsUrl = input.maps_url;
  const mapsUrl = typeof rawMapsUrl === 'string' ? rawMapsUrl : '';

  const rawTypes = 'types' in input ? (input as any).types : undefined;
  const tags = Array.isArray(rawTypes)
    ? rawTypes.filter((t): t is string => typeof t === 'string')
    : Array.isArray((input as any).tags)
    ? (input as any).tags.filter((t: any): t is string => typeof t === 'string')
    : [];

  const rawSavedAt = (input as SavedPlace).saved_at;
  const savedAt = isExistingSaved && typeof rawSavedAt === 'number' ? rawSavedAt : Date.now();

  return {
    id,
    name,
    address,
    latitude,
    longitude,
    category,
    rating,
    review_count: reviewCount,
    distance,
    photo,
    maps_url: mapsUrl,
    tags,
    saved_at: savedAt,
  };
}

/**
 * Initializes and hydrates the in-memory cache from AsyncStorage.
 * Resilient against corrupted JSON and invalid schema objects.
 */
export async function initializeSavedStorage(): Promise<SavedPlace[]> {
  if (isLoaded) return memoryCache;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const seenIds = new Set<string>();
            const sanitized: SavedPlace[] = [];
            for (const item of parsed) {
              if (item && typeof item === 'object' && typeof item.id === 'string' && item.id.trim()) {
                const cleanId = item.id.trim();
                if (!seenIds.has(cleanId)) {
                  seenIds.add(cleanId);
                  sanitized.push(normalizeToSavedPlace(item));
                }
              }
            }
            memoryCache = sanitized;
          } else {
            memoryCache = [];
          }
        } catch {
          memoryCache = [];
        }
      }
    } catch {
      memoryCache = [];
    } finally {
      isLoaded = true;
      initPromise = null;
      notifyListeners();
    }
    return memoryCache;
  })();

  return initPromise;
}

// Auto-start hydration
initializeSavedStorage();

/**
 * Returns all saved places asynchronously.
 */
export async function getSavedPlaces(): Promise<SavedPlace[]> {
  await initializeSavedStorage();
  return [...memoryCache];
}

/**
 * Synchronous read of saved places from memory cache.
 */
export function getSavedPlacesSync(): SavedPlace[] {
  return [...memoryCache];
}

/**
 * Synchronous check whether a place ID is saved.
 */
export function isPlaceSavedSync(id: string): boolean {
  if (!id) return false;
  return memoryCacheMap.has(id);
}

/**
 * Synchronous retrieval of a saved place by ID.
 */
export function getSavedPlaceByIdSync(id: string): SavedPlace | null {
  if (!id) return null;
  return memoryCacheMap.get(id) || null;
}

/**
 * Asynchronously checks if a place is saved.
 */
export async function isPlaceSaved(id: string): Promise<boolean> {
  await initializeSavedStorage();
  return isPlaceSavedSync(id);
}

/**
 * Saves a place to local storage. Prevents duplicate IDs.
 */
export async function savePlace(
  place: SaveablePlaceInput,
  photoOverride?: string
): Promise<SavedPlace> {
  await initializeSavedStorage();
  const normalized = normalizeToSavedPlace(place, photoOverride);

  // Check if already saved
  const existingIndex = memoryCache.findIndex((p) => p.id === normalized.id);
  if (existingIndex >= 0) {
    // Already saved: update details without duplicating
    memoryCache[existingIndex] = {
      ...normalized,
      saved_at: memoryCache[existingIndex].saved_at,
    };
  } else {
    // New save: prepend to list
    memoryCache = [normalized, ...memoryCache];
  }

  persistCacheToStorage();
  notifyListeners();
  hapticFeedback.selection();
  return normalized;
}

/**
 * Removes a place from saved storage by ID.
 */
export async function removeSavedPlace(id: string): Promise<void> {
  await initializeSavedStorage();
  const initialLength = memoryCache.length;
  memoryCache = memoryCache.filter((p) => p.id !== id);

  if (memoryCache.length !== initialLength) {
    persistCacheToStorage();
    notifyListeners();
    hapticFeedback.light();
  }
}

/**
 * Toggles saved state. Returns true if now saved, false if removed.
 */
export async function toggleSavedPlace(
  place: SaveablePlaceInput,
  photoOverride?: string
): Promise<boolean> {
  await initializeSavedStorage();
  const normalized = normalizeToSavedPlace(place, photoOverride);

  if (isPlaceSavedSync(normalized.id)) {
    await removeSavedPlace(normalized.id);
    return false;
  } else {
    await savePlace(normalized, photoOverride);
    return true;
  }
}

/**
 * Subscribes to storage changes.
 */
export function subscribeToSavedPlaces(
  listener: (places: SavedPlace[]) => void
): () => void {
  listeners.add(listener);
  // Initial emit if loaded
  if (isLoaded) {
    listener([...memoryCache]);
  }
  return () => {
    listeners.delete(listener);
  };
}

/**
 * React hook for consuming and updating saved places with live synchronization.
 */
export function useSavedPlaces() {
  const [places, setPlaces] = useState<SavedPlace[]>(() => getSavedPlacesSync());
  const [loading, setLoading] = useState(!isLoaded);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = subscribeToSavedPlaces((updated) => {
      if (mounted) {
        setPlaces(updated);
        setLoading(false);
      }
    });

    if (!isLoaded) {
      initializeSavedStorage().then((data) => {
        if (mounted) {
          setPlaces(data);
          setLoading(false);
        }
      });
    }

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const savedIdsSet = useMemo(() => new Set(places.map((p) => p.id)), [places]);

  const isSaved = useCallback(
    (id?: string | null): boolean => {
      if (!id) return false;
      return savedIdsSet.has(id);
    },
    [savedIdsSet]
  );

  const handleToggle = useCallback(
    async (place: SaveablePlaceInput, photoUrl?: string): Promise<boolean> => {
      return await toggleSavedPlace(place, photoUrl);
    },
    []
  );

  const handleRemove = useCallback(async (id: string): Promise<void> => {
    await removeSavedPlace(id);
  }, []);

  return {
    savedPlaces: places,
    savedCount: places.length,
    isLoading: loading,
    isSaved,
    toggleSave: handleToggle,
    removeSave: handleRemove,
  };
}
