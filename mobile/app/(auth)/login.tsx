/**
 * VAMO Mobile — Login / Account Modal
 *
 * Implements Google & Apple OAuth via Supabase Auth with robust offline/error handling:
 * - Persistent root atmospheric background (no per-screen background remounts)
 * - Apple button shown ONLY on iOS; Android shows Google + Continue as Guest
 * - Sign-in unavailable handling (preflight health check & mock state):
 *     - Google button disabled with "Sign-in isn't available right now"
 *     - Continue as Guest becomes primary pill
 *     - Toast notification explains
 *     - Zero dead browser tabs
 * - __DEV__ Diagnostic Panel:
 *     - Host DNS resolution status
 *     - /auth/v1/health status
 *     - Exact redirect URL in use (Expo Go vs travelai://auth/callback)
 *     - Last auth error
 * - __DEV__ Fixtures bar: instant testing of guest, signed-in, loading, error, and unavailable
 */

import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AuthButton,
  toast,
} from '@/components/ui';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import {
  useAuth,
  clearPendingSaveAction,
  executePendingSaveAction,
} from '@/lib/supabase';
import {
  checkSupabaseHealthDetails,
  getLastAuthError,
  SupabaseHealthDetails,
} from '@/lib/supabase/auth';
import { syncCloudPlaceToCache } from '@/lib/storage/saved-places';
import { hapticFeedback } from '@/lib/haptics';
import { DevAuthFixtures } from '@/components/dev/DevAuthFixtures';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    signInWithGoogle,
    signInWithApple,
    isAuthenticating,
    isConfigured,
    error,
    clearError,
    user,
    mockState,
  } = useAuth();

  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [healthDetails, setHealthDetails] = useState<SupabaseHealthDetails | null>(null);
  const [isPreflightChecking, setIsPreflightChecking] = useState(true);
  const [hasShownUnavailableToast, setHasShownUnavailableToast] = useState(false);

  // Preflight check on mount
  useEffect(() => {
    let mounted = true;
    checkSupabaseHealthDetails()
      .then((details) => {
        if (mounted) {
          setHealthDetails(details);
          setIsPreflightChecking(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsPreflightChecking(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Determine if sign-in is unavailable (live preflight failed, unconfigured, or mock unavailable)
  const isSignInUnavailable =
    mockState === 'unavailable' ||
    (!isConfigured && mockState === 'real') ||
    (!isPreflightChecking && healthDetails !== null && !healthDetails.reachable && mockState === 'real');

  // Show one toast when sign-in is determined to be unavailable
  useEffect(() => {
    if (isSignInUnavailable && !hasShownUnavailableToast) {
      setHasShownUnavailableToast(true);
      toast.info("Sign-in isn't available right now. You can keep using VAMO as a guest.");
    }
  }, [isSignInUnavailable, hasShownUnavailableToast]);

  const handleDismiss = () => {
    hapticFeedback.light();
    clearPendingSaveAction();
    clearError();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleAppleSignIn = async () => {
    if (isSignInUnavailable) {
      toast.info("Sign-in isn't available right now. You can continue as a guest.");
      return;
    }
    hapticFeedback.selection();
    clearError();
    setStatusNotice(null);

    const result = await signInWithApple();

    if (result.canceled) {
      clearPendingSaveAction();
      setStatusNotice('Apple sign-in cancelled. You can continue exploring as a guest.');
      return;
    }

    if (result.success) {
      hapticFeedback.success();
      toast.success('Signed in with Apple');
      try {
        const pendingResult = await executePendingSaveAction();
        if (pendingResult.executed && pendingResult.place) {
          syncCloudPlaceToCache(pendingResult.place);
        }
      } catch {
        // Pending save failure does not block sign-in completion
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/profile');
      }
    } else if (result.error && !result.unreachable) {
      toast.error(result.error);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSignInUnavailable) {
      toast.info("Sign-in isn't available right now. You can continue as a guest.");
      return;
    }
    hapticFeedback.selection();
    clearError();
    setStatusNotice(null);

    const result = await signInWithGoogle();

    if (result.canceled) {
      clearPendingSaveAction();
      setStatusNotice('Google sign-in cancelled. You can continue exploring as a guest.');
      return;
    }

    if (result.success) {
      hapticFeedback.success();
      toast.success('Signed in with Google');
      try {
        const pendingResult = await executePendingSaveAction();
        if (pendingResult.executed && pendingResult.place) {
          syncCloudPlaceToCache(pendingResult.place);
        }
      } catch {
        // Pending save failure does not block sign-in completion
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/profile');
      }
    } else if (result.error && !result.unreachable) {
      toast.error(result.error);
    }
  };

  const lastAuthErr = error || getLastAuthError();

  return (
    <View style={styles.screenContainer}>
      {/* Top Header with 44px Frosted Close Button */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, Spacing.base) },
        ]}
      >
        <Pressable
          onPress={handleDismiss}
          hitSlop={8}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Close sign in and continue as guest"
        >
          <Ionicons name="close" size={20} color={Colors.ivoryMist} />
        </Pressable>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, Spacing.xl) + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* __DEV__ Auth Fixtures Bar */}
        {__DEV__ && <DevAuthFixtures />}

        {/* Brand Hero with High-Contrast Frosted Pill */}
        <View style={styles.heroSection}>
          <View style={styles.badgeWrapper}>
            <View style={styles.badgePill}>
              <Ionicons name="cloud" size={14} color={Colors.icyBlue} />
              <Text style={styles.badgeText}>VAMO CLOUD</Text>
            </View>
          </View>

          <Text style={styles.title}>
            {user ? 'Signed In' : 'Sign in to sync your travel discoveries'}
          </Text>
          <Text style={styles.subtitle}>
            {user
              ? `Connected as ${user.email}. Your saved destinations are synchronized across all your devices.`
              : 'Save places from Instagram Reels, sync bookmarks across your devices, and access your travel history anywhere.'}
          </Text>
        </View>

        {/* Value Proposition: Dark Glass Card */}
        <View style={styles.benefitsCard}>
          <View style={styles.benefitItem}>
            <View style={styles.benefitIconWrapper}>
              <Ionicons name="bookmark-outline" size={18} color={Colors.icyBlue} />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Multi-Device Sync</Text>
              <Text style={styles.benefitDesc}>
                Access your bookmarked landmarks and saved places from iPhone, Android, or web.
              </Text>
            </View>
          </View>

          <View style={styles.benefitDivider} />

          <View style={styles.benefitItem}>
            <View style={styles.benefitIconWrapper}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Colors.verified} />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Private by Default</Text>
              <Text style={styles.benefitDesc}>
                Only you can see your saved places.
              </Text>
            </View>
          </View>

          <View style={styles.benefitDivider} />

          <View style={styles.benefitItem}>
            <View style={styles.benefitIconWrapper}>
              <Ionicons name="sparkles-outline" size={18} color={Colors.icyBlue} />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Guest Access Always Preserved</Text>
              <Text style={styles.benefitDesc}>
                Analyzing Reels never requires an account. Sign in only when you want cross-device backup.
              </Text>
            </View>
          </View>
        </View>

        {/* Status / Cancellation Feedback Notice */}
        {statusNotice && !error && (
          <View style={styles.noticeCard}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.icyBlue} />
            <Text style={styles.noticeText}>{statusNotice}</Text>
          </View>
        )}

        {/* Error Feedback Notice */}
        {error && (
          <View style={styles.errorNoticeCard}>
            <Ionicons name="alert-circle-outline" size={18} color={Colors.unverified} />
            <Text style={styles.errorNoticeText}>{error}</Text>
          </View>
        )}

        {/* Action Buttons Stack */}
        <View style={styles.actionSection}>
          {/* Apple button: ONLY on iOS */}
          {Platform.OS === 'ios' && (
            <AuthButton
              provider="apple"
              title="Continue with Apple"
              onPress={handleAppleSignIn}
              isLoading={isAuthenticating}
              disabled={isAuthenticating || isSignInUnavailable}
            />
          )}

          {/* Google Button: If unavailable, disabled with "Sign-in isn't available right now" */}
          {isSignInUnavailable ? (
            <View style={styles.disabledGoogleContainer}>
              <Text style={styles.disabledGoogleText}>Sign-in isn&apos;t available right now</Text>
            </View>
          ) : (
            <AuthButton
              provider="google"
              title="Continue with Google"
              onPress={handleGoogleSignIn}
              isLoading={isAuthenticating}
              disabled={isAuthenticating}
            />
          )}

          {/* Continue as Guest: When sign-in is unavailable, becomes the primary prominent pill */}
          <Pressable
            onPress={handleDismiss}
            disabled={isAuthenticating}
            style={({ pressed }) => [
              styles.guestButton,
              isSignInUnavailable && styles.guestButtonPrimary,
              pressed && !isAuthenticating && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue as guest"
          >
            <Text
              style={[
                styles.guestButtonText,
                isSignInUnavailable && styles.guestButtonTextPrimary,
              ]}
            >
              Continue as Guest
            </Text>
          </Pressable>
        </View>

        {/* Privacy Note */}
        <Text style={styles.footerNote}>
          By signing in, you agree to VAMO&apos;s privacy principles. Media processed during
          analysis remains strictly ephemeral and is never stored in the cloud.
        </Text>

        {/* __DEV__ Diagnostic Panel */}
        {__DEV__ && (
          <View style={styles.devPanel}>
            <View style={styles.devPanelHeader}>
              <Ionicons name="analytics-outline" size={13} color={Colors.icyBlue} />
              <Text style={styles.devPanelTitle}>__DEV__ AUTH DIAGNOSTICS</Text>
            </View>

            <View style={styles.devRow}>
              <Text style={styles.devLabel}>Supabase Host:</Text>
              <Text style={styles.devValue} numberOfLines={1}>
                {healthDetails?.host || 'Checking...'}
              </Text>
            </View>

            <View style={styles.devRow}>
              <Text style={styles.devLabel}>Host Resolves:</Text>
              <Text
                style={[
                  styles.devValue,
                  healthDetails?.hostResolves ? styles.textSuccess : styles.textDanger,
                ]}
              >
                {healthDetails?.hostResolves ? 'Yes (DNS OK)' : 'Failed (NXDOMAIN / Network Error)'}
              </Text>
            </View>

            <View style={styles.devRow}>
              <Text style={styles.devLabel}>/auth/v1/health:</Text>
              <Text
                style={[
                  styles.devValue,
                  healthDetails?.reachable ? styles.textSuccess : styles.textDanger,
                ]}
              >
                {healthDetails?.status ? `HTTP ${healthDetails.status}` : 'Unreachable'}
              </Text>
            </View>

            <View style={styles.devRowCol}>
              <Text style={styles.devLabel}>Exact Redirect URL in Use:</Text>
              <Text style={styles.devCodeSnippet} numberOfLines={2} selectable>
                {healthDetails?.exactRedirectUrl || 'Generating...'}
              </Text>
            </View>

            <View style={styles.devRowCol}>
              <Text style={styles.devLabel}>Standalone Scheme URL:</Text>
              <Text style={styles.devCodeSnippet} selectable>
                {healthDetails?.standaloneRedirectUrl || 'travelai://auth/callback'}
              </Text>
            </View>

            <View style={styles.devRowCol}>
              <Text style={styles.devLabel}>Last Auth Error:</Text>
              <Text
                style={[
                  styles.devValue,
                  lastAuthErr ? styles.textDanger : styles.textMuted,
                ]}
              >
                {lastAuthErr || 'None'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xs,
  },
  headerTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.ivoryMist,
  },
  closeButton: {
    width: TouchTarget.minWidth,
    height: TouchTarget.minHeight,
    minWidth: 44,
    minHeight: 44,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(251, 244, 227, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 244, 227, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPlaceholder: {
    width: TouchTarget.minWidth,
    minWidth: 44,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  heroSection: {
    marginBottom: Spacing.lg,
  },
  badgeWrapper: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassFrostedBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
    gap: 6,
  },
  badgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: Colors.icyBlue,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.ivoryMist,
    letterSpacing: -0.4,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  benefitsCard: {
    backgroundColor: Colors.glassDarkBg,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.glassDarkBorder,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  benefitIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: Colors.glassFrostedBg,
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.ivoryMist,
    marginBottom: 2,
  },
  benefitDesc: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
  },
  benefitDivider: {
    height: 1,
    backgroundColor: Colors.glassDarkBorder,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassDarkBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  noticeText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  errorNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(235, 38, 39, 0.12)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(235, 38, 39, 0.35)',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorNoticeText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.ivoryMist,
    flex: 1,
  },
  actionSection: {
    gap: Spacing.sm + 2,
    marginBottom: Spacing.lg,
  },
  disabledGoogleContainer: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(251, 244, 227, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.10)',
    paddingHorizontal: Spacing.lg,
  },
  disabledGoogleText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.textMuted,
  },
  guestButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(251, 244, 227, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
  },
  guestButtonPrimary: {
    minHeight: 52,
    backgroundColor: Colors.ivoryMist,
    borderColor: Colors.ivoryMist,
    shadowColor: Colors.ivoryMist,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  guestButtonText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.ivoryMist,
  },
  guestButtonTextPrimary: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.onyx,
    fontSize: 15,
  },
  footerNote: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.base,
  },
  devPanel: {
    backgroundColor: 'rgba(8, 14, 18, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.30)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: 8,
  },
  devPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(166, 220, 248, 0.15)',
  },
  devPanelTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  devRowCol: {
    paddingVertical: 2,
    gap: 2,
  },
  devLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  devValue: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    color: Colors.ivoryMist,
  },
  devCodeSnippet: {
    fontFamily: Fonts.sansRegular,
    fontSize: 10,
    color: Colors.icyBlue,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  textSuccess: {
    color: Colors.verified,
  },
  textDanger: {
    color: Colors.unverified,
  },
  textMuted: {
    color: Colors.textMuted,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
});
