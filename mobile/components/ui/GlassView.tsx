import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Radius } from '@/constants/theme';
import {
  GLASS_CONFIG,
  GLASS_PRESETS,
  GlassVariant,
  getGlassColors,
} from '@/constants/glass';
import { useAtmosphere } from '@/context/AtmosphereContext';

export { GlassVariant };

export interface GlassViewProps {
  children?: React.ReactNode;
  variant?: GlassVariant;
  borderRadius?: number;
  hasBorder?: boolean;
  blurTarget?: React.RefObject<View | null>;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  // Optional tuning overrides (used by live dev tuner /dev/glass)
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  fillAlpha?: number;
  borderAlpha?: number;
}

/**
 * GlassView
 *
 * Real native glass panel with expo-blur.
 * - Android: explicitly uses blurMethod="dimezisBlurView" and receives blurTarget from AtmosphereContext.
 * - iOS: native UIVisualEffectView.
 * - Tuning: reads blurIntensity, fillAlpha, borderAlpha, tint ONLY from constants/glass.ts.
 * - Architecture: Container is kept transparent so the native blur view directly samples the photo behind it.
 *   The translucent fill layer sits on top of the blur, providing high-contrast text legibility.
 * - Degrades to high-contrast solid surface only when reduce-transparency is enabled.
 */
export const GlassView: React.FC<GlassViewProps> = ({
  children,
  variant = 'dark',
  borderRadius = Radius.xxl,
  hasBorder = true,
  blurTarget: customBlurTarget,
  style,
  pointerEvents,
  intensity: customIntensity,
  tint: customTint,
  fillAlpha: customFillAlpha,
  borderAlpha: customBorderAlpha,
}) => {
  const { blurTargetRef, effectiveGlassPreset, isReduceTransparency } = useAtmosphere();
  const [localReduceTransparency, setLocalReduceTransparency] = useState(false);

  useEffect(() => {
    if (typeof AccessibilityInfo?.isReduceTransparencyEnabled === 'function') {
      AccessibilityInfo.isReduceTransparencyEnabled()
        .then(setLocalReduceTransparency)
        .catch(() => {});
    }

    const sub = typeof AccessibilityInfo?.addEventListener === 'function'
      ? AccessibilityInfo.addEventListener('reduceTransparencyChanged', setLocalReduceTransparency)
      : null;
    return () => {
      sub?.remove();
    };
  }, []);

  const reduceTransparency = isReduceTransparency || localReduceTransparency;

  // Resolve config from constants/glass.ts using active preset (or fallback to GLASS_CONFIG)
  const variantConfig = effectiveGlassPreset && GLASS_PRESETS[effectiveGlassPreset]
    ? GLASS_PRESETS[effectiveGlassPreset][variant]
    : GLASS_CONFIG[variant] ?? GLASS_CONFIG.dark;

  const activeIntensity = customIntensity ?? variantConfig.blurIntensity;
  const activeFillAlpha = customFillAlpha ?? variantConfig.fillAlpha;
  const activeBorderAlpha = customBorderAlpha ?? variantConfig.borderAlpha;
  const activeTint = customTint ?? variantConfig.tint;

  const { backgroundColor, borderColor } = getGlassColors(variant, {
    blurIntensity: activeIntensity,
    fillAlpha: activeFillAlpha,
    borderAlpha: activeBorderAlpha,
    tint: activeTint,
  });

  const borderStyle: ViewStyle = hasBorder
    ? {
        borderWidth: 1,
        borderColor,
      }
    : {};

  if (reduceTransparency) {
    return (
      <View
        pointerEvents={pointerEvents}
        style={[
          styles.solidFallback,
          { borderRadius },
          borderStyle,
          style,
          { backgroundColor },
        ]}
      >
        {children}
      </View>
    );
  }

  const activeBlurTarget = customBlurTarget || blurTargetRef;

  return (
    <BlurView
      intensity={activeIntensity}
      tint={activeTint}
      blurMethod="dimezisBlurView"
      blurTarget={Platform.OS === 'android' ? activeBlurTarget : undefined}
      pointerEvents={pointerEvents}
      style={[
        styles.blurContainer,
        { borderRadius },
        borderStyle,
        style,
        { backgroundColor: 'transparent' },
      ]}
    >
      {/* Translucent glass fill layer on top of native blur */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor,
            borderRadius,
          },
        ]}
        pointerEvents="none"
      />
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    overflow: 'hidden',
  },
  solidFallback: {
    backgroundColor: 'rgba(10, 18, 24, 0.94)',
    overflow: 'hidden',
  },
});

export default GlassView;
