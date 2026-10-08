import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export const ProcessingIndicator: React.FC = () => {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseWaveAnim = useRef(new Animated.Value(0)).current;
  const centerPinAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Smooth vertical scanning sweep
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // Expanding cartographic pulse wave
    const waveLoop = Animated.loop(
      Animated.timing(pulseWaveAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );

    // Subtle breathing pulse on the pinpoint location
    const pinLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(centerPinAnim, {
          toValue: 1.25,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(centerPinAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    scanLoop.start();
    waveLoop.start();
    pinLoop.start();

    return () => {
      scanLoop.stop();
      waveLoop.stop();
      pinLoop.stop();
    };
  }, [scanLineAnim, pulseWaveAnim, centerPinAnim]);

  // Interpolations scaled to 184px reticle
  const scanTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-65, 65],
  });

  const scanOpacity = scanLineAnim.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0.2, 0.9, 0.9, 0.2],
  });

  const waveScale = pulseWaveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1.25],
  });

  const waveOpacity = pulseWaveAnim.interpolate({
    inputRange: [0, 0.4, 0.8, 1],
    outputRange: [0.65, 0.4, 0.15, 0],
  });

  return (
    <View style={styles.container} accessible={true} accessibilityLabel="Geographic radar scanning viewfinder">
      {/* Outer Reticle Ring (Ivory strokes over atmosphere) */}
      <View style={styles.outerRing}>
        {/* Cardinal Direction Indicators */}
        <Text style={[styles.cardinalText, styles.cardinalN]}>N</Text>
        <Text style={[styles.cardinalText, styles.cardinalE]}>E</Text>
        <Text style={[styles.cardinalText, styles.cardinalS]}>S</Text>
        <Text style={[styles.cardinalText, styles.cardinalW]}>W</Text>

        {/* Crosshair Tick Marks (Ivory) */}
        <View style={styles.tickNorth} />
        <View style={styles.tickSouth} />
        <View style={styles.tickEast} />
        <View style={styles.tickWest} />

        {/* Inner Concentric Horizon Ring (Ivory) */}
        <View style={styles.innerRing} />

        {/* Expanding Cartographic Wave (Icy Blue) */}
        <Animated.View
          style={[
            styles.pulseWave,
            {
              transform: [{ scale: waveScale }],
              opacity: waveOpacity,
            },
          ]}
        />

        {/* Scanning Sweep Line (Icy Blue) */}
        <Animated.View
          style={[
            styles.scannerLine,
            {
              transform: [{ translateY: scanTranslateY }],
              opacity: scanOpacity,
            },
          ]}
        />

        {/* Pinpoint Location Marker (Ivory Ring + Racing Red Center Dot) */}
        <Animated.View
          style={[
            styles.centerPin,
            {
              transform: [{ scale: centerPinAnim }],
            },
          ]}
        >
          <View style={styles.racingRedCore} />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  outerRing: {
    width: 184,
    height: 184,
    borderRadius: 92,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 244, 227, 0.25)', // Ivory strokes
    backgroundColor: 'rgba(8, 18, 24, 0.42)', // Soft dark scrim within reticle
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  innerRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)', // Ivory inner ring
    position: 'absolute',
  },
  cardinalText: {
    position: 'absolute',
    fontSize: 9,
    fontFamily: Fonts.sansBold,
    color: Colors.ivoryMist,
    opacity: 0.65,
    letterSpacing: 0.5,
  },
  cardinalN: {
    top: 8,
  },
  cardinalS: {
    bottom: 8,
  },
  cardinalE: {
    right: 9,
  },
  cardinalW: {
    left: 9,
  },
  tickNorth: {
    position: 'absolute',
    top: 0,
    width: 1.5,
    height: 8,
    backgroundColor: 'rgba(251, 244, 227, 0.35)',
  },
  tickSouth: {
    position: 'absolute',
    bottom: 0,
    width: 1.5,
    height: 8,
    backgroundColor: 'rgba(251, 244, 227, 0.35)',
  },
  tickEast: {
    position: 'absolute',
    right: 0,
    width: 8,
    height: 1.5,
    backgroundColor: 'rgba(251, 244, 227, 0.35)',
  },
  tickWest: {
    position: 'absolute',
    left: 0,
    width: 8,
    height: 1.5,
    backgroundColor: 'rgba(251, 244, 227, 0.35)',
  },
  pulseWave: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 1.5,
    borderColor: Colors.icyBlue, // Icy Blue
    backgroundColor: 'rgba(166, 220, 248, 0.12)',
  },
  scannerLine: {
    position: 'absolute',
    width: 140,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.icyBlue, // Icy Blue scanning sweep
  },
  centerPin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.ivoryMist,
    backgroundColor: 'rgba(8, 18, 24, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  racingRedCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.racingRed, // Racing Red center dot
  },
});

export default ProcessingIndicator;
