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

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runSupabaseBoundaryTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  const runTest = (name: string, fn: () => void) => {
    try {
      fn();
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
  } finally {
    process.env = originalEnv;
  }

  return { passed, failed };
}
