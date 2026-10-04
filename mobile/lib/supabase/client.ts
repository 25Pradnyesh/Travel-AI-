/**
 * Travel AI Mobile — Supabase Client & Configuration (Stage 1)
 *
 * Official Supabase client initialized for Expo / React Native with
 * AsyncStorage session persistence and safe environment configuration.
 *
 * NOTE: Never place or expose a Supabase service-role key in mobile client code.
 * Only the public project URL and publishable/anon key are permitted.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

/**
 * Resolved Supabase environment credentials from Expo process environment.
 * Supports both EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY and EXPO_PUBLIC_SUPABASE_ANON_KEY alias.
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

/**
 * Retrieves the currently active Supabase configuration without throwing.
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  };
}

/**
 * Returns true if both Supabase URL and public client key are present.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}

/**
 * Factory function for creating a typed Supabase client with custom credentials.
 * Useful for tests, staging switching, and dependency injection.
 */
export function createSupabaseClient(
  url: string,
  anonKey: string
): SupabaseClient<Database> {
  if (!url || !anonKey) {
    throw new Error(
      'Cannot initialize Supabase client: valid url and anonKey must be provided.'
    );
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Must be false in React Native / Expo environments
    },
  });
}

// Fallback dummy credentials to allow zero-crash lazy initialization during early setup / testing
const FALLBACK_DUMMY_URL = 'https://unconfigured-travelai.supabase.co';
const FALLBACK_DUMMY_KEY = 'unconfigured-public-anon-key';

let cachedClient: SupabaseClient<Database> | null = null;

/**
 * Get or initialize the primary Supabase singleton client.
 * If credentials are missing in development, initializes a fallback client to prevent
 * app-wide crash at module load time while logging an informative diagnostic.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (cachedClient) {
    return cachedClient;
  }

  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (isConfigured) {
    cachedClient = createSupabaseClient(url, anonKey);
    return cachedClient;
  }

  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
  if (isDev) {
    // eslint-disable-next-line no-console
    console.warn(
      '[Travel AI Supabase] Supabase credentials not found. ' +
        'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in mobile/.env.local.'
    );
  }

  // Graceful dummy fallback to prevent initialization crash
  cachedClient = createClient<Database>(FALLBACK_DUMMY_URL, FALLBACK_DUMMY_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return cachedClient;
}

/**
 * Singleton client instance for standard application data and auth operations.
 */
export const supabase = getSupabaseClient();

export default supabase;
