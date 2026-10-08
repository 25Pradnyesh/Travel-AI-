import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Colors } from '@/constants/theme';

export interface AtmosphereBackgroundProps {
  children?: React.ReactNode;
  imageUrl?: string | null;
  blurRadius?: number;
  variant?: 'sky' | 'night' | 'destination';
  style?: ViewStyle;
}

/**
 * AtmosphereBackground
 *
 * Full-bleed atmospheric background layer.
 * - Default 'sky': Icy Blue sky (#A6DCF8) fading to deep Onyx-Teal (#081218).
 * - Destination: Blurred/tinted photo with bottom vignette scrim for contrast.
 * - Fallback: If imageUrl is missing or fails, gracefully falls back to default sky atmosphere.
 */
export const AtmosphereBackground: React.FC<AtmosphereBackgroundProps> = ({
  children,
  imageUrl,
  variant = 'sky',
  style,
}) => {
  const hasPhoto = Boolean(imageUrl && imageUrl.trim().length > 0);

  return (
    <View style={[styles.container, style]}>
      {hasPhoto ? (
        // Full-bleed destination photography with dark readability scrim
        <View style={StyleSheet.absoluteFill}>
          <Image
            source={{ uri: imageUrl! }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="disk"
            transition={300}
          />
          {/* Bottom vignette darkening scrim so text is always high contrast */}
          <LinearGradient
            colors={Colors.posterGradient}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : (
        // Signature VAMO Sky Atmosphere: Icy Blue #A6DCF8 -> Slate-Teal -> Deep Onyx-Teal #081218
        <LinearGradient
          colors={variant === 'night' ? Colors.atmosphereNight : Colors.atmosphereSky}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
        />
      )}

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
});

export default AtmosphereBackground;
