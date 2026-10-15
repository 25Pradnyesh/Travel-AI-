/**
 * Travel AI Mobile — Cloud Analysis History Service (Stage 5)
 *
 * Implements cloud persistence for successful Reel analyses using the existing
 * Supabase client and authenticated mobile session.
 *
 * Key Design Principles:
 * 1. Strict Tenant Isolation: Only saves when a verified Supabase session exists.
 *    User ID is retrieved directly from the verified session; client-supplied IDs are never trusted.
 * 2. Guest Preservation: Guests analyze Reels normally with zero cloud writes.
 * 3. Ephemeral Media Rule: Never stores raw video, audio, or frame binaries in Supabase.
 *    Only structured intelligence and resolved place metadata are persisted.
 * 4. Resilient & Non-blocking: Reel analysis never appears to fail if cloud persistence errors.
 * 5. Parent-Child RLS Compliance: Inserts the parent `analyses` record first, then associated
 *    `analysis_places` referencing the parent ID.
 * 6. Partial Failure Safety: If child place insertion fails, attempts safe cleanup of the
 *    orphaned parent analysis under RLS to prevent corrupt/partial state.
 * 7. Duplicate Prevention: Deduplicates accidental repeated callbacks or component re-renders.
 * 8. Future History Screen Preparation: Exports query and mutation contracts for the data layer.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  AnalysisInsert,
  AnalysisPlaceInsert,
  AnalysisPlaceRow,
  AnalysisRow,
  Database,
  Json,
} from './types';
import { supabase as defaultSupabaseClient, isSupabaseConfigured } from './client';
import { AnalysisResponse, NearbyPlace } from '@/types/analysis';
import { Config } from '@/constants/config';

/**
 * Result outcome of a cloud history persistence operation.
 */
export type SaveHistoryResult =
  | { status: 'saved'; analysisId: string; placesCount: number }
  | { status: 'skipped_guest'; reason: string }
  | { status: 'skipped_unconfigured'; reason: string }
  | { status: 'skipped_duplicate'; reason: string }
  | { status: 'skipped_invalid'; reason: string }
  | { status: 'error'; message: string; partialPlacesFailed?: boolean };

/**
 * Composite model for an analysis record alongside its resolved places.
 */
export interface AnalysisDetail {
  analysis: AnalysisRow;
  places: AnalysisPlaceRow[];
}

/**
 * Query options for paginated user analysis history.
 */
export interface GetUserAnalysesOptions {
  limit?: number;
  offset?: number;
}

// ==============================================================================
// In-Memory Duplicate Prevention State
// ==============================================================================

// WeakSet tracking response object references already persisted
let savedResponsesWeakSet = new WeakSet<AnalysisResponse>();

// Cooldown tracker for (user_id + ':' + reel_url) to debounce rapid re-renders (10 seconds)
const recentSavesMap = new Map<string, number>();
const RECENT_SAVE_COOLDOWN_MS = 10000;

// Active in-flight save promises to coalesce simultaneous invocations
const inFlightSaves = new Map<string, Promise<SaveHistoryResult>>();

/**
 * Resets duplicate prevention caches. Primary use: unit test isolation.
 */
export function resetHistorySaveGuards(): void {
  savedResponsesWeakSet = new WeakSet<AnalysisResponse>();
  recentSavesMap.clear();
  inFlightSaves.clear();
}

// ==============================================================================
// Data Mapping & Normalization Utilities
// ==============================================================================

/**
 * Extracts the Instagram Reel shortcode from a Reel URL.
 * Handles formats: /reel/CODE/, /reels/CODE/, with or without trailing slash or query params.
 */
export function extractReelId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.trim().match(/(?:reel|reels)\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
}

/**
 * Normalizes a photo URL. If relative proxy path (starts with '/'), prepends API base URL.
 */
export function resolveThumbnailUrl(photoUrl?: string | null): string | null {
  if (!photoUrl) return null;
  const trimmed = photoUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    const baseUrl = (Config.API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');
    return baseUrl ? `${baseUrl}${trimmed}` : trimmed;
  }

  return trimmed;
}

/**
 * Clamps confidence score to an integer between 0 and 100 per database CHECK constraint.
 */
export function clampConfidence(confidence?: number | null): number | null {
  if (confidence == null || isNaN(confidence)) return null;
  return Math.max(0, Math.min(100, Math.round(confidence)));
}

/**
 * Clamps place star rating between 0.00 and 5.00 rounded to 2 decimal places per NUMERIC(3, 2).
 */
export function formatRating(rating?: number | null): number | null {
  if (rating == null || isNaN(rating)) return null;
  const clamped = Math.max(0, Math.min(5, rating));
  return parseFloat(clamped.toFixed(2));
}

/**
 * Maps an AnalysisResponse to a typed public.analyses Insert record.
 * Guarantees no video, audio, or frame media is stored.
 */
export function mapAnalysisToRow(
  response: AnalysisResponse,
  reelUrl: string,
  userId: string
): AnalysisInsert {
  const bg = response.best_guess;
  const destination = (bg?.name || bg?.formatted_address || 'Unknown Destination').trim();
  const country = bg?.country?.trim() || null;
  const confidence = clampConfidence(bg?.confidence);
  const rawThumbnail = bg?.photos?.[0]?.url;
  const thumbnailUrl = resolveThumbnailUrl(rawThumbnail);

  // Preserve structured travel intelligence JSON, omitting undefined values
  const travelIntelligence = (response.travel_intelligence || {}) as Json;

  return {
    user_id: userId,
    reel_url: reelUrl.trim(),
    reel_id: extractReelId(reelUrl),
    thumbnail_url: thumbnailUrl,
    destination,
    country,
    confidence,
    travel_intelligence: travelIntelligence,
  };
}

/**
 * Maps primary destination (best_guess) and surrounding points of interest (nearby_places)
 * to public.analysis_places Insert records linked to the given parent analysis_id.
 * Deduplicates identical place IDs within the analysis run.
 */
export function mapPlacesToRows(
  response: AnalysisResponse,
  analysisId: string
): AnalysisPlaceInsert[] {
  const places: AnalysisPlaceInsert[] = [];
  const seenPlaceIds = new Set<string>();

  // 1. Primary Destination (best_guess)
  const bg = response.best_guess;
  if (bg && bg.name) {
    const bgPlaceId = (bg.place_id || 'primary_destination').trim();
    seenPlaceIds.add(bgPlaceId);

    places.push({
      analysis_id: analysisId,
      place_id: bgPlaceId,
      name: bg.name.trim(),
      address: bg.formatted_address?.trim() || null,
      latitude: typeof bg.latitude === 'number' && Number.isFinite(bg.latitude) ? bg.latitude : null,
      longitude:
        typeof bg.longitude === 'number' && Number.isFinite(bg.longitude) ? bg.longitude : null,
      rating: formatRating(bg.rating),
      category: bg.types?.[0] || 'Primary Destination',
      photo_url: resolveThumbnailUrl(bg.photos?.[0]?.url),
    });
  }

  // 2. Surrounding Points of Interest (nearby_places)
  if (Array.isArray(response.nearby_places)) {
    response.nearby_places.forEach((p: NearbyPlace, index: number) => {
      if (!p || !p.name) return;
      const pid = (p.place_id || `place_${index + 1}`).trim();
      if (seenPlaceIds.has(pid)) return; // Prevent duplicate place_id in same analysis
      seenPlaceIds.add(pid);

      let photo: string | undefined;
      const anyP = p as unknown as { photos?: Array<{ url?: string }>; photo?: string };
      if (Array.isArray(anyP.photos) && anyP.photos[0]?.url) {
        photo = anyP.photos[0].url;
      } else if (typeof anyP.photo === 'string') {
        photo = anyP.photo;
      }

      places.push({
        analysis_id: analysisId,
        place_id: pid,
        name: p.name.trim(),
        address: p.formatted_address?.trim() || null,
        latitude: typeof p.latitude === 'number' && Number.isFinite(p.latitude) ? p.latitude : null,
        longitude:
          typeof p.longitude === 'number' && Number.isFinite(p.longitude) ? p.longitude : null,
        rating: formatRating(p.rating),
        category: p.category || (Array.isArray(p.types) ? p.types[0] : null) || 'Attraction',
        photo_url: resolveThumbnailUrl(photo),
      });
    });
  }

  return places;
}

// ==============================================================================
// Cloud History Persistence Service
// ==============================================================================

/**
 * Saves a successful Reel analysis and its discovered places to Supabase cloud history.
 *
 * Rules:
 * - Persists ONLY when an authenticated user session is active (retrieved via `supabase.auth.getSession()`).
 * - Guest analyses immediately return `{ status: 'skipped_guest' }` without any cloud operations.
 * - Accidental duplicate saves from component re-renders or rapid duplicate callbacks are debounced.
 * - Non-blocking: returns structured result; failures never throw to disrupt the user's active view.
 * - On place persistence failure after parent insertion, cleans up the orphaned parent under RLS.
 */
export async function saveAnalysisToCloudHistory(
  response: AnalysisResponse,
  reelUrl: string,
  client?: SupabaseClient<Database>
): Promise<SaveHistoryResult> {
  const activeClient = client || defaultSupabaseClient;

  // 1. Guard against unconfigured Supabase environment
  if (!client && !isSupabaseConfigured()) {
    return {
      status: 'skipped_unconfigured',
      reason: 'Supabase credentials are not configured in this environment.',
    };
  }

  // 2. Validate analysis response structure
  if (!response || !response.success || !response.best_guess?.name) {
    return {
      status: 'skipped_invalid',
      reason: 'Analysis response is incomplete or has no verified destination.',
    };
  }

  // 3. Authenticated session verification: Obtain user ID directly from verified session
  try {
    const {
      data: { session },
      error: sessionError,
    } = await activeClient.auth.getSession();

    if (sessionError || !session?.user?.id) {
      return {
        status: 'skipped_guest',
        reason: 'Guest mode active. Cloud history persistence skipped.',
      };
    }

    const verifiedUserId = session.user.id;
    const normalizedUrl = reelUrl.trim();
    const saveKey = `${verifiedUserId}:${normalizedUrl}`;

    // 4. Duplicate Save Prevention
    if (savedResponsesWeakSet.has(response)) {
      return {
        status: 'skipped_duplicate',
        reason: 'This analysis response has already been persisted to cloud history.',
      };
    }

    const lastSavedTime = recentSavesMap.get(saveKey);
    const now = Date.now();
    if (lastSavedTime && now - lastSavedTime < RECENT_SAVE_COOLDOWN_MS) {
      return {
        status: 'skipped_duplicate',
        reason: 'Analysis was recently saved to cloud history. Coalescing duplicate callback.',
      };
    }

    // Coalesce in-flight execution if a save for the same user and URL is already progressing
    const existingInFlight = inFlightSaves.get(saveKey);
    if (existingInFlight) {
      return await existingInFlight;
    }

    // Execute save operation wrapped in concurrency tracking
    const savePromise = (async (): Promise<SaveHistoryResult> => {
      try {
        // Step A: Insert parent analysis record
        const analysisData = mapAnalysisToRow(response, normalizedUrl, verifiedUserId);

        const { data: insertedAnalysis, error: analysisError } = await activeClient
          .from('analyses')
          .insert(analysisData)
          .select('id, user_id, destination, created_at')
          .single();

        if (analysisError || !insertedAnalysis) {
          const msg = analysisError?.message || 'Failed to insert parent analysis record.';
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.warn('[Travel AI Cloud History] Analysis insert failed:', msg);
          }
          return { status: 'error', message: msg };
        }

        const analysisId = insertedAnalysis.id;

        // Step B: Map and insert associated places (best_guess + nearby_places)
        const placeRows = mapPlacesToRows(response, analysisId);

        if (placeRows.length > 0) {
          const { error: placesError } = await activeClient
            .from('analysis_places')
            .insert(placeRows);

          if (placesError) {
            if (__DEV__) {
              // eslint-disable-next-line no-console
              console.warn(
                '[Travel AI Cloud History] Places insert failed. Initiating parent cleanup:',
                placesError.message
              );
            }

            // Safe cleanup: Delete orphaned parent analysis record to prevent partial/misleading state
            try {
              await activeClient.from('analyses').delete().eq('id', analysisId);
            } catch (cleanupErr) {
              if (__DEV__) {
                // eslint-disable-next-line no-console
                console.warn(
                  '[Travel AI Cloud History] Orphaned analysis cleanup failed:',
                  cleanupErr
                );
              }
            }

            return {
              status: 'error',
              message: `Failed to persist analysis places: ${placesError.message}`,
              partialPlacesFailed: true,
            };
          }
        }

        // Mark as saved in duplicate guards
        savedResponsesWeakSet.add(response);
        recentSavesMap.set(saveKey, Date.now());

        return {
          status: 'saved',
          analysisId,
          placesCount: placeRows.length,
        };
      } catch (innerErr: unknown) {
        const errorMsg =
          innerErr instanceof Error ? innerErr.message : 'Unexpected cloud history save error.';
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[Travel AI Cloud History] Unexpected persistence exception:', errorMsg);
        }
        return { status: 'error', message: errorMsg };
      } finally {
        inFlightSaves.delete(saveKey);
      }
    })();

    inFlightSaves.set(saveKey, savePromise);
    return await savePromise;
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Failed to verify session for cloud history.';
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[Travel AI Cloud History] Auth verification error:', errorMsg);
    }
    return { status: 'error', message: errorMsg };
  }
}

// ==============================================================================
// Future History Screen Data Layer Contracts
// ==============================================================================

/**
 * Retrieves the authenticated user's analysis history ordered by creation date descending.
 * Prepares the data layer for a future History screen.
 */
export async function getUserAnalyses(
  options?: GetUserAnalysesOptions,
  client?: SupabaseClient<Database>
): Promise<{ data: AnalysisRow[] | null; error: string | null }> {
  const activeClient = client || defaultSupabaseClient;

  try {
    const {
      data: { session },
    } = await activeClient.auth.getSession();

    if (!session?.user?.id) {
      return { data: null, error: 'User is not authenticated.' };
    }

    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    const { data, error } = await activeClient
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch user analyses.';
    return { data: null, error: msg };
  }
}

/**
 * Retrieves a single analysis record alongside all associated discovered places.
 */
export async function getAnalysisDetail(
  analysisId: string,
  client?: SupabaseClient<Database>
): Promise<{ data: AnalysisDetail | null; error: string | null }> {
  const activeClient = client || defaultSupabaseClient;

  try {
    const {
      data: { session },
    } = await activeClient.auth.getSession();

    if (!session?.user?.id) {
      return { data: null, error: 'User is not authenticated.' };
    }

    // 1. Fetch parent analysis
    const { data: analysis, error: analysisError } = await activeClient
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (analysisError || !analysis) {
      return { data: null, error: analysisError?.message || 'Analysis not found.' };
    }

    // 2. Fetch child places
    const { data: places, error: placesError } = await activeClient
      .from('analysis_places')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: true });

    if (placesError) {
      return { data: null, error: placesError.message };
    }

    return {
      data: {
        analysis,
        places: places || [],
      },
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch analysis detail.';
    return { data: null, error: msg };
  }
}

/**
 * Deletes an analysis record belonging to the authenticated user.
 * Database foreign keys cascade deletion automatically to all child `analysis_places`.
 */
export async function deleteAnalysis(
  analysisId: string,
  client?: SupabaseClient<Database>
): Promise<{ success: boolean; error: string | null }> {
  const activeClient = client || defaultSupabaseClient;

  try {
    const {
      data: { session },
    } = await activeClient.auth.getSession();

    if (!session?.user?.id) {
      return { success: false, error: 'User is not authenticated.' };
    }

    const { error } = await activeClient.from('analyses').delete().eq('id', analysisId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete analysis.';
    return { success: false, error: msg };
  }
}
