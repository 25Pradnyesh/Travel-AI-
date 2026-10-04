/**
 * Travel AI Mobile — Login Screen (Stages 3 & 4)
 *
 * Implements Sign in with Apple & Sign in with Google via Supabase Auth:
 * - Clear value proposition (bookmark sync, cross-device analysis history)
 * - Clear loading, cancellation, and error feedback for both providers
 * - Strict preservation of guest mode ("Continue as Guest" / dismissible modal)
 * - Adherence to Travel AI Design System & Apple Human Interface Guidelines
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
import { Colors, Radius, Spacing, TouchTarget, Typography } from '@/constants/theme';
import { useAuth } from '@/lib/supabase';
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
      setStatusNotice('Apple sign-in cancelled. You can continue exploring as a guest.');
      return;
    }

    if (result.success) {
      hapticFeedback.success();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/profile');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    hapticFeedback.selection();
    clearError();
    setStatusNotice(null);

    const result = await signInWithGoogle();

    if (result.canceled) {
      setStatusNotice('Google sign-in cancelled. You can continue exploring as a guest.');
      return;
    }

    if (result.success) {
      hapticFeedback.success();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/profile');
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, Spacing.base) }]}>
      {/* Top Header with Dismiss Button */}
      <View style={styles.header}>
        <Pressable
          onPress={handleDismiss}
          hitSlop={12}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Close sign in and continue as guest"
        >
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, Spacing.xl) + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand & Hero */}
        <View style={styles.heroSection}>
          <View style={styles.badgeWrapper}>
            <View style={styles.badge}>
              <Ionicons name="airplane" size={16} color={Colors.surfaceDark} />
              <Text style={styles.badgeText}>TRAVEL AI CLOUD</Text>
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

        {/* Value Proposition Cards */}
        <View style={styles.benefitsSection}>
          <View style={styles.benefitItem}>
            <View style={styles.benefitIconWrapper}>
              <Ionicons name="bookmark-outline" size={20} color={Colors.textPrimary} />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Multi-Device Sync</Text>
              <Text style={styles.benefitDesc}>
                Access your bookmarked landmarks and saved places from iPhone, Android, or web.
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIconWrapper}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.verified} />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Private & Protected</Text>
              <Text style={styles.benefitDesc}>
                Secured by PostgreSQL Row Level Security. Only you can access your travel intelligence.
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIconWrapper}>
              <Ionicons name="sparkles-outline" size={20} color={Colors.info} />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Guest Access Always Preserved</Text>
              <Text style={styles.benefitDesc}>
                Analyzing Reels never requires an account. Sign in only when you want cross-device backup.
              </Text>
            </View>
          </View>
        </View>

        {/* Status / Cancellation Feedback */}
        {statusNotice && !error && (
          <View style={styles.noticeCard}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.noticeText}>{statusNotice}</Text>
          </View>
        )}

        {/* Error Feedback */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorTitle}>Sign-In Error</Text>
              <Text style={styles.errorMessage}>{error}</Text>
            </View>
          </View>
        )}

        {/* Unconfigured Warning Notice */}
        {!isConfigured && (
          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={18} color={Colors.partial} />
            <Text style={styles.warningText}>
              Supabase credentials not configured. Set EXPO_PUBLIC_SUPABASE_URL and
              EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in mobile/.env.local to enable live sign-in.
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {/* Sign in with Apple */}
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
              <ActivityIndicator size="small" color={Colors.canvas} />
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons
                  name="logo-apple"
                  size={19}
                  color={Colors.canvas}
                  style={styles.providerIcon}
                />
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
              </View>
            )}
          </Pressable>

          {/* Sign in with Google */}
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
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons
                  name="logo-google"
                  size={17}
                  color={Colors.textPrimary}
                  style={styles.providerIcon}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </Pressable>

          {/* Continue as Guest */}
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

        {/* Privacy Note */}
        <Text style={styles.footerNote}>
          By signing in, you agree to Travel AI&apos;s privacy principles. Media processed during
          analysis remains strictly ephemeral and is never stored in the cloud.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  closeButton: {
    width: TouchTarget.minWidth,
    height: TouchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  headerPlaceholder: {
    width: TouchTarget.minWidth,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
  },
  heroSection: {
    marginBottom: Spacing.xl,
  },
  badgeWrapper: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 6,
  },
  badgeText: {
    ...Typography.label,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.surfaceDark,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  benefitsSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  benefitDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  noticeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FDF2F2',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#F8B4B4',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 2,
  },
  errorMessage: {
    ...Typography.caption,
    color: '#9B1C1C',
    lineHeight: 17,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  warningText: {
    ...Typography.caption,
    color: '#92400E',
    flex: 1,
    lineHeight: 17,
  },
  actionSection: {
    gap: Spacing.sm + 2,
    marginBottom: Spacing.lg,
  },
  appleButton: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.xl,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  appleButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.canvas,
  },
  googleButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.xl,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  googleButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerIcon: {
    marginRight: Spacing.sm + 2,
  },
  guestButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xl,
    backgroundColor: 'transparent',
  },
  guestButtonText: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  footerNote: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
