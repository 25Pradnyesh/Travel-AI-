import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { ConfidenceBadge, GlassView } from '@/components/ui';
import { hapticFeedback } from '@/lib/haptics';

export interface ResultHeroProps {
  imageUrl?: string | number | null;
  destinationName: string;
  locationSubtitle?: string;
  photoCount?: number;
  currentPhotoIndex?: number;
  onNextPhoto?: () => void;
  photoAuthor?: string[] | string | null;
  verificationStatus?: string;
  confidence?: number;
  onBack: () => void;
  onShare?: () => void;
}

export function isLocationPillInformative(title: string, subtitle?: string): boolean {
  if (!subtitle || !subtitle.trim()) return false;
  const cleanTitle = title.toLowerCase().trim();
  const cleanSub = subtitle.toLowerCase().trim();
  if (cleanTitle === cleanSub) return false;

  const subParts = cleanSub
    .split(/[\s·,•\-]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

  const novelParts = subParts.filter((part) => !cleanTitle.includes(part));
  return novelParts.length > 0;
}

export const ResultHero: React.FC<ResultHeroProps> = React.memo(({
  destinationName,
  locationSubtitle,
  photoCount = 0,
  currentPhotoIndex = 0,
  onNextPhoto,
  photoAuthor,
  verificationStatus,
  confidence,
  onBack,
  onShare,
}) => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  // Hero takes ~58% of screen height as the primary photo view zone
  const heroHeight = Math.max(440, Math.round(screenHeight * 0.58));

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
      {/* Top subtle vignette protecting floating Back & Share controls */}
      <LinearGradient
        colors={['rgba(5, 11, 14, 0.45)', 'transparent']}
        locations={[0, 1]}
        style={styles.topVignette}
        pointerEvents="none"
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
            variant="dark"
            borderRadius={Radius.pill}
            style={styles.pillGlass}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.ivoryMist} />
            <Text style={styles.pillText}>Back</Text>
          </GlassView>
        </Pressable>

        {/* Floating dark Share pill (if share handler present) */}
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
              variant="dark"
              borderRadius={Radius.pill}
              style={styles.pillGlass}
            >
              <Ionicons name="share-outline" size={16} color={Colors.ivoryMist} />
              <Text style={styles.pillText}>Share</Text>
            </GlassView>
          </Pressable>
        ) : null}
      </View>

      {/* Bottom Content: Meta Badges + Huge Instrument Serif Destination Name + Location Hierarchy */}
      <View style={styles.bottomContent}>
        {/* Photo Badges & Attribution (Cleanly positioned above title) */}
        <View style={styles.heroMetaRow}>
          {verificationStatus ? (
            <ConfidenceBadge
              status={verificationStatus}
              confidence={confidence}
            />
          ) : null}

          {photoCount > 1 ? (
            <Pressable
              onPress={() => {
                if (onNextPhoto) {
                  hapticFeedback.selection();
                  onNextPhoto();
                }
              }}
              disabled={!onNextPhoto}
              hitSlop={6}
              style={({ pressed }) => [
                styles.photoCountBadge,
                onNextPhoto && pressed && styles.pressed,
              ]}
              accessible={true}
              accessibilityLabel={`Photo ${currentPhotoIndex + 1} of ${photoCount}. Tap to cycle.`}
            >
              <Ionicons name="camera-outline" size={12} color={Colors.ivoryMist} />
              <Text style={styles.photoCountText}>
                {currentPhotoIndex + 1} of {photoCount}
              </Text>
            </Pressable>
          ) : null}

          {authorText ? (
            <View style={styles.attributionBadge}>
              <Ionicons name="shield-checkmark-outline" size={11} color={Colors.icyBlue} />
              <Text style={styles.attributionText} numberOfLines={1}>
                Photo: {authorText}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Huge Display Name directly on the photo with soft backplate & text shadow */}
        <Text
          style={styles.destinationName}
          numberOfLines={2}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.55}
        >
          {destinationName}
        </Text>

        {/* Location Hierarchy Pill — only rendered if it adds information beyond the title */}
        {isLocationPillInformative(destinationName, locationSubtitle) ? (
          <View style={styles.locationPill}>
            <Ionicons name="location-sharp" size={13} color={Colors.icyBlue} />
            <Text
              style={styles.locationSubtitle}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
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
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
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
    backgroundColor: 'rgba(8, 18, 24, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.24)',
  },
  pillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ivoryMist,
    letterSpacing: -0.2,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  photoCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.20)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
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
    backgroundColor: 'rgba(8, 18, 24, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.20)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
    maxWidth: 280,
  },
  attributionText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.ivoryMist,
    letterSpacing: -0.1,
  },
  bottomContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    zIndex: 6,
  },
  destinationName: {
    fontFamily: Fonts.serifItalic,
    fontSize: 68,
    lineHeight: 72,
    color: Colors.ivoryMist,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.90)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
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
  locationSubtitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 17,
    color: Colors.ivoryMist,
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});

export default ResultHero;
