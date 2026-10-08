import React, { createContext, useContext, useRef, useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { BlurTargetView } from 'expo-blur';
import { Colors } from '@/constants/theme';

export interface AtmosphereContextType {
  blurTargetRef: React.RefObject<View | null>;
}

export const AtmosphereContext = createContext<AtmosphereContextType>({
  blurTargetRef: { current: null },
});

export const useAtmosphere = () => useContext(AtmosphereContext);

export interface AtmosphereBackgroundProps {
  children?: React.ReactNode;
  imageUrl?: string | number | null;
  blurRadius?: number;
  variant?: 'sky' | 'night' | 'destination';
  style?: ViewStyle;
}

/**
 * AtmosphereBackground
 *
 * Full-bleed atmospheric background layer with Android BlurTargetView integration.
 * - 'sky': Icy Blue sky (#A6DCF8) -> Mid-slate teal (#2F6275) -> Deep Onyx-Teal (#081218).
 * - 'destination': Background photo blurred with translucent scrim + soft bottom vignette.
 * - Wraps background with BlurTargetView so all child GlassViews receive native Android blur target.
 */
export const AtmosphereBackground: React.FC<AtmosphereBackgroundProps> = ({
  children,
  imageUrl,
  blurRadius = 24,
  variant = 'sky',
  style,
}) => {
  const blurTargetRef = useRef<View>(null);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

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

  return (
    <AtmosphereContext.Provider value={{ blurTargetRef }}>
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
                onLoad={(e) => {
                  if (__DEV__) {
                    console.log(
                      `[AtmosphereBackground] Background photo loaded: (${e.source.width}x${e.source.height})`
                    );
                  }
                }}
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
              {/* Gentle bottom vignette gradient protecting bottom cards */}
              <LinearGradient
                colors={['transparent', 'rgba(5, 11, 14, 0.20)', 'rgba(5, 11, 14, 0.70)', 'rgba(5, 11, 14, 0.92)']}
                locations={[0, 0.35, 0.70, 1]}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ) : (
            // Signature VAMO Sky Atmosphere: Icy Blue #A6DCF8 -> #2F6275 (at 0.28) -> #081218
            <View style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={variant === 'night' ? Colors.atmosphereNight : Colors.atmosphereSky}
                locations={variant === 'night' ? [0, 0.38, 1] : [0, 0.28, 1]}
                style={StyleSheet.absoluteFill}
              />
              {/* Top vignette scrim protecting header legibility */}
              <LinearGradient
                colors={['rgba(5, 11, 14, 0.40)', 'transparent']}
                locations={[0, 1]}
                style={styles.topVignette}
              />
            </View>
          )}
        </BlurTargetView>

        {children}
      </View>
    </AtmosphereContext.Provider>
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
    height: 130,
  },
});

export default AtmosphereBackground;
