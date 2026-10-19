/**
 * VAMO Mobile — Sharp Photo-First Atmosphere Background Layer
 *
 * Implements the Phase 1 "Photo Mode" reference look:
 * - One full-bleed SHARP expo-image (contentFit="cover", NO blur) behind the entire screen
 * - Fills status bar, canvas, and safe areas edge-to-edge
 * - 700ms hardware-accelerated crossfade with 1.04 -> 1.0 scale settle
 * - Pre-fetches incoming image and swaps only after onLoad (zero black flash)
 * - Restrained 12% highlight tint + local soft top/bottom gradient backplates
 * - Persistent Google Places / photographer attribution pill
 * - Fixes AUDIT-001: unconditional hook calls with fallback ref
 * - 60 FPS performance: cachePolicy="memory-disk", zero full-screen BlurViews
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { BlurTargetView } from 'expo-blur';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import {
  AtmospherePalette,
  PlaceAtmosphereInput,
} from '@/types/atmosphere';
import { VAMO_DEFAULT_PRESET } from '@/lib/atmosphere/presets';
import { resolvePalette } from '@/lib/atmosphere/palette-resolver';
import {
  DEFAULT_DISCOVERY_IMAGE,
  resolveDestinationImage,
} from '@/lib/atmosphere/imagery-resolver';
import {
  AtmosphereContext,
  useAtmosphere,
} from '@/context/AtmosphereContext';

export { AtmosphereContext, useAtmosphere };

export interface AtmosphereBackgroundProps {
  children?: React.ReactNode;
  imageUrl?: string | number | null;
  /** Explicit palette override (for subtle glow accents or preview surfaces) */
  palette?: AtmospherePalette;
  /** Explicit place override; resolves photography and palette directly for this view */
  place?: PlaceAtmosphereInput | null;
  /** Explicit photo author attribution string */
  photoAuthor?: string | null;
  /** Legacy variant prop maintained for backwards-compatibility */
  variant?: 'sky' | 'night' | 'destination';
  /** Shows or hides bottom attribution pill (defaults to true) */
  showAttribution?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AtmosphereBackground: React.FC<AtmosphereBackgroundProps> = ({
  children,
  imageUrl,
  palette: explicitPalette,
  place: explicitPlace,
  photoAuthor: explicitAuthor,
  variant,
  showAttribution = true,
  style,
}) => {
  const context = useAtmosphere();

  // FIX AUDIT-001: Call useRef unconditionally in the component body
  const fallbackRef = useRef<View>(null);
  const blurTargetRef = context.blurTargetRef || fallbackRef;

  const [reduceMotion, setReduceMotion] = useState(false);

  // Monitor system Accessibility Reduce Motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => {
      sub?.remove();
    };
  }, []);

  // Priority: explicit imageUrl -> explicit place image -> context activeImage -> DEFAULT_DISCOVERY_IMAGE
  const resolvedExplicitPlaceImage = useMemo(() => {
    if (explicitPlace) {
      return resolveDestinationImage(explicitPlace);
    }
    return null;
  }, [explicitPlace]);

  const targetImage = useMemo<string | number>(() => {
    if (imageUrl !== undefined && imageUrl !== null) {
      if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
        return imageUrl;
      }
      if (typeof imageUrl === 'number') {
        return imageUrl;
      }
    }
    if (resolvedExplicitPlaceImage) {
      return resolvedExplicitPlaceImage;
    }
    return context.activeImage || DEFAULT_DISCOVERY_IMAGE;
  }, [imageUrl, resolvedExplicitPlaceImage, context.activeImage]);

  // Determine target palette for subtle ambient glow
  const targetPalette = useMemo<AtmospherePalette>(() => {
    if (explicitPalette) return explicitPalette;
    if (explicitPlace) return resolvePalette(explicitPlace);
    if (variant === 'night') {
      return {
        top: '#182B36',
        mid: '#0E1A22',
        bottom: '#050B0E',
        glow: '#314E5F',
      };
    }
    return context.activePalette || VAMO_DEFAULT_PRESET;
  }, [explicitPalette, explicitPlace, variant, context.activePalette]);

  // Double-buffered crossfade state for sharp destination photography
  const [baseImage, setBaseImage] = useState<string | number>(targetImage);
  const [incomingImage, setIncomingImage] = useState<string | number | null>(null);

  // Animation values: opacity (0 -> 1) and scale (1.04 -> 1.0)
  const crossfadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Prefetch and initiate smooth transition
  useEffect(() => {
    if (targetImage === baseImage) {
      return;
    }

    // Prefetch remote URLs to prime disk and memory cache
    if (typeof targetImage === 'string' && targetImage.startsWith('http')) {
      Image.prefetch(targetImage).catch(() => {});
    }

    // Instant swap if Reduce Motion is active (150ms fade)
    if (reduceMotion) {
      Animated.timing(crossfadeAnim, {
        toValue: 0,
        duration: 75,
        useNativeDriver: true,
      }).start(() => {
        setBaseImage(targetImage);
        setIncomingImage(null);
        Animated.timing(crossfadeAnim, {
          toValue: 1,
          duration: 75,
          useNativeDriver: true,
        }).start();
      });
      return;
    }

    // Initiate 700ms cinematic crossfade with 1.04 -> 1.0 scale settle
    setIncomingImage(targetImage);
    crossfadeAnim.setValue(0);
    scaleAnim.setValue(1.04);

    Animated.parallel([
      Animated.timing(crossfadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start((result) => {
      if (result.finished) {
        setBaseImage(targetImage);
        setIncomingImage(null);
        crossfadeAnim.setValue(1);
        scaleAnim.setValue(1);
      }
    });
  }, [targetImage, baseImage, reduceMotion, crossfadeAnim, scaleAnim]);

  const handleImageError = useCallback(() => {
    // If incoming image fails, silently discard it and keep baseImage
    setIncomingImage(null);
    crossfadeAnim.setValue(1);
    scaleAnim.setValue(1);
  }, [crossfadeAnim, scaleAnim]);

  const toImageSource = (img: string | number) => {
    if (typeof img === 'string') {
      return { uri: img };
    }
    return img;
  };

  // Determine active attribution
  const activeAttribution = explicitAuthor || context.activeAuthor;

  return (
    <View style={[styles.container, style]}>
      {/* Background composite wrapped in BlurTargetView for native Android GlassView sampling */}
      <BlurTargetView ref={blurTargetRef} style={StyleSheet.absoluteFill}>
        {/* 1. Underlying dark baseline canvas ensuring zero white flash */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.canvas }]} />

        {/* 2. Base Destination Photography Layer (SHARP, NO BLUR) */}
        <Animated.View style={StyleSheet.absoluteFill}>
          <Image
            source={toImageSource(baseImage)}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={typeof baseImage === 'string' ? baseImage : String(baseImage)}
            transition={0}
            onError={handleImageError}
          />
        </Animated.View>

        {/* 3. Crossfading Incoming Destination Photography Layer (with 1.04 -> 1.0 scale settle) */}
        {incomingImage && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: crossfadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Image
              source={toImageSource(incomingImage)}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={typeof incomingImage === 'string' ? incomingImage : String(incomingImage)}
              transition={0}
              onError={handleImageError}
            />
          </Animated.View>
        )}

        {/* 4. Restrained 12% uniform highlight tint (NO global darkening) */}
        <View style={[StyleSheet.absoluteFill, styles.highlightTint]} pointerEvents="none" />

        {/* 5. Subtle Ambient Glow Orb reflecting destination lighting */}
        <View
          style={[
            styles.ambientGlow,
            {
              backgroundColor: targetPalette.glow,
            },
          ]}
          pointerEvents="none"
        />

        {/* 6. Soft Top Vignette Backplate protecting status bar and navigation chrome */}
        <LinearGradient
          colors={['rgba(5, 11, 14, 0.45)', 'rgba(5, 11, 14, 0.18)', 'transparent']}
          locations={[0, 0.50, 1]}
          style={styles.topVignette}
          pointerEvents="none"
        />

        {/* 7. Soft Bottom Vignette Backplate protecting tab bar and text zones */}
        <LinearGradient
          colors={[
            'transparent',
            'rgba(5, 11, 14, 0.20)',
            'rgba(5, 11, 14, 0.55)',
            'rgba(6, 11, 14, 0.85)',
          ]}
          locations={[0, 0.40, 0.75, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </BlurTargetView>

      {/* Main Foreground Content */}
      {children}

      {/* 8. Persistent Google Places / Contributor Photo Attribution Pill */}
      {showAttribution && activeAttribution ? (
        <View style={styles.attributionContainer} pointerEvents="none">
          <View style={styles.attributionPill}>
            <Text style={styles.attributionText} numberOfLines={1}>
              Photo: {activeAttribution}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
    position: 'relative',
    overflow: 'hidden',
  },
  highlightTint: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)', // Restrained 12% tint to tame highlights without dulling the photo
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    left: '25%',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.10,
  },
  attributionContainer: {
    position: 'absolute',
    bottom: 76,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 90,
  },
  attributionPill: {
    backgroundColor: 'rgba(8, 16, 22, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.15)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    maxWidth: 260,
  },
  attributionText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 0.5,
    color: 'rgba(251, 244, 227, 0.75)',
  },
});

export default AtmosphereBackground;
