/**
 * Travel AI Mobile — Supabase OAuth Service (Stages 3 & 4)
 *
 * Implements Google and Apple OAuth authentication via Supabase Auth using:
 * - `expo-web-browser` for secure in-app browser authentication sessions
 * - `expo-linking` for deep-link redirect handling
 * - `@supabase/supabase-js` for PKCE/token session establishment and AsyncStorage persistence
 *
 * SECURITY:
 * - Google and Apple Client Secrets, Service IDs, Team IDs, and Private Keys are NEVER
 *   stored in the mobile application. They reside exclusively in the Supabase Dashboard
 *   under Authentication -> Providers -> (Google / Apple).
 * - Mobile client interacts only using the public Supabase URL and publishable/anon key.
 * - Guest mode is preserved across all application paths; authentication is strictly opt-in.
 */

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './client';

// Ensures any pending auth session popups or redirects are completed cleanly
WebBrowser.maybeCompleteAuthSession();

/**
 * Supported third-party OAuth providers.
 */
export type OAuthProvider = 'google' | 'apple';

/**
 * Parsed parameters extracted from an OAuth callback URL.
 */
export interface ParsedAuthTokens {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  errorDescription?: string;
}

/**
 * Result returned by the OAuth sign-in operations.
 */
export interface AuthResult {
  success: boolean;
  canceled?: boolean;
  error?: string;
  session?: Session | null;
  user?: User | null;
}

/**
 * Generates the canonical deep-link redirect URL for Supabase OAuth callbacks.
 * Returns `travelai://auth/callback` in standalone/production builds or the
 * corresponding Expo development URL in local dev.
 */
export function getAuthRedirectUrl(): string {
  return Linking.createURL('auth/callback', { scheme: 'travelai' });
}

/**
 * Parses query parameters and hash fragments from an OAuth redirect URL.
 * Handles both PKCE code grant (`?code=...`) and implicit token grant (`#access_token=...`).
 */
export function parseAuthUrl(url: string): ParsedAuthTokens {
  const result: ParsedAuthTokens = {};

  if (!url || typeof url !== 'string') {
    return result;
  }

  const queryIndex = url.indexOf('?');
  const hashIndex = url.indexOf('#');

  let queryString = '';
  let hashString = '';

  if (queryIndex !== -1) {
    if (hashIndex !== -1 && hashIndex > queryIndex) {
      queryString = url.substring(queryIndex + 1, hashIndex);
      hashString = url.substring(hashIndex + 1);
    } else {
      queryString = url.substring(queryIndex + 1);
    }
  } else if (hashIndex !== -1) {
    hashString = url.substring(hashIndex + 1);
  }

  const parseKeyValuePairs = (paramStr: string) => {
    if (!paramStr) return;
    const pairs = paramStr.split('&');
    for (const pair of pairs) {
      if (!pair) continue;
      const [rawKey, ...valueParts] = pair.split('=');
      if (!rawKey) continue;
      const key = decodeURIComponent(rawKey.trim());
      const rawVal = valueParts.join('=');
      const val = decodeURIComponent((rawVal || '').replace(/\+/g, ' '));

      if (key === 'code') result.code = val;
      if (key === 'access_token') result.accessToken = val;
      if (key === 'refresh_token') result.refreshToken = val;
      if (key === 'error') result.error = val;
      if (key === 'error_description') result.errorDescription = val;
    }
  };

  parseKeyValuePairs(queryString);
  parseKeyValuePairs(hashString);

  return result;
}

/**
 * Processes an OAuth redirect URL, exchanges the authorization code or sets the session tokens,
 * and establishes the active session in the Supabase client.
 */
export async function handleAuthRedirect(url: string): Promise<Session | null> {
  const { code, accessToken, refreshToken, error, errorDescription } = parseAuthUrl(url);

  if (error) {
    throw new Error(errorDescription || error || 'Authentication was denied by the provider.');
  }

  // 1. PKCE flow: Exchange authorization code for session
  if (code) {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      throw new Error(`Failed to exchange authorization code: ${exchangeError.message}`);
    }
    return data.session;
  }

  // 2. Implicit grant: Set session directly from tokens
  if (accessToken && refreshToken) {
    const { data, error: setSessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (setSessionError) {
      throw new Error(`Failed to establish session from tokens: ${setSessionError.message}`);
    }
    return data.session;
  }

  // Check if session was already picked up by Supabase client
  const { data: currentSessionData } = await supabase.auth.getSession();
  if (currentSessionData.session) {
    return currentSessionData.session;
  }

  throw new Error('No authentication credentials or session found in redirect URL.');
}

/**
 * Common OAuth sign-in flow for supported providers (Google, Apple).
 *
 * Flow:
 * 1. Verifies Supabase configuration is present.
 * 2. Requests an OAuth authorization URL from Supabase for the specified provider.
 * 3. Launches an in-app browser session using `WebBrowser.openAuthSessionAsync`.
 * 4. Intercepts the `travelai://auth/callback` redirect.
 * 5. Exchanges credentials and persists session into AsyncStorage.
 */
export async function signInWithOAuth(provider: OAuthProvider): Promise<AuthResult> {
  const providerLabel = provider === 'apple' ? 'Apple' : 'Google';

  // 1. Guard against unconfigured Supabase credentials
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error:
        'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in mobile/.env.local.',
    };
  }

  try {
    WebBrowser.maybeCompleteAuthSession();

    const redirectUrl = getAuthRedirectUrl();

    const options: {
      redirectTo: string;
      skipBrowserRedirect: boolean;
      queryParams?: Record<string, string>;
    } = {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    };

    if (provider === 'google') {
      options.queryParams = {
        access_type: 'offline',
        prompt: 'consent',
      };
    }

    // 2. Request authorization URL from Supabase
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options,
    });

    if (oauthError) {
      return {
        success: false,
        error: oauthError.message || `Failed to initialize ${providerLabel} OAuth session.`,
      };
    }

    if (!data?.url) {
      return {
        success: false,
        error: `Supabase did not return an authorization URL. Check that the ${providerLabel} provider is enabled in the Supabase Dashboard.`,
      };
    }

    // 3. Open browser auth session
    const authSessionResult = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    // 4. Handle user cancellation or dismissal
    if (authSessionResult.type === 'cancel' || authSessionResult.type === 'dismiss') {
      return {
        success: false,
        canceled: true,
      };
    }

    // 5. Handle successful browser redirect
    if (authSessionResult.type === 'success' && authSessionResult.url) {
      const session = await handleAuthRedirect(authSessionResult.url);
      return {
        success: true,
        session,
        user: session?.user ?? null,
      };
    }

    return {
      success: false,
      error: 'Authentication browser window was closed without completing sign-in.',
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : `${providerLabel} sign-in encountered an unexpected error.`;
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Initiates Google OAuth sign-in flow.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  return signInWithOAuth('google');
}

/**
 * Initiates Apple OAuth sign-in flow.
 */
export async function signInWithApple(): Promise<AuthResult> {
  return signInWithOAuth('apple');
}

/**
 * Signs the user out of their Supabase session and clears persisted tokens.
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to sign out.';
    return { success: false, error: message };
  }
}

/**
 * Returns the currently active session from the Supabase client or local storage.
 */
export async function getAuthSession(): Promise<Session | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Returns the currently authenticated user or null.
 */
export async function getAuthUser(): Promise<User | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}
