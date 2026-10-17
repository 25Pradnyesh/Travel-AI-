/**
 * VAMO Mobile — Login / Account Modal
 *
 * Implements Sign in with Apple & Sign in with Google via Supabase Auth:
 * - Pure atmospheric dark-glass presentation (AtmosphereBackground variant="night")
 * - High-contrast readable "VAMO CLOUD" frosted pill
 * - Plain language privacy copy ("Private by default. Only you can see your saved places.")
 * - Apple HIG compliant white button on dark backgrounds + outlined Google glass pill
 * - Prominent "Continue as Guest" pill + 44px frosted close button
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
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
  AtmosphereBackground,
  toast,
} from '@/components/ui';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useAuth, clearPendingSaveAction, executePendingSaveAction } from '@/lib/supabase';
import { syncCloudPlaceToCache } from '@/lib/storage/saved-places';
import { hapticFeedback } from '@/lib/haptics';

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
  } = useAuth();
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

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

  return (
    <AtmosphereBackground>
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

        {/* Unconfigured Warning Notice */}
        {!isConfigured && (
          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={18} color={Colors.partial} />
            <Text style={styles.warningText}>
              Supabase credentials not configured. Live sign-in requires environment keys.
            </Text>
          </View>
        )}

        {/* Action Buttons Stack */}
        <View style={styles.actionSection}>
          {/* Sign in with Apple: White button on dark backgrounds strictly following Apple HIG */}
          <Pressable
            onPress={handleAppleSignIn}
            disabled={isAuthenticating}
            style={({ pressed }) => [
              styles.appleButton,
              isAuthenticating && styles.buttonDisabled,
              pressed && !isAuthenticating && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Apple"
            accessibilityState={{ busy: isAuthenticating }}
          >
            {isAuthenticating ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons
                  name="logo-apple"
                  size={19}
                  color="#000000"
                  style={styles.providerIcon}
                />
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
              </View>
            )}
          </Pressable>

          {/* Sign in with Google: Outlined frosted glass pill with visible Google G */}
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={isAuthenticating}
            style={({ pressed }) => [
              styles.googleButton,
              isAuthenticating && styles.buttonDisabled,
              pressed && !isAuthenticating && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Google"
            accessibilityState={{ busy: isAuthenticating }}
          >
            {isAuthenticating ? (
              <ActivityIndicator size="small" color={Colors.ivoryMist} />
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons
                  name="logo-google"
                  size={17}
                  color={Colors.ivoryMist}
                  style={styles.providerIcon}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </Pressable>

          {/* Continue as Guest: Prominent frosted pill */}
          <Pressable
            onPress={handleDismiss}
            disabled={isAuthenticating}
            style={({ pressed }) => [
              styles.guestButton,
              pressed && !isAuthenticating && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue as guest"
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </Pressable>
        </View>

        {/* Privacy Note with original legal claims preserved, brand updated */}
        <Text style={styles.footerNote}>
          By signing in, you agree to VAMO&apos;s privacy principles. Media processed during
          analysis remains strictly ephemeral and is never stored in the cloud.
        </Text>
      </ScrollView>
    </AtmosphereBackground>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: Spacing.md,
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
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(229, 168, 102, 0.12)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.partialBorder,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  warningText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.partial,
    flex: 1,
    lineHeight: 17,
  },
  actionSection: {
    gap: Spacing.sm + 2,
    marginBottom: Spacing.lg,
  },
  appleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  appleButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: '#000000',
  },
  googleButton: {
    backgroundColor: Colors.glassFrostedBg,
    borderWidth: 1.5,
    borderColor: Colors.glassFrostedBorder,
    borderRadius: Radius.xl,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  googleButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.ivoryMist,
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
  guestButtonText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.ivoryMist,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerIcon: {
    marginRight: Spacing.sm + 2,
  },
  footerNote: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
});
