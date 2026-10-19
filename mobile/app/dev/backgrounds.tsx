/**
 * VAMO Mobile — Background Photos & Contrast Harness (/dev/backgrounds)
 *
 * Dedicated development route to preview, verify, and stress-test:
 * 1. The 8 proposed royalty-free bundled photos (4 nature + 4 cityscapes)
 * 2. The 4 contrast stress-test fixtures (including Pure White 1.0 worst-case)
 * 3. Real interactive UI overlays sitting on top of the live sharp photo
 * 4. WCAG 2.1 contrast calculations (Headline >= 3:1, Body on glass >= 4.5:1)
 * 5. Full attribution details (Photographer, Unsplash/Pexels license, source URL)
 */

import React, { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  AtmosphereBackground,
  GlassInput,
  GlassView,
  PillChip,
  PosterCard,
} from '@/components/ui';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import {
  PROPOSED_BACKGROUNDS,
  CONTRAST_TEST_FIXTURES,
  getPresetContrastStats,
} from '@/lib/atmosphere/background-manifest';
import { hapticFeedback } from '@/lib/haptics';

export default function BackgroundsDevScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<'proposed' | 'fixtures'>('proposed');
  const [selectedProposedIndex, setSelectedProposedIndex] = useState(0);
  const [selectedFixtureIndex, setSelectedFixtureIndex] = useState(0);

  const activeProposed = PROPOSED_BACKGROUNDS[selectedProposedIndex];
  const activeFixture = CONTRAST_TEST_FIXTURES[selectedFixtureIndex];

  const currentTitle = activeTab === 'proposed' ? activeProposed.title : activeFixture.name;
  const currentImageUrl = activeTab === 'proposed' ? activeProposed.previewUrl : activeFixture.url;
  const currentLuminance = activeTab === 'proposed' ? activeProposed.precomputedLuminance : activeFixture.luminance;

  // Calculate live contrast metrics against the selected photo's luminance
  const contrastStats = useMemo(() => {
    return getPresetContrastStats(currentLuminance);
  }, [currentLuminance]);

  const handleDismiss = () => {
    hapticFeedback.light();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleOpenSourceUrl = async (url: string) => {
    try {
      hapticFeedback.selection();
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
    } catch {
      // Quiet fallback
    }
  };

  return (
    <AtmosphereBackground imageUrl={currentImageUrl}>
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.topRow}>
          <Pressable
            onPress={handleDismiss}
            hitSlop={8}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={16} color={Colors.ivoryMist} />
            <Text style={styles.backBtnText}>Exit</Text>
          </Pressable>

          <View style={styles.headerTitlePill}>
            <Ionicons name="images-outline" size={13} color={Colors.icyBlue} />
            <Text style={styles.headerTitleText}>PHOTO HARNESS</Text>
          </View>
        </View>

        {/* Tab switcher: Proposed Photos vs Contrast Test Fixtures */}
        <View style={styles.segmentedControl}>
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setActiveTab('proposed');
            }}
            style={[
              styles.segmentTab,
              activeTab === 'proposed' && styles.segmentTabActive,
            ]}
          >
            <Text
              style={[
                styles.segmentLabel,
                activeTab === 'proposed' && styles.segmentLabelActive,
              ]}
            >
              8 Proposed Photos
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setActiveTab('fixtures');
            }}
            style={[
              styles.segmentTab,
              activeTab === 'fixtures' && styles.segmentTabActive,
            ]}
          >
            <Text
              style={[
                styles.segmentLabel,
                activeTab === 'fixtures' && styles.segmentLabelActive,
              ]}
            >
              4 Contrast Fixtures
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Selector Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.itemPickerRow}
        >
          {activeTab === 'proposed'
            ? PROPOSED_BACKGROUNDS.map((item, idx: number) => {
                const isSelected = idx === selectedProposedIndex;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      hapticFeedback.selection();
                      setSelectedProposedIndex(idx);
                    }}
                    style={[
                      styles.pickerCard,
                      isSelected && styles.pickerCardSelected,
                    ]}
                  >
                    <View style={styles.pickerCardTop}>
                      <Text style={styles.pickerCategory}>
                        {item.category.toUpperCase()}
                      </Text>
                      <View
                        style={[
                          styles.lumPill,
                          {
                            backgroundColor:
                              item.precomputedLuminance > 0.5
                                ? 'rgba(235, 38, 39, 0.25)'
                                : 'rgba(166, 220, 248, 0.20)',
                          },
                        ]}
                      >
                        <Text style={styles.lumText}>
                          L: {Math.round(item.precomputedLuminance * 100)}%
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.pickerTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.pickerAuthor} numberOfLines={1}>
                      by {item.photographer}
                    </Text>
                  </Pressable>
                );
              })
            : CONTRAST_TEST_FIXTURES.map((item, idx: number) => {
                const isSelected = idx === selectedFixtureIndex;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      hapticFeedback.selection();
                      setSelectedFixtureIndex(idx);
                    }}
                    style={[
                      styles.pickerCard,
                      isSelected && styles.pickerCardSelected,
                    ]}
                  >
                    <View style={styles.pickerCardTop}>
                      <Text style={styles.pickerCategory}>FIXTURE</Text>
                      <View style={styles.lumPill}>
                        <Text style={styles.lumText}>
                          L: {Math.round(item.luminance * 100)}%
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.pickerTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.pickerAuthor} numberOfLines={1}>
                      {item.notes}
                    </Text>
                  </Pressable>
                );
              })}
        </ScrollView>

        {/* Selected Item Metadata Card */}
        <GlassView variant="dark" borderRadius={Radius.xl} style={styles.metaGlassCard}>
          <View style={styles.metaHeaderRow}>
            <View style={styles.metaTitleCol}>
              <Text style={styles.metaItemEyebrow}>
                {activeTab === 'proposed' ? `${activeProposed.category.toUpperCase()} CANDIDATE` : 'CONTRAST TEST CASE'}
              </Text>
              <Text style={styles.metaItemTitle}>{currentTitle}</Text>
            </View>
            <View style={styles.activePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>ACTIVE BG</Text>
            </View>
          </View>

          {activeTab === 'proposed' && (
            <View style={styles.creditDetails}>
              <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>Photographer:</Text>
                <Text style={styles.creditValue}>{activeProposed.photographer}</Text>
              </View>
              <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>License:</Text>
                <Text style={styles.creditValue}>{activeProposed.license}</Text>
              </View>
              <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>Location:</Text>
                <Text style={styles.creditValue}>{activeProposed.location}</Text>
              </View>
              <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>Scrim Tint:</Text>
                <Text style={styles.creditValue}>
                  {Math.round(activeProposed.scrimStrength * 100)}% local backplate (Portrait ~1170x2532 crop)
                </Text>
              </View>

              <Pressable
                onPress={() => handleOpenSourceUrl(activeProposed.sourceUrl)}
                hitSlop={6}
                style={({ pressed }) => [styles.sourceLinkRow, pressed && styles.pressed]}
              >
                <Ionicons name="open-outline" size={13} color={Colors.icyBlue} />
                <Text style={styles.sourceLinkText}>Open Unsplash Page</Text>
              </Pressable>
            </View>
          )}

          {activeTab === 'fixtures' && (
            <Text style={styles.fixtureDescText}>{activeFixture.notes}</Text>
          )}
        </GlassView>

        {/* Live WCAG Contrast Readout Card */}
        <GlassView variant="dark" borderRadius={Radius.xl} style={styles.contrastCard}>
          <View style={styles.contrastHeaderRow}>
            <View style={styles.contrastHeaderLeft}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.icyBlue} />
              <Text style={styles.contrastHeaderTitle}>WCAG 2.1 CONTRAST VERIFICATION</Text>
            </View>
            <View
              style={[
                styles.wcagPassBadge,
                contrastStats.headlinePass && contrastStats.bodyPass
                  ? styles.badgePass
                  : styles.badgeFail,
              ]}
            >
              <Text style={styles.wcagPassText}>
                {contrastStats.headlinePass && contrastStats.bodyPass ? 'PASS AA' : 'CHECK'}
              </Text>
            </View>
          </View>

          <View style={styles.contrastGrid}>
            <View style={styles.contrastMetric}>
              <Text style={styles.contrastMetricLabel}>Headline on Backplate</Text>
              <Text style={styles.contrastMetricVal}>
                {contrastStats.headlineRatio.toFixed(2)}:1
              </Text>
              <Text style={styles.contrastTarget}>Target: ≥ 3.0:1 (Large)</Text>
            </View>

            <View style={styles.contrastMetric}>
              <Text style={styles.contrastMetricLabel}>Body Text on Dark Glass</Text>
              <Text style={styles.contrastMetricVal}>
                {contrastStats.bodyRatio.toFixed(2)}:1
              </Text>
              <Text style={styles.contrastTarget}>Target: ≥ 4.5:1 (Normal)</Text>
            </View>
          </View>

          <View style={[styles.contrastGrid, { marginTop: Spacing.sm }]}>
            <View style={styles.contrastMetric}>
              <Text style={styles.contrastMetricLabel}>Secondary Label on Glass</Text>
              <Text style={styles.contrastMetricVal}>
                {contrastStats.secondaryRatio.toFixed(2)}:1
              </Text>
              <Text style={styles.contrastTarget}>Target: ≥ 4.5:1 (Normal)</Text>
            </View>

            <View style={styles.contrastMetric}>
              <Text style={styles.contrastMetricLabel}>Base Photo Luminance</Text>
              <Text style={styles.contrastMetricVal}>
                {(currentLuminance * 100).toFixed(1)}%
              </Text>
              <Text style={styles.contrastTarget}>Raw linear sRGB</Text>
            </View>
          </View>
        </GlassView>

        {/* LIVE REAL UI OVERLAYS TEST BENCH */}
        <Text style={styles.testBenchHeading}>LIVE UI OVERLAYS TEST BENCH</Text>

        {/* 1. Huge Display Headline sitting directly on photo */}
        <View style={styles.headlineContainer}>
          <Text style={styles.headlineEyebrow}>DESTINATION IDENTIFIED</Text>
          <Text style={styles.hugeDisplayHeadline}>
            {currentTitle}
          </Text>
          <View style={styles.liveLocationPill}>
            <Ionicons name="location-sharp" size={13} color={Colors.icyBlue} />
            <Text style={styles.liveLocationText}>
              Verified Atmosphere · Photo Mode
            </Text>
          </View>
        </View>

        {/* 2. Glass Input Pill */}
        <View style={styles.inputPreviewWrap}>
          <GlassInput
            value="https://www.instagram.com/reel/C8xyzExample1/"
            placeholder="Paste Instagram Reel link"
            onChangeText={() => {}}
            onSubmit={() => hapticFeedback.selection()}
            onClear={() => {}}
          />
        </View>

        {/* 3. Category PillChips */}
        <View style={styles.chipsRow}>
          <PillChip label="Hidden Stays" count={4} selected={true} onPress={() => {}} />
          <PillChip label="Viewpoints" count={12} selected={false} onPress={() => {}} />
          <PillChip label="Cafés" count={7} selected={false} onPress={() => {}} />
        </View>

        {/* 4. PosterCard preview */}
        <View style={styles.posterPreview}>
          <View style={{ width: Math.round(screenWidth * 0.70) }}>
            <PosterCard
              title={currentTitle}
              subtitle="Verified Destination Discovery"
              imageUrl={currentImageUrl}
              category="Verified Spot"
              isSaved={false}
              onPress={() => hapticFeedback.light()}
              onToggleSave={() => hapticFeedback.selection()}
            />
          </View>
        </View>
      </ScrollView>
    </AtmosphereBackground>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    zIndex: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.20)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    gap: 6,
    minHeight: TouchTarget.minHeight,
  },
  backBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ivoryMist,
  },
  headerTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.35)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    gap: 6,
  },
  headerTitleText: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.icyBlue,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(8, 18, 24, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    borderRadius: Radius.pill,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  segmentTabActive: {
    backgroundColor: Colors.onyx,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.28)',
  },
  segmentLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  segmentLabelActive: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.ivoryMist,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  itemPickerRow: {
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.base,
  },
  pickerCard: {
    width: 170,
    backgroundColor: 'rgba(8, 18, 24, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
  },
  pickerCardSelected: {
    borderColor: Colors.icyBlue,
    borderWidth: 1.5,
    backgroundColor: 'rgba(10, 24, 34, 0.92)',
  },
  pickerCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pickerCategory: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.icyBlue,
  },
  lumPill: {
    backgroundColor: 'rgba(251, 244, 227, 0.12)',
    borderRadius: Radius.pill,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  lumText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    color: Colors.ivoryMist,
  },
  pickerTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ivoryMist,
    marginBottom: 2,
  },
  pickerAuthor: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  metaGlassCard: {
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.18)',
    marginBottom: Spacing.base,
  },
  metaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  metaTitleCol: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  metaItemEyebrow: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
    marginBottom: 2,
  },
  metaItemTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 18,
    color: Colors.ivoryMist,
    letterSpacing: -0.3,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(166, 220, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.35)',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.icyBlue,
  },
  activeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.icyBlue,
  },
  creditDetails: {
    gap: 4,
    marginTop: 4,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  creditLabel: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  creditValue: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.ivoryMist,
  },
  sourceLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing.xs + 2,
    alignSelf: 'flex-start',
  },
  sourceLinkText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.icyBlue,
    textDecorationLine: 'underline',
  },
  fixtureDescText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.ivoryMist,
  },
  contrastCard: {
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.18)',
    marginBottom: Spacing.lg,
  },
  contrastHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  contrastHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contrastHeaderTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: Colors.icyBlue,
  },
  wcagPassBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgePass: {
    backgroundColor: 'rgba(166, 220, 248, 0.20)',
    borderWidth: 1,
    borderColor: Colors.icyBlue,
  },
  badgeFail: {
    backgroundColor: 'rgba(235, 38, 39, 0.20)',
    borderWidth: 1,
    borderColor: Colors.racingRed,
  },
  wcagPassText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.ivoryMist,
  },
  contrastGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  contrastMetric: {
    flex: 1,
    backgroundColor: 'rgba(6, 12, 16, 0.60)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.10)',
  },
  contrastMetricLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  contrastMetricVal: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    color: Colors.ivoryMist,
    letterSpacing: -0.2,
  },
  contrastTarget: {
    fontFamily: Fonts.sansRegular,
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
  },
  testBenchHeading: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: Colors.icyBlue,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  headlineContainer: {
    marginBottom: Spacing.lg,
  },
  headlineEyebrow: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: Colors.icyBlue,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hugeDisplayHeadline: {
    fontFamily: Fonts.serifItalic,
    fontSize: 54,
    lineHeight: 58,
    color: Colors.ivoryMist,
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.90)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  liveLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(8, 18, 24, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    marginTop: 8,
  },
  liveLocationText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.ivoryMist,
  },
  inputPreviewWrap: {
    marginBottom: Spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  posterPreview: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
