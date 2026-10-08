import React, { useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface PosterCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string | number | null;
  category?: string;
  isSaved?: boolean;
  onPress: () => void;
  onToggleSave?: () => void;
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
}

export const PosterCard: React.FC<PosterCardProps> = ({
  title,
  subtitle,
  imageUrl,
  category,
  isSaved = false,
  onPress,
  onToggleSave,
  aspectRatio = 3 / 4,
  style,
}) => {
  const [imageError, setImageError] = useState(false);

  // Reset error state whenever imageUrl changes
  React.useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const handleToggleSave = (e: any) => {
    e?.stopPropagation?.();
    hapticFeedback.light();
    onToggleSave?.();
  };

  const hasImage = Boolean(
    imageUrl &&
      !imageError &&
      (typeof imageUrl === 'number' || (typeof imageUrl === 'string' && imageUrl.trim().length > 0))
  );

  const imageSource = React.useMemo(() => {
    if (!hasImage) return null;
    if (typeof imageUrl === 'string') {
      return { uri: imageUrl };
    }
    return imageUrl;
  }, [hasImage, imageUrl]);

  return (
    <Pressable
      onPress={() => {
        hapticFeedback.selection();
        onPress();
      }}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle || ''}`}
      style={({ pressed }) => [
        styles.container,
        { aspectRatio },
        pressed && styles.pressed,
        style,
      ]}
    >
      {hasImage && imageSource ? (
        // Full-bleed destination photography
        <Image
          source={imageSource}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="disk"
          transition={250}
          onLoad={(e) => {
            if (__DEV__) {
              console.log(
                `[PosterCard] Photo loaded: "${title}" (${e.source.width}x${e.source.height})`
              );
            }
          }}
          onError={(err) => {
            console.warn(
              `[PosterCard] Photo load failed for "${title}":`,
              imageUrl,
              err.error
            );
            setImageError(true);
          }}
        />
      ) : (
        // Graceful fallback: Atmospheric sky gradient + outline icon
        <LinearGradient
          colors={Colors.atmosphereSky}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.fallbackIconWrapper}>
            <Ionicons name="compass-outline" size={32} color="rgba(251, 244, 227, 0.45)" />
          </View>
        </LinearGradient>
      )}

      {/* Scrim Overlay: darkened at the bottom for typography legibility */}
      <LinearGradient
        colors={['rgba(8, 18, 24, 0.15)', 'transparent', 'rgba(5, 11, 14, 0.88)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Controls: Category Pill + Bookmark Icon */}
      <View style={styles.topRow}>
        {category ? (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText} numberOfLines={1}>
              {category.toUpperCase()}
            </Text>
          </View>
        ) : (
          <View />
        )}

        {onToggleSave && (
          <Pressable
            onPress={handleToggleSave}
            hitSlop={10}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remove from saved' : 'Save destination'}
            style={({ pressed }) => [
              styles.bookmarkButton,
              isSaved && styles.bookmarkButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={15}
              color={isSaved ? Colors.racingRed : Colors.ivoryMist}
            />
          </Pressable>
        )}
      </View>

      {/* Bottom Content: Oversized Display Title + Subtitle */}
      <View style={styles.bottomContent}>
        {subtitle ? (
          <View style={styles.subtitleRow}>
            <Ionicons name="location-sharp" size={11} color="rgba(251, 244, 227, 0.8)" />
            <Text style={styles.subtitleText} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        ) : null}

        {/* Large Poster Display Name (Instrument Serif) */}
        <Text style={styles.titleText} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    backgroundColor: Colors.canvasDeep,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  topRow: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  categoryPill: {
    backgroundColor: 'rgba(8, 18, 24, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
  },
  categoryText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.ivoryMist,
  },
  bookmarkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(8, 18, 24, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkButtonActive: {
    backgroundColor: 'rgba(8, 18, 24, 0.85)',
    borderColor: Colors.racingRed,
  },
  bottomContent: {
    position: 'absolute',
    bottom: Spacing.base,
    left: Spacing.base,
    right: Spacing.base,
    zIndex: 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  subtitleText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: 'rgba(251, 244, 227, 0.85)',
    letterSpacing: 0.3,
  },
  titleText: {
    fontFamily: Fonts.serifRegular,
    fontSize: 34,
    lineHeight: 38,
    color: Colors.ivoryMist,
    letterSpacing: -0.6,
  },
  fallbackIconWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});

export default PosterCard;
