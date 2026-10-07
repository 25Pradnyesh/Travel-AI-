import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

// 9:16 vertical Travel AI launch video asset
const splashVideoSource = require('@/assets/splash/splash-video.mp4');

interface SplashVideoProps {
  onFinish: () => void;
}

export function SplashVideo({ onFinish }: SplashVideoProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isFinishingRef = useRef(false);
  const hasHiddenNativeSplash = useRef(false);

  const hideNativeSplash = useCallback(() => {
    if (!hasHiddenNativeSplash.current) {
      hasHiddenNativeSplash.current = true;
      SplashScreen.hideAsync().catch(() => {
        // Tolerated if native splash is already hidden or unavailable
      });
    }
  }, []);

  const finishSplash = useCallback(() => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;

    // Ensure native splash is hidden
    hideNativeSplash();

    // Smoothly fade out video layer into app entry
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsDismissed(true);
      onFinish();
    });
  }, [fadeAnim, hideNativeSplash, onFinish]);

  const player = useVideoPlayer(splashVideoSource, (p) => {
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    // Hide native splash once first frame renders or playback starts
    const playingSub = player.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying) {
        hideNativeSplash();
      }
    });

    // Auto-transition when video finishes
    const endSub = player.addListener('playToEnd', () => {
      finishSplash();
    });

    // Gracefully handle playback error
    const statusSub = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error' || error) {
        finishSplash();
      }
    });

    // Fallback: Ensure native splash doesn't stay stuck if playback start is delayed
    const nativeSplashFallback = setTimeout(() => {
      hideNativeSplash();
    }, 1200);

    // Safety timeout: Video duration is ~10.0s; guarantee transition if playback stalls
    const maxDurationSafetyTimer = setTimeout(() => {
      finishSplash();
    }, 10800);

    return () => {
      playingSub.remove();
      endSub.remove();
      statusSub.remove();
      clearTimeout(nativeSplashFallback);
      clearTimeout(maxDurationSafetyTimer);
    };
  }, [player, hideNativeSplash, finishSplash]);

  if (isDismissed) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
      pointerEvents={isFinishingRef.current ? 'none' : 'auto'}
    >
      <StatusBar style="light" hidden />
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
        onFirstFrameRender={hideNativeSplash}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

export default SplashVideo;
