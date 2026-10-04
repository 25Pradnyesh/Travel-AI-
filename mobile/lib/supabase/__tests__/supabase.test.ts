/**
 * Travel AI Mobile — Supabase Client & Configuration Boundary Tests (Stage 1)
 *
 * Self-contained validation suite covering:
 * 1. Environment configuration loading and resolution logic
 * 2. Supabase client initialization boundaries without requiring live cloud credentials
 * 3. Database schema type contracts and backend AnalysisResponse compatibility
 */

import {
  getSupabaseConfig,
  isSupabaseConfigured,
  createSupabaseClient,
  getSupabaseClient,
} from '../client';
import {
  ProfileRow,
  AnalysisRow,
  AnalysisPlaceRow,
  SavedPlaceRow,
} from '../types';
import {
  parseAuthUrl,
  getAuthRedirectUrl,
  signInWithGoogle,
  signInWithApple,
} from '../auth';
import {
  extractReelId,
  resolveThumbnailUrl,
  clampConfidence,
  formatRating,
  mapAnalysisToRow,
  mapPlacesToRows,
  saveAnalysisToCloudHistory,
  getUserAnalyses,
  getAnalysisDetail,
  deleteAnalysis,
  resetHistorySaveGuards,
} from '../history';
import {
  mapPlaceToSavedPlaceInsert,
  mapSavedPlaceRowToModel,
  getCloudSavedPlaces,
  saveCloudPlace,
  removeCloudPlace,
  setPendingSaveAction,
  getPendingSaveAction,
  clearPendingSaveAction,
  executePendingSaveAction,
} from '../saved-places';
import { AnalysisResponse } from '@/types/analysis';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runSupabaseBoundaryTests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  const runTest = async (name: string, fn: () => void | Promise<void>) => {
    try {
      await fn();
      passed++;
    } catch (err) {
      failed++;
      // eslint-disable-next-line no-console
      console.error(`[FAIL] ${name}:`, err);
    }
  };

  const originalEnv = { ...process.env };

  try {
    // ============================================================================
    // 1. Configuration Loading
    // ============================================================================
    runTest('reports unconfigured state when environment variables are missing', () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      const config = getSupabaseConfig();
      assert(config.url === '', 'url should be empty string');
      assert(config.anonKey === '', 'anonKey should be empty string');
      assert(config.isConfigured === false, 'isConfigured should be false');
      assert(isSupabaseConfigured() === false, 'isSupabaseConfigured() should be false');
    });

    runTest('resolves primary publishable key when set', () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock-test.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'mock-publishable-key-123';

      const config = getSupabaseConfig();
      assert(config.url === 'https://mock-test.supabase.co', 'url should match configured');
      assert(config.anonKey === 'mock-publishable-key-123', 'anonKey should match configured');
      assert(config.isConfigured === true, 'isConfigured should be true');
      assert(isSupabaseConfigured() === true, 'isSupabaseConfigured() should be true');
    });

    runTest('resolves anon key alias when publishable key is not set', () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock-test.supabase.co';
      delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-alias-456';

      const config = getSupabaseConfig();
      assert(config.url === 'https://mock-test.supabase.co', 'url should match');
      assert(config.anonKey === 'mock-anon-alias-456', 'anonKey should resolve alias');
      assert(config.isConfigured === true, 'isConfigured should be true');
    });

    // ============================================================================
    // 2. Client Initialization Boundaries
    // ============================================================================
    runTest('initializes a typed client without live credentials or network activity', () => {
      const client = createSupabaseClient(
        'https://mock-project.supabase.co',
        'mock-anon-client-key-xyz'
      );
      assert(client !== null && client !== undefined, 'client must be defined');
      assert(typeof client.from === 'function', 'client.from must be a function');
      assert(typeof client.auth?.getSession === 'function', 'client.auth.getSession must be a function');
    });

    runTest('throws descriptive error if url or key is empty in factory function', () => {
      let threwEmptyUrl = false;
      try {
        createSupabaseClient('', 'some-key');
      } catch (err: unknown) {
        threwEmptyUrl = err instanceof Error && /valid url and anonKey must be provided/.test(err.message);
      }
      assert(threwEmptyUrl, 'must throw descriptive error for empty url');

      let threwEmptyKey = false;
      try {
        createSupabaseClient('https://mock.supabase.co', '');
      } catch (err: unknown) {
        threwEmptyKey = err instanceof Error && /valid url and anonKey must be provided/.test(err.message);
      }
      assert(threwEmptyKey, 'must throw descriptive error for empty anonKey');
    });

    runTest('getSupabaseClient returns a functional client instance even in unconfigured test mode', () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      const client = getSupabaseClient();
      assert(client !== null && client !== undefined, 'fallback client must be defined');
      assert(typeof client.from === 'function', 'client.from must be a function on fallback');
    });

    // ============================================================================
    // 3. Database Schema Assumptions & Type Compatibility
    // ============================================================================
    runTest('verifies ProfileRow contract compatibility', () => {
      const mockProfile: ProfileRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        display_name: 'Traveler Explorer',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: new Date().toISOString(),
      };
      assert(mockProfile.id.length > 0, 'id should be non-empty');
      assert(mockProfile.display_name === 'Traveler Explorer', 'display_name matches');
    });

    runTest('verifies AnalysisRow matches FastAPI engine analysis response attributes', () => {
      const mockAnalysis: AnalysisRow = {
        id: '987e6543-e89b-12d3-a456-426614174111',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        reel_url: 'https://www.instagram.com/reel/DaAiVGUx7Cf/',
        reel_id: 'DaAiVGUx7Cf',
        thumbnail_url: 'https://example.com/thumb.jpg',
        destination: 'Varenna, Lake Como',
        country: 'Italy',
        confidence: 95,
        travel_intelligence: {
          category: 'Scenic Coastal Town',
          best_season: 'May - September',
          budget_level: 'Moderate to High',
        },
        created_at: new Date().toISOString(),
      };

      assert(mockAnalysis.destination === 'Varenna, Lake Como', 'destination matches');
      assert(mockAnalysis.confidence === 95, 'confidence matches');
      assert(mockAnalysis.reel_id === 'DaAiVGUx7Cf', 'reel_id matches');
    });

    runTest('verifies AnalysisPlaceRow matches Google Places resolution attributes', () => {
      const mockPlace: AnalysisPlaceRow = {
        id: '111e2222-e89b-12d3-a456-426614174222',
        analysis_id: '987e6543-e89b-12d3-a456-426614174111',
        place_id: 'ChIJ42b10_nzh0cR2M2h4hJ7f_E',
        name: 'Villa Cipressi',
        address: 'Via 4 Novembre, 22, 23829 Varenna LC, Italy',
        latitude: 46.0125,
        longitude: 9.2831,
        rating: 4.7,
        category: 'landmark',
        photo_url: 'https://maps.googleapis.com/maps/api/place/photo?...',
        created_at: new Date().toISOString(),
      };

      assert(mockPlace.place_id === 'ChIJ42b10_nzh0cR2M2h4hJ7f_E', 'place_id matches');
      assert(typeof mockPlace.latitude === 'number', 'latitude is number');
    });

    runTest('verifies SavedPlaceRow contract compatibility', () => {
      const mockSavedPlace: SavedPlaceRow = {
        id: '333e4444-e89b-12d3-a456-426614174333',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        place_id: 'ChIJ42b10_nzh0cR2M2h4hJ7f_E',
        name: 'Villa Cipressi',
        address: 'Via 4 Novembre, 22, 23829 Varenna LC, Italy',
        latitude: 46.0125,
        longitude: 9.2831,
        rating: 4.7,
        category: 'landmark',
        photo_url: null,
        created_at: new Date().toISOString(),
      };

      assert(mockSavedPlace.place_id === 'ChIJ42b10_nzh0cR2M2h4hJ7f_E', 'place_id matches');
      assert(mockSavedPlace.user_id !== null, 'user_id matches');
    });

    // ============================================================================
    // 4. Stage 3: Google OAuth & Redirect URL Processing
    // ============================================================================
    runTest('parses PKCE authorization code from OAuth callback URL', () => {
      const url = 'travelai://auth/callback?code=mock_pkce_auth_code_999';
      const parsed = parseAuthUrl(url);
      assert(parsed.code === 'mock_pkce_auth_code_999', 'code must match expected');
      assert(!parsed.accessToken, 'accessToken should be undefined');
      assert(!parsed.error, 'error should be undefined');
    });

    runTest('parses access_token and refresh_token from hash fragment callback URL', () => {
      const url =
        'travelai://auth/callback#access_token=mock_jwt_access_111&refresh_token=mock_refresh_222&expires_in=3600&token_type=bearer';
      const parsed = parseAuthUrl(url);
      assert(parsed.accessToken === 'mock_jwt_access_111', 'accessToken must match');
      assert(parsed.refreshToken === 'mock_refresh_222', 'refreshToken must match');
      assert(!parsed.code, 'code should be undefined');
    });

    runTest('parses error and error_description from failed OAuth callback URL', () => {
      const url =
        'travelai://auth/callback?error=access_denied&error_description=User+declined+the+authorization+request';
      const parsed = parseAuthUrl(url);
      assert(parsed.error === 'access_denied', 'error must match');
      assert(
        parsed.errorDescription === 'User declined the authorization request',
        'errorDescription must match'
      );
    });

    runTest('handles empty or malformed URLs gracefully without throwing', () => {
      const emptyParsed = parseAuthUrl('');
      assert(Object.keys(emptyParsed).length === 0, 'empty string returns empty object');

      const malformedParsed = parseAuthUrl('travelai://not-a-valid-param');
      assert(!malformedParsed.code, 'malformed url does not set code');
    });

    runTest('getAuthRedirectUrl generates deep link matching app scheme', () => {
      const redirectUrl = getAuthRedirectUrl();
      assert(
        typeof redirectUrl === 'string' && redirectUrl.length > 0,
        'redirect URL must be a non-empty string'
      );
      assert(
        redirectUrl.includes('auth/callback'),
        'redirect URL must target auth/callback route'
      );
    });

    // ============================================================================
    // 5. Stage 4: Apple OAuth & Multi-Provider Compatibility
    // ============================================================================
    runTest('parses Apple authorization code from callback URL', () => {
      const appleUrl = 'travelai://auth/callback?code=mock_apple_auth_code_777';
      const parsed = parseAuthUrl(appleUrl);
      assert(parsed.code === 'mock_apple_auth_code_777', 'Apple code must match expected');
    });

    runTest('parses Apple user cancellation error', () => {
      const appleCancelUrl =
        'travelai://auth/callback?error=user_cancelled_authorize&error_description=The+user+canceled+authorization';
      const parsed = parseAuthUrl(appleCancelUrl);
      assert(parsed.error === 'user_cancelled_authorize', 'Apple cancel error must match');
      assert(
        parsed.errorDescription === 'The user canceled authorization',
        'Apple cancel description must match'
      );
    });

    runTest('verifies signInWithApple and signInWithGoogle guard unconfigured environment', async () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      const appleResult = await signInWithApple();
      assert(appleResult.success === false, 'Apple sign in must fail when unconfigured');
      assert(
        Boolean(appleResult.error && appleResult.error.includes('Supabase is not configured')),
        'Apple sign in must report descriptive unconfigured error'
      );

      const googleResult = await signInWithGoogle();
      assert(googleResult.success === false, 'Google sign in must fail when unconfigured');
      assert(
        Boolean(googleResult.error && googleResult.error.includes('Supabase is not configured')),
        'Google sign in must report descriptive unconfigured error'
      );
    });

    // ============================================================================
    // 6. Stage 5: Cloud Analysis History Persistence & Data Layer
    // ============================================================================
    const mockAnalysisResponse: AnalysisResponse = {
      success: true,
      best_guess: {
        place_id: 'ChIJ42b10_nzh0cR2M2h4hJ7f_E',
        name: 'Villa Cipressi, Lake Como',
        formatted_address: 'Via 4 Novembre, 22, 23829 Varenna LC, Italy',
        country: 'Italy',
        city: 'Varenna',
        region: 'Lombardy',
        latitude: 46.0125,
        longitude: 9.2831,
        rating: 4.7,
        user_ratings_total: 1250,
        types: ['tourist_attraction', 'point_of_interest'],
        photos: [{ url: 'https://images.unsplash.com/photo-varenna.jpg' }],
        maps_url: 'https://maps.google.com/?cid=123',
        confidence: 96,
        confidence_level: 'VERY_HIGH',
        verification_status: 'VERIFIED',
        gemini_confidence: 0.98,
        gemini_reason: 'Distinct architectural landmarks and Lake Como shoreline match.',
        why: 'Verified via multimodal visual matching and Google Places coordinates.',
      },
      travel_intelligence: {
        category: 'Scenic Coastal Town',
        category_emoji: '🏔️',
        best_season: 'May - September',
        peak_months: ['July', 'August'],
        budget_level: 'Moderate to High',
        travel_tips: ['Book ferry tickets in advance during peak season.'],
      },
      nearby_places: [
        {
          place_id: 'ChIJNearbyPlace001',
          name: 'Villa Monastero',
          formatted_address: 'Viale Polvani, 4, 23829 Varenna LC, Italy',
          latitude: 46.0092,
          longitude: 9.2842,
          rating: 4.8,
          user_ratings_total: 2100,
          types: ['museum'],
          category: 'Cultural Landmark',
          maps_url: 'https://maps.google.com/?cid=456',
        },
        {
          // Duplicate place ID simulation to verify deduplication
          place_id: 'ChIJ42b10_nzh0cR2M2h4hJ7f_E',
          name: 'Villa Cipressi (Duplicate)',
          formatted_address: 'Via 4 Novembre, 22, Italy',
          latitude: 46.0125,
          longitude: 9.2831,
          rating: 4.7,
          user_ratings_total: 1250,
          types: ['tourist_attraction'],
          category: 'Attractions',
          maps_url: 'https://maps.google.com/?cid=123',
        },
      ],
    };

    function createMockHistoryClient(options?: {
      session?: { user: { id: string } } | null;
      failParentInsert?: boolean;
      failPlacesInsert?: boolean;
      analysesData?: any[];
      placesData?: any[];
    }) {
      const session =
        options?.session !== undefined
          ? options.session
          : { user: { id: '123e4567-e89b-12d3-a456-426614174000' } };

      const calls: { table: string; method: string; payload?: any }[] = [];

      const client: any = {
        auth: {
          getSession: async () => ({
            data: { session },
            error: null,
          }),
        },
        from: (table: string) => ({
          insert: (payload: any) => {
            calls.push({ table, method: 'insert', payload });
            return {
              select: (_fields?: string) => ({
                single: async () => {
                  if (table === 'analyses' && options?.failParentInsert) {
                    return { data: null, error: { message: 'Database insert failed' } };
                  }
                  return {
                    data: {
                      id: 'mock-analysis-uuid-999',
                      user_id: payload.user_id,
                      destination: payload.destination,
                      created_at: new Date().toISOString(),
                    },
                    error: null,
                  };
                },
              }),
              then: (resolve: (val: any) => void) => {
                if (table === 'analysis_places' && options?.failPlacesInsert) {
                  return resolve({
                    data: null,
                    error: { message: 'Foreign key or place insert failed' },
                  });
                }
                return resolve({ data: payload, error: null });
              },
            };
          },
          delete: () => {
            calls.push({ table, method: 'delete' });
            return {
              eq: (_col: string, _val: any) => Promise.resolve({ data: null, error: null }),
            };
          },
          select: (_cols?: string) => {
            calls.push({ table, method: 'select' });
            return {
              order: (_col: string, _opts?: any) => ({
                range: (_start: number, _end: number) =>
                  Promise.resolve({ data: options?.analysesData || [], error: null }),
              }),
              eq: (_col: string, _val: any) => ({
                single: async () => ({
                  data: options?.analysesData?.[0] || { id: 'mock-analysis-uuid-999' },
                  error: null,
                }),
                order: (_c: string, _o?: any) =>
                  Promise.resolve({ data: options?.placesData || [], error: null }),
              }),
            };
          },
        }),
        __calls: calls,
      };

      return client;
    }

    await runTest('extractReelId parses shortcodes and ignores trailing parameters', () => {
      assert(
        extractReelId('https://www.instagram.com/reel/C8xyzExample1/') === 'C8xyzExample1',
        'standard reel url parsed'
      );
      assert(
        extractReelId('https://instagram.com/reels/DaAiVGUx7Cf?igsh=123') === 'DaAiVGUx7Cf',
        'reels plural url with query parsed'
      );
      assert(extractReelId('https://instagram.com/p/something') === null, 'non-reel url returns null');
      assert(extractReelId('') === null, 'empty url returns null');
    });

    await runTest('clampConfidence and formatRating conform to database constraints', () => {
      assert(clampConfidence(95.4) === 95, 'rounds confidence');
      assert(clampConfidence(-10) === 0, 'clamps negative confidence to 0');
      assert(clampConfidence(120) === 100, 'clamps high confidence to 100');
      assert(clampConfidence(null) === null, 'null confidence preserved');

      assert(formatRating(4.766) === 4.77, 'formats rating to 2 decimal places');
      assert(formatRating(6.5) === 5.0, 'clamps rating above 5.0');
      assert(formatRating(-1) === 0.0, 'clamps rating below 0.0');
      assert(formatRating(null) === null, 'null rating preserved');
    });

    await runTest('mapAnalysisToRow maps AnalysisResponse to AnalysisInsert respecting ephemeral media rule', () => {
      const reelUrl = 'https://www.instagram.com/reel/C8xyzExample1/';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mapped = mapAnalysisToRow(mockAnalysisResponse, reelUrl, userId);

      assert(mapped.user_id === userId, 'user_id matches verified session');
      assert(mapped.reel_url === reelUrl, 'reel_url matches');
      assert(mapped.reel_id === 'C8xyzExample1', 'reel_id extracted');
      assert(mapped.destination === 'Villa Cipressi, Lake Como', 'destination mapped');
      assert(mapped.country === 'Italy', 'country mapped');
      assert(mapped.confidence === 96, 'confidence clamped and mapped');
      assert(
        mapped.thumbnail_url === 'https://images.unsplash.com/photo-varenna.jpg',
        'thumbnail mapped'
      );
      assert(
        typeof mapped.travel_intelligence === 'object' && mapped.travel_intelligence !== null,
        'travel_intelligence JSON preserved'
      );

      // Strict ephemeral media check: confirm no video bytes, audio tracks, or frames are mapped
      const keys = Object.keys(mapped);
      assert(!keys.includes('video'), 'no raw video in mapped row');
      assert(!keys.includes('audio'), 'no raw audio in mapped row');
      assert(!keys.includes('frames'), 'no extracted frames in mapped row');
    });

    await runTest('mapPlacesToRows maps best_guess and nearby places, deduplicating IDs', () => {
      const analysisId = '987e6543-e89b-12d3-a456-426614174111';
      const places = mapPlacesToRows(mockAnalysisResponse, analysisId);

      // Total places: 1 from best_guess + 1 unique from nearby_places (duplicate ID ignored) = 2
      assert(places.length === 2, `expected 2 deduplicated places, got ${places.length}`);

      // Primary place check
      const primary = places[0];
      assert(primary.analysis_id === analysisId, 'primary links to parent analysisId');
      assert(primary.place_id === 'ChIJ42b10_nzh0cR2M2h4hJ7f_E', 'primary place_id matches');
      assert(primary.name === 'Villa Cipressi, Lake Como', 'primary name matches');
      assert(primary.rating === 4.7, 'primary rating matches');
      assert(primary.category === 'tourist_attraction', 'category mapped');

      // Nearby place check
      const nearby = places[1];
      assert(nearby.analysis_id === analysisId, 'nearby links to parent analysisId');
      assert(nearby.place_id === 'ChIJNearbyPlace001', 'nearby place_id matches');
      assert(nearby.name === 'Villa Monastero', 'nearby name matches');
      assert(nearby.category === 'Cultural Landmark', 'nearby category matches');
    });

    await runTest('saveAnalysisToCloudHistory skips cloud writes for guest users (no session)', async () => {
      const mockClient = createMockHistoryClient({ session: null });
      const result = await saveAnalysisToCloudHistory(
        mockAnalysisResponse,
        'https://www.instagram.com/reel/C8xyzExample1/',
        mockClient
      );

      assert(result.status === 'skipped_guest', 'guest write must be skipped');
      assert(
        mockClient.__calls.length === 0,
        'zero database calls should be made when unauthenticated'
      );
    });

    await runTest('saveAnalysisToCloudHistory skips invalid or incomplete analysis responses', async () => {
      const mockClient = createMockHistoryClient();
      const invalidResponse: AnalysisResponse = { success: false, error: 'Resolution failed' };

      const result = await saveAnalysisToCloudHistory(
        invalidResponse,
        'https://www.instagram.com/reel/C8xyzExample1/',
        mockClient
      );

      assert(result.status === 'skipped_invalid', 'incomplete analysis must be skipped');
      assert(mockClient.__calls.length === 0, 'zero database calls for invalid response');
    });

    await runTest('saveAnalysisToCloudHistory saves parent analysis first then places for signed-in user', async () => {
      resetHistorySaveGuards();
      const mockClient = createMockHistoryClient();
      const reelUrl = 'https://www.instagram.com/reel/C8xyzExample1/';

      const result = await saveAnalysisToCloudHistory(mockAnalysisResponse, reelUrl, mockClient);

      assert(result.status === 'saved', 'persists successfully for authenticated session');
      assert(result.analysisId === 'mock-analysis-uuid-999', 'returns persisted analysisId');
      assert(result.placesCount === 2, 'persists associated places count');

      // Verify call sequence: analyses inserted first, analysis_places second
      assert(mockClient.__calls.length >= 2, 'at least 2 database operations executed');
      assert(mockClient.__calls[0].table === 'analyses', 'analyses inserted first');
      assert(mockClient.__calls[0].method === 'insert', 'analyses method is insert');
      assert(
        mockClient.__calls[0].payload.user_id === '123e4567-e89b-12d3-a456-426614174000',
        'parent analysis uses verified auth.uid()'
      );

      assert(mockClient.__calls[1].table === 'analysis_places', 'analysis_places inserted second');
      assert(mockClient.__calls[1].method === 'insert', 'analysis_places method is insert');
    });

    await runTest('saveAnalysisToCloudHistory cleans up parent analysis on places insertion failure', async () => {
      resetHistorySaveGuards();
      const mockClient = createMockHistoryClient({ failPlacesInsert: true });
      const reelUrl = 'https://www.instagram.com/reel/C8xyzExampleFailPlaces/';

      const result = await saveAnalysisToCloudHistory(mockAnalysisResponse, reelUrl, mockClient);

      assert(result.status === 'error', 'returns error status on partial failure');
      assert(result.partialPlacesFailed === true, 'marks partialPlacesFailed');

      // Verify that parent analysis was deleted as cleanup under RLS
      const deleteCalls = mockClient.__calls.filter(
        (c: { table: string; method: string }) => c.table === 'analyses' && c.method === 'delete'
      );
      assert(deleteCalls.length === 1, 'cleanup delete was invoked on analyses');
    });

    await runTest('saveAnalysisToCloudHistory prevents accidental duplicate saves from re-renders', async () => {
      resetHistorySaveGuards();
      const mockClient = createMockHistoryClient();
      const reelUrl = 'https://www.instagram.com/reel/C8xyzDuplicateTest/';

      // First save succeeds
      const firstResult = await saveAnalysisToCloudHistory(mockAnalysisResponse, reelUrl, mockClient);
      assert(firstResult.status === 'saved', 'first save succeeds');

      // Duplicate save on same response object immediately skipped
      const secondResult = await saveAnalysisToCloudHistory(mockAnalysisResponse, reelUrl, mockClient);
      assert(secondResult.status === 'skipped_duplicate', 'second save on same object is debounced');

      // Separate response for same user+URL within cooldown also debounced
      const clonedResponse = JSON.parse(JSON.stringify(mockAnalysisResponse));
      const thirdResult = await saveAnalysisToCloudHistory(clonedResponse, reelUrl, mockClient);
      assert(thirdResult.status === 'skipped_duplicate', 'rapid duplicate callback is debounced');

      // Resetting guards permits subsequent intentional save
      resetHistorySaveGuards();
      const separateResult = await saveAnalysisToCloudHistory(clonedResponse, reelUrl, mockClient);
      assert(separateResult.status === 'saved', 'intentional save after reset succeeds');
    });

    await runTest('future history query methods prepare data layer cleanly', async () => {
      const mockData = [
        {
          id: 'mock-analysis-uuid-999',
          destination: 'Villa Cipressi',
          created_at: new Date().toISOString(),
        },
      ];
      const mockClient = createMockHistoryClient({ analysesData: mockData, placesData: [] });

      const analysesResult = await getUserAnalyses({ limit: 10 }, mockClient);
      assert(analysesResult.data !== null, 'getUserAnalyses returns data array');
      assert(analysesResult.error === null, 'getUserAnalyses error is null');

      const detailResult = await getAnalysisDetail('mock-analysis-uuid-999', mockClient);
      assert(detailResult.data !== null, 'getAnalysisDetail returns composite record');
      assert(detailResult.data?.analysis.id === 'mock-analysis-uuid-999', 'analysis id matches');

      const deleteResult = await deleteAnalysis('mock-analysis-uuid-999', mockClient);
      assert(deleteResult.success === true, 'deleteAnalysis succeeds');
    });

    // ==============================================================================
    // Stage 6 Tests — History and Saved Places UI & Cloud Data Layer
    // ==============================================================================

    function createMockSavedPlacesClient(options?: {
      session?: any;
      savedPlacesData?: any[];
      failUpsert?: boolean;
      failDelete?: boolean;
    }) {
      const calls: Array<{ table: string; method: string; payload?: any; filter?: any }> = [];
      const defaultUser = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@travelai.app' };
      const session = options?.session !== undefined ? options.session : { user: defaultUser };

      const client: any = {
        auth: {
          getSession: async () => ({
            data: { session },
            error: null,
          }),
        },
        from: (table: string) => ({
          select: (_cols?: string) => {
            calls.push({ table, method: 'select' });
            return {
              order: (_col: string, _opts?: any) =>
                Promise.resolve({ data: options?.savedPlacesData || [], error: null }),
            };
          },
          upsert: (payload: any, _opts?: any) => {
            calls.push({ table, method: 'upsert', payload });
            return {
              select: (_cols?: string) => ({
                single: async () => {
                  if (options?.failUpsert) {
                    return { data: null, error: { message: 'Database error on upsert' } };
                  }
                  return {
                    data: {
                      id: 'mock-saved-uuid-1',
                      user_id: payload.user_id,
                      place_id: payload.place_id,
                      name: payload.name,
                      address: payload.address,
                      latitude: payload.latitude,
                      longitude: payload.longitude,
                      rating: payload.rating,
                      category: payload.category,
                      photo_url: payload.photo_url,
                      created_at: new Date().toISOString(),
                    },
                    error: null,
                  };
                },
              }),
            };
          },
          delete: () => ({
            eq: (col: string, val: any) => {
              calls.push({ table, method: 'delete', filter: { [col]: val } });
              if (options?.failDelete) {
                return Promise.resolve({ error: { message: 'Delete failed' } });
              }
              return Promise.resolve({ error: null });
            },
          }),
        }),
        __calls: calls,
      };

      return client;
    }

    await runTest('mapPlaceToSavedPlaceInsert normalizes place attributes into typed schema row', () => {
      const mockPlace = {
        place_id: 'ChIJ42b10_nzh0cR2M2h4hJ7f_E',
        name: 'Villa Cipressi',
        formatted_address: 'Via 4 Novembre, 22, Varenna, Italy',
        latitude: 45.9995,
        longitude: 9.2847,
        rating: 4.678,
        category: 'Historic Villa',
        photos: [{ url: '/api/v1/proxy/photo1.jpg' }],
      };

      const row = mapPlaceToSavedPlaceInsert(mockPlace as any, 'user-uuid-123');

      assert(row.user_id === 'user-uuid-123', 'user_id matches authenticated user');
      assert(row.place_id === 'ChIJ42b10_nzh0cR2M2h4hJ7f_E', 'place_id preserved');
      assert(row.name === 'Villa Cipressi', 'name preserved');
      assert(row.address === 'Via 4 Novembre, 22, Varenna, Italy', 'address mapped');
      assert(row.latitude === 45.9995 && row.longitude === 9.2847, 'coordinates mapped');
      assert(row.rating === 4.68, 'rating clamped and rounded to 2 decimal places');
      assert(row.category === 'Historic Villa', 'category preserved');
    });

    await runTest('mapSavedPlaceRowToModel maps database row to UI SavedPlace model', () => {
      const mockRow: SavedPlaceRow = {
        id: 'mock-saved-uuid-1',
        user_id: 'user-uuid-123',
        place_id: 'ChIJ42b10_nzh0cR2M2h4hJ7f_E',
        name: 'Villa Cipressi',
        address: 'Via 4 Novembre, 22, Varenna, Italy',
        latitude: 45.9995,
        longitude: 9.2847,
        rating: 4.68,
        category: 'Historic Villa',
        photo_url: 'https://images.unsplash.com/photo-151234',
        created_at: '2026-10-04T12:00:00Z',
      };

      const model = mapSavedPlaceRowToModel(mockRow);

      assert(model.id === 'ChIJ42b10_nzh0cR2M2h4hJ7f_E', 'model id maps to place_id');
      assert(model.name === 'Villa Cipressi', 'name maps');
      assert(model.address === 'Via 4 Novembre, 22, Varenna, Italy', 'address maps');
      assert(model.rating === 4.68, 'rating maps');
      assert(model.saved_at === new Date('2026-10-04T12:00:00Z').getTime(), 'saved_at timestamp parsed');
    });

    await runTest('getCloudSavedPlaces queries public.saved_places under authenticated session', async () => {
      const mockPlaces = [
        {
          id: 'row-1',
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          place_id: 'place-1',
          name: 'Lake Como Villa',
          created_at: new Date().toISOString(),
        },
      ];
      const mockClient = createMockSavedPlacesClient({ savedPlacesData: mockPlaces });

      const result = await getCloudSavedPlaces(mockClient);

      assert(result.data !== null && result.data.length === 1, 'returns array of saved places');
      assert(result.error === null, 'no error returned');
      assert(mockClient.__calls[0].table === 'saved_places', 'queries saved_places table');
    });

    await runTest('getCloudSavedPlaces protects guests with unauthenticated error', async () => {
      const mockClient = createMockSavedPlacesClient({ session: null });

      const result = await getCloudSavedPlaces(mockClient);

      assert(result.data === null, 'data is null for guest');
      assert(result.error !== null, 'returns unauthenticated error');
      assert(mockClient.__calls.length === 0, 'zero database calls made');
    });

    await runTest('saveCloudPlace prevents duplicate saves using unique constraint upsert', async () => {
      const mockClient = createMockSavedPlacesClient();
      const placeInput = {
        id: 'place-dup-001',
        name: 'Grand Hotel Tremezzo',
        rating: 4.9,
      };

      const result = await saveCloudPlace(placeInput as any, undefined, mockClient);

      assert(result.data !== null, 'place successfully saved');
      assert(result.error === null, 'no error');

      const upsertCall = mockClient.__calls.find((c: any) => c.method === 'upsert');
      assert(upsertCall !== undefined, 'upsert was invoked');
      assert(upsertCall.payload.place_id === 'place-dup-001', 'payload has correct place_id');
      assert(upsertCall.payload.user_id === '123e4567-e89b-12d3-a456-426614174000', 'payload has verified user_id');
    });

    await runTest('removeCloudPlace deletes place record scoped to place_id', async () => {
      const mockClient = createMockSavedPlacesClient();

      const result = await removeCloudPlace('place-to-remove-123', mockClient);

      assert(result.success === true, 'delete succeeds');
      const deleteCall = mockClient.__calls.find((c: any) => c.method === 'delete');
      assert(deleteCall !== undefined, 'delete was invoked');
      assert(deleteCall.filter.place_id === 'place-to-remove-123', 'filtered by place_id');
    });

    await runTest('Guest pending save action lifecycle: set, get, clear, and cancel', () => {
      clearPendingSaveAction();
      assert(getPendingSaveAction() === null, 'pending action initially null');

      const samplePlace = { id: 'place-guest-1', name: 'Castello di Vezio' };
      setPendingSaveAction(samplePlace as any, 'https://example.com/photo.jpg');

      const active = getPendingSaveAction();
      assert(active !== null, 'pending action exists after set');
      assert(active?.place.name === 'Castello di Vezio', 'pending place name preserved');
      assert(active?.photoUrl === 'https://example.com/photo.jpg', 'photoUrl preserved');

      // Cancellation clears pending action without saving
      clearPendingSaveAction();
      assert(getPendingSaveAction() === null, 'pending action cleared on cancellation');
    });

    await runTest('executePendingSaveAction resumes save after auth without rerunning Reel', async () => {
      clearPendingSaveAction();
      const mockClient = createMockSavedPlacesClient();

      // Guest tapped save
      const samplePlace = { id: 'place-resume-1', name: 'Bellagio Harbor' };
      setPendingSaveAction(samplePlace as any, 'https://example.com/bellagio.jpg');

      // Auth completed successfully
      const result = await executePendingSaveAction(mockClient);

      assert(result.executed === true, 'pending action executed');
      assert(result.place?.name === 'Bellagio Harbor', 'saved place row returned');
      assert(getPendingSaveAction() === null, 'pending action cleared after execution');
    });
  } finally {
    process.env = originalEnv;
  }

  return { passed, failed };
}
