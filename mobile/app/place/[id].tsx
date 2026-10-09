import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  AtmosphereBackground,
  EmptyState,
  GlassView,
} from '@/components/ui';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { analysisStore } from '@/lib/api/analysis-store';
import { openInExternalMaps } from '@/lib/maps';
import { formatCoordinates, formatDistance } from '@/lib/utils';
import { useSavedPlaces } from '@/lib/storage/saved-places';
import { hapticFeedback } from '@/lib/haptics';

export default function PlaceDetailScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { id, name: paramName } = useLocalSearchParams<{ id: string; name?: string }>();
  const { isSaved, toggleSave, savedPlaces } = useSavedPlaces();
  const [imageError, setImageError] = useState(false);

  // 1. Look up place from active analysis session first, then reactive savedPlaces for cold-start resilience
  const place = useMemo(() => {
    if (!id) return null;
    const storePlace = analysisStore.getPlaceById(id);
    if (storePlace) return storePlace;

    const foundSaved = savedPlaces.find((p) => p.id === id);
    if (foundSaved) {
      return {
        place_id: foundSaved.id,
        name: foundSaved.name,
        formatted_address: foundSaved.address || '',
        latitude: foundSaved.latitude,
        longitude: foundSaved.longitude,
        rating: foundSaved.rating || 0,
        user_ratings_total: foundSaved.review_count || 0,
        types: foundSaved.tags || [],
        distance_km: foundSaved.distance,
        maps_url: foundSaved.maps_url || '',
        category: foundSaved.category || 'Saved Place',
      };
    }
    return null;
  }, [id, savedPlaces]);

  const displayName = place?.name || paramName || 'Place Details';

  // 2. Photo URL resolution from store or saved places fallback
  const photoUrl = useMemo(() => {
    if (!id) return undefined;
    const storePhoto = analysisStore.getPlacePhotoUrl(id);
    if (storePhoto) return storePhoto;
    const foundSaved = savedPlaces.find((p) => p.id === id);
    return analysisStore.resolvePhotoUrl(foundSaved?.photo);
  }, [id, savedPlaces]);

  React.useEffect(() => {
    setImageError(false);
  }, [photoUrl]);

  const hasPhoto = Boolean(
    photoUrl &&
      !imageError &&
      typeof photoUrl === 'string' &&
      photoUrl.trim().length > 0
  );

  const isBookmarked = isSaved(place?.place_id || id || '');

  const handleDismiss = React.useCallback(() => {
    hapticFeedback.light();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/analyze/results');
    }
  }, []);

  const handleToggleSave = React.useCallback(async () => {
    if (!place) return;
    hapticFeedback.light();
    await toggleSave(place, photoUrl);
  }, [place, photoUrl, toggleSave]);

  const handleOpenMaps = React.useCallback(async () => {
    if (!place) return;
    hapticFeedback.light();
    await openInExternalMaps({
      latitude: place.latitude,
      longitude: place.longitude,
      name: displayName,
      formattedAddress: place.formatted_address,
      fallbackUrl: place.maps_url,
    });
  }, [place, displayName]);

  const handleViewOnMap = React.useCallback(() => {
    hapticFeedback.light();
    router.push('/analyze/map');
  }, []);

  if (!place) {
    return (
      <AtmosphereBackground variant="sky">
        <View style={[styles.fallbackTopBar, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
          <Pressable onPress={handleDismiss} style={styles.pillBackBtn}>
            <Ionicons name="arrow-back" size={16} color={Colors.ivoryMist} />
            <Text style={styles.pillBackText}>Back</Text>
          </Pressable>
        </View>
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={<Ionicons name="compass-outline" size={36} color={Colors.icyBlue} />}
            eyebrow="POI UNAVAILABLE"
            title="Place Details Unavailable"
            description="Could not locate details for this point of interest. It may not exist in the active session or your saved collection."
            actionLabel="Return to Discoveries"
            onActionPress={handleDismiss}
          />
        </View>
      </AtmosphereBackground>
    );
  }

  const coordinatesFormatted = formatCoordinates(place.latitude, place.longitude);
  const distanceFormatted = formatDistance(place.distance_km);
  const hasRating = place.rating != null && place.rating > 0;
  const isPrimary = place.category === 'Primary Destination';
  const categoryLabel = isPrimary ? 'DESTINATION' : (place.category || 'POINT OF INTEREST').toUpperCase();

  // Shorter poster-hero height (~40% of screen height, min 320px)
  const heroHeight = Math.max(320, Math.round(screenHeight * 0.40));
  const scrollBottomPadding = 64 + Math.max(insets.bottom, 12) + Spacing.xl;

  return (
    <View style={styles.screen}>
      <AtmosphereBackground variant="sky">
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: scrollBottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Poster Hero Modal Header (~320-360px) */}
          <View style={[styles.heroContainer, { height: heroHeight }]}>
            {hasPhoto ? (
              <Image
                source={{ uri: photoUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="disk"
                transition={250}
                onError={() => setImageError(true)}
              />
            ) : (
              <LinearGradient
                colors={Colors.atmosphereSky}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
              >
                <View style={styles.watermarkContainer}>
                  <Ionicons name="compass-outline" size={88} color="rgba(251, 244, 227, 0.12)" />
                </View>
              </LinearGradient>
            )}

            {/* Top Vignette Scrim */}
            <LinearGradient
              colors={['rgba(5, 11, 14, 0.55)', 'transparent']}
              locations={[0, 1]}
              style={styles.topVignette}
            />

            {/* Deep Bottom Vignette Scrim */}
            <LinearGradient
              colors={[
                'transparent',
                'rgba(5, 11, 14, 0.30)',
                'rgba(5, 11, 14, 0.82)',
                'rgba(8, 18, 24, 1)',
              ]}
              locations={[0, 0.28, 0.68, 1]}
              style={StyleSheet.absoluteFill}
            />

            {/* Floating Top Bar (Back and Category Pill) */}
            <View
              style={[
                styles.heroTopBar,
                { paddingTop: Math.max(insets.top, 16) + 4 },
              ]}
            >
              <Pressable
                onPress={handleDismiss}
                hitSlop={8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Back"
                style={({ pressed }) => [styles.pillBackBtn, pressed && styles.pressed]}
              >
                <GlassView variant="frosted" borderRadius={Radius.pill} style={styles.pillBackGlass}>
                  <Ionicons name="arrow-back" size={16} color={Colors.ivoryMist} />
                  <Text style={styles.pillBackText}>Back</Text>
                </GlassView>
              </Pressable>

              <View style={[styles.categoryBadge, isPrimary && styles.primaryCategoryBadge]}>
                <View style={[styles.categoryDot, isPrimary && styles.primaryCategoryDot]} />
                <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
              </View>
            </View>

            {/* Bottom Hero Content: Title & Location Pill */}
            <View style={styles.heroBottomContent}>
              <Text
                style={styles.heroTitle}
                numberOfLines={2}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.65}
              >
                {displayName}
              </Text>

              {place.formatted_address ? (
                <View style={styles.locationPill}>
                  <Ionicons name="location-sharp" size={13} color={Colors.icyBlue} />
                  <Text
                    style={styles.locationPillText}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.85}
                  >
                    {place.formatted_address}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* 2. Metadata Rows (ONLY fields that exist!) */}
          <View style={styles.metaSection}>
            {/* Metric Row: Rating & Distance */}
            {(hasRating || (distanceFormatted && !isPrimary)) ? (
              <View style={styles.metricsRow}>
                {hasRating ? (
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeaderRow}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.metricLabel}>RATING</Text>
                    </View>
                    <View style={styles.ratingNumberRow}>
                      <Text style={styles.metricValLarge}>{place.rating.toFixed(1)}</Text>
                      {place.user_ratings_total != null && place.user_ratings_total > 0 ? (
                        <Text style={styles.reviewsCount}>
                          ({place.user_ratings_total.toLocaleString()})
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ) : null}

                {distanceFormatted && !isPrimary ? (
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeaderRow}>
                      <Ionicons name="navigate-outline" size={14} color={Colors.icyBlue} />
                      <Text style={styles.metricLabel}>DISTANCE</Text>
                    </View>
                    <Text style={styles.metricValLarge}>{distanceFormatted}</Text>
                    <Text style={styles.metricSub}>from center</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Coordinates Row (only if coordinates valid) */}
            {coordinatesFormatted ? (
              <View style={styles.dataCard}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="globe-outline" size={13} color={Colors.icyBlue} />
                  <Text style={styles.cardHeaderLabel}>COORDINATES</Text>
                </View>
                <Text style={styles.coordText}>{coordinatesFormatted}</Text>
              </View>
            ) : null}

            {/* Categories & Tags (only if types exist) */}
            {Array.isArray(place.types) && place.types.length > 0 ? (
              <View style={styles.dataCard}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="pricetags-outline" size={13} color={Colors.icyBlue} />
                  <Text style={styles.cardHeaderLabel}>TAGS & ATTRIBUTES</Text>
                </View>
                <View style={styles.typesRow}>
                  {place.types.slice(0, 6).map((type) => (
                    <View key={type} style={styles.typeTag}>
                      <Text style={styles.typeTagText}>{type.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* 3. Sticky Floating Glass Action Bar: Save + View on Map + Directions */}
        <View
          style={[
            styles.floatingBarWrapper,
            { bottom: Math.max(insets.bottom, 12) + 6 },
          ]}
          pointerEvents="box-none"
        >
          <GlassView
            variant="dark"
            borderRadius={Radius.pill}
            intensity={85}
            style={styles.floatingBar}
          >
            {/* Save Toggle */}
            <Pressable
              onPress={handleToggleSave}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isBookmarked ? 'Remove from saved' : 'Save place'}
              style={({ pressed }) => [
                styles.actionBtn,
                isBookmarked && styles.savedActiveBtn,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isBookmarked ? Colors.racingRed : Colors.ivoryMist}
              />
              <Text style={styles.actionBtnText}>{isBookmarked ? 'Saved' : 'Save'}</Text>
            </Pressable>

            <View style={styles.actionDivider} />

            {/* View on Exploration Map */}
            <Pressable
              onPress={handleViewOnMap}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="View location on exploration map"
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            >
              <Ionicons name="map-outline" size={18} color={Colors.icyBlue} />
              <Text style={styles.actionBtnText}>Map</Text>
            </Pressable>

            <View style={styles.actionDivider} />

            {/* External Directions */}
            <Pressable
              onPress={handleOpenMaps}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Get directions to ${displayName}`}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            >
              <Ionicons name="navigate-outline" size={18} color={Colors.ivoryMist} />
              <Text style={styles.actionBtnText}>Directions</Text>
            </Pressable>
          </GlassView>
        </View>
      </AtmosphereBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  scrollContent: {
    flexGrow: 1,
  },
  fallbackTopBar: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  heroContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Colors.canvas,
    justifyContent: 'space-between',
  },
  watermarkContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 2,
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    zIndex: 10,
  },
  pillBackBtn: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
    minHeight: TouchTarget.minHeight,
    justifyContent: 'center',
  },
  pillBackGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    gap: 6,
    backgroundColor: 'rgba(8, 18, 24, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.20)',
  },
  pillBackText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ivoryMist,
    letterSpacing: -0.2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  primaryCategoryBadge: {
    backgroundColor: 'rgba(235, 38, 39, 0.16)',
    borderColor: 'rgba(235, 38, 39, 0.40)',
  },
  categoryDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.icyBlue,
  },
  primaryCategoryDot: {
    backgroundColor: Colors.racingRed,
  },
  categoryBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: Colors.ivoryMist,
  },
  heroBottomContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base,
    zIndex: 6,
  },
  heroTitle: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 42,
    lineHeight: 46,
    color: Colors.ivoryMist,
    letterSpacing: -0.6,
  },
  locationPill: {
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
    maxWidth: '96%',
  },
  locationPillText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.ivoryMist,
    letterSpacing: -0.1,
  },
  metaSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    gap: Spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 28, 0.78)',
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.14)',
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  metricLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
  },
  ratingNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValLarge: {
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    color: Colors.ivoryMist,
  },
  reviewsCount: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  metricSub: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dataCard: {
    backgroundColor: 'rgba(10, 20, 28, 0.78)',
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.14)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardHeaderLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
  },
  coordText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.ivoryMist,
    letterSpacing: 0.3,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeTag: {
    backgroundColor: 'rgba(251, 244, 227, 0.08)',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
  },
  typeTagText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.ivoryMist,
    textTransform: 'capitalize',
  },
  floatingBarWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  floatingBar: {
    width: '100%',
    maxWidth: 380,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(10, 20, 28, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 6,
    minHeight: TouchTarget.minHeight,
    borderRadius: Radius.pill,
  },
  savedActiveBtn: {
    backgroundColor: 'rgba(235, 38, 39, 0.10)',
  },
  actionBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ivoryMist,
    letterSpacing: -0.2,
  },
  actionDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(251, 244, 227, 0.12)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});
