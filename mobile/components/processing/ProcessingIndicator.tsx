import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

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
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // Expanding cartographic pulse wave
    const waveLoop = Animated.loop(
      Animated.timing(pulseWaveAnim, {
        toValue: 1,
        duration: 2800,
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

  // Interpolations
  const scanTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-45, 45],
  });

  const scanOpacity = scanLineAnim.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0.2, 0.85, 0.85, 0.2],
  });

  const waveScale = pulseWaveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1.2],
  });

  const waveOpacity = pulseWaveAnim.interpolate({
    inputRange: [0, 0.4, 0.8, 1],
    outputRange: [0.65, 0.4, 0.15, 0],
  });

  return (
    <View style={styles.container} accessible={true} accessibilityLabel="Geographic radar scanning viewfinder">
      {/* Outer Reticle Ring */}
      <View style={styles.outerRing}>
        {/* Cardinal Direction Indicators */}
        <Text style={[styles.cardinalText, styles.cardinalN]}>N</Text>
        <Text style={[styles.cardinalText, styles.cardinalE]}>E</Text>
        <Text style={[styles.cardinalText, styles.cardinalS]}>S</Text>
        <Text style={[styles.cardinalText, styles.cardinalW]}>W</Text>

        {/* Crosshair Tick Marks */}
        <View style={styles.tickNorth} />
        <View style={styles.tickSouth} />
        <View style={styles.tickEast} />
        <View style={styles.tickWest} />

        {/* Inner Concentric Horizon Ring */}
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

        {/* Pinpoint Location Marker (Onyx Ring + Racing Red Core) */}
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
    marginVertical: 14,
  },
  outerRing: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 1.5,
    borderColor: 'rgba(12, 12, 12, 0.16)', // Subtle Onyx border
    backgroundColor: Colors.ivoryMist,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  innerRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.10)',
    position: 'absolute',
  },
  cardinalText: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(12, 12, 12, 0.35)',
    letterSpacing: 0.5,
  },
  cardinalN: {
    top: 7,
  },
  cardinalS: {
    bottom: 7,
  },
  cardinalE: {
    right: 8,
  },
  cardinalW: {
    left: 8,
  },
  tickNorth: {
    position: 'absolute',
    top: 0,
    width: 1.5,
    height: 6,
    backgroundColor: 'rgba(12, 12, 12, 0.25)',
  },
  tickSouth: {
    position: 'absolute',
    bottom: 0,
    width: 1.5,
    height: 6,
    backgroundColor: 'rgba(12, 12, 12, 0.25)',
  },
  tickEast: {
    position: 'absolute',
    right: 0,
    width: 6,
    height: 1.5,
    backgroundColor: 'rgba(12, 12, 12, 0.25)',
  },
  tickWest: {
    position: 'absolute',
    left: 0,
    width: 6,
    height: 1.5,
    backgroundColor: 'rgba(12, 12, 12, 0.25)',
  },
  pulseWave: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: Colors.icyBlue, // Icy Blue #A6DCF8
    backgroundColor: 'rgba(166, 220, 248, 0.12)',
  },
  scannerLine: {
    position: 'absolute',
    width: 104,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.icyBlue, // Icy Blue #A6DCF8 scanning line
  },
  centerPin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.onyx,
    backgroundColor: Colors.ivoryMist,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  racingRedCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.racingRed, // Racing Red #EB2627 pinpoint core
  },
});

export default ProcessingIndicator;
