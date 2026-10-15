/**
 * Travel AI Mobile — Supabase Authentication Context & Hook (Stages 3 & 4)
 *
 * Provides reactive authentication state across the application:
 * - Google and Apple OAuth sign-in support
 * - Session restoration from AsyncStorage on boot
 * - Real-time state subscription via `onAuthStateChange`
 * - Deep linking fallback handler for OAuth redirects
 * - Zero-crash guest mode when unauthenticated or unconfigured
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Linking from 'expo-linking';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './client';
import {
  AuthResult,
  handleAuthRedirect,
  signInWithGoogle as authSignInWithGoogle,
  signInWithApple as authSignInWithApple,
  signOut as authSignOut,
} from './auth';
import { clearPendingSaveAction } from './saved-places';
import { resetHistorySaveGuards } from './history';

// Registry for external caches to clear on sign out without creating circular dependencies
const signOutCallbacks = new Set<() => Promise<void> | void>();

export function registerSignOutCallback(callback: () => Promise<void> | void): () => void {
  signOutCallbacks.add(callback);
  return () => {
    signOutCallbacks.delete(callback);
  };
}

/**
 * Compares two User objects for functional equivalence.
 */
export function isSameUser(a: User | null, b: User | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.email === b.email &&
    a.updated_at === b.updated_at &&
    a.role === b.role
  );
}

/**
 * Compares two Session objects for functional equivalence.
 */
export function isSameSession(a: Session | null, b: Session | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.access_token === b.access_token &&
    a.refresh_token === b.refresh_token &&
    a.expires_at === b.expires_at &&
    isSameUser(a.user, b.user)
  );
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  error: string | null;
  isConfigured: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithApple: () => Promise<AuthResult>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Tracks settled auth events from onAuthStateChange to prevent older getSession() results
  // from racing or overwriting newer authentication state during boot.
  const authEventsProcessedRef = useRef(0);

  const configured = isSupabaseConfigured();

  /**
   * Applies session and user updates idempotently.
   * If the effective session or user data has not changed, the existing reference is preserved.
   * This prevents spurious re-renders and eliminates cascading update loops in consumers.
   */
  const applySession = useCallback((nextSession: Session | null) => {
    setSession((prevSession) => {
      if (isSameSession(prevSession, nextSession)) {
        return prevSession;
      }
      return nextSession;
    });

    setUser((prevUser) => {
      const nextUser = nextSession?.user ?? null;
      if (isSameUser(prevUser, nextUser)) {
        return prevUser;
      }
      return nextUser;
    });

    setIsLoading((prev) => (prev ? false : prev));
  }, []);

  const executeSignOutCleanups = useCallback(async () => {
    for (const cb of signOutCallbacks) {
      try {
        await cb();
      } catch {
        // Callback failure tolerated
      }
    }
    clearPendingSaveAction();
    resetHistorySaveGuards();
  }, []);

  // 1. Initial session restoration and auth state change subscription
  useEffect(() => {
    let isMounted = true;

    if (!configured) {
      setIsLoading(false);
      return;
    }

    // 1. Subscribe to real-time auth events (INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      authEventsProcessedRef.current += 1;
      applySession(currentSession);

      if (event === 'SIGNED_OUT') {
        await executeSignOutCleanups();
      }
    });

    // 2. Initial session resolution fallback: only apply if no onAuthStateChange event
    // has already updated session state (prevents async getSession from racing/overwriting)
    const initializeAuth = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (sessionError) {
          setError((prev) => (prev === sessionError.message ? prev : sessionError.message));
        } else if (authEventsProcessedRef.current === 0) {
          applySession(data.session);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to restore auth session.';
          setError((prev) => (prev === msg ? prev : msg));
        }
      } finally {
        if (isMounted) {
          setIsLoading((prev) => (prev ? false : prev));
        }
      }
    };

    initializeAuth();

    // 3. Fallback deep link listener for OAuth redirects
    const handleUrlEvent = async (event: { url: string }) => {
      if (event.url && event.url.includes('auth/callback')) {
        try {
          setIsAuthenticating(true);
          const newSession = await handleAuthRedirect(event.url);
          if (isMounted) {
            applySession(newSession);
            setError(null);
          }
        } catch (redirectErr: unknown) {
          if (isMounted) {
            const msg =
              redirectErr instanceof Error
                ? redirectErr.message
                : 'Failed to process authentication redirect.';
            setError(msg);
          }
        } finally {
          if (isMounted) {
            setIsAuthenticating(false);
          }
        }
      }
    };

    const urlSubscription = Linking.addEventListener('url', handleUrlEvent);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      urlSubscription.remove();
    };
  }, [configured, applySession, executeSignOutCleanups]);

  // Sign in with Google handler
  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await authSignInWithGoogle();

      if (result.success && result.session) {
        applySession(result.session);
        setError(null);
      } else if (result.error && !result.canceled) {
        setError(result.error);
      }

      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsAuthenticating(false);
    }
  }, [applySession]);

  // Sign in with Apple handler
  const signInWithApple = useCallback(async (): Promise<AuthResult> => {
    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await authSignInWithApple();

      if (result.success && result.session) {
        applySession(result.session);
        setError(null);
      } else if (result.error && !result.canceled) {
        setError(result.error);
      }

      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Apple sign-in failed.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsAuthenticating(false);
    }
  }, [applySession]);

  // Sign out handler
  const signOut = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setIsAuthenticating(true);
    try {
      const result = await authSignOut();
      if (result.success) {
        applySession(null);
        setError(null);
        await executeSignOutCleanups();
      } else if (result.error) {
        setError(result.error);
      }
      return result;
    } finally {
      setIsAuthenticating(false);
    }
  }, [applySession, executeSignOutCleanups]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isLoading,
      isAuthenticating,
      error,
      isConfigured: configured,
      isAuthenticated: Boolean(session && user),
      signInWithGoogle,
      signInWithApple,
      signOut,
      clearError,
    }),
    [
      session,
      user,
      isLoading,
      isAuthenticating,
      error,
      configured,
      signInWithGoogle,
      signInWithApple,
      signOut,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Access the shared authentication context.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}

export default useAuth;
