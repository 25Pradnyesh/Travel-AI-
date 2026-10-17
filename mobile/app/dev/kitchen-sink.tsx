import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurTargetView } from 'expo-blur';
import {
  AtmosphereBackground,
  ConfidenceBadge,
  EmptyState,
  ErrorState,
  GlassInput,
  GlassView,
  LoadingState,
  PillButton,
  PillChip,
  PosterCard,
  SkeletonShimmer,
  Toast,
  toast,
} from '@/components/ui';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';
import { useNetwork } from '@/hooks/useNetwork';

// Bundled local high-resolution demo photo
const SAMPLE_PHOTO = require('@/assets/images/sample-destination.jpg');

export default function KitchenSinkScreen() {
  // Gated strictly by __DEV__
  if (!__DEV__) {
    return null;
  }

  const insets = useSafeAreaInsets();
  const network = useNetwork();
  const [backgroundMode, setBackgroundMode] = useState<'sky' | 'photo' | 'white'>('sky');
  const stripeTargetRef = React.useRef<View>(null);
  const [inputValue, setInputValue] = useState('');
  const [showInputError, setShowInputError] = useState(false);
  const [selectedChip, setSelectedChip] = useState('Beach');
  const [isPosterSaved, setIsPosterSaved] = useState(false);
  const [loadingVariant, setLoadingVariant] = useState<'card' | 'list' | 'hero'>('card');
  const [errorVariant, setErrorVariant] = useState<'network' | 'engine' | 'generic'>('generic');

  const WHITE_PHOTO_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

  const handleToggleBackground = () => {
    hapticFeedback.light();
    setBackgroundMode((prev) => {
      if (prev === 'sky') return 'photo';
      if (prev === 'photo') return 'white';
      return 'sky';
    });
  };

  const currentBgImage =
    backgroundMode === 'photo'
      ? SAMPLE_PHOTO
      : backgroundMode === 'white'
      ? { uri: WHITE_PHOTO_URI }
      : null;

  return (
    <AtmosphereBackground
      imageUrl={currentBgImage}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: Math.max(insets.bottom, 24) + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header / Back Action */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backPill, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.ivoryMist} />
            <Text style={styles.backPillText}>Back to App</Text>
          </Pressable>

          {/* Toggle Background Mode */}
          <Pressable
            onPress={handleToggleBackground}
            style={({ pressed }) => [styles.togglePill, pressed && styles.pressed]}
          >
            <Ionicons
              name={
                backgroundMode === 'photo'
                  ? 'image'
                  : backgroundMode === 'white'
                  ? 'contrast'
                  : 'color-palette'
              }
              size={14}
              color={Colors.ivoryMist}
            />
            <Text style={styles.togglePillText}>
              {backgroundMode === 'photo'
                ? 'Photo Mode'
                : backgroundMode === 'white'
                ? 'White Photo (Test)'
                : 'Sky Gradient'}
            </Text>
          </Pressable>
        </View>

        {/* Dev Route Shortcuts */}
        <View style={styles.fixturesLinkRow}>
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              router.push('/dev/atmosphere' as any);
            }}
            style={({ pressed }) => [styles.fixturesPill, pressed && styles.pressed]}
          >
            <Ionicons name="color-palette-outline" size={15} color={Colors.icyBlue} />
            <Text style={styles.fixturesPillText}>Open Atmosphere Palettes (/dev/atmosphere)</Text>
            <Ionicons name="arrow-forward" size={13} color={Colors.icyBlue} />
          </Pressable>
        </View>

        <View style={styles.fixturesLinkRow}>
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              router.push('/dev/results-fixtures');
            }}
            style={({ pressed }) => [styles.fixturesPill, pressed && styles.pressed]}
          >
            <Ionicons name="flask-outline" size={15} color={Colors.icyBlue} />
            <Text style={styles.fixturesPillText}>Open Results Fixtures Harness (/dev/results-fixtures)</Text>
            <Ionicons name="arrow-forward" size={13} color={Colors.icyBlue} />
          </Pressable>
        </View>

        {/* Section 0: Title & Contrast Audit on Dark Glass Container */}
        <View style={styles.section}>
          <GlassView variant="dark" style={styles.heroGlassCard}>
            <Text style={styles.sectionEyebrow}>PHASE 1 PRIMITIVES AUDIT</Text>
            <Text style={styles.heroTitle}>Tokyo</Text>
            <Text style={styles.headlineWithAccent}>
              Drop a reel. <Text style={styles.italicAccent}>Find the place.</Text>
            </Text>
            <Text style={styles.subhead}>
              Atmospheric Canvas & Glassmorphic Primitives
            </Text>
          </GlassView>

          {/* Contrast Numbers Card (Dark Glass variant) */}
          <GlassView variant="dark" style={styles.contrastCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.icyBlue} />
              <Text style={styles.cardHeaderText}>SCRIPT-COMPUTED CONTRAST RATIOS</Text>
            </View>
            <Text style={styles.contrastLine}>
              • Ivory Mist (#FBF4E3) on Canvas (#081218): <Text style={styles.boldScore}>17.25:1 (AAA)</Text>
            </Text>
            <Text style={styles.contrastLine}>
              • Ivory Mist on Mid-Gradient (#2F6275): <Text style={styles.boldScore}>6.13:1 (AA ≥ 4.5:1)</Text>
            </Text>
            <Text style={styles.contrastLine}>
              • Ivory Mist on Dark Glass (#0E1A22): <Text style={styles.boldScore}>16.39:1 (AAA)</Text>
            </Text>
            <Text style={styles.contrastLine}>
              • Ivory Mist on Dark Glass over Pure White: <Text style={styles.boldScore}>11.17:1 (AAA ≥ 7:1)</Text>
            </Text>
            <Text style={styles.contrastLine}>
              • Frost Tint (#A8B6BE) on Canvas: <Text style={styles.boldScore}>9.10:1 (AAA)</Text>
            </Text>
            <Text style={styles.contrastLine}>
              • Frost Tint on Dark Glass: <Text style={styles.boldScore}>8.64:1 (AAA)</Text>
            </Text>
            <Text style={styles.contrastLine}>
              • Muted Slate (#6E7E86) on Canvas: <Text style={styles.boldScore}>4.50:1 (AA)</Text>
            </Text>
            <Text style={styles.contrastLine}>
              • Onyx (#0C0C0C) on Icy Blue (#A6DCF8): <Text style={styles.boldScore}>13.24:1 (AAA)</Text>
            </Text>
            <Text style={styles.contrastLine}>
              • White on Racing Red: <Text style={styles.boldScore}>4.34:1 (Large text / icons only)</Text>
            </Text>
            <Text style={styles.platformBadge}>
              Android blur: dimezisBlurView + BlurTargetView ({Platform.OS})
            </Text>
          </GlassView>
        </View>

        {/* Section 1: Blur Test Strip */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Native Blur Test Strip</Text>
          <Text style={styles.sectionDesc}>
            High-contrast underlying stripes to visibly prove optical blur behind frosted glass (~12% opacity).
          </Text>
          <View style={styles.blurTestWrapper}>
            {/* High-contrast underlying pattern wrapped in BlurTargetView for Android */}
            <BlurTargetView ref={stripeTargetRef} style={styles.stripePattern}>
              {[...Array(12)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.stripe,
                    { backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#081218' },
                  ]}
                />
              ))}
            </BlurTargetView>

            {/* Overlaid GlassView blurring the right half */}
            <GlassView
              variant="frosted"
              blurTarget={stripeTargetRef}
              intensity={70}
              style={styles.blurTestOverlay}
            >
              <View style={styles.blurLabelPill}>
                <Text style={styles.blurOverlayText}>Frosted Glass Blur</Text>
                <Text style={styles.blurOverlaySubtext}>dimezisBlurView active</Text>
              </View>
            </GlassView>
          </View>
        </View>

        {/* Section 2: Glass Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Glass Input Pill (Frosted Chrome)</Text>
          <GlassInput
            value={inputValue}
            onChangeText={(t) => {
              setInputValue(t);
              if (showInputError) setShowInputError(false);
            }}
            onSubmit={() => {
              if (!inputValue.trim()) {
                setShowInputError(true);
              }
            }}
            error={showInputError ? 'Enter a valid Instagram Reel URL' : null}
            placeholder="Paste Instagram Reel link"
          />
        </View>

        {/* Section 3: Pill Chips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Pill Chips (Frosted Chrome)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {['Beach', 'Mountain', 'Cafés', 'Hidden Stays', 'Viewpoints'].map((cat) => (
              <PillChip
                key={cat}
                label={cat}
                selected={selectedChip === cat}
                onPress={() => setSelectedChip(cat)}
                icon={
                  <Ionicons
                    name={cat === 'Beach' ? 'sunny-outline' : cat === 'Mountain' ? 'trail-sign-outline' : 'cafe-outline'}
                    size={14}
                    color={selectedChip === cat ? Colors.ivoryMist : Colors.textSecondary}
                  />
                }
              />
            ))}
          </ScrollView>
        </View>

        {/* Section 4: Truthful PRD Verification Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. PRD Verification Badges (Truthful Styling)</Text>
          <View style={styles.badgeRow}>
            <ConfidenceBadge status="VERIFIED" />
            <ConfidenceBadge status="PARTIAL" />
            <ConfidenceBadge status="UNVERIFIED" />
          </View>
          <Text style={styles.badgeNote}>
            * Unverified is styled with honest muted slate—strictly NO Icy Blue.
          </Text>
        </View>

        {/* Section 5: Pill Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Pill Buttons</Text>
          <View style={styles.buttonRow}>
            <PillButton
              title="Brand CTA"
              variant="brand"
              onPress={() => hapticFeedback.selection()}
              iconRight={<Ionicons name="arrow-forward" size={15} color={Colors.textOnRed} />}
            />
            <PillButton
              title="Primary Onyx"
              variant="primary"
              onPress={() => hapticFeedback.selection()}
            />
            <PillButton
              title="Glass Panel"
              variant="glass"
              onPress={() => hapticFeedback.selection()}
            />
          </View>
        </View>

        {/* Section 6: Poster Cards (~3:4 Aspect Ratio) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            6. Poster Cards (~3:4) & Graceful Fallback
          </Text>
          <View style={styles.postersGrid}>
            {/* Card with Photo */}
            <View style={styles.posterColumn}>
              <Text style={styles.cardSublabel}>With Full-Bleed Photo</Text>
              <PosterCard
                title="Sample Discovery"
                subtitle="Demo reel · Full bleed"
                category="Destinations"
                imageUrl={SAMPLE_PHOTO}
                isSaved={isPosterSaved}
                onPress={() => hapticFeedback.selection()}
                onToggleSave={() => setIsPosterSaved((prev) => !prev)}
              />
            </View>

            {/* Card without Photo (Graceful Sky Atmosphere Fallback) */}
            <View style={styles.posterColumn}>
              <Text style={styles.cardSublabel}>Missing Photo Fallback</Text>
              <PosterCard
                title="Sample Discovery"
                subtitle="Demo reel · Missing photo"
                category="Mountain"
                imageUrl={null}
                isSaved={false}
                onPress={() => hapticFeedback.selection()}
              />
            </View>
          </View>
        </View>

        {/* Section 7: Skeleton Shimmer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Skeleton Shimmer Loaders</Text>
          <GlassView variant="dark" style={styles.skeletonContainer}>
            <SkeletonShimmer height={180} borderRadius={Radius.xl} />
            <View style={{ height: 12 }} />
            <SkeletonShimmer height={20} width="65%" borderRadius={Radius.sm} />
            <View style={{ height: 8 }} />
            <SkeletonShimmer height={14} width="40%" borderRadius={Radius.sm} />
          </GlassView>
        </View>

        {/* Section 8: Typography Comparison: Sans Italic vs Instrument Serif Italic */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Font Audit: Sans Italic vs Serif Italic</Text>
          <GlassView variant="dark" borderRadius={Radius.xl} style={styles.contrastCard}>
            <View style={styles.fontCompareRow}>
              <Text style={styles.fontCompareLabel}>Sans-Italic (System / Inter):</Text>
              <Text style={styles.sansItalicSample}>Finding your place. Amalfi Coast Dossier</Text>
            </View>
            <View style={[styles.fontCompareRow, { marginTop: Spacing.md }]}>
              <Text style={styles.fontCompareLabel}>Instrument Serif Italic (Signature VAMO):</Text>
              <Text style={styles.serifItalicSample}>Finding your place. Amalfi Coast Dossier</Text>
            </View>
          </GlassView>
        </View>

        {/* Section 9: Offline & 404 Error Experiences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Offline & 404 Error Experiences</Text>
          <GlassView variant="dark" borderRadius={Radius.xl} style={styles.contrastCard}>
            <Text style={styles.cardSublabel}>
              Network Status: {network.isOffline ? 'OFFLINE' : 'ONLINE'} ({network.connectionType})
            </Text>
            <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
              <PillButton
                title="Preview Dedicated Offline Screen"
                variant="brand"
                onPress={() => router.push('/offline' as any)}
                iconLeft={<Ionicons name="cloud-offline-outline" size={16} color={Colors.textOnRed} />}
              />
              <PillButton
                title="Test 404 Route (/unmatched-route-test)"
                variant="glass"
                onPress={() => router.push('/unmatched-route-test' as any)}
                iconLeft={<Ionicons name="compass-outline" size={16} color={Colors.ivoryMist} />}
              />
              <PillButton
                title={
                  network.isSimulatedOffline
                    ? 'Simulated Offline: ACTIVE (Tap to Restore)'
                    : 'Simulate Real Offline Disconnection'
                }
                variant="primary"
                onPress={() => {
                  hapticFeedback.medium();
                  network.simulateOffline(!network.isSimulatedOffline);
                }}
                iconLeft={
                  <Ionicons
                    name={network.isSimulatedOffline ? 'wifi-outline' : 'airplane-outline'}
                    size={16}
                    color={Colors.ivoryMist}
                  />
                }
              />
            </View>
          </GlassView>
        </View>

        {/* Section 10: Stage C Shared States Fixtures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Stage C: Shared States (Loading, Empty, Error, Toast)</Text>
          <GlassView variant="dark" borderRadius={Radius.xl} style={styles.contrastCard}>
            <Text style={styles.cardSublabel}>Toast Dispatcher (Safe-Area Aware, Queued)</Text>
            <View style={styles.buttonRow}>
              <PillButton
                title="Info Toast"
                variant="glass"
                size="sm"
                onPress={() => toast.info('VAMO analysis engine connected.')}
              />
              <PillButton
                title="Success Toast"
                variant="glass"
                size="sm"
                onPress={() => toast.success('Saved to your travel dossier.')}
              />
              <PillButton
                title="Warning Toast"
                variant="glass"
                size="sm"
                onPress={() => toast.warning('Places API quota running slow.')}
              />
              <PillButton
                title="Error Toast"
                variant="brand"
                size="sm"
                onPress={() => toast.error('Authentication session expired. Please sign in.')}
              />
            </View>

            <View style={{ height: Spacing.lg }} />

            <Text style={styles.cardSublabel}>LoadingState Variants (SkeletonShimmer Powered)</Text>
            <View style={styles.buttonRow}>
              <PillButton
                title="Card"
                variant={loadingVariant === 'card' ? 'primary' : 'glass'}
                size="sm"
                onPress={() => setLoadingVariant('card')}
              />
              <PillButton
                title="List"
                variant={loadingVariant === 'list' ? 'primary' : 'glass'}
                size="sm"
                onPress={() => setLoadingVariant('list')}
              />
              <PillButton
                title="Hero"
                variant={loadingVariant === 'hero' ? 'primary' : 'glass'}
                size="sm"
                onPress={() => setLoadingVariant('hero')}
              />
            </View>
            <View style={{ marginVertical: Spacing.sm }}>
              <LoadingState variant={loadingVariant} />
            </View>

            <View style={{ height: Spacing.lg }} />

            <Text style={styles.cardSublabel}>EmptyState with Instrument Serif Accent</Text>
            <View style={{ marginVertical: Spacing.sm }}>
              <EmptyState
                icon={<Ionicons name="bookmark-outline" size={28} color={Colors.icyBlue} />}
                eyebrow="SAVED VAULT"
                title="Your collection,"
                titleAccent="bookmarked."
                description="Save places from Instagram Reels to build your personal travel guide."
                actionLabel="Explore Spots"
                onActionPress={() => toast.info('Navigating to Explore')}
              />
            </View>

            <View style={{ height: Spacing.lg }} />

            <Text style={styles.cardSublabel}>ErrorState (Amber Warnings, No Red Walls)</Text>
            <View style={styles.buttonRow}>
              <PillButton
                title="Network"
                variant={errorVariant === 'network' ? 'primary' : 'glass'}
                size="sm"
                onPress={() => setErrorVariant('network')}
              />
              <PillButton
                title="Engine"
                variant={errorVariant === 'engine' ? 'primary' : 'glass'}
                size="sm"
                onPress={() => setErrorVariant('engine')}
              />
              <PillButton
                title="Generic"
                variant={errorVariant === 'generic' ? 'primary' : 'glass'}
                size="sm"
                onPress={() => setErrorVariant('generic')}
              />
            </View>
            <View style={{ marginVertical: Spacing.sm }}>
              <ErrorState
                variant={errorVariant}
                onRetry={() => toast.success('Retrying connection...')}
                onCancel={() => toast.info('Returned to previous screen')}
              />
            </View>
          </GlassView>
        </View>

        {/* Section 11: Stage C Profile & Login Modal Fixtures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Stage C: Profile & Login Screen Fixtures</Text>
          <GlassView variant="dark" borderRadius={Radius.xl} style={styles.contrastCard}>
            <Text style={styles.cardSublabel}>Live Screen Navigation</Text>
            <View style={[styles.buttonRow, { marginBottom: Spacing.lg }]}>
              <PillButton
                title="Open Profile (/profile)"
                variant="brand"
                onPress={() => router.push('/profile' as any)}
                iconLeft={<Ionicons name="person" size={15} color={Colors.textOnRed} />}
              />
              <PillButton
                title="Open Login Modal (/(auth)/login)"
                variant="glass"
                onPress={() => router.push('/(auth)/login' as any)}
                iconLeft={<Ionicons name="log-in-outline" size={15} color={Colors.ivoryMist} />}
              />
            </View>

            <Text style={styles.cardSublabel}>Apple HIG vs Google Button Comparison (Contrast Verified)</Text>
            <View style={{ gap: Spacing.sm, marginVertical: Spacing.sm }}>
              {/* Apple HIG White Button */}
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: Radius.lg,
                  minHeight: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Ionicons name="logo-apple" size={18} color="#000000" />
                <Text style={{ fontFamily: Fonts.sansSemiBold, fontSize: 14, color: '#000000' }}>
                  Sign in with Apple (HIG: White on Dark, 21:1 Contrast)
                </Text>
              </View>

              {/* Google Glass Pill */}
              <View
                style={{
                  backgroundColor: Colors.glassFrostedBg,
                  borderWidth: 1.2,
                  borderColor: Colors.glassFrostedBorder,
                  borderRadius: Radius.lg,
                  minHeight: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Ionicons name="logo-google" size={16} color={Colors.ivoryMist} />
                <Text style={{ fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.ivoryMist }}>
                  Continue with Google (Frosted Glass Pill, 14.2:1 Contrast)
                </Text>
              </View>

              {/* VAMO CLOUD Frosted Pill */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 4 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: Colors.glassFrostedBg,
                    borderWidth: 1,
                    borderColor: Colors.glassFrostedBorder,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 6,
                    borderRadius: Radius.pill,
                    gap: 6,
                  }}
                >
                  <Ionicons name="cloud" size={14} color={Colors.icyBlue} />
                  <Text
                    style={{
                      fontFamily: Fonts.sansBold,
                      fontSize: 10,
                      letterSpacing: 1.4,
                      color: Colors.icyBlue,
                      textTransform: 'uppercase',
                    }}
                  >
                    VAMO CLOUD (High Contrast Frosted Pill)
                  </Text>
                </View>
              </View>
            </View>
          </GlassView>
        </View>
      </ScrollView>
    </AtmosphereBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.72)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 6,
    minHeight: TouchTarget.minHeight,
  },
  backPillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.ivoryMist,
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.onyx,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.35)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 6,
    minHeight: TouchTarget.minHeight,
  },
  togglePillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.ivoryMist,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionEyebrow: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: Colors.icyBlue,
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    fontFamily: Fonts.serifRegular,
    fontSize: 84,
    lineHeight: 88,
    color: Colors.ivoryMist,
    letterSpacing: -1.8,
  },
  headlineWithAccent: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 28,
    lineHeight: 34,
    color: Colors.ivoryMist,
    letterSpacing: -0.6,
    marginTop: Spacing.xs,
  },
  italicAccent: {
    fontFamily: Fonts.serifItalic,
    color: Colors.ivoryMist,
  },
  fixturesLinkRow: {
    marginBottom: Spacing.xl,
  },
  fixturesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(8, 18, 24, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.35)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    minHeight: TouchTarget.minHeight,
  },
  fixturesPillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.icyBlue,
    letterSpacing: -0.1,
    flex: 1,
    marginHorizontal: 8,
  },
  heroGlassCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    marginBottom: Spacing.md,
  },
  subhead: {
    fontFamily: Fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  contrastCard: {
    padding: Spacing.base,
    borderRadius: Radius.xl,
    marginTop: Spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  cardHeaderText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
  },
  contrastLine: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginVertical: 1,
  },
  boldScore: {
    fontFamily: Fonts.sansBold,
    color: Colors.ivoryMist,
  },
  platformBadge: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.ivoryMist,
    marginBottom: Spacing.xs,
  },
  sectionDesc: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  blurTestWrapper: {
    height: 110,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  stripePattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  stripe: {
    flex: 1,
    height: '100%',
  },
  blurTestOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    bottom: 10,
    width: '60%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
  },
  blurLabelPill: {
    backgroundColor: 'rgba(8, 18, 24, 0.78)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.20)',
  },
  blurOverlayText: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.ivoryMist,
  },
  blurOverlaySubtext: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.icyBlue,
    marginTop: 2,
  },
  chipRow: {
    gap: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badgeNote: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.xs + 2,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  postersGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  posterColumn: {
    flex: 1,
  },
  cardSublabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  skeletonContainer: {
    padding: Spacing.base,
    borderRadius: Radius.xl,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  fontCompareRow: {
    gap: 4,
  },
  fontCompareLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.icyBlue,
    textTransform: 'uppercase',
  },
  sansItalicSample: {
    fontFamily: Fonts.sansMedium,
    fontStyle: 'italic',
    fontSize: 22,
    lineHeight: 28,
    color: Colors.ivoryMist,
  },
  serifItalicSample: {
    fontFamily: Fonts.serifItalic,
    fontSize: 26,
    lineHeight: 30,
    color: Colors.ivoryMist,
  },
});
