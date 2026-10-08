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

  const configured = isSupabaseConfigured();

  // 1. Initial session restoration and auth state change subscription
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (!configured) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          if (isMounted) {
            setError(sessionError.message);
          }
        } else if (isMounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to restore auth session.';
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // 2. Subscribe to auth state updates (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (isMounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      }
      if (event === 'SIGNED_OUT') {
        for (const cb of signOutCallbacks) {
          try {
            await cb();
          } catch {
            // Callback failure tolerated
          }
        }
        clearPendingSaveAction();
        resetHistorySaveGuards();
      }
    });

    // 3. Fallback deep link listener for OAuth redirects
    const handleUrlEvent = async (event: { url: string }) => {
      if (event.url && event.url.includes('auth/callback')) {
        try {
          setIsAuthenticating(true);
          const newSession = await handleAuthRedirect(event.url);
          if (isMounted) {
            setSession(newSession);
            setUser(newSession?.user ?? null);
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
  }, [configured]);

  // Sign in with Google handler
  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await authSignInWithGoogle();

      if (result.success && result.session) {
        setSession(result.session);
        setUser(result.session.user);
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
  }, []);

  // Sign in with Apple handler
  const signInWithApple = useCallback(async (): Promise<AuthResult> => {
    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await authSignInWithApple();

      if (result.success && result.session) {
        setSession(result.session);
        setUser(result.session.user);
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
  }, []);

  // Sign out handler
  const signOut = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setIsAuthenticating(true);
    try {
      const result = await authSignOut();
      if (result.success) {
        setSession(null);
        setUser(null);
        setError(null);
        // Execute decoupled cache clearing callbacks
        for (const cb of signOutCallbacks) {
          try {
            await cb();
          } catch {
            // Callback failure tolerated
          }
        }
        clearPendingSaveAction();
        resetHistorySaveGuards();
      } else if (result.error) {
        setError(result.error);
      }
      return result;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

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
