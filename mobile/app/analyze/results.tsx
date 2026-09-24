import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Chip,
  ConfidenceBadge,
  EmptyState,
  IconButton,
  ImageCard,
  PlaceCard,
  SectionHeader,
  StatCard,
  TopBar,
} from '@/components/ui';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { analysisStore } from '@/lib/api/analysis-store';
import { openInExternalMaps } from '@/lib/maps';
import { useSavedPlaces } from '@/lib/storage/saved-places';
import { NearbyPlace, TravelIntelligence } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';

export default function ResultsScreen() {
  const { data, sourceUrl } = analysisStore.getAnalysisResult();
  const { isSaved, toggleSave } = useSavedPlaces();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeSegment, setActiveSegment] = useState<'Overview' | 'Places'>('Overview');
  const entranceFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entranceFade, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [entranceFade]);

  const bestGuess = data?.best_guess;
  const ti = (data?.travel_intelligence || {}) as TravelIntelligence;
  const nearbyPlaces = Array.isArray(data?.nearby_places) ? data.nearby_places : [];
  const gemini = data?.gemini;
  const performance = data?.performance;

  // Extract location subtitle: City, Region, Country
  const locationSubtitle = useMemo(() => {
    if (!bestGuess) return '';
    return [bestGuess.city, bestGuess.region, bestGuess.country]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .join(', ');
  }, [bestGuess]);

  // Extract category filters for nearby places
  const categories = useMemo(() => {
    const set = new Set<string>();
    nearbyPlaces.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [nearbyPlaces]);

  // Pre-compute single-pass category counts O(N)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: nearbyPlaces.length };
    nearbyPlaces.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [nearbyPlaces]);

  // Filtered places
  const filteredPlaces = useMemo(() => {
    if (activeCategory === 'All') return nearbyPlaces;
    return nearbyPlaces.filter((p) => p.category === activeCategory);
  }, [nearbyPlaces, activeCategory]);

  const handleBack = React.useCallback(() => {
    router.replace('/');
  }, []);

  const handleOpenMap = React.useCallback(() => {
    router.push('/analyze/map');
  }, []);

  const handleOpenDestinationMaps = React.useCallback(async () => {
    if (!bestGuess) return;
    await openInExternalMaps({
      latitude: bestGuess.latitude,
      longitude: bestGuess.longitude,
      name: bestGuess.name,
      formattedAddress: bestGuess.formatted_address,
      fallbackUrl: bestGuess.maps_url,
    });
  }, [bestGuess]);

  const handleOpenPlaceDirections = React.useCallback(async (place: NearbyPlace) => {
    await openInExternalMaps({
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      formattedAddress: place.formatted_address,
      fallbackUrl: place.maps_url,
    });
  }, []);

  const handleOpenSourceReel = React.useCallback(async () => {
    if (!sourceUrl) return;
    try {
      const canOpen = await Linking.canOpenURL(sourceUrl);
      if (canOpen) {
        await Linking.openURL(sourceUrl);
      }
    } catch {
      // Ignore link open failure
    }
  }, [sourceUrl]);

  const handleOpenPlace = React.useCallback((place: NearbyPlace) => {
    router.push({
      pathname: '/place/[id]',
      params: {
        id: place.place_id,
        name: place.name,
      },
    });
  }, []);

  // If no analysis is available in memory
  if (!data || !bestGuess) {
    return (
      <View style={styles.screen}>
        <TopBar title="Destination Dossier" showBack onBackPress={handleBack} />
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={<Ionicons name="compass-outline" size={32} color={Colors.textMuted} />}
            eyebrow="NO ANALYSIS ACTIVE"
            title="No Destination Selected"
            description="Paste an Instagram travel reel on the Analyze screen to extract verified coordinates and places."
            actionLabel="Go to Analyze"
            onActionPress={handleBack}
          />
        </View>
      </View>
    );
  }

  // Resolve hero image
  const heroImageUrl = useMemo(() => {
    const primaryPhoto = Array.isArray(bestGuess?.photos) ? bestGuess.photos[0] : undefined;
    return analysisStore.resolvePhotoUrl(primaryPhoto?.url);
  }, [bestGuess?.photos]);

  // Normalize travel tips
  const tipsList = useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(ti.travel_tips)) {
      ti.travel_tips.forEach((t) => {
        if (typeof t === 'string' && t.trim()) list.push(t.trim());
      });
    } else if (ti.travel_tips && typeof ti.travel_tips === 'object') {
      const rawTips = ti.travel_tips as Record<string, unknown>;
      ['travel_tips', 'local_tips', 'safety_tips'].forEach((k) => {
        const arr = rawTips[k];
        if (Array.isArray(arr)) {
          arr.forEach((t) => {
            if (typeof t === 'string' && t.trim()) list.push(t.trim());
          });
        }
      });
    }
    return list;
  }, [ti.travel_tips]);

  return (
    <View style={styles.screen}>
      <TopBar
        title={bestGuess.name}
        showBack
        onBackPress={handleBack}
        rightAction={
          <View style={styles.topRightActions}>
            <IconButton
              size={36}
              variant="subtle"
              accessibilityLabel={
                isSaved(bestGuess.place_id || 'primary_destination')
                  ? 'Remove destination from saved'
                  : 'Save destination'
              }
              onPress={() => toggleSave(bestGuess, heroImageUrl)}
            >
              <Ionicons
                name={
                  isSaved(bestGuess.place_id || 'primary_destination')
                    ? 'bookmark'
                    : 'bookmark-outline'
                }
                size={18}
                color={
                  isSaved(bestGuess.place_id || 'primary_destination')
                    ? Colors.textPrimary
                    : Colors.textSecondary
                }
              />
            </IconButton>
            <IconButton
              size={36}
              variant="subtle"
              accessibilityLabel="View exploration map"
              onPress={handleOpenMap}
            >
              <Ionicons name="map-outline" size={18} color={Colors.textPrimary} />
            </IconButton>
            {sourceUrl ? (
              <IconButton
                size={36}
                variant="subtle"
                accessibilityLabel="View original Reel on Instagram"
                onPress={handleOpenSourceReel}
              >
                <Ionicons name="logo-instagram" size={18} color={Colors.textPrimary} />
              </IconButton>
            ) : null}
          </View>
        }
      />

      <Animated.View style={{ flex: 1, opacity: entranceFade }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Destination Hero Photography Card */}
          <View style={styles.heroWrapper}>
            <ImageCard
              imageUrl={heroImageUrl}
              title={bestGuess.name}
              subtitle={locationSubtitle || 'Identified Travel Destination'}
              photoCount={Array.isArray(bestGuess.photos) ? bestGuess.photos.length : 0}
              badge={
                <ConfidenceBadge
                  status={bestGuess.verification_status}
                  confidence={bestGuess.confidence}
                />
              }
            />
          </View>

          {/* View Switcher Segments */}
          <View style={styles.segmentRow}>
            <Pressable
              onPress={() => {
                hapticFeedback.selection();
                setActiveSegment('Overview');
              }}
              style={({ pressed }) => [
                styles.segmentButton,
                activeSegment === 'Overview' && styles.segmentButtonActive,
                pressed && styles.segmentButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeSegment === 'Overview' && styles.segmentTextActive,
                ]}
              >
                Overview & Briefing
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                hapticFeedback.selection();
                setActiveSegment('Places');
              }}
              style={({ pressed }) => [
                styles.segmentButton,
                activeSegment === 'Places' && styles.segmentButtonActive,
                pressed && styles.segmentButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeSegment === 'Places' && styles.segmentTextActive,
                ]}
              >
                Places ({nearbyPlaces.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                hapticFeedback.light();
                handleOpenMap();
              }}
              style={({ pressed }) => [
                styles.segmentButton,
                pressed && styles.segmentButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open interactive exploration map"
            >
              <View style={styles.mapSegmentContent}>
                <Ionicons name="map-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.segmentText}>Map</Text>
              </View>
            </Pressable>
          </View>

        {activeSegment === 'Overview' ? (
          <View style={styles.overviewSection}>
            {/* Interactive Cartography Preview Banner */}
            <Pressable
              onPress={handleOpenMap}
              style={({ pressed }) => [
                styles.mapBannerCard,
                pressed && styles.mapBannerPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open interactive exploration map"
            >
              <View style={styles.mapBannerLeft}>
                <View style={styles.mapBannerIcon}>
                  <Ionicons name="map" size={18} color={Colors.canvas} />
                </View>
                <View style={styles.mapBannerText}>
                  <Text style={styles.mapBannerEyebrow}>INTERACTIVE CARTOGRAPHY</Text>
                  <Text style={styles.mapBannerTitle}>
                    {nearbyPlaces.length > 0
                      ? `Explore ${bestGuess.name} & ${nearbyPlaces.length} Nearby Places`
                      : `View ${bestGuess.name} on Interactive Map`}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </Pressable>

            {/* Identification Evidence Dossier */}
            {bestGuess.why ? (
              <View style={styles.evidenceCard}>
                <View style={styles.evidenceHeader}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={Colors.verified} />
                  <Text style={styles.evidenceLabel}>IDENTIFICATION EVIDENCE</Text>
                </View>
                <Text style={styles.evidenceBody}>{bestGuess.why}</Text>
                {gemini?.used && gemini.reason ? (
                  <View style={styles.geminiNoteRow}>
                    <Ionicons name="sparkles" size={13} color={Colors.surfaceDark} />
                    <Text style={styles.geminiNoteText}>{gemini.reason}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Travel Summary */}
            {ti.travel_summary ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>ABOUT THE DESTINATION</Text>
                <Text style={styles.summaryBody}>{ti.travel_summary}</Text>
              </View>
            ) : null}

            {/* Practical Travel Intelligence Metrics */}
            <SectionHeader eyebrow="TRAVEL BRIEFING" title="Trip Intelligence" />

            <View style={styles.statsGrid}>
              {ti.best_season ? (
                <StatCard
                  label="Optimal Window"
                  value={ti.best_season}
                  subtitle={
                    Array.isArray(ti.peak_months) && ti.peak_months.length > 0
                      ? `Peak: ${ti.peak_months.join(', ')}`
                      : 'Recommended time'
                  }
                  icon={<Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />}
                  style={styles.statCard}
                />
              ) : null}

              {ti.estimated_daily_budget || ti.budget_level ? (
                <StatCard
                  label="Daily Budget"
                  value={ti.estimated_daily_budget || 'Moderate'}
                  subtitle={ti.budget_level ? `${ti.budget_level} Tier (${ti.currency || 'USD'})` : 'Average daily cost'}
                  icon={<Ionicons name="wallet-outline" size={16} color={Colors.textMuted} />}
                  style={styles.statCard}
                />
              ) : null}
            </View>

            {ti.recommended_trip_days ? (
              <View style={styles.stayBanner}>
                <Ionicons name="time-outline" size={16} color={Colors.textPrimary} />
                <Text style={styles.stayBannerText}>
                  Recommended Stay: <Text style={styles.stayBold}>{ti.recommended_trip_days}</Text>
                </Text>
              </View>
            ) : null}

            {/* Local Travel Advice List */}
            {tipsList.length > 0 ? (
              <View style={styles.tipsSection}>
                <SectionHeader eyebrow="PRACTICAL GUIDANCE" title="Local Travel Advice" />
                {tipsList.slice(0, 5).map((tip, idx) => (
                  <View key={idx} style={styles.tipCard}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={Colors.verified} style={styles.tipIcon} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Open Destination in External Maps */}
            <View style={styles.openMapsSection}>
              <Button
                title="Open in Maps"
                variant="secondary"
                size="md"
                onPress={handleOpenDestinationMaps}
                iconRight={<Ionicons name="open-outline" size={16} color={Colors.textPrimary} />}
                accessibilityLabel={`Open ${bestGuess.name} in maps`}
                style={styles.openMapsButton}
              />
            </View>

            {/* Source Reel Attribution */}
            {sourceUrl ? (
              <View style={styles.sourceSection}>
                <SectionHeader eyebrow="ATTRIBUTION" title="Source Content" />
                <Pressable
                  onPress={handleOpenSourceReel}
                  style={({ pressed }) => [styles.sourceCard, pressed && styles.sourceCardPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Open original Instagram Reel"
                >
                  <View style={styles.sourceLeft}>
                    <View style={styles.sourceIconBox}>
                      <Ionicons name="logo-instagram" size={20} color={Colors.canvas} />
                    </View>
                    <View style={styles.sourceInfo}>
                      <Text style={styles.sourceType}>ORIGINAL INSTAGRAM REEL</Text>
                      <Text style={styles.sourceUrlText} numberOfLines={1}>
                        {sourceUrl}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="open-outline" size={18} color={Colors.textSecondary} />
                </Pressable>
              </View>
            ) : null}

            {/* Performance Telemetry Diagnostics */}
            {typeof performance?.total_seconds === 'number' && Number.isFinite(performance.total_seconds) ? (
              <View style={styles.telemetryFooter}>
                <Text style={styles.telemetryText}>
                  Engine Resolution Time: {performance.total_seconds.toFixed(2)}s
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.placesSection}>
            <View style={styles.placesHeaderRow}>
              <SectionHeader
                eyebrow="SURROUNDING HIGHLIGHTS"
                title="Points of Interest"
                rightActionLabel={`${filteredPlaces.length} locations`}
              />
              <Button
                title="View All on Map"
                variant="secondary"
                size="sm"
                onPress={handleOpenMap}
                iconLeft={<Ionicons name="map-outline" size={14} color={Colors.textPrimary} />}
                style={styles.viewMapButton}
              />
            </View>

            {/* Category Filter Chips */}
            {categories.length > 2 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryChipsRow}
              >
                {categories.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    selected={activeCategory === cat}
                    onPress={() => {
                      hapticFeedback.selection();
                      setActiveCategory(cat);
                    }}
                    count={categoryCounts[cat] ?? 0}
                  />
                ))}
              </ScrollView>
            )}

            {filteredPlaces.length > 0 ? (
              filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.place_id || place.name}
                  name={place.name}
                  category={place.category}
                  formattedAddress={place.formatted_address}
                  rating={place.rating}
                  userRatingsTotal={place.user_ratings_total}
                  distanceKm={place.distance_km}
                  isSaved={isSaved(place.place_id)}
                  onPress={() => handleOpenPlace(place)}
                  onSavePress={() => toggleSave(place)}
                  onDirectionsPress={() => handleOpenPlaceDirections(place)}
                />
              ))
            ) : (
              <EmptyState
                icon={<Ionicons name="location-outline" size={28} color={Colors.textMuted} />}
                eyebrow="CATEGORY FILTER"
                title="No Places in this Category"
                description={`No surrounding points of interest matching '${activeCategory}' were detected.`}
                actionLabel="Show All Places"
                onActionPress={() => setActiveCategory('All')}
              />
            )}
          </View>
        )}
      </ScrollView>
      </Animated.View>
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
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.huge,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.base,
  },
  heroWrapper: {
    marginBottom: Spacing.base,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.lg,
    padding: 3,
    marginBottom: Spacing.base,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  segmentButtonActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  segmentButtonPressed: {
    opacity: 0.75,
  },
  segmentText: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  segmentTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  overviewSection: {
    gap: Spacing.xs,
  },
  evidenceCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  evidenceLabel: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.verified,
    marginLeft: Spacing.xs,
  },
  evidenceBody: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  geminiNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  geminiNoteText: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
    flex: 1,
    lineHeight: 16,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  summaryBody: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
  },
  stayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stayBannerText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  stayBold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tipsSection: {
    marginBottom: Spacing.md,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.sm,
  },
  tipIcon: {
    marginTop: 2,
    marginRight: Spacing.sm,
  },
  tipText: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  sourceSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sourceCardPressed: {
    opacity: 0.8,
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  sourceIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceType: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  sourceUrlText: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  telemetryFooter: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  telemetryText: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.textMuted,
  },
  placesSection: {
    marginTop: Spacing.xs,
  },
  placesHeaderRow: {
    marginBottom: Spacing.xs,
  },
  viewMapButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  categoryChipsRow: {
    paddingBottom: Spacing.md,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  mapSegmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mapBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  mapBannerPressed: {
    opacity: 0.85,
    borderColor: Colors.borderFocus,
  },
  mapBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  mapBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  mapBannerText: {
    flex: 1,
  },
  mapBannerEyebrow: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  mapBannerTitle: {
    ...Typography.h3,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  openMapsSection: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  openMapsButton: {
    width: '100%',
  },
});
