/**
 * VAMO — TravelOceanError Component
 *
 * Immersive editorial error screen featuring a wooden sailboat sailing
 * across the ocean at sunset.
 *
 * Distinctly supports:
 * 1. 'offline': Network disconnection (drifting offline, retry mechanism)
 * 2. 'not-found': Route or resource 404 (uncharted waters, navigation back to home)
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  DimensionValue,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';
import PillButton from './PillButton';

// Bundled local image asset — never relies on remote network connection
export const BOAT_SUNSET_IMAGE = require('@/assets/images/boat-sunset.jpg');

export type TravelErrorMode = 'offline' | 'not-found';

export interface TravelOceanErrorProps {
  mode?: TravelErrorMode;
  headline?: string;
  supportingText?: string;
  onRetry?: () => Promise<void> | void;
  onBackHome?: () => void;
  retryLabel?: string;
  homeLabel?: string;
  showHomeAction?: boolean;
  isRetrying?: boolean;
  statusLabel?: string;
  style?: StyleProp<ViewStyle>;
  customNotice?: string | null;
}

export const TravelOceanError: React.FC<TravelOceanErrorProps> = ({
  mode = 'offline',
  headline,
  supportingText,
  onRetry,
  onBackHome,
  retryLabel = 'Try Again',
  homeLabel = 'Back to Home',
  showHomeAction = true,
  isRetrying: externalIsRetrying,
  statusLabel,
  style,
  customNotice,
}) => {
  const insets = useSafeAreaInsets();
  const [internalIsRetrying, setInternalIsRetrying] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const isRetrying = externalIsRetrying ?? internalIsRetrying;

  const isOfflineMode = mode === 'offline';

  // Default editorial copy matching VAMO specifications
  const displayHeadline =
    headline ||
    (isOfflineMode ? "Looks like we've drifted offline" : 'Lost at sea?');

  const displaySupportingText =
    supportingText ||
    (isOfflineMode
      ? 'Your next adventure is still waiting. Check your internet connection and try again.'
      : "We couldn't find the page you're looking for. Let's get you back on course.");

  const displayStatusLabel =
    statusLabel ||
    (isOfflineMode ? 'CONNECTION LOST' : '404 • UNCHARTED ROUTE');

  const activeNotice = customNotice || feedbackNotice;

  const handleRetryPress = async () => {
    if (isRetrying || !onRetry) return;

    hapticFeedback.medium();
    setFeedbackNotice(null);
    setInternalIsRetrying(true);

    try {
      await onRetry();
    } catch {
      hapticFeedback.warning();
      setFeedbackNotice('Still offline. Check your internet connection and try again.');
    } finally {
      setInternalIsRetrying(false);
    }
  };

  const handleHomePress = () => {
    if (onBackHome) {
      hapticFeedback.light();
      onBackHome();
    }
  };

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`${displayHeadline}. ${displaySupportingText}`}
    >
      {/* 1. HERO BACKGROUND: Bundled local sailboat sunset artwork */}
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={BOAT_SUNSET_IMAGE}
          style={styles.heroImage}
          contentFit="cover"
          contentPosition="center"
          cachePolicy="none"
          priority="high"
        />

        {/* Top subtle vignette protecting the VAMO chrome and status label */}
        <LinearGradient
          colors={['rgba(5, 11, 14, 0.75)', 'rgba(5, 11, 14, 0.35)', 'transparent']}
          locations={[0, 0.45, 1]}
          style={styles.topVignette}
          pointerEvents="none"
        />

        {/* Smooth cinematic transition from ocean sunset into deep Onyx-Teal canvas */}
        <LinearGradient
          colors={[
            'transparent',
            'rgba(8, 18, 24, 0.30)',
            'rgba(8, 18, 24, 0.72)',
            'rgba(8, 18, 24, 0.94)',
            Colors.canvas,
          ]}
          locations={[0, 0.35, 0.60, 0.82, 1]}
          style={styles.bottomVignette}
          pointerEvents="none"
        />
      </View>

      {/* 2. SCROLL CONTENT: Designed for all screen sizes including small Androids */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, Spacing.base) + Spacing.sm,
            paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.base,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* TOP SECTION: Discreet VAMO Wordmark + Status Label */}
        <View style={styles.topBar}>
          <View style={styles.brandPill}>
            <Text style={styles.brandText}>VAMO</Text>
            <View style={styles.brandDot} />
          </View>

          <View
            style={[
              styles.statusPill,
              isOfflineMode ? styles.statusOfflinePill : styles.statusNotFoundPill,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isOfflineMode ? Colors.icyBlue : '#E5A866',
                },
              ]}
            />
            <Text style={styles.statusLabelText}>{displayStatusLabel}</Text>
          </View>
        </View>

        {/* HERO SPACER: Preserves generous view of the boat and sunset horizon */}
        <View style={styles.heroFocalSpacer} />

        {/* CONTENT SECTION: Headline, Supporting Text, Action CTAs */}
        <View style={styles.contentCard}>
          {/* Editorial Serif Display Headline */}
          <Text
            style={styles.headline}
            maxFontSizeMultiplier={1.3}
            accessibilityRole="header"
          >
            {displayHeadline}
          </Text>

          {/* Calm, reassuring supporting message */}
          <Text style={styles.supportingText} maxFontSizeMultiplier={1.3}>
            {displaySupportingText}
          </Text>

          {/* Feedback Notice Banner (when still offline after retry) */}
          {activeNotice ? (
            <View
              style={styles.noticeBanner}
              accessible={true}
              accessibilityRole="alert"
            >
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={Colors.icyBlue}
                style={styles.noticeIcon}
              />
              <Text style={styles.noticeText}>{activeNotice}</Text>
            </View>
          ) : null}

          {/* ACTIONS ROW */}
          <View style={styles.buttonStack}>
            {/* Primary Action */}
            {isOfflineMode ? (
              <PillButton
                title={isRetrying ? 'Checking Connection...' : retryLabel}
                variant="brand"
                size="lg"
                onPress={handleRetryPress}
                loading={isRetrying}
                disabled={isRetrying}
                iconLeft={
                  !isRetrying ? (
                    <Ionicons name="refresh" size={17} color={Colors.textOnRed} />
                  ) : undefined
                }
                style={styles.primaryBtn}
                accessibilityLabel={retryLabel}
                accessibilityHint="Rechecks your network connection"
              />
            ) : (
              <PillButton
                title={homeLabel}
                variant="brand"
                size="lg"
                onPress={handleHomePress}
                iconLeft={
                  <Ionicons name="compass-outline" size={18} color={Colors.textOnRed} />
                }
                style={styles.primaryBtn}
                accessibilityLabel={homeLabel}
                accessibilityHint="Navigates back to the VAMO home screen"
              />
            )}

            {/* Secondary Action (Back to Home for offline mode) */}
            {isOfflineMode && showHomeAction && onBackHome && (
              <PillButton
                title={homeLabel}
                variant="glass"
                size="md"
                onPress={handleHomePress}
                iconLeft={
                  <Ionicons name="compass-outline" size={16} color={Colors.ivoryMist} />
                }
                style={styles.secondaryBtn}
                accessibilityLabel={homeLabel}
                accessibilityHint="Navigates back to the VAMO home screen"
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  bottomVignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '68%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    marginBottom: Spacing.md,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 6,
  },
  brandText: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    letterSpacing: 2.2,
    color: Colors.ivoryMist,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.racingRed,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
  },
  statusOfflinePill: {
    backgroundColor: 'rgba(8, 18, 24, 0.72)',
    borderColor: 'rgba(166, 220, 248, 0.35)',
  },
  statusNotFoundPill: {
    backgroundColor: 'rgba(8, 18, 24, 0.72)',
    borderColor: 'rgba(229, 168, 102, 0.35)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabelText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.ivoryMist,
    textTransform: 'uppercase',
  },
  heroFocalSpacer: {
    flex: 1,
    minHeight: 120,
  },
  contentCard: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingBottom: Spacing.sm,
  },
  headline: {
    fontFamily: Fonts.serifItalic,
    fontSize: 34,
    lineHeight: 38,
    color: Colors.ivoryMist,
    textAlign: 'left',
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  },
  supportingText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: 'left',
    marginBottom: Spacing.xl,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 20, 28, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.28)',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  noticeIcon: {
    marginTop: 1,
  },
  noticeText: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.ivoryMist,
  },
  buttonStack: {
    gap: Spacing.md,
    width: '100%',
  },
  primaryBtn: {
    width: '100%',
    shadowColor: Colors.racingRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  secondaryBtn: {
    width: '100%',
  },
});

export default TravelOceanError;
