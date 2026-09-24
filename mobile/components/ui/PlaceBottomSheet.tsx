import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from './Badge';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Colors, Radius, Shadows, Spacing, TouchTarget, Typography } from '@/constants/theme';
import { openInExternalMaps } from '@/lib/maps';
import { formatCoordinates, formatDistance } from '@/lib/utils';
import { NearbyPlace } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';

export interface PlaceBottomSheetProps {
  place: NearbyPlace | null;
  photoUrl?: string;
  isPrimary?: boolean;
  onViewDetails: (place: NearbyPlace) => void;
  onClose?: () => void;
}

const PEEK_HEIGHT = 185;
const EXPANDED_HEIGHT = 420;

export const PlaceBottomSheet: React.FC<PlaceBottomSheetProps> = React.memo(({
  place,
  photoUrl,
  isPrimary = false,
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

  const imageSource = React.useMemo(() => {
    return photoUrl ? { uri: photoUrl } : undefined;
  }, [photoUrl]);

  const totalExpandedHeight = EXPANDED_HEIGHT + insets.bottom;
  const peekTranslateY = totalExpandedHeight - (PEEK_HEIGHT + insets.bottom);

  useEffect(() => {
    if (place) {
      // Default to peek when a new place is selected
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
          // Dragged upward -> expand
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
            // Collapse to peek
            handleCollapse();
          } else {
            // Dragged down from peek -> close sheet
            hapticFeedback.light();
            onClose?.();
          }
        } else {
          // Snap back to current state
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
  const categoryLabel = isPrimary ? 'PRIMARY DESTINATION' : (place.category || 'POI').toUpperCase();

  const handleOpenMaps = async () => {
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
      {/* Drag handle / Header area with gestures */}
      <View {...panResponder.panHandlers} style={styles.handleWrapper}>
        <Pressable onPress={toggleExpand} style={styles.handlePressable} hitSlop={12}>
          <View style={styles.handleBar} />
        </Pressable>
      </View>

      {/* Top Bar with Category, Chevron and Close */}
      <View style={styles.metaHeader}>
        <View style={styles.badgeRow}>
          <Badge
            label={categoryLabel}
            variant={isPrimary ? 'dark' : 'default'}
          />
          {formattedDist && !isPrimary && (
            <Text style={styles.distanceBadge}>{formattedDist}</Text>
          )}
        </View>

        <View style={styles.topActionsRow}>
          <IconButton
            size={32}
            variant="surface"
            accessibilityLabel={isExpanded ? 'Collapse preview' : 'Expand preview'}
            onPress={toggleExpand}
          >
            <Ionicons
              name={isExpanded ? 'chevron-down' : 'chevron-up'}
              size={18}
              color={Colors.textSecondary}
            />
          </IconButton>
          {onClose && (
            <IconButton
              size={32}
              variant="surface"
              accessibilityLabel="Dismiss place preview"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={16} color={Colors.textMuted} />
            </IconButton>
          )}
        </View>
      </View>

      {/* Peek Content Row */}
      <Pressable onPress={toggleExpand} style={styles.peekSummaryRow}>
        <View style={styles.thumbnailContainer}>
          {imageSource && !imageError ? (
            <Image
              source={imageSource}
              style={styles.thumbnail}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.thumbnailFallback}>
              <Ionicons
                name={isPrimary ? 'star' : 'location-outline'}
                size={22}
                color={isPrimary ? Colors.surfaceDark : Colors.textMuted}
              />
            </View>
          )}
        </View>

        <View style={styles.peekInfo}>
          <Text style={styles.placeName} numberOfLines={1}>
            {place.name}
          </Text>

          {place.formatted_address && (
            <Text style={styles.placeAddress} numberOfLines={1}>
              {place.formatted_address}
            </Text>
          )}

          <View style={styles.peekStatsRow}>
            {hasRating ? (
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingNumber}>{place.rating.toFixed(1)}</Text>
                {place.user_ratings_total != null && place.user_ratings_total > 0 && (
                  <Text style={styles.reviewsCount}>
                    ({place.user_ratings_total.toLocaleString()})
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.unratedText}>Point of Interest</Text>
            )}
          </View>
        </View>
      </Pressable>

      {/* Actions Row (Peek Mode) */}
      {!isExpanded && (
        <View style={styles.peekActionsRow}>
          <Button
            title="View Details"
            variant="primary"
            size="sm"
            onPress={() => onViewDetails(place)}
            iconRight={<Ionicons name="arrow-forward" size={14} color={Colors.canvas} />}
            style={styles.flexButton}
          />
          <Button
            title="Open in Maps"
            variant="secondary"
            size="sm"
            onPress={handleOpenMaps}
            iconRight={<Ionicons name="open-outline" size={14} color={Colors.textPrimary} />}
            style={styles.flexButton}
          />
        </View>
      )}

      {/* Expanded Details Scrollable Area */}
      {isExpanded && (
        <ScrollView
          style={styles.expandedScroll}
          contentContainerStyle={styles.expandedContent}
          showsVerticalScrollIndicator={false}
        >
          {place.formatted_address && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>FULL ADDRESS</Text>
              <Text style={styles.detailValue}>{place.formatted_address}</Text>
            </View>
          )}

          {formattedCoords && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>COORDINATES</Text>
              <Text style={styles.coordValue}>{formattedCoords}</Text>
            </View>
          )}

          {place.types && place.types.length > 0 && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>CATEGORIES</Text>
              <View style={styles.tagsRow}>
                {place.types.slice(0, 5).map((type) => (
                  <View key={type} style={styles.tagPill}>
                    <Text style={styles.tagText}>{type.replace(/_/g, ' ')}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.expandedButtonsRow}>
            <Button
              title="Full Place Dossier"
              variant="primary"
              size="md"
              onPress={() => onViewDetails(place)}
              iconRight={<Ionicons name="arrow-forward" size={16} color={Colors.canvas} />}
              style={styles.expandedMainBtn}
            />
            <Button
              title="Open in Maps"
              variant="secondary"
              size="md"
              onPress={handleOpenMaps}
              iconRight={<Ionicons name="open-outline" size={16} color={Colors.textPrimary} />}
              style={styles.expandedMapsBtn}
            />
          </View>
        </ScrollView>
      )}
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
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.lg,
    zIndex: 1000,
    paddingHorizontal: Spacing.base,
  },
  handleWrapper: {
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
  },
  handlePressable: {
    paddingVertical: 4,
    paddingHorizontal: 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderSubtle,
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
    gap: Spacing.xs,
  },
  distanceBadge: {
    ...Typography.mono,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  closeButton: {
    marginLeft: 2,
  },
  peekSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSubtle,
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
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  peekInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  placeName: {
    ...Typography.h3,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  placeAddress: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  peekStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 3,
  },
  reviewsCount: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  unratedText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textMuted,
  },
  peekActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  flexButton: {
    flex: 1,
    minHeight: TouchTarget.minHeight,
  },
  expandedScroll: {
    flex: 1,
    marginTop: Spacing.xs,
  },
  expandedContent: {
    paddingBottom: Spacing.lg,
  },
  detailItem: {
    marginBottom: Spacing.md,
  },
  detailLabel: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: 3,
  },
  detailValue: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  coordValue: {
    ...Typography.mono,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tagPill: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  expandedButtonsRow: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  expandedMainBtn: {
    width: '100%',
  },
  expandedMapsBtn: {
    width: '100%',
  },
});

export default PlaceBottomSheet;
