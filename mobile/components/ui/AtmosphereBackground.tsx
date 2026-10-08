import React, { createContext, useContext, useRef } from 'react';
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
  imageUrl?: string | null;
  blurRadius?: number;
  variant?: 'sky' | 'night' | 'destination';
  style?: ViewStyle;
}

/**
 * AtmosphereBackground
 *
 * Full-bleed atmospheric background layer with Android BlurTargetView integration.
 * - 'sky': Icy Blue sky (#A6DCF8) -> Mid-slate teal (#2F6275) -> Deep Onyx-Teal (#081218).
 * - 'destination': Background photo blurred (blurRadius ~30-36) with 55% dark scrim + bottom vignette.
 * - Wraps background with BlurTargetView so all child GlassViews receive native Android blur target.
 */
export const AtmosphereBackground: React.FC<AtmosphereBackgroundProps> = ({
  children,
  imageUrl,
  variant = 'sky',
  style,
}) => {
  const blurTargetRef = useRef<View>(null);
  const hasPhoto = Boolean(imageUrl && imageUrl.trim().length > 0);

  return (
    <AtmosphereContext.Provider value={{ blurTargetRef }}>
      <View style={[styles.container, style]}>
        {/* Background layer wrapped in BlurTargetView for native Android blur resolution */}
        <BlurTargetView ref={blurTargetRef} style={StyleSheet.absoluteFill}>
          {hasPhoto ? (
            // Full-bleed destination photography with heavy blur and 55% dark scrim
            <View style={StyleSheet.absoluteFill}>
              <Image
                source={{ uri: imageUrl! }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                blurRadius={32}
                cachePolicy="disk"
                transition={300}
              />
              {/* Dark uniform scrim so text is readable over any bright/busy photo */}
              <View style={[StyleSheet.absoluteFill, styles.photoScrim]} />
              {/* Bottom vignette gradient */}
              <LinearGradient
                colors={Colors.posterGradient}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ) : (
            // Signature VAMO Sky Atmosphere: Icy Blue #A6DCF8 -> #2F6275 -> #081218
            <View style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={variant === 'night' ? Colors.atmosphereNight : Colors.atmosphereSky}
                locations={[0, 0.38, 1]}
                style={StyleSheet.absoluteFill}
              />
              {/* Subtle top vignette scrim protecting header legibility */}
              <LinearGradient
                colors={['rgba(5, 11, 14, 0.45)', 'transparent']}
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
    backgroundColor: 'rgba(5, 11, 14, 0.55)', // 55% dark scrim
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
});

export default AtmosphereBackground;
