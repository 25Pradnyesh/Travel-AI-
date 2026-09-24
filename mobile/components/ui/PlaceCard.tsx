import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadows, Spacing, TouchTarget, Typography } from '@/constants/theme';
import { formatDistance } from '@/lib/utils';

export interface PlaceCardProps {
  name: string;
  category?: string;
  formattedAddress?: string;
  rating?: number;
  userRatingsTotal?: number;
  distanceKm?: number | null;
  photoUrl?: string;
  isSaved?: boolean;
  onPress: () => void;
  onSavePress?: () => void;
  onDirectionsPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const PlaceCard: React.FC<PlaceCardProps> = React.memo(({
  name,
  category = 'Highlight',
  formattedAddress,
  rating,
  userRatingsTotal,
  distanceKm,
  photoUrl,
  isSaved = false,
  onPress,
  onSavePress,
  onDirectionsPress,
  style,
}) => {
  const [imageError, setImageError] = useState(false);
  const formattedDist = formatDistance(distanceKm);
  const hasRating = rating != null && rating > 0;

  // Reset image error if URL changes
  React.useEffect(() => {
    setImageError(false);
  }, [photoUrl]);

  const imageSource = React.useMemo(() => {
    return photoUrl ? { uri: photoUrl } : undefined;
  }, [photoUrl]);

  const handleSavePress = (e: any) => {
    e?.stopPropagation?.();
    onSavePress?.();
  };

  const handleDirectionsPress = (e: any) => {
    e?.stopPropagation?.();
    onDirectionsPress?.();
  };

  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${category}${formattedDist ? `, ${formattedDist}` : ''}`}
      style={({ pressed }) => [styles.container, pressed && styles.pressed, style]}
    >
      <View style={styles.thumbnailContainer}>
        {imageSource && !imageError ? (
          <Image
            source={imageSource}
            style={styles.thumbnail}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="location-outline" size={24} color={Colors.textMuted} />
          </View>
        )}
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.topRow}>
          <Text style={styles.categoryText} numberOfLines={1}>
            {category.toUpperCase()}
          </Text>
          {formattedDist && <Text style={styles.distanceText}>{formattedDist}</Text>}
        </View>

        <Text style={styles.nameText} numberOfLines={1}>
          {name}
        </Text>

        {formattedAddress && (
          <Text style={styles.addressText} numberOfLines={1}>
            {formattedAddress}
          </Text>
        )}

        <View style={styles.bottomRow}>
          {hasRating ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.ratingText}>{rating?.toFixed(1)}</Text>
              {userRatingsTotal != null && userRatingsTotal > 0 && (
                <Text style={styles.reviewsText}>
                  ({userRatingsTotal.toLocaleString()})
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.ratingRow}>
              <Ionicons name="compass-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.reviewsText}>Point of Interest</Text>
            </View>
          )}

          <View style={styles.actionsCluster}>
            {onSavePress && (
              <Pressable
                onPress={handleSavePress}
                hitSlop={10}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? `Unsave ${name}` : `Save ${name}`}
                style={({ pressed }) => [
                  styles.cardActionButton,
                  isSaved && styles.savedActiveButton,
                  pressed && styles.cardActionPressed,
                ]}
              >
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={15}
                  color={isSaved ? Colors.textPrimary : Colors.textSecondary}
                />
              </Pressable>
            )}

            {onDirectionsPress && (
              <Pressable
                onPress={handleDirectionsPress}
                hitSlop={10}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Directions to ${name}`}
                style={({ pressed }) => [styles.cardActionButton, pressed && styles.cardActionPressed]}
              >
                <Ionicons name="navigate-outline" size={15} color={Colors.textPrimary} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
});

PlaceCard.displayName = 'PlaceCard';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: TouchTarget.minHeight * 1.5,
    ...Shadows.subtle,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
    borderColor: Colors.borderFocus,
  },
  thumbnailContainer: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSubtle,
    marginRight: Spacing.md,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  categoryText: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textMuted,
    flex: 1,
  },
  distanceText: {
    ...Typography.mono,
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  nameText: {
    ...Typography.h3,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  addressText: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs + 2,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceSubtle,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 3,
  },
  reviewsText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  actionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardActionButton: {
    padding: Spacing.xs,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardActionPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.92 }],
  },
  savedActiveButton: {
    backgroundColor: Colors.surface,
    borderColor: Colors.borderSubtle,
  },
  directionsButton: {
    padding: Spacing.xs,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSubtle,
  },
});

export default PlaceCard;
