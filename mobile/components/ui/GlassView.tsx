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
import { Colors, Radius } from '@/constants/theme';
import { useAtmosphere } from './AtmosphereBackground';

export type GlassVariant = 'frosted' | 'dark';

export interface GlassViewProps {
  children?: React.ReactNode;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  variant?: GlassVariant;
  borderRadius?: number;
  hasBorder?: boolean;
  blurTarget?: React.RefObject<View | null>;
  style?: StyleProp<ViewStyle>;
}

/**
 * GlassView
 *
 * Translucent glass panel with native BlurView.
 * - Android: explicitly uses blurMethod="dimezisBlurView" and receives blurTarget from AtmosphereContext.
 * - Variants:
 *     'dark' (default): BlurView tint="dark" + explicit fill rgba(8,14,18,0.82) for high legibility over all photography.
 *     'frosted': Light translucent frosted tint reserved only for non-text chrome (accents, decorators).
 * - Degrades to high-contrast solid surface only when reduce-transparency is enabled.
 */
export const GlassView: React.FC<GlassViewProps> = ({
  children,
  intensity = 55,
  tint,
  variant = 'dark',
  borderRadius = Radius.xxl,
  hasBorder = true,
  blurTarget: customBlurTarget,
  style,
}) => {
  const [reduceTransparency, setReduceTransparency] = useState(false);
  const { blurTargetRef } = useAtmosphere();

  useEffect(() => {
    if (typeof AccessibilityInfo?.isReduceTransparencyEnabled === 'function') {
      AccessibilityInfo.isReduceTransparencyEnabled()
        .then(setReduceTransparency)
        .catch(() => {});
    }

    const sub = typeof AccessibilityInfo?.addEventListener === 'function'
      ? AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency)
      : null;
    return () => {
      sub?.remove();
    };
  }, []);

  const borderStyle: ViewStyle = hasBorder
    ? {
        borderWidth: 1,
        borderColor: variant === 'frosted' ? Colors.glassFrostedBorder : Colors.glassDarkBorder,
      }
    : {};

  const backgroundStyle: ViewStyle = {
    backgroundColor: variant === 'frosted' ? Colors.glassFrostedBg : Colors.glassDarkBg,
  };

  const activeBlurTarget = customBlurTarget || blurTargetRef;
  const activeTint = tint ?? (variant === 'frosted' ? 'light' : 'dark');

  if (reduceTransparency) {
    return (
      <View
        style={[
          styles.solidFallback,
          backgroundStyle,
          { borderRadius },
          borderStyle,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={activeTint}
      blurMethod="dimezisBlurView"
      blurTarget={Platform.OS === 'android' ? activeBlurTarget : undefined}
      style={[
        styles.blurContainer,
        backgroundStyle,
        { borderRadius },
        borderStyle,
        style,
      ]}
    >
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
  },
});

export default GlassView;
