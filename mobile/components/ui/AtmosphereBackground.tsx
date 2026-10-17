/**
 * VAMO Mobile — Adaptive Atmosphere Background Layer
 *
 * Full-bleed atmospheric background layer featuring:
 * - Dynamic 3-stop vertical gradient resolving to the active destination's atmosphere
 * - 450ms hardware-accelerated double-buffered crossfade transitions between destinations
 * - Immediate 0ms transition when Accessibility Reduce Motion is enabled
 * - Ambient diffuse top glow orb accentuating the active atmosphere
 * - Full-bleed photography on hero screens with subtle scrims
 * - Android BlurTargetView integration ensuring GlassView components receive native blur
 * - Zero dependency additions; 100% compliant with VAMO 60 FPS performance budgets
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { BlurTargetView } from 'expo-blur';
import { Colors } from '@/constants/theme';
import {
  AtmospherePalette,
  PlaceAtmosphereInput,
} from '@/types/atmosphere';
import { VAMO_DEFAULT_PRESET } from '@/lib/atmosphere/presets';
import { resolvePalette } from '@/lib/atmosphere/palette-resolver';
import {
  AtmosphereContext,
  useAtmosphere,
} from '@/context/AtmosphereContext';

// Re-export context and hook for seamless module compatibility
export { AtmosphereContext, useAtmosphere };

export interface AtmosphereBackgroundProps {
  children?: React.ReactNode;
  imageUrl?: string | number | null;
  blurRadius?: number;
  /** Explicit palette override (e.g., for self-contained cards or preview surfaces) */
  palette?: AtmospherePalette;
  /** Explicit place override; resolves palette directly for this view */
  place?: PlaceAtmosphereInput | null;
  /** Legacy variant prop maintained for backwards-compatibility; mapped to adaptive atmosphere */
  variant?: 'sky' | 'night' | 'destination';
  style?: StyleProp<ViewStyle>;
}

export const AtmosphereBackground: React.FC<AtmosphereBackgroundProps> = ({
  children,
  imageUrl,
  blurRadius = 24,
  palette: explicitPalette,
  place: explicitPlace,
  variant,
  style,
}) => {
  const context = useAtmosphere();
  const blurTargetRef = context.blurTargetRef || useRef<View>(null);
  const [imageError, setImageError] = useState(false);
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

  // Reset image error whenever imageUrl prop changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const hasPhoto = Boolean(
    imageUrl &&
      !imageError &&
      (typeof imageUrl === 'number' || (typeof imageUrl === 'string' && imageUrl.trim().length > 0))
  );

  const imageSource = useMemo(() => {
    if (!hasPhoto) return null;
    if (typeof imageUrl === 'string') {
      return { uri: imageUrl };
    }
    return imageUrl;
  }, [hasPhoto, imageUrl]);

  // Determine target palette: explicit prop -> explicit place -> context activePalette
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

  // Double-buffered crossfade state
  const [basePalette, setBasePalette] = useState<AtmospherePalette>(targetPalette);
  const [incomingPalette, setIncomingPalette] = useState<AtmospherePalette | null>(null);
  const crossfadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // If target palette matches base palette, no transition needed
    if (
      targetPalette.top === basePalette.top &&
      targetPalette.mid === basePalette.mid &&
      targetPalette.bottom === basePalette.bottom
    ) {
      return;
    }

    // Instant swap if Reduce Motion is active
    if (reduceMotion) {
      setBasePalette(targetPalette);
      setIncomingPalette(null);
      crossfadeAnim.setValue(1);
      return;
    }

    // Initiate 450ms smooth crossfade
    setIncomingPalette(targetPalette);
    crossfadeAnim.setValue(0);

    Animated.timing(crossfadeAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start((result) => {
      if (result.finished) {
        setBasePalette(targetPalette);
        setIncomingPalette(null);
        crossfadeAnim.setValue(1);
      }
    });
  }, [targetPalette, basePalette, reduceMotion, crossfadeAnim]);

  return (
    <View style={[styles.container, style]}>
      {/* Background layer wrapped in BlurTargetView for native Android blur resolution */}
      <BlurTargetView ref={blurTargetRef} style={StyleSheet.absoluteFill}>
        {hasPhoto && imageSource ? (
          // Full-bleed destination photography with blur and translucent scrim
          <View style={StyleSheet.absoluteFill}>
            <Image
              source={imageSource}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              blurRadius={blurRadius}
              cachePolicy="disk"
              transition={300}
              onError={(err) => {
                console.warn(
                  '[AtmosphereBackground] Background photo failed to load:',
                  imageUrl,
                  err.error
                );
                setImageError(true);
              }}
            />
            {/* Soft scrim so the photo's vibrant colors visibly shine */}
            <View style={[StyleSheet.absoluteFill, styles.photoScrim]} />
            {/* Top vignette scrim protecting floating header chrome */}
            <LinearGradient
              colors={['rgba(5, 11, 14, 0.40)', 'transparent']}
              locations={[0, 1]}
              style={styles.topVignette}
            />
            {/* Gentle bottom vignette gradient protecting bottom cards */}
            <LinearGradient
              colors={[
                'transparent',
                'rgba(5, 11, 14, 0.20)',
                'rgba(5, 11, 14, 0.70)',
                'rgba(5, 11, 14, 0.92)',
              ]}
              locations={[0, 0.35, 0.70, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ) : (
          // Adaptive Atmospheric Palette with Double-Buffered Opacity Crossfade
          <View style={StyleSheet.absoluteFill}>
            {/* Base Layer */}
            <LinearGradient
              colors={[basePalette.top, basePalette.mid, basePalette.bottom]}
              locations={[0, 0.38, 1]}
              style={StyleSheet.absoluteFill}
            />

            {/* Crossfading Incoming Layer */}
            {incomingPalette && (
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: crossfadeAnim }]}>
                <LinearGradient
                  colors={[incomingPalette.top, incomingPalette.mid, incomingPalette.bottom]}
                  locations={[0, 0.38, 1]}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            )}

            {/* Ambient diffuse top glow orb */}
            <View
              style={[
                styles.ambientGlow,
                {
                  backgroundColor: (incomingPalette || basePalette).glow,
                },
              ]}
              pointerEvents="none"
            />

            {/* Subtle top vignette protecting status bar legibility */}
            <LinearGradient
              colors={['rgba(5, 11, 14, 0.45)', 'rgba(5, 11, 14, 0.15)', 'transparent']}
              locations={[0, 0.5, 1]}
              style={styles.topVignette}
              pointerEvents="none"
            />
          </View>
        )}
      </BlurTargetView>

      {/* Sticky top dark header scrim protecting status bar when scrolled */}
      <LinearGradient
        colors={[
          'rgba(8, 18, 24, 0.88)',
          'rgba(8, 18, 24, 0.65)',
          'rgba(8, 18, 24, 0.25)',
          'transparent',
        ]}
        locations={[0, 0.4, 0.75, 1]}
        style={styles.stickyHeaderScrim}
        pointerEvents="none"
      />

      {children}
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
  photoScrim: {
    backgroundColor: 'rgba(5, 11, 14, 0.16)', // ~16% scrim so vibrant photo colors shine through
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  stickyHeaderScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 50,
  },
  ambientGlow: {
    position: 'absolute',
    top: -120,
    left: '20%',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.22,
  },
});

export default AtmosphereBackground;
