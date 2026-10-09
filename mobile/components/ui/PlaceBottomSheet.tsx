import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Shadows, Spacing, TouchTarget } from '@/constants/theme';
import { openInExternalMaps } from '@/lib/maps';
import { formatCoordinates, formatDistance } from '@/lib/utils';
import { NearbyPlace } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';

export interface PlaceBottomSheetProps {
  place: NearbyPlace | null;
  photoUrl?: string;
  isPrimary?: boolean;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onViewDetails: (place: NearbyPlace) => void;
  onClose?: () => void;
}

const PEEK_HEIGHT = 160;
const EXPANDED_HEIGHT = 440;

export const PlaceBottomSheet: React.FC<PlaceBottomSheetProps> = React.memo(({
  place,
  photoUrl,
  isPrimary = false,
  isSaved = false,
  onToggleSave,
  onViewDetails,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const animatedTranslateY = useRef(new Animated.Value(EXPANDED_HEIGHT + insets.bottom + 50)).current;

  useEffect(() => {
    setImageError(false);
  }, [photoUrl]);

  const hasPhoto = Boolean(
    photoUrl &&
      !imageError &&
      typeof photoUrl === 'string' &&
      photoUrl.trim().length > 0
  );

  const totalExpandedHeight = EXPANDED_HEIGHT + insets.bottom;
  const peekTranslateY = totalExpandedHeight - (PEEK_HEIGHT + insets.bottom);

  useEffect(() => {
    if (place) {
      setIsExpanded(false);
      Animated.spring(animatedTranslateY, {
        toValue: peekTranslateY,
        useNativeDriver: true,
        damping: 24,
        stiffness: 220,
      }).start();
    } else {
      Animated.timing(animatedTranslateY, {
        toValue: totalExpandedHeight + 50,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [place, peekTranslateY, totalExpandedHeight, animatedTranslateY]);

  const toggleExpand = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    if (nextState) {
      hapticFeedback.selection();
    } else {
      hapticFeedback.light();
    }
    Animated.spring(animatedTranslateY, {
      toValue: nextState ? 0 : peekTranslateY,
      useNativeDriver: true,
      damping: 24,
      stiffness: 220,
    }).start();
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    hapticFeedback.light();
    Animated.spring(animatedTranslateY, {
      toValue: peekTranslateY,
      useNativeDriver: true,
      damping: 24,
      stiffness: 220,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 8;
      },
      onPanResponderMove: (_, gestureState) => {
        const baseValue = isExpanded ? 0 : peekTranslateY;
        const target = baseValue + gestureState.dy;
        if (target >= -20 && target <= totalExpandedHeight) {
          animatedTranslateY.setValue(target);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -40) {
          setIsExpanded(true);
          hapticFeedback.selection();
          Animated.spring(animatedTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 24,
            stiffness: 220,
          }).start();
        } else if (gestureState.dy > 50) {
          if (isExpanded) {
            handleCollapse();
          } else {
            hapticFeedback.light();
            onClose?.();
          }
        } else {
          Animated.spring(animatedTranslateY, {
            toValue: isExpanded ? 0 : peekTranslateY,
            useNativeDriver: true,
            damping: 24,
            stiffness: 220,
          }).start();
        }
      },
    })
  ).current;

  if (!place) {
    return null;
  }

  const formattedDist = formatDistance(place.distance_km);
  const formattedCoords = formatCoordinates(place.latitude, place.longitude);
  const hasRating = place.rating != null && place.rating > 0;
  const categoryLabel = isPrimary ? 'DESTINATION' : (place.category || 'POINT OF INTEREST').toUpperCase();

  const handleOpenMaps = async () => {
    hapticFeedback.light();
    await openInExternalMaps({
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      formattedAddress: place.formatted_address,
      fallbackUrl: place.maps_url,
    });
  };

  return (
    <Animated.View
      style={[
        styles.sheetContainer,
        {
          height: totalExpandedHeight,
          paddingBottom: insets.bottom,
          transform: [{ translateY: animatedTranslateY }],
        },
      ]}
    >
      {/* Drag handle area */}
      <View {...panResponder.panHandlers} style={styles.handleWrapper}>
        <Pressable onPress={toggleExpand} style={styles.handlePressable} hitSlop={12}>
          <View style={styles.handleBar} />
        </Pressable>
      </View>

      {/* Top Meta Bar: Category, Distance, Save Toggle, Close */}
      <View style={styles.metaHeader}>
        <View style={styles.badgeRow}>
          <View style={[styles.categoryPill, isPrimary && styles.primaryCategoryPill]}>
            <View style={[styles.categoryDot, isPrimary && styles.primaryCategoryDot]} />
            <Text style={styles.categoryText}>{categoryLabel}</Text>
          </View>

          {formattedDist && !isPrimary ? (
            <View style={styles.distPill}>
              <Text style={styles.distText}>{formattedDist}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.topActionsRow}>
          {/* Save Bookmark Toggle */}
          {onToggleSave ? (
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                onToggleSave();
              }}
              hitSlop={8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? 'Remove from saved' : 'Save place'}
              style={({ pressed }) => [
                styles.iconActionBtn,
                isSaved && styles.savedActiveBtn,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={16}
                color={isSaved ? Colors.racingRed : Colors.ivoryMist}
              />
            </Pressable>
          ) : null}

          {/* Expand / Collapse Chevron */}
          <Pressable
            onPress={toggleExpand}
            hitSlop={8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? 'Collapse preview' : 'Expand preview'}
            style={({ pressed }) => [styles.iconActionBtn, pressed && styles.pressed]}
          >
            <Ionicons
              name={isExpanded ? 'chevron-down' : 'chevron-up'}
              size={16}
              color={Colors.ivoryMist}
            />
          </Pressable>

          {/* Dismiss Sheet */}
          {onClose ? (
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Dismiss place preview"
              style={({ pressed }) => [styles.iconActionBtn, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={16} color={Colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Peek Summary Row: Photo Thumb + Info */}
      <Pressable onPress={toggleExpand} style={styles.peekSummaryRow}>
        <View style={styles.thumbnailContainer}>
          {hasPhoto && photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.thumbnail}
              contentFit="cover"
              cachePolicy="disk"
              transition={200}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.thumbnailFallback}>
              <Ionicons
                name={isPrimary ? 'star' : 'compass-outline'}
                size={22}
                color={isPrimary ? Colors.racingRed : Colors.icyBlue}
              />
            </View>
          )}
        </View>

        <View style={styles.peekInfo}>
          <Text
            style={styles.placeName}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.85}
          >
            {place.name}
          </Text>

          {place.formatted_address ? (
            <Text style={styles.placeAddress} numberOfLines={1}>
              {place.formatted_address}
            </Text>
          ) : null}

          {/* Rating or Coordinates */}
          <View style={styles.peekStatsRow}>
            {hasRating ? (
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.ratingNumber}>{place.rating.toFixed(1)}</Text>
                {place.user_ratings_total != null && place.user_ratings_total > 0 ? (
                  <Text style={styles.reviewsCount}>
                    ({place.user_ratings_total.toLocaleString()})
                  </Text>
                ) : null}
              </View>
            ) : formattedDist ? (
              <Text style={styles.unratedText}>{formattedDist} from center</Text>
            ) : null}
          </View>
        </View>
      </Pressable>

      {/* Peek Action Bar: One-Tap Directions & View Details */}
      {!isExpanded ? (
        <View style={styles.peekActionsRow}>
          <Pressable
            onPress={handleOpenMaps}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Get directions to ${place.name}`}
            style={({ pressed }) => [styles.directionsBtn, pressed && styles.pressed]}
          >
            <Ionicons name="navigate" size={15} color="#FFFFFF" />
            <Text style={styles.directionsBtnText}>Directions</Text>
          </Pressable>

          <Pressable
            onPress={() => onViewDetails(place)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`View full dossier for ${place.name}`}
            style={({ pressed }) => [styles.detailsBtn, pressed && styles.pressed]}
          >
            <Text style={styles.detailsBtnText}>Details</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.ivoryMist} />
          </Pressable>
        </View>
      ) : null}

      {/* Expanded Mode: Scrollable Details */}
      {isExpanded ? (
        <ScrollView
          style={styles.expandedScroll}
          contentContainerStyle={styles.expandedContent}
          showsVerticalScrollIndicator={false}
        >
          {place.formatted_address ? (
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>FULL ADDRESS</Text>
              <Text style={styles.detailValue}>{place.formatted_address}</Text>
            </View>
          ) : null}

          {formattedCoords ? (
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>GEOGRAPHIC COORDINATES</Text>
              <Text style={styles.coordValue}>{formattedCoords}</Text>
            </View>
          ) : null}

          {Array.isArray(place.types) && place.types.length > 0 ? (
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>CATEGORIES & TAGS</Text>
              <View style={styles.tagsRow}>
                {place.types.slice(0, 6).map((type) => (
                  <View key={type} style={styles.tagPill}>
                    <Text style={styles.tagText}>{type.replace(/_/g, ' ')}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Action CTAs inside expanded mode */}
          <View style={styles.expandedActions}>
            <Pressable
              onPress={() => onViewDetails(place)}
              style={({ pressed }) => [styles.fullDossierBtn, pressed && styles.pressed]}
            >
              <Text style={styles.fullDossierText}>Open Full Place Dossier</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.canvas} />
            </Pressable>

            <Pressable
              onPress={handleOpenMaps}
              style={({ pressed }) => [styles.expandedMapsBtn, pressed && styles.pressed]}
            >
              <Ionicons name="open-outline" size={16} color={Colors.ivoryMist} />
              <Text style={styles.expandedMapsText}>Open in External Maps</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : null}
    </Animated.View>
  );
});

PlaceBottomSheet.displayName = 'PlaceBottomSheet';

const styles = StyleSheet.create({
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 20, 28, 0.94)',
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    ...Shadows.lg,
    zIndex: 1000,
    paddingHorizontal: Spacing.base,
  },
  handleWrapper: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  handlePressable: {
    paddingVertical: 4,
    paddingHorizontal: 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(251, 244, 227, 0.25)',
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 244, 227, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  primaryCategoryPill: {
    backgroundColor: 'rgba(235, 38, 39, 0.15)',
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
  categoryText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: Colors.ivoryMist,
  },
  distPill: {
    backgroundColor: 'rgba(166, 220, 248, 0.10)',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.20)',
  },
  distText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    color: Colors.icyBlue,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(251, 244, 227, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedActiveBtn: {
    backgroundColor: 'rgba(235, 38, 39, 0.16)',
    borderColor: 'rgba(235, 38, 39, 0.45)',
  },
  peekSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  thumbnailContainer: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(5, 11, 14, 0.60)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    marginRight: Spacing.md,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.80)',
  },
  peekInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  placeName: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 19,
    color: Colors.ivoryMist,
    letterSpacing: -0.2,
  },
  placeAddress: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  peekStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingNumber: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    color: Colors.ivoryMist,
  },
  reviewsCount: {
    fontFamily: Fonts.sansRegular,
    fontSize: 10,
    color: Colors.textMuted,
  },
  unratedText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 10,
    color: Colors.textMuted,
  },
  peekActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 8,
    paddingBottom: 4,
  },
  directionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.racingRed,
    gap: 6,
    minHeight: TouchTarget.minHeight,
  },
  directionsBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(251, 244, 227, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.20)',
    gap: 6,
    minHeight: TouchTarget.minHeight,
  },
  detailsBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.ivoryMist,
    letterSpacing: -0.1,
  },
  expandedScroll: {
    flex: 1,
    marginTop: Spacing.sm,
  },
  expandedContent: {
    paddingBottom: Spacing.lg,
  },
  detailCard: {
    backgroundColor: 'rgba(8, 18, 24, 0.70)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.12)',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
    marginBottom: 3,
  },
  detailValue: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.ivoryMist,
  },
  coordValue: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.ivoryMist,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tagPill: {
    backgroundColor: 'rgba(251, 244, 227, 0.08)',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
  },
  tagText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.ivoryMist,
    textTransform: 'capitalize',
  },
  expandedActions: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  fullDossierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.ivoryMist,
    gap: 8,
  },
  fullDossierText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.canvas,
  },
  expandedMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(251, 244, 227, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.20)',
    gap: 8,
  },
  expandedMapsText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ivoryMist,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});

export default PlaceBottomSheet;
