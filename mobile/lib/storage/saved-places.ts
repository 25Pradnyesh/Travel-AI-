/**
 * Travel AI — Local Saved Places Storage
 *
 * Lightweight, offline persistence layer for bookmarked destinations and POIs.
 * Uses @react-native-async-storage/async-storage with an in-memory cache and
 * reactive subscriber notification.
 */

import { useEffect, useState } from 'react';
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
let isLoaded = false;
let initPromise: Promise<SavedPlace[]> | null = null;
const listeners = new Set<(places: SavedPlace[]) => void>();

function notifyListeners() {
  const snapshot = [...memoryCache];
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // Ignore listener error
    }
  });
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

  const id =
    (input as any).place_id ||
    (input as any).id ||
    input.name ||
    `place_${Date.now()}`;

  const name = input.name || 'Unnamed Place';

  const address =
    (input as any).formatted_address ||
    (input as any).address ||
    '';

  const latitude = input.latitude ?? null;
  const longitude = input.longitude ?? null;

  let category = 'Highlight';
  if ((input as any).category) {
    category = (input as any).category;
  } else if (isBestGuess) {
    category = 'Primary Destination';
  }

  const rating = typeof input.rating === 'number' ? input.rating : 0;
  const reviewCount =
    typeof (input as any).user_ratings_total === 'number'
      ? (input as any).user_ratings_total
      : typeof (input as any).review_count === 'number'
      ? (input as any).review_count
      : 0;

  const distance =
    isNearby && (input as NearbyPlace).distance_km != null
      ? (input as NearbyPlace).distance_km
      : (input as any).distance ?? null;

  let photo = photoOverride;
  if (!photo && (input as any).photo) {
    photo = (input as any).photo;
  } else if (!photo && (input as any).photos?.[0]?.url) {
    photo = (input as any).photos[0].url;
  }

  const mapsUrl = input.maps_url || '';
  const rawTypes = 'types' in input ? (input as any).types : undefined;
  const tags = Array.isArray(rawTypes) ? rawTypes : (input as any).tags || [];

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
    saved_at: isExistingSaved ? (input as SavedPlace).saved_at : Date.now(),
  };
}

/**
 * Initializes and hydrates the in-memory cache from AsyncStorage.
 */
export async function initializeSavedStorage(): Promise<SavedPlace[]> {
  if (isLoaded) return memoryCache;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          memoryCache = parsed;
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
  return memoryCache.some((p) => p.id === id);
}

/**
 * Synchronous retrieval of a saved place by ID.
 */
export function getSavedPlaceByIdSync(id: string): SavedPlace | null {
  if (!id) return null;
  return memoryCache.find((p) => p.id === id) || null;
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

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
  } catch {
    // Persistence error tolerated in memory
  }

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
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
    } catch {
      // Persistence error tolerated
    }
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

    initializeSavedStorage().then((data) => {
      if (mounted) {
        setPlaces(data);
        setLoading(false);
      }
    });

    const unsubscribe = subscribeToSavedPlaces((updated) => {
      if (mounted) {
        setPlaces(updated);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const isSaved = (id?: string | null): boolean => {
    if (!id) return false;
    return places.some((p) => p.id === id);
  };

  const handleToggle = async (
    place: SaveablePlaceInput,
    photoUrl?: string
  ): Promise<boolean> => {
    return await toggleSavedPlace(place, photoUrl);
  };

  const handleRemove = async (id: string): Promise<void> => {
    await removeSavedPlace(id);
  };

  return {
    savedPlaces: places,
    savedCount: places.length,
    isLoading: loading,
    isSaved,
    toggleSave: handleToggle,
    removeSave: handleRemove,
  };
}
