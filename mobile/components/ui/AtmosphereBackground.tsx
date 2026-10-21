/**
 * VAMO Mobile — Atmosphere Background Layer
 *
 * Backwards-compatible wrapper.
 * The primary atmospheric background and slideshow are now managed persistently at
 * the ROOT layout level by RootAtmosphereBackground.
 *
 * If explicit imageUrl is passed (e.g. previewing in a dev harness), renders the explicit photo.
 * Otherwise, renders children directly over the transparent container so the persistent
 * root background layer shines through with zero remounts or white flashes.
 */

import React, { useMemo } from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { AtmospherePalette, PlaceAtmosphereInput } from '@/types/atmosphere';
import { AtmosphereContext, useAtmosphere } from '@/context/AtmosphereContext';

export { AtmosphereContext, useAtmosphere };

export interface AtmosphereBackgroundProps {
  children?: React.ReactNode;
  imageUrl?: string | number | null;
  /** Explicit palette override */
  palette?: AtmospherePalette;
  /** Explicit place override */
  place?: PlaceAtmosphereInput | null;
  /** Explicit photo author attribution string */
  photoAuthor?: string | null;
  /** Legacy variant prop maintained for backwards-compatibility */
  variant?: 'sky' | 'night' | 'destination';
  /** Shows or hides bottom attribution pill */
  showAttribution?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AtmosphereBackground: React.FC<AtmosphereBackgroundProps> = ({
  children,
  imageUrl,
  style,
}) => {
  const hasExplicitImage = Boolean(
    imageUrl !== undefined &&
      imageUrl !== null &&
      (typeof imageUrl === 'number' || (typeof imageUrl === 'string' && imageUrl.trim().length > 0))
  );

  const imageSource = useMemo(() => {
    if (!hasExplicitImage || !imageUrl) return null;
    return typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl;
  }, [hasExplicitImage, imageUrl]);

  return (
    <View style={[styles.container, style]}>
      {hasExplicitImage && imageSource && (
        <View style={StyleSheet.absoluteFill}>
          <Image
            source={imageSource}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={300}
          />
          <View style={[StyleSheet.absoluteFill, styles.highlightTint]} pointerEvents="none" />
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  highlightTint: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
});

export default AtmosphereBackground;
