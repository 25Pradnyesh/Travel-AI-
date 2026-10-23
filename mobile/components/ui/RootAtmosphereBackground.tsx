/**
 * VAMO Mobile — Root Persistent Atmospheric Background Layer
 *
 * Mounted ONCE at the root layout over a solid #000 base View.
 * Never unmounts or remounts on navigation, completely eliminating white/grey flashes.
 *
 * Features:
 * - Slideshow of 22 bundled photos:
 *     - Hold: 4000ms (SLIDESHOW_HOLD_MS)
 *     - Crossfade: 900ms (SLIDESHOW_CROSSFADE_MS)
 *     - Shuffled cycle with no immediate repeat and full cycle before repeating
 *     - Random start per launch
 *     - Double-buffered: preloads only NEXT image and releases previous (never 22 decoded at once)
 *     - Pauses when app is backgrounded (AppState !== 'active')
 *     - Pauses when destination photo is active
 *     - Pauses when reduce-motion is enabled (shows single static image)
 *     - Pauses when Background Slideshow preference is Off (shows single static image)
 * - Seamlessly crossfades in active destination photo when present, and resumes slideshow when cleared.
 * - Wraps BlurTargetView for native Android GlassView sampling.
 * - Restrained 12% highlight tint + subtle ambient glow + top/bottom vignettes.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  AppStateStatus,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { BlurTargetView } from 'expo-blur';
import { useAtmosphere } from '@/context/AtmosphereContext';
import {
  BUNDLED_BACKGROUNDS,
  generateShuffledCycle,
  SLIDESHOW_CROSSFADE_MS,
  SLIDESHOW_HOLD_MS,
} from '@/lib/atmosphere/background-manifest';

import { PhotoCredit } from './PhotoCredit';

export const RootAtmosphereBackground: React.FC = () => {
  const {
    activePalette,
    isDestinationActive,
    activeDestinationImage,
    coldStartImage,
    slideshowEnabled,
    blurTargetRef,
  } = useAtmosphere();

  const [reduceMotion, setReduceMotion] = useState(false);
  const [appActive, setAppActive] = useState(true);

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

  // Monitor AppState (pause slideshow when app is backgrounded)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      setAppActive(nextState === 'active');
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, []);

  // Cycle management for 22 bundled photos
  const totalPhotos = BUNDLED_BACKGROUNDS.length;
  const cycleRef = useRef<number[]>([]);
  const cyclePointerRef = useRef<number>(0);

  // Initialize random shuffled cycle on mount
  useEffect(() => {
    const initialCycle = generateShuffledCycle(totalPhotos);
    cycleRef.current = initialCycle;
    cyclePointerRef.current = 0;
  }, [totalPhotos]);

  // Slideshow image state (double-buffered)
  const [baseImage, setBaseImage] = useState<string | number>(coldStartImage);
  const [incomingImage, setIncomingImage] = useState<string | number | null>(null);

  // Animation values: opacity (0 -> 1)
  const crossfadeAnim = useRef(new Animated.Value(1)).current;

  // Determine target image to display:
  // If destination is active, target is activeDestinationImage
  // If destination is not active, target is handled by slideshow loop
  const targetImage = isDestinationActive && activeDestinationImage ? activeDestinationImage : null;

  // Handle destination photo crossfade in / out with safe prefetch
  useEffect(() => {
    let cancelled = false;

    if (targetImage) {
      if (targetImage === baseImage) return;

      const triggerCrossfade = () => {
        if (cancelled) return;
        if (reduceMotion) {
          setBaseImage(targetImage);
          setIncomingImage(null);
          crossfadeAnim.setValue(1);
          return;
        }

        setIncomingImage(targetImage);
        crossfadeAnim.setValue(0);

        Animated.timing(crossfadeAnim, {
          toValue: 1,
          duration: SLIDESHOW_CROSSFADE_MS,
          useNativeDriver: true,
        }).start((result) => {
          if (result.finished && !cancelled) {
            setBaseImage(targetImage);
            setIncomingImage(null);
            crossfadeAnim.setValue(1);
          }
        });
      };

      if (typeof targetImage === 'string' && targetImage.startsWith('http')) {
        Image.prefetch(targetImage)
          .then((success) => {
            if (success) {
              triggerCrossfade();
            }
          })
          .catch(() => {
            // Keep current slideshow frame if remote prefetch fails; zero dark placeholder
          });
      } else {
        triggerCrossfade();
      }
    } else {
      // Destination cleared: resume with current slideshow photo
      const currentCycle = cycleRef.current;
      const ptr = cyclePointerRef.current;
      const resumeIndex = currentCycle[ptr] ?? 0;
      const resumePhoto = BUNDLED_BACKGROUNDS[resumeIndex]?.source || coldStartImage;

      if (resumePhoto !== baseImage) {
        if (reduceMotion) {
          setBaseImage(resumePhoto);
          setIncomingImage(null);
          crossfadeAnim.setValue(1);
          return;
        }

        setIncomingImage(resumePhoto);
        crossfadeAnim.setValue(0);

        Animated.timing(crossfadeAnim, {
          toValue: 1,
          duration: SLIDESHOW_CROSSFADE_MS,
          useNativeDriver: true,
        }).start((result) => {
          if (result.finished) {
            setBaseImage(resumePhoto);
            setIncomingImage(null);
            crossfadeAnim.setValue(1);
          }
        });
      }
    }
  }, [targetImage, reduceMotion, coldStartImage, baseImage, crossfadeAnim]);

  // Slideshow advance timer (active only when no destination photo, app is active, slideshow enabled, not reduce motion)
  useEffect(() => {
    if (isDestinationActive || !appActive || !slideshowEnabled || reduceMotion) {
      return;
    }

    const timer = setTimeout(() => {
      const currentCycle = cycleRef.current;
      if (!currentCycle || currentCycle.length === 0) return;

      let nextPointer = cyclePointerRef.current + 1;
      let nextCycle = currentCycle;

      // Completed full cycle: reshuffle with no immediate repeat
      if (nextPointer >= currentCycle.length) {
        const lastIdx = currentCycle[currentCycle.length - 1];
        nextCycle = generateShuffledCycle(totalPhotos, lastIdx);
        cycleRef.current = nextCycle;
        nextPointer = 0;
      }

      cyclePointerRef.current = nextPointer;
      const nextPhotoIndex = nextCycle[nextPointer];
      const nextPhoto = BUNDLED_BACKGROUNDS[nextPhotoIndex];

      if (!nextPhoto) return;

      const nextSource = nextPhoto.source;

      // Preload next image and start crossfade
      setIncomingImage(nextSource);
      crossfadeAnim.setValue(0);

      Animated.timing(crossfadeAnim, {
        toValue: 1,
        duration: SLIDESHOW_CROSSFADE_MS,
        useNativeDriver: true,
      }).start((result) => {
        if (result.finished) {
          setBaseImage(nextSource);
          setIncomingImage(null);
          crossfadeAnim.setValue(1);
        }
      });
    }, SLIDESHOW_HOLD_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [
    isDestinationActive,
    appActive,
    slideshowEnabled,
    reduceMotion,
    baseImage,
    totalPhotos,
    crossfadeAnim,
  ]);

  const handleImageError = useCallback(() => {
    setIncomingImage(null);
    crossfadeAnim.setValue(1);
  }, [crossfadeAnim]);

  const toImageSource = (img: string | number) => {
    if (typeof img === 'string') {
      return { uri: img };
    }
    return img;
  };

  const ambientGlowColor = activePalette?.glow || '#314E5F';

  return (
    <View style={styles.rootContainer} pointerEvents="none">
      {/* 1. Underlying pure black #000 canvas to ensure zero white or grey flashes */}
      <View style={[StyleSheet.absoluteFill, styles.pureBlackBase]} />

      {/* 2. BlurTargetView for native Android GlassView sampling */}
      <BlurTargetView ref={blurTargetRef} style={StyleSheet.absoluteFill}>
        {/* Base Layer */}
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

        {/* Crossfading Incoming Layer */}
        {incomingImage && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: crossfadeAnim,
              },
            ]}
          >
            <Image
              source={toImageSource(incomingImage)}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={
                typeof incomingImage === 'string' ? incomingImage : String(incomingImage)
              }
              transition={0}
              onError={handleImageError}
            />
          </Animated.View>
        )}

        {/* Restrained 12% highlight tint */}
        <View style={[StyleSheet.absoluteFill, styles.highlightTint]} />

        {/* Ambient Glow */}
        <View
          style={[
            styles.ambientGlow,
            {
              backgroundColor: ambientGlowColor,
            },
          ]}
        />

        {/* Top Scrim Backplate */}
        <LinearGradient
          colors={['rgba(5, 11, 14, 0.55)', 'rgba(5, 11, 14, 0.28)', 'transparent']}
          locations={[0, 0.6, 1]}
          style={styles.topVignette}
        />

        {/* Soft Bottom Vignette Backplate */}
        <LinearGradient
          colors={[
            'transparent',
            'rgba(5, 11, 14, 0.20)',
            'rgba(5, 11, 14, 0.55)',
            'rgba(6, 11, 14, 0.85)',
          ]}
          locations={[0, 0.4, 0.75, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Global Photo Credit Attribution */}
        <PhotoCredit />
      </BlurTargetView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  pureBlackBase: {
    backgroundColor: '#000000',
  },
  highlightTint: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '28%',
  },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    left: '25%',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.1,
  },
});

export default RootAtmosphereBackground;
