import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { GlassView } from '@/components/ui';
import { hapticFeedback } from '@/lib/haptics';

export interface ResultHeroProps {
  imageUrl?: string | number | null;
  destinationName: string;
  locationSubtitle?: string;
  photoCount?: number;
  photoAuthor?: string[] | string | null;
  onBack: () => void;
  onShare?: () => void;
}

export const ResultHero: React.FC<ResultHeroProps> = React.memo(({
  imageUrl,
  destinationName,
  locationSubtitle,
  photoCount = 0,
  photoAuthor,
  onBack,
  onShare,
}) => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [imageError, setImageError] = useState(false);

  // Reset error if image URL changes
  React.useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const heroHeight = Math.max(420, Math.round(screenHeight * 0.54));
  const hasPhoto = Boolean(
    imageUrl &&
      !imageError &&
      (typeof imageUrl === 'number' || (typeof imageUrl === 'string' && imageUrl.trim().length > 0))
  );

  const imageSource = React.useMemo(() => {
    if (!hasPhoto) return null;
    if (typeof imageUrl === 'string') {
      return { uri: imageUrl };
    }
    return imageUrl;
  }, [hasPhoto, imageUrl]);

  // Clean author attribution string
  const authorText = React.useMemo(() => {
    if (!photoAuthor) return null;
    if (Array.isArray(photoAuthor)) {
      return photoAuthor.filter(Boolean).join(', ');
    }
    return String(photoAuthor).trim();
  }, [photoAuthor]);

  return (
    <View style={[styles.container, { height: heroHeight }]}>
      {/* Background: Destination Photography or Atmospheric Sky Fallback */}
      {hasPhoto && imageSource ? (
        <Image
          source={imageSource}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="disk"
          transition={300}
          onLoad={(e) => {
            if (__DEV__) {
              console.log(
                `[ResultHero] Destination photo loaded: "${destinationName}" (${e.source.width}x${e.source.height})`
              );
            }
          }}
          onError={(err) => {
            console.warn(
              `[ResultHero] Destination photo failed for "${destinationName}":`,
              imageUrl,
              err.error
            );
            setImageError(true);
          }}
          accessible={true}
          accessibilityLabel={`Photography of ${destinationName}`}
        />
      ) : (
        <LinearGradient
          colors={Colors.atmosphereSky}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.fallbackWatermark}>
            <Ionicons name="compass-outline" size={96} color="rgba(251, 244, 227, 0.14)" />
          </View>
        </LinearGradient>
      )}

      {/* Top subtle vignette protecting floating controls */}
      <LinearGradient
        colors={['rgba(5, 11, 14, 0.55)', 'transparent']}
        locations={[0, 1]}
        style={styles.topVignette}
      />

      {/* Deep bottom scrim protecting oversized typography */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(5, 11, 14, 0.25)',
          'rgba(5, 11, 14, 0.78)',
          'rgba(8, 18, 24, 1)',
        ]}
        locations={[0, 0.35, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Top Bar (Back and Share pills) */}
      <View
        style={[
          styles.topBar,
          { paddingTop: Math.max(insets.top, 16) + 4 },
        ]}
      >
        {/* Floating frosted Back pill */}
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            onBack();
          }}
          hitSlop={8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Back to Analyze"
          style={({ pressed }) => [styles.pillButton, pressed && styles.pressed]}
        >
          <GlassView
            variant="frosted"
            borderRadius={Radius.pill}
            style={styles.pillGlass}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.ivoryMist} />
            <Text style={styles.pillText}>Back</Text>
          </GlassView>
        </Pressable>

        {/* Floating frosted Share pill (if share handler present) */}
        {onShare ? (
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              onShare();
            }}
            hitSlop={8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Share destination dossier"
            style={({ pressed }) => [styles.pillButton, pressed && styles.pressed]}
          >
            <GlassView
              variant="frosted"
              borderRadius={Radius.pill}
              style={styles.pillGlass}
            >
              <Ionicons name="share-outline" size={16} color={Colors.ivoryMist} />
              <Text style={styles.pillText}>Share</Text>
            </GlassView>
          </Pressable>
        ) : null}
      </View>

      {/* Photo Badges & Attribution (Right Side) */}
      <View style={styles.metaRow}>
        {hasPhoto && photoCount > 1 ? (
          <View style={styles.photoCountBadge}>
            <Ionicons name="camera-outline" size={12} color={Colors.ivoryMist} />
            <Text style={styles.photoCountText}>1 of {photoCount}</Text>
          </View>
        ) : null}

        {hasPhoto && authorText ? (
          <View style={styles.attributionBadge}>
            <Ionicons name="shield-checkmark-outline" size={11} color="rgba(251, 244, 227, 0.85)" />
            <Text style={styles.attributionText} numberOfLines={1}>
              Photo: {authorText}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Bottom Content: Oversized Destination Name + Location Hierarchy */}
      <View style={styles.bottomContent}>
        {/* Oversized 64-76px Display Name */}
        <Text style={styles.destinationName} numberOfLines={2}>
          {destinationName}
        </Text>

        {/* Location Hierarchy */}
        {locationSubtitle ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color={Colors.icyBlue} />
            <Text style={styles.locationSubtitle} numberOfLines={1}>
              {locationSubtitle}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
});

ResultHero.displayName = 'ResultHero';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Colors.canvas,
    justifyContent: 'space-between',
  },
  fallbackWatermark: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 2,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    zIndex: 10,
  },
  pillButton: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
    minHeight: TouchTarget.minHeight,
    justifyContent: 'center',
  },
  pillGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    gap: 6,
    backgroundColor: 'rgba(8, 18, 24, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.20)',
  },
  pillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ivoryMist,
    letterSpacing: -0.2,
  },
  metaRow: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: 110,
    alignItems: 'flex-end',
    gap: 6,
    zIndex: 5,
  },
  photoCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 5,
  },
  photoCountText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    color: Colors.ivoryMist,
    letterSpacing: 0.2,
  },
  attributionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    maxWidth: 240,
  },
  attributionText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 10,
    color: 'rgba(251, 244, 227, 0.85)',
    letterSpacing: -0.1,
  },
  bottomContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    zIndex: 6,
  },
  destinationName: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 64,
    lineHeight: 68,
    color: Colors.ivoryMist,
    letterSpacing: -1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  locationSubtitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    lineHeight: 18,
    color: Colors.textSecondary,
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});

export default ResultHero;
