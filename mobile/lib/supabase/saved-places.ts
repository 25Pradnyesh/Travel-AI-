/**
 * Travel AI Mobile — Supabase Cloud Saved Places Repository (Stage 6)
 *
 * Implements cloud persistence for user bookmarked places and destinations
 * using the `public.saved_places` table and authenticated Supabase session.
 *
 * Key Principles:
 * 1. Strict Tenant Isolation: All database operations use `auth.uid() = user_id`.
 * 2. Unauthenticated Safety: Guests make zero cloud writes.
 * 3. In-Memory Pending Action: If a guest taps Save, the action is held in memory,
 *    authentication is requested, and the save resumes upon sign-in without rerunning the Reel.
 * 4. Duplicate Prevention: Enforces uniqueness on (user_id, place_id) in accordance
 *    with database constraint `saved_places_user_place_unique`.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database, SavedPlaceInsert, SavedPlaceRow } from './types';
import { supabase as defaultSupabaseClient, isSupabaseConfigured } from './client';
import { BestGuess, NearbyPlace } from '@/types/analysis';
import { formatRating, resolveThumbnailUrl } from './history';

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

/**
 * Result returned by cloud saved places operations.
 */
export type SavePlaceResult =
  | { status: 'saved'; place: SavedPlaceRow }
  | { status: 'removed'; placeId: string }
  | { status: 'skipped_guest'; reason: string }
  | { status: 'error'; message: string };

/**
 * Pending action structure for guest saves awaiting authentication.
 */
export interface PendingSaveAction {
  type: 'save_place';
  place: SaveablePlaceInput;
  photoUrl?: string;
  timestamp: number;
}

// In-memory pending save action for guest resumption
let pendingSaveAction: PendingSaveAction | null = null;
const PENDING_ACTION_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Sets a pending save action for guest users who tap Save before signing in.
 */
export function setPendingSaveAction(place: SaveablePlaceInput, photoUrl?: string): void {
  pendingSaveAction = {
    type: 'save_place',
    place,
    photoUrl,
    timestamp: Date.now(),
  };
}

/**
 * Gets the active pending save action if it has not expired.
 */
export function getPendingSaveAction(): PendingSaveAction | null {
  if (!pendingSaveAction) return null;
  if (Date.now() - pendingSaveAction.timestamp > PENDING_ACTION_EXPIRY_MS) {
    pendingSaveAction = null;
    return null;
  }
  return pendingSaveAction;
}

/**
 * Clears the active pending save action (on cancel, completion, or error).
 */
export function clearPendingSaveAction(): void {
  pendingSaveAction = null;
}

/**
 * Maps any SaveablePlaceInput into a canonical public.saved_places Insert payload.
 */
export function mapPlaceToSavedPlaceInsert(
  input: SaveablePlaceInput,
  userId: string,
  photoOverride?: string
): SavedPlaceInsert {
  const isBestGuess = 'why' in input || 'confidence' in input;
  const rawId = (input as any).place_id || (input as any).id || input.name;
  const placeId = typeof rawId === 'string' && rawId.trim() ? rawId.trim() : `place_${Date.now()}`;

  const rawName = input.name;
  const name = typeof rawName === 'string' && rawName.trim() ? rawName.trim() : 'Saved Location';

  const rawAddress = (input as any).formatted_address || (input as any).address;
  const address = typeof rawAddress === 'string' && rawAddress.trim() ? rawAddress.trim() : null;

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

  let photo = photoOverride;
  if (!photo && typeof (input as any).photo === 'string') {
    photo = (input as any).photo;
  } else if (!photo && Array.isArray((input as any).photos) && (input as any).photos[0]?.url) {
    photo = (input as any).photos[0].url;
  }
  const photoUrl = resolveThumbnailUrl(photo);

  return {
    user_id: userId,
    place_id: placeId,
    name,
    address,
    latitude,
    longitude,
    rating: formatRating(input.rating),
    category,
    photo_url: photoUrl,
  };
}

/**
 * Maps a public.saved_places database row to the UI SavedPlace model.
 */
export function mapSavedPlaceRowToModel(row: SavedPlaceRow): SavedPlace {
  return {
    id: row.place_id,
    name: row.name,
    address: row.address || undefined,
    latitude: row.latitude,
    longitude: row.longitude,
    category: row.category || 'Saved Place',
    rating: typeof row.rating === 'number' ? row.rating : Number(row.rating) || 0,
    review_count: 0,
    distance: null,
    photo: row.photo_url || undefined,
    maps_url: undefined,
    tags: row.category ? [row.category] : [],
    saved_at: new Date(row.created_at).getTime(),
  };
}

/**
 * Retrieves all saved places for the authenticated user from Supabase.
 */
export async function getCloudSavedPlaces(
  client?: SupabaseClient<Database>
): Promise<{ data: SavedPlaceRow[] | null; error: string | null }> {
  const activeClient = client || defaultSupabaseClient;

  if (!client && !isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  try {
    const {
      data: { session },
    } = await activeClient.auth.getSession();

    if (!session?.user?.id) {
      return { data: null, error: 'User is not authenticated.' };
    }

    const { data, error } = await activeClient
      .from('saved_places')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch saved places.';
    return { data: null, error: msg };
  }
}

/**
 * Saves a place to the authenticated user's cloud saved places in Supabase.
 * Respects unique constraint on (user_id, place_id) to prevent duplicate records.
 */
export async function saveCloudPlace(
  place: SaveablePlaceInput,
  photoUrl?: string,
  client?: SupabaseClient<Database>
): Promise<{ data: SavedPlaceRow | null; error: string | null }> {
  const activeClient = client || defaultSupabaseClient;

  if (!client && !isSupabaseConfigured()) {
    return { data: null, error: 'Supabase is not configured.' };
  }

  try {
    const {
      data: { session },
    } = await activeClient.auth.getSession();

    if (!session?.user?.id) {
      return { data: null, error: 'User is not authenticated.' };
    }

    const insertPayload = mapPlaceToSavedPlaceInsert(place, session.user.id, photoUrl);

    // Insert or update on conflict (user_id, place_id)
    const { data, error } = await activeClient
      .from('saved_places')
      .upsert(insertPayload, { onConflict: 'user_id,place_id' })
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save place to cloud.';
    return { data: null, error: msg };
  }
}

/**
 * Removes a place from the authenticated user's cloud saved places by place_id.
 */
export async function removeCloudPlace(
  placeId: string,
  client?: SupabaseClient<Database>
): Promise<{ success: boolean; error: string | null }> {
  const activeClient = client || defaultSupabaseClient;

  if (!client && !isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const {
      data: { session },
    } = await activeClient.auth.getSession();

    if (!session?.user?.id) {
      return { success: false, error: 'User is not authenticated.' };
    }

    const { error } = await activeClient
      .from('saved_places')
      .delete()
      .eq('place_id', placeId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to remove saved place.';
    return { success: false, error: msg };
  }
}

/**
 * Executes a pending guest save action once authentication has completed.
 * Does not rerun the Reel analysis.
 */
export async function executePendingSaveAction(
  client?: SupabaseClient<Database>
): Promise<{ executed: boolean; place?: SavedPlaceRow; error?: string }> {
  const pending = getPendingSaveAction();
  if (!pending) {
    return { executed: false };
  }

  try {
    const result = await saveCloudPlace(pending.place, pending.photoUrl, client);
    clearPendingSaveAction();

    if (result.error) {
      return { executed: false, error: result.error };
    }

    return { executed: true, place: result.data || undefined };
  } catch (err: unknown) {
    clearPendingSaveAction();
    const msg = err instanceof Error ? err.message : 'Failed to execute pending save.';
    return { executed: false, error: msg };
  }
}
