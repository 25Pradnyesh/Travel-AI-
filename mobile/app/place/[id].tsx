import React, { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, EmptyState, IconButton, TopBar } from '@/components/ui';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { analysisStore } from '@/lib/api/analysis-store';
import { openInExternalMaps } from '@/lib/maps';
import { formatCoordinates, formatDistance } from '@/lib/utils';
import { useSavedPlaces } from '@/lib/storage/saved-places';
import { hapticFeedback } from '@/lib/haptics';

export default function PlaceDetailScreen() {
  const { id, name: paramName } = useLocalSearchParams<{ id: string; name?: string }>();
  const { isSaved, toggleSave, savedPlaces } = useSavedPlaces();
  const [imageError, setImageError] = useState(false);

  // Look up place from active analysis session first, then reactive savedPlaces for cold-start resilience
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

  const photoUrl = useMemo(() => {
    if (!id) return undefined;
    const storePhoto = analysisStore.getPlacePhotoUrl(id);
    if (storePhoto) return storePhoto;
    const foundSaved = savedPlaces.find((p) => p.id === id);
    return analysisStore.resolvePhotoUrl(foundSaved?.photo);
  }, [id, savedPlaces]);

  const isBookmarked = isSaved(place?.place_id || id);

  const handleDismiss = () => {
    hapticFeedback.light();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleToggleSave = async () => {
    if (!place) return;
    await toggleSave(place, photoUrl);
  };

  const handleOpenMaps = async () => {
    if (!place) return;
    hapticFeedback.light();
    await openInExternalMaps({
      latitude: place.latitude,
      longitude: place.longitude,
      name: displayName,
      formattedAddress: place.formatted_address,
      fallbackUrl: place.maps_url,
    });
  };

  const handleViewOnMap = () => {
    hapticFeedback.light();
    router.push('/analyze/map');
  };

  if (!place) {
    return (
      <View style={styles.screen}>
        <TopBar title={displayName} showBack onBackPress={handleDismiss} />
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={<Ionicons name="map-outline" size={32} color={Colors.textMuted} />}
            title="Place Details Unavailable"
            description="Could not locate details for this point of interest. It may not exist in the active session or your saved collection."
            actionLabel="Go Back"
            onActionPress={handleDismiss}
          />
        </View>
      </View>
    );
  }

  const coordinatesFormatted = formatCoordinates(place.latitude, place.longitude);
  const distanceFormatted = formatDistance(place.distance_km);
  const hasRating = place.rating != null && place.rating > 0;
  const isPrimary = place.category === 'Primary Destination';

  return (
    <View style={styles.screen}>
      <TopBar
        title="Place Dossier"
        showBack
        onBackPress={handleDismiss}
        rightAction={
          <View style={styles.topRightActions}>
            <IconButton
              size={36}
              variant="surface"
              accessibilityLabel={isBookmarked ? 'Remove from saved' : 'Save place'}
              onPress={handleToggleSave}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isBookmarked ? Colors.textPrimary : Colors.textSecondary}
              />
            </IconButton>
            <IconButton
              size={36}
              variant="surface"
              accessibilityLabel="Close place details"
              onPress={handleDismiss}
            >
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </IconButton>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Drag Handle Indicator */}
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

        {/* Hero Imagery if available */}
        {photoUrl && !imageError && (
          <View style={styles.heroWrapper}>
            <Image
              source={{ uri: photoUrl }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          </View>
        )}

        {/* Identity & Header */}
        <View style={styles.header}>
          {place?.category && (
            <View style={styles.badgeRow}>
              <Badge
                label={isPrimary ? 'PRIMARY DESTINATION' : place.category.toUpperCase()}
                variant={isPrimary ? 'dark' : 'default'}
              />
            </View>
          )}

          <Text style={styles.title}>{displayName}</Text>

          {place?.formatted_address && (
            <View style={styles.addressRow}>
              <Ionicons
                name="location-outline"
                size={15}
                color={Colors.textMuted}
                style={styles.addressIcon}
              />
              <Text style={styles.addressText}>{place.formatted_address}</Text>
            </View>
          )}
        </View>

        {/* Metric Cards Row */}
        <View style={styles.metricsRow}>
          {hasRating && (
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>RATING</Text>
              <View style={styles.ratingValueRow}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.ratingValue}>{place?.rating.toFixed(1)}</Text>
              </View>
              {place?.user_ratings_total != null && place.user_ratings_total > 0 && (
                <Text style={styles.metricSub}>
                  {place.user_ratings_total.toLocaleString()} reviews
                </Text>
              )}
            </View>
          )}

          {distanceFormatted && !isPrimary && (
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>DISTANCE</Text>
              <Text style={styles.metricValue}>{distanceFormatted}</Text>
              <Text style={styles.metricSub}>from destination</Text>
            </View>
          )}
        </View>

        {/* Coordinates */}
        {coordinatesFormatted && (
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>COORDINATES</Text>
            <Text style={styles.coordText}>{coordinatesFormatted}</Text>
          </View>
        )}

        {/* Types / Categories */}
        {place?.types && place.types.length > 0 && (
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>CATEGORIES & TAGS</Text>
            <View style={styles.typesRow}>
              {place.types.slice(0, 6).map((type) => (
                <View key={type} style={styles.typePill}>
                  <Text style={styles.typeText}>{type.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions: Save / Unsave + Open in Maps + View on Map */}
        <View style={styles.actionSection}>
          <Button
            title={isBookmarked ? 'Saved in Locker' : 'Save Place'}
            onPress={handleToggleSave}
            variant={isBookmarked ? 'secondary' : 'primary'}
            size="lg"
            iconLeft={
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={16}
                color={isBookmarked ? Colors.textPrimary : Colors.canvas}
              />
            }
            accessibilityLabel={isBookmarked ? 'Remove from saved places' : 'Save this place'}
            style={styles.actionButton}
          />

          <Button
            title="Open in Maps"
            onPress={handleOpenMaps}
            variant="secondary"
            size="md"
            iconRight={<Ionicons name="open-outline" size={16} color={Colors.textPrimary} />}
            accessibilityLabel={`Open ${displayName} in maps`}
            style={styles.actionButton}
          />

          <Button
            title="View on Interactive Map"
            onPress={handleViewOnMap}
            variant="secondary"
            size="md"
            iconLeft={<Ionicons name="map-outline" size={16} color={Colors.textPrimary} />}
            accessibilityLabel="View location on exploration map"
            style={styles.actionButton}
          />
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
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.huge,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.base,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderSubtle,
  },
  heroWrapper: {
    width: '100%',
    height: 200,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSubtle,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.sm,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  header: {
    marginBottom: Spacing.lg,
  },
  badgeRow: {
    marginBottom: Spacing.xs + 2,
  },
  title: {
    ...Typography.h1,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  addressIcon: {
    marginTop: 2,
    marginRight: Spacing.xs,
  },
  addressText: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  metricLabel: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  ratingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  metricValue: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  metricSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
  },
  detailLabel: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: Spacing.xs + 2,
  },
  coordText: {
    ...Typography.mono,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  typePill: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  typeText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  actionSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
});
