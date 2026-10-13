import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import {
  AtmosphereBackground,
  PillButton,
  SkeletonShimmer,
  toast,
} from '@/components/ui';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { travelAiApi } from '@/lib/api/travel-ai';
import { apiClient } from '@/lib/api/client';
import { EngineHealthResponse } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';
import { useAuth, executePendingSaveAction } from '@/lib/supabase';
import { syncCloudPlaceToCache } from '@/lib/storage/saved-places';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    user,
    isAuthenticated,
    isAuthenticating,
    signInWithGoogle,
    signInWithApple,
    signOut,
    error: authError,
  } = useAuth();

  const [preferredMap, setPreferredMap] = useState<'apple' | 'google'>('google');
  const [health, setHealth] = useState<EngineHealthResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Surface auth errors via Toast instead of an inline red wall
  useEffect(() => {
    if (authError) {
      toast.error(authError);
    }
  }, [authError]);

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

  const handleDismiss = () => {
    hapticFeedback.light();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSignInDetailsPress = () => {
    hapticFeedback.selection();
    router.push('/(auth)/login');
  };

  const handleQuickAppleSignIn = async () => {
    hapticFeedback.selection();
    const result = await signInWithApple();
    if (result.success) {
      hapticFeedback.success();
      toast.success('Signed in with Apple');
      try {
        const pendingResult = await executePendingSaveAction();
        if (pendingResult.executed && pendingResult.place) {
          syncCloudPlaceToCache(pendingResult.place);
        }
      } catch {
        // Pending save failure tolerated
      }
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const handleQuickGoogleSignIn = async () => {
    hapticFeedback.selection();
    const result = await signInWithGoogle();
    if (result.success) {
      hapticFeedback.success();
      toast.success('Signed in with Google');
      try {
        const pendingResult = await executePendingSaveAction();
        if (pendingResult.executed && pendingResult.place) {
          syncCloudPlaceToCache(pendingResult.place);
        }
      } catch {
        // Pending save failure tolerated
      }
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const handleHistoryPress = () => {
    hapticFeedback.selection();
    router.push({ pathname: '/(tabs)/saved', params: { tab: 'history' } });
  };

  const handleSignOutPress = async () => {
    hapticFeedback.selection();
    await signOut();
    toast.info('Signed out of account');
  };

  const isEngineOnline = health?.status === 'ok';
  const isPlacesReady = Boolean(health?.configuration?.google_places_ready);
  const isGeminiReady = Boolean(health?.configuration?.gemini_ready);

  // Derived user display name, provider, and initials
  const displayName =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    user?.email?.split('@')[0] ||
    'Traveler';
  const userInitial = displayName.charAt(0).toUpperCase();

  const provider =
    (user?.app_metadata?.provider as string) ||
    (user?.identities?.[0]?.provider as string) ||
    'oauth';
  const isApple = provider === 'apple';

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <AtmosphereBackground variant="night">
      {/* Top Header Row: Frosted Back Pill */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, Spacing.base) }]}>
        <Pressable
          onPress={handleDismiss}
          hitSlop={8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back to main view"
          style={({ pressed }) => [styles.frostedBackPill, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.ivoryMist} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 64 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Editorial Title */}
        <View style={styles.titleSection}>
          <Text style={styles.largeTitle}>
            Traveler <Text style={styles.serifAccent}>Profile.</Text>
          </Text>
        </View>

        {/* Section A: Account */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>

          {isAuthenticating ? (
            <View style={styles.darkCard}>
              <View style={styles.loadingRow}>
                <SkeletonShimmer width={44} height={44} borderRadius={Radius.full} />
                <View style={styles.loadingTextCol}>
                  <SkeletonShimmer width="60%" height={16} borderRadius={Radius.xs} style={styles.mbSm} />
                  <SkeletonShimmer width="40%" height={12} borderRadius={Radius.xs} />
                </View>
              </View>
            </View>
          ) : isAuthenticated && user ? (
            <View style={styles.darkCard}>
              <View style={styles.accountHeaderRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{userInitial}</Text>
                </View>
                <View style={styles.accountInfo}>
                  <View style={styles.accountNameRow}>
                    <Text style={styles.accountName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <View style={styles.providerBadge}>
                      {isApple ? (
                        <>
                          <Ionicons name="logo-apple" size={12} color={Colors.ivoryMist} />
                          <Text style={styles.providerBadgeText}>Apple</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={13} color={Colors.verified} />
                          <Text style={styles.providerBadgeText}>Google</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <Text style={styles.accountEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.syncStatusRow}>
                <Ionicons name="cloud-done-outline" size={16} color={Colors.verified} />
                <Text style={styles.syncStatusText}>
                  Cloud synchronization active · Private
                </Text>
              </View>

              <Pressable
                onPress={handleSignOutPress}
                disabled={isAuthenticating}
                style={({ pressed }) => [
                  styles.signOutPill,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Sign out of account"
              >
                <Ionicons name="log-out-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.darkCard}>
              <View style={styles.guestHeaderRow}>
                <View style={styles.guestIconCircle}>
                  <Ionicons name="person-outline" size={20} color={Colors.icyBlue} />
                </View>
                <View style={styles.guestTextContainer}>
                  <View style={styles.guestTitleRow}>
                    <Text style={styles.guestTitle}>Guest Traveler</Text>
                    <View style={styles.localModeBadge}>
                      <Text style={styles.localModeText}>LOCAL MODE</Text>
                    </View>
                  </View>
                  <Text style={styles.guestSubtitle}>
                    Sign in to sync your bookmarks across devices and safeguard your analyses.
                  </Text>
                </View>
              </View>

              <View style={styles.authButtonsStack}>
                {/* White button with black text/logo strictly following Apple HIG on dark atmospheres */}
                <Pressable
                  onPress={handleQuickAppleSignIn}
                  disabled={isAuthenticating}
                  style={({ pressed }) => [
                    styles.appleButton,
                    pressed && styles.pressed,
                    isAuthenticating && styles.buttonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in with Apple"
                >
                  {isAuthenticating ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <View style={styles.buttonInner}>
                      <Ionicons name="logo-apple" size={18} color="#000000" />
                      <Text style={styles.appleButtonText}>Sign in with Apple</Text>
                    </View>
                  )}
                </Pressable>

                {/* Outlined glass pill with visible Google G */}
                <View style={styles.googleRow}>
                  <Pressable
                    onPress={handleQuickGoogleSignIn}
                    disabled={isAuthenticating}
                    style={({ pressed }) => [
                      styles.googleButton,
                      pressed && styles.pressed,
                      isAuthenticating && styles.buttonDisabled,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Continue with Google"
                  >
                    <View style={styles.buttonInner}>
                      <Ionicons name="logo-google" size={16} color={Colors.ivoryMist} />
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={handleSignInDetailsPress}
                    hitSlop={8}
                    style={({ pressed }) => [styles.detailsButton, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Learn more about cloud sync"
                  >
                    <Text style={styles.detailsButtonText}>Details</Text>
                    <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Section B: History */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TRAVEL INTELLIGENCE</Text>
          <Pressable
            onPress={handleHistoryPress}
            style={({ pressed }) => [styles.darkCard, styles.historyCard, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="View previous Reel analyses and travel history"
          >
            <View style={styles.historyLeft}>
              <View style={styles.historyIconWrapper}>
                <Ionicons name="time-outline" size={20} color={Colors.icyBlue} />
              </View>
              <View style={styles.historyTextContainer}>
                <View style={styles.historyTitleRow}>
                  <Text style={styles.historyTitle}>Analysis History</Text>
                  {isAuthenticated && (
                    <View style={styles.cloudPill}>
                      <Ionicons name="cloud-outline" size={11} color={Colors.icyBlue} />
                      <Text style={styles.cloudPillText}>Cloud</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.historySubtitle}>
                  Access previous Reel analyses, verified destinations, and travel intelligence.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* Section C: Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.darkCard}>
            <View style={styles.preferenceRow}>
              <View style={styles.prefIconWrapper}>
                <Ionicons name="navigate-outline" size={18} color={Colors.icyBlue} />
              </View>
              <View style={styles.prefText}>
                <Text style={styles.prefTitle}>Directions App</Text>
                <Text style={styles.prefSubtitle}>Preferred mapping provider</Text>
              </View>
            </View>

            <View
              style={styles.segmentedControl}
              accessibilityRole="tablist"
              accessibilityLabel="Preferred Directions App"
            >
              <Pressable
                onPress={() => {
                  hapticFeedback.selection();
                  setPreferredMap('apple');
                }}
                style={[
                  styles.segmentOption,
                  preferredMap === 'apple' && styles.segmentOptionActive,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: preferredMap === 'apple' }}
                accessibilityLabel="Apple Maps"
              >
                <Text
                  style={[
                    styles.segmentText,
                    preferredMap === 'apple' && styles.segmentTextActive,
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
                  styles.segmentOption,
                  preferredMap === 'google' && styles.segmentOptionActive,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: preferredMap === 'google' }}
                accessibilityLabel="Google Maps"
              >
                <Text
                  style={[
                    styles.segmentText,
                    preferredMap === 'google' && styles.segmentTextActive,
                  ]}
                >
                  Google Maps
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Section D: System Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>SYSTEM STATUS</Text>
            <Pressable
              onPress={checkEngineHealth}
              disabled={isCheckingHealth}
              hitSlop={8}
              style={({ pressed }) => [styles.refreshPill, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Refresh system diagnostics"
            >
              <Ionicons
                name="refresh-outline"
                size={13}
                color={Colors.icyBlue}
                style={isCheckingHealth ? styles.rotating : undefined}
              />
              <Text style={styles.refreshPillText}>
                {isCheckingHealth ? 'Checking...' : 'Refresh'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.darkCard}>
            {/* Engine Row */}
            <View style={styles.diagnosticRow}>
              <View style={styles.diagnosticLeft}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isEngineOnline
                        ? Colors.icyBlue
                        : healthError
                        ? Colors.unverified
                        : Colors.partial,
                    },
                  ]}
                />
                <Text style={styles.diagnosticName}>FastAPI Engine Boundary</Text>
              </View>
              <Text
                style={[
                  styles.diagnosticValue,
                  isEngineOnline
                    ? styles.valueReady
                    : healthError
                    ? styles.valueMuted
                    : styles.valueAmber,
                ]}
              >
                {healthError ? 'Unreachable' : isEngineOnline ? 'Ready' : 'Degraded'}
              </Text>
            </View>

            <View style={styles.cardDivider} />

            {/* Places Service Row */}
            <View style={styles.diagnosticRow}>
              <View style={styles.diagnosticLeft}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isPlacesReady ? Colors.icyBlue : Colors.unverified,
                    },
                  ]}
                />
                <Text style={styles.diagnosticName}>Google Places Service</Text>
              </View>
              <Text
                style={[
                  styles.diagnosticValue,
                  isPlacesReady ? styles.valueReady : styles.valueMuted,
                ]}
              >
                {isPlacesReady ? 'Ready' : 'Not Configured'}
              </Text>
            </View>

            <View style={styles.cardDivider} />

            {/* Vision Service Row */}
            <View style={styles.diagnosticRow}>
              <View style={styles.diagnosticLeft}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isGeminiReady ? Colors.icyBlue : Colors.unverified,
                    },
                  ]}
                />
                <Text style={styles.diagnosticName}>Gemini Multimodal Vision</Text>
              </View>
              <Text
                style={[
                  styles.diagnosticValue,
                  isGeminiReady ? styles.valueReady : styles.valueMuted,
                ]}
              >
                {isGeminiReady ? 'Ready' : 'Not Configured'}
              </Text>
            </View>

            <View style={styles.cardDivider} />

            {/* Base URL: IP/Host ONLY shown in __DEV__, release builds show Connected / Not Connected */}
            <View style={styles.diagnosticRow}>
              <View style={styles.diagnosticLeft}>
                <Ionicons
                  name="link-outline"
                  size={14}
                  color={Colors.textMuted}
                  style={styles.metaIcon}
                />
                <Text style={styles.diagnosticName}>Engine Connection</Text>
              </View>
              <Text style={styles.diagnosticMetaValue} numberOfLines={1}>
                {__DEV__
                  ? apiClient.getBaseUrl() || 'Not Configured'
                  : isEngineOnline
                  ? 'Connected'
                  : 'Not Connected'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section E: About */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.darkCard}>
            <View style={styles.aboutRow}>
              <View style={styles.brandWordmarkRow}>
                <Text style={styles.aboutBrandText}>VAMO</Text>
                <View style={styles.brandDot} />
              </View>
              <Text style={styles.aboutVersionText}>Version {appVersion}</Text>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Intelligence Architecture</Text>
              <Text style={styles.infoValue}>Gemini Multimodal · Google Places</Text>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Privacy Principles</Text>
              <Text style={styles.infoValueHighlight}>Private by default · Ephemeral media</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </AtmosphereBackground>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xs,
    zIndex: 20,
  },
  frostedBackPill: {
    width: TouchTarget.minWidth,
    height: TouchTarget.minHeight,
    borderRadius: Radius.pill,
    backgroundColor: Colors.glassFrostedBg,
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
  },
  titleSection: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  largeTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 32,
    lineHeight: 38,
    color: Colors.ivoryMist,
    letterSpacing: -0.8,
  },
  serifAccent: {
    fontFamily: Fonts.serifItalic,
    fontSize: 36,
    color: Colors.ivoryMist,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs + 2,
    paddingHorizontal: Spacing.xs,
  },
  sectionLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.icyBlue,
    marginBottom: Spacing.xs + 2,
    paddingHorizontal: Spacing.xs,
  },
  darkCard: {
    backgroundColor: Colors.glassDarkBg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.glassDarkBorder,
    padding: Spacing.base,
  },
  // Section A: Account
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingTextCol: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  accountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    backgroundColor: Colors.onyx,
    borderWidth: 1.5,
    borderColor: Colors.glassFrostedBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarInitial: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    color: Colors.ivoryMist,
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
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.ivoryMist,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 244, 227, 0.10)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
    gap: 4,
  },
  providerBadgeText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    color: Colors.ivoryMist,
  },
  accountEmail: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: Spacing.sm,
  },
  syncStatusText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  signOutPill: {
    minHeight: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
    backgroundColor: Colors.glassFrostedBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  signOutText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  // Guest state
  guestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  guestIconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.glassFrostedBg,
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
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
    marginBottom: 4,
  },
  guestTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.ivoryMist,
  },
  localModeBadge: {
    backgroundColor: 'rgba(251, 244, 227, 0.08)',
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  localModeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.textSecondary,
  },
  guestSubtitle: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  authButtonsStack: {
    gap: Spacing.sm,
  },
  appleButton: {
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  appleButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: '#000000',
  },
  googleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  googleButton: {
    flex: 1,
    minHeight: 46,
    backgroundColor: Colors.glassFrostedBg,
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  googleButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ivoryMist,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    minHeight: 46,
    gap: 2,
  },
  detailsButtonText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  // Section B: History
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  historyIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.glassFrostedBg,
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  historyTextContainer: {
    flex: 1,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  historyTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.ivoryMist,
  },
  cloudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(166, 220, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.30)',
    gap: 4,
  },
  cloudPillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    color: Colors.icyBlue,
  },
  historySubtitle: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
  },
  // Section C: Preferences
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  prefIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.glassFrostedBg,
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  prefText: {
    flex: 1,
  },
  prefTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.ivoryMist,
    marginBottom: 2,
  },
  prefSubtitle: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.glassFrostedBg,
    borderRadius: Radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
  },
  segmentOption: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  segmentOptionActive: {
    backgroundColor: Colors.onyx,
    borderWidth: 1,
    borderColor: Colors.glassBorderActive,
  },
  segmentText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.ivoryMist,
  },
  // Section D: Diagnostics
  refreshPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassFrostedBg,
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    minHeight: 32,
    gap: 4,
  },
  refreshPillText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.icyBlue,
  },
  diagnosticRow: {
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
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  diagnosticName: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.ivoryMist,
  },
  diagnosticValue: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
  },
  diagnosticMetaValue: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    maxWidth: '52%',
  },
  valueReady: {
    color: Colors.icyBlue,
  },
  valueAmber: {
    color: Colors.partial,
  },
  valueMuted: {
    color: Colors.unverified,
  },
  metaIcon: {
    marginRight: Spacing.sm,
  },
  // Section E: About
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  brandWordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aboutBrandText: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    letterSpacing: 2.2,
    color: Colors.ivoryMist,
  },
  brandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.racingRed,
  },
  aboutVersionText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  infoLabel: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.ivoryMist,
  },
  infoValueHighlight: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.icyBlue,
  },
  // Shared Utilities
  cardDivider: {
    height: 1,
    backgroundColor: Colors.glassDarkBorder,
    marginVertical: Spacing.sm,
  },
  mbSm: {
    marginBottom: Spacing.xs,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  rotating: {
    opacity: 0.6,
  },
});
