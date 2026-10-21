/**
 * VAMO Mobile — 22 Bundled Background Photos Harness (/dev/backgrounds)
 *
 * Dedicated route to view, verify, and confirm all 22 bundled background photographs:
 * 1. Thumbnail + Full Portrait Crop Preview (1170x2532 WebP <= 250KB)
 * 2. Exact Filename
 * 3. True one-line visual description from inspection
 * 4. Place mapping {city?, country?, name?, region?} extracted strictly from filenames
 * 5. Focal point coordinates
 * 6. Interactive full-screen preview and live UI contrast stress-test
 */

import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
} from '@/components/ui';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import {
  BUNDLED_BACKGROUNDS,
  BundledBackground,
} from '@/lib/atmosphere/background-manifest';
import { hapticFeedback } from '@/lib/haptics';

export default function BackgroundsDevScreen() {
  const insets = useSafeAreaInsets();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activePhoto: BundledBackground =
    BUNDLED_BACKGROUNDS[selectedIndex] || BUNDLED_BACKGROUNDS[0];

  const handleDismiss = () => {
    hapticFeedback.light();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <AtmosphereBackground imageUrl={activePhoto.source}>
      {/* Top Header */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.topRow}>
          <Pressable
            onPress={handleDismiss}
            hitSlop={8}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Exit photo harness"
          >
            <Ionicons name="arrow-back" size={16} color={Colors.ivoryMist} />
            <Text style={styles.backBtnText}>Exit</Text>
          </Pressable>

          <View style={styles.headerTitlePill}>
            <Ionicons name="images-outline" size={13} color={Colors.icyBlue} />
            <Text style={styles.headerTitleText}>22 BUNDLED PHOTOS HARNESS</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================== */}
        {/* Section 1: Collection Overview Banner */}
        {/* ================================================== */}
        <GlassView variant="dark" borderRadius={Radius.xl} style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View style={styles.overviewIconCircle}>
              <Ionicons name="folder-open-outline" size={20} color={Colors.icyBlue} />
            </View>
            <View style={styles.overviewTextCol}>
              <Text style={styles.overviewTitle}>22 Bundled Travel Photographs</Text>
              <Text style={styles.overviewSubtitle}>
                Source: &quot;homepage img&quot; · 1170×2532 WebP (all ≤ 250KB) · Double-buffered root slideshow (4s hold, 900ms crossfade)
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.overviewNote}>
            Rule compliance: Honest one-line visual descriptions. Place names mapped strictly from filenames
            and presented below for user confirmation. No artificial credits or invented photographers.
          </Text>
        </GlassView>

        {/* ================================================== */}
        {/* Section 2: Active Selected Photo Details & UI Stress Test */}
        {/* ================================================== */}
        <GlassView variant="dark" borderRadius={Radius.xl} style={styles.activeDetailCard}>
          <View style={styles.activeHeaderRow}>
            <View style={styles.activeBadgeRow}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBadgeText}>ACTIVE PREVIEW (#{selectedIndex + 1} of 22)</Text>
            </View>
            <Text style={styles.filenameText}>{activePhoto.filename}</Text>
          </View>

          <Text style={styles.activeDescriptionText}>{activePhoto.description}</Text>

          <View style={styles.metaPillsRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillLabel}>Focal Point:</Text>
              <Text style={styles.metaPillVal}>
                ({activePhoto.focal.x}, {activePhoto.focal.y})
              </Text>
            </View>

            <View style={styles.metaPill}>
              <Text style={styles.metaPillLabel}>Place Mapping:</Text>
              <Text style={styles.metaPillVal}>
                {activePhoto.place
                  ? `${activePhoto.place.city || activePhoto.place.name || activePhoto.place.region || ''}, ${activePhoto.place.country || ''}`.replace(/^, /, '')
                  : 'Generic (No place named)'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Live UI Overlay Contrast Sample */}
          <Text style={styles.overlaySectionTitle}>UI CONTRAST & LEGIBILITY TEST OVER ACTIVE PHOTO</Text>
          <View style={styles.editorialMockup}>
            <Text style={styles.mockupEyebrow}>TRAVEL DISCOVERY</Text>
            <Text style={styles.mockupTitle}>
              Ethereal Waters. <Text style={styles.serifAccent}>Untamed.</Text>
            </Text>
            <Text style={styles.mockupSubtitle}>
              WCAG AAA contrast over dark glass backplate.
            </Text>
          </View>

          <View style={styles.mockupChipsRow}>
            <PillChip label="Verified Land" selected={true} onPress={() => {}} />
            <PillChip label="Scenic Peak" onPress={() => {}} />
            <PillChip label="Local Culture" onPress={() => {}} />
          </View>

          <GlassInput
            value=""
            onChangeText={() => {}}
            onSubmit={() => {}}
            placeholder="Search verified destinations..."
            style={{ marginTop: Spacing.sm }}
          />
        </GlassView>

        {/* ================================================== */}
        {/* Section 3: All 22 Photos Grid */}
        {/* ================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="grid-outline" size={16} color={Colors.icyBlue} />
          <Text style={styles.sectionHeading}>ALL 22 PHOTOS & PLACE MAPPINGS</Text>
        </View>

        <View style={styles.photosGrid}>
          {BUNDLED_BACKGROUNDS.map((photo, idx) => {
            const isSelected = idx === selectedIndex;
            const hasPlace = Boolean(photo.place);

            return (
              <Pressable
                key={photo.id}
                onPress={() => {
                  hapticFeedback.selection();
                  setSelectedIndex(idx);
                }}
                style={({ pressed }) => [
                  styles.photoCard,
                  isSelected && styles.photoCardActive,
                  pressed && styles.pressed,
                ]}
              >
                {/* Portrait Crop Preview Thumbnail (1170x2532 ratio) */}
                <View style={styles.cropPreviewWrapper}>
                  <Image
                    source={photo.source}
                    style={styles.cropPreviewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.idxBadge}>
                    <Text style={styles.idxBadgeText}>#{idx + 1}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.selectedPill}>
                      <Ionicons name="checkmark-circle" size={12} color={Colors.verified} />
                      <Text style={styles.selectedPillText}>ACTIVE</Text>
                    </View>
                  )}
                </View>

                {/* Photo Information & Place Mapping */}
                <View style={styles.photoInfo}>
                  <Text style={styles.cardFilename} numberOfLines={1}>
                    {photo.filename}
                  </Text>

                  <Text style={styles.cardDescription} numberOfLines={3}>
                    {photo.description}
                  </Text>

                  <View style={styles.cardDivider} />

                  <View style={styles.placeRow}>
                    <Text style={styles.placeLabel}>Place:</Text>
                    <View
                      style={[
                        styles.placeBadge,
                        hasPlace ? styles.placeBadgeMapped : styles.placeBadgeNone,
                      ]}
                    >
                      <Ionicons
                        name={hasPlace ? 'location' : 'help-circle-outline'}
                        size={11}
                        color={hasPlace ? Colors.verified : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.placeBadgeText,
                          hasPlace ? styles.placeTextMapped : styles.placeTextNone,
                        ]}
                        numberOfLines={1}
                      >
                        {hasPlace
                          ? `${photo.place?.city || photo.place?.name || photo.place?.region || ''}${
                              photo.place?.country ? `, ${photo.place?.country}` : ''
                            }`
                          : 'None in filename'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.focalRow}>
                    <Text style={styles.focalLabel}>Focal Point:</Text>
                    <Text style={styles.focalValue}>
                      x: {photo.focal.x}, y: {photo.focal.y}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </AtmosphereBackground>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(5, 11, 14, 0.40)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TouchTarget.minHeight,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassFrostedBg,
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    gap: 4,
  },
  backBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.ivoryMist,
  },
  headerTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 14, 18, 0.85)',
    borderWidth: 1,
    borderColor: Colors.glassDarkBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    gap: 6,
  },
  headerTitleText: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  overviewCard: {
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  overviewIconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(92, 198, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewTextCol: {
    flex: 1,
  },
  overviewTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.ivoryMist,
    marginBottom: 2,
  },
  overviewSubtitle: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.glassDarkBorder,
    marginVertical: Spacing.md,
  },
  overviewNote: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  activeDetailCard: {
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  activeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.verified,
  },
  activeBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.verified,
  },
  filenameText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.icyBlue,
  },
  activeDescriptionText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 14,
    color: Colors.ivoryMist,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  metaPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 244, 227, 0.06)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.10)',
  },
  metaPillLabel: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  metaPillVal: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.ivoryMist,
  },
  overlaySectionTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
    marginBottom: Spacing.sm,
  },
  editorialMockup: {
    marginBottom: Spacing.sm,
  },
  mockupEyebrow: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.icyBlue,
    marginBottom: 2,
  },
  mockupTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 22,
    color: Colors.ivoryMist,
    letterSpacing: -0.5,
  },
  serifAccent: {
    fontFamily: Fonts.serifItalic,
    fontSize: 24,
    color: Colors.ivoryMist,
  },
  mockupSubtitle: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  mockupChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionHeading: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
  },
  photosGrid: {
    gap: Spacing.md,
  },
  photoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.glassDarkBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassDarkBorder,
    overflow: 'hidden',
    padding: Spacing.sm,
    gap: Spacing.md,
  },
  photoCardActive: {
    borderColor: Colors.icyBlue,
    backgroundColor: 'rgba(18, 30, 40, 0.92)',
  },
  cropPreviewWrapper: {
    width: 90,
    height: 145, // roughly 1170x2532 portrait ratio
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.onyx,
  },
  cropPreviewImage: {
    width: '100%',
    height: '100%',
  },
  idxBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(8, 14, 18, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  idxBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    color: Colors.ivoryMist,
  },
  selectedPill: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: 'rgba(8, 14, 18, 0.90)',
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  selectedPillText: {
    fontFamily: Fonts.sansBold,
    fontSize: 8,
    color: Colors.verified,
  },
  photoInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardFilename: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.ivoryMist,
    marginBottom: 4,
  },
  cardDescription: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: Spacing.xs,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(251, 244, 227, 0.08)',
    marginVertical: 4,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  placeLabel: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  placeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    maxWidth: '75%',
  },
  placeBadgeMapped: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.30)',
  },
  placeBadgeNone: {
    backgroundColor: 'rgba(251, 244, 227, 0.05)',
  },
  placeBadgeText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
  },
  placeTextMapped: {
    color: Colors.verified,
  },
  placeTextNone: {
    color: Colors.textMuted,
  },
  focalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  focalLabel: {
    fontFamily: Fonts.sansRegular,
    fontSize: 10,
    color: Colors.textMuted,
  },
  focalValue: {
    fontFamily: Fonts.sansRegular,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  pressed: {
    opacity: 0.85,
  },
});
