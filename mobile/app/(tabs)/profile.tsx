import React, { useEffect, useState } from 'react';
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
import { TopBar } from '@/components/ui';
import { Colors, Radius, Spacing, TouchTarget, Typography } from '@/constants/theme';
import { travelAiApi } from '@/lib/api/travel-ai';
import { apiClient } from '@/lib/api/client';
import { EngineHealthResponse } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';
import { useAuth } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isAuthenticating, signInWithGoogle, signOut, error: authError } =
    useAuth();

  const [preferredMap, setPreferredMap] = useState<'apple' | 'google'>('google');
  const [health, setHealth] = useState<EngineHealthResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const checkEngineHealth = async () => {
    hapticFeedback.light();
    setIsCheckingHealth(true);
    setHealthError(null);
    if (!apiClient.getBaseUrl()) {
      setHealthError('Not Configured');
      setIsCheckingHealth(false);
      return;
    }
    try {
      const res = await travelAiApi.checkHealth();
      setHealth(res);
    } catch {
      setHealthError('Unreachable');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkEngineHealth();
  }, []);

  const handleSignInPress = () => {
    hapticFeedback.selection();
    router.push('/(auth)/login');
  };

  const handleQuickGoogleSignIn = async () => {
    hapticFeedback.selection();
    const result = await signInWithGoogle();
    if (result.success) {
      hapticFeedback.success();
    }
  };

  const handleSignOutPress = async () => {
    hapticFeedback.selection();
    await signOut();
  };

  const isEngineOnline = health?.status === 'ok';
  const isPlacesReady = Boolean(health?.configuration?.google_places_ready);
  const isGeminiReady = Boolean(health?.configuration?.gemini_ready);

  // Derived user display name and initials
  const displayName =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    user?.email?.split('@')[0] ||
    'Traveler';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.screen}>
      <TopBar brandTitle="Profile" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account & Cloud Sync Section */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>ACCOUNT & CLOUD</Text>

          {isAuthenticated && user ? (
            <View style={styles.card}>
              <View style={styles.accountHeaderRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{userInitial}</Text>
                </View>
                <View style={styles.accountInfo}>
                  <View style={styles.accountNameRow}>
                    <Text style={styles.accountName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.verified} />
                      <Text style={styles.verifiedBadgeText}>Google</Text>
                    </View>
                  </View>
                  <Text style={styles.accountEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.accountMetaRow}>
                <Ionicons name="cloud-done-outline" size={16} color={Colors.verified} />
                <Text style={styles.accountMetaText}>
                  Cloud synchronization active with Row Level Security.
                </Text>
              </View>

              <Pressable
                onPress={handleSignOutPress}
                disabled={isAuthenticating}
                style={({ pressed }) => [
                  styles.signOutButton,
                  pressed && styles.pressed,
                  isAuthenticating && styles.buttonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Sign out of account"
              >
                {isAuthenticating ? (
                  <ActivityIndicator size="small" color={Colors.textSecondary} />
                ) : (
                  <View style={styles.signOutButtonContent}>
                    <Ionicons name="log-out-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                  </View>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.guestHeaderRow}>
                <View style={styles.guestIconWrapper}>
                  <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
                </View>
                <View style={styles.guestTextContainer}>
                  <View style={styles.guestTitleRow}>
                    <Text style={styles.guestTitle}>Guest Traveler</Text>
                    <View style={styles.guestBadge}>
                      <Text style={styles.guestBadgeText}>Local Mode</Text>
                    </View>
                  </View>
                  <Text style={styles.guestSubtitle}>
                    Sign in with Google to sync bookmarks across your devices and safeguard your
                    analyses.
                  </Text>
                </View>
              </View>

              {authError && (
                <View style={styles.inlineErrorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                  <Text style={styles.inlineErrorText}>{authError}</Text>
                </View>
              )}

              <View style={styles.guestActionRow}>
                <Pressable
                  onPress={handleQuickGoogleSignIn}
                  disabled={isAuthenticating}
                  style={({ pressed }) => [
                    styles.primarySignInButton,
                    pressed && styles.pressed,
                    isAuthenticating && styles.buttonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in with Google"
                >
                  {isAuthenticating ? (
                    <ActivityIndicator size="small" color={Colors.canvas} />
                  ) : (
                    <View style={styles.signInButtonContent}>
                      <Ionicons name="logo-google" size={16} color={Colors.canvas} />
                      <Text style={styles.primarySignInText}>Sign in with Google</Text>
                    </View>
                  )}
                </Pressable>

                <Pressable
                  onPress={handleSignInPress}
                  hitSlop={8}
                  style={({ pressed }) => [styles.secondaryDetailsButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Learn more about cloud sync"
                >
                  <Text style={styles.secondaryDetailsText}>Details</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Navigation & Maps Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>PREFERENCES</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconWrapper}>
                <Ionicons name="map-outline" size={18} color={Colors.textPrimary} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Default Navigation App</Text>
                <Text style={styles.rowSubtitle}>App launched for directions</Text>
              </View>
            </View>

            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => {
                  hapticFeedback.selection();
                  setPreferredMap('apple');
                }}
                style={[
                  styles.toggleButton,
                  preferredMap === 'apple' && styles.toggleButtonActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Set Apple Maps as default"
              >
                <Text
                  style={[
                    styles.toggleText,
                    preferredMap === 'apple' && styles.toggleTextActive,
                  ]}
                >
                  Apple Maps
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  hapticFeedback.selection();
                  setPreferredMap('google');
                }}
                style={[
                  styles.toggleButton,
                  preferredMap === 'google' && styles.toggleButtonActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Set Google Maps as default"
              >
                <Text
                  style={[
                    styles.toggleText,
                    preferredMap === 'google' && styles.toggleTextActive,
                  ]}
                >
                  Google Maps
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Engine Diagnostics */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionEyebrow}>SYSTEM DIAGNOSTICS</Text>
            <Pressable
              onPress={checkEngineHealth}
              disabled={isCheckingHealth}
              hitSlop={8}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Text style={styles.refreshText}>
                {isCheckingHealth ? 'Checking...' : 'Refresh'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.diagnosticItem}>
              <View style={styles.diagnosticLeft}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isEngineOnline ? Colors.verified : Colors.error,
                    },
                  ]}
                />
                <Text style={styles.diagnosticName}>FastAPI Engine Boundary</Text>
              </View>
              <Text
                style={[
                  styles.diagnosticValue,
                  !isEngineOnline && styles.diagnosticValueWarning,
                ]}
              >
                {healthError ? 'Unreachable' : isEngineOnline ? 'Online (200 OK)' : 'Degraded'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.diagnosticItem}>
              <View style={styles.diagnosticLeft}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isPlacesReady ? Colors.verified : Colors.textMuted,
                    },
                  ]}
                />
                <Text style={styles.diagnosticName}>Google Places Service</Text>
              </View>
              <Text
                style={[
                  styles.diagnosticValue,
                  !isPlacesReady && styles.diagnosticValueMuted,
                ]}
              >
                {isPlacesReady ? 'Ready' : 'Not Configured'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.diagnosticItem}>
              <View style={styles.diagnosticLeft}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isGeminiReady ? Colors.verified : Colors.textMuted,
                    },
                  ]}
                />
                <Text style={styles.diagnosticName}>Gemini Multimodal Vision</Text>
              </View>
              <Text
                style={[
                  styles.diagnosticValue,
                  !isGeminiReady && styles.diagnosticValueMuted,
                ]}
              >
                {isGeminiReady ? 'Ready' : 'Not Configured'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.diagnosticItem}>
              <View style={styles.diagnosticLeft}>
                <Ionicons
                  name="link-outline"
                  size={14}
                  color={Colors.textMuted}
                  style={styles.metaIcon}
                />
                <Text style={styles.metaLabel}>Configured Base URL</Text>
              </View>
              <Text style={styles.metaValue} numberOfLines={1}>
                {apiClient.getBaseUrl() || 'Not Configured (Production)'}
              </Text>
            </View>
          </View>
        </View>

        {/* Application Information */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>ABOUT TRAVEL AI</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0 (Phase 2 Mobile Engine)</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Client Stack</Text>
              <Text style={styles.infoValue}>React Native · Expo Router · TypeScript</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Analysis Timeout</Text>
              <Text style={styles.infoValue}>180s (Deep Video & Places)</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.huge,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.xs + 2,
  },
  sectionEyebrow: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textMuted,
  },
  refreshText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  // Account Card Styles
  accountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarInitial: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.canvas,
    fontSize: 18,
  },
  accountInfo: {
    flex: 1,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  accountName: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 4,
  },
  verifiedBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.verified,
  },
  accountEmail: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  accountMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: Spacing.sm,
  },
  accountMetaText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  signOutButton: {
    minHeight: 40,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    backgroundColor: Colors.surfaceSubtle,
  },
  signOutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signOutText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  // Guest Card Styles
  guestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  guestIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  guestTextContainer: {
    flex: 1,
  },
  guestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  guestTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  guestBadge: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  guestBadgeText: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
  },
  guestSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  inlineErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F2',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    gap: 6,
    marginBottom: Spacing.sm,
  },
  inlineErrorText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.error,
    flex: 1,
  },
  guestActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  primarySignInButton: {
    flex: 1,
    minHeight: 44,
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  signInButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primarySignInText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.canvas,
  },
  secondaryDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    minHeight: 44,
    gap: 2,
  },
  secondaryDetailsText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  // Existing Preferences Styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  rowSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.lg,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md - 2,
  },
  toggleButtonActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    ...Typography.caption,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  diagnosticItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs + 2,
  },
  diagnosticLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
  },
  diagnosticName: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
  },
  diagnosticValue: {
    ...Typography.caption,
    fontWeight: '500',
    color: Colors.verified,
  },
  diagnosticValueWarning: {
    color: Colors.error,
  },
  diagnosticValueMuted: {
    color: Colors.textMuted,
  },
  metaIcon: {
    marginRight: Spacing.sm,
  },
  metaLabel: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  metaValue: {
    ...Typography.caption,
    color: Colors.textMuted,
    maxWidth: '50%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
  },
  infoLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: Spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
