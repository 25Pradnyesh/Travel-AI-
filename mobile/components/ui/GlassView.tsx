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

export interface GlassViewProps {
  children?: React.ReactNode;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  borderRadius?: number;
  hasBorder?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * GlassView
 *
 * Translucent glass panel with blur on iOS and native DimezisBlurView on Android.
 * - Android blur explicitly enabled via blurMethod="dimezisBlurView".
 * - Automatically degrades to high-contrast solid frosted surface when
 *   AccessibilityInfo.isReduceTransparencyEnabled() is active.
 * - Hairline 1px border with soft 20-28px radius.
 */
export const GlassView: React.FC<GlassViewProps> = ({
  children,
  intensity = 55,
  tint = 'dark',
  borderRadius = Radius.xxl,
  hasBorder = true,
  style,
}) => {
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    // Check user system accessibility preference
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then(setReduceTransparency)
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency
    );
    return () => {
      sub?.remove();
    };
  }, []);

  const borderStyle: ViewStyle = hasBorder
    ? {
        borderWidth: 1,
        borderColor: Colors.glassBorder,
      }
    : {};

  if (reduceTransparency) {
    // Solid high-contrast fallback strictly for users with reduce-transparency enabled
    return (
      <View
        style={[
          styles.solidFallback,
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
      tint={tint}
      blurMethod="dimezisBlurView"
      experimentalBlurMethod="dimezisBlurView"
      style={[
        styles.blurContainer,
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
    backgroundColor: Colors.glassBg,
  },
  solidFallback: {
    backgroundColor: 'rgba(10, 18, 24, 0.92)',
  },
});

export default GlassView;
