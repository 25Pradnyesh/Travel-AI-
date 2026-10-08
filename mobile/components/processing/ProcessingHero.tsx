import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

export interface ProcessingHeroProps {
  isLongRunning?: boolean;
}

export const ProcessingHero: React.FC<ProcessingHeroProps> = ({
  isLongRunning = false,
}) => {
  const reassuranceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLongRunning) {
      Animated.timing(reassuranceAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    } else {
      reassuranceAnim.setValue(0);
    }
  }, [isLongRunning, reassuranceAnim]);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>EDITORIAL REEL RESOLUTION</Text>
      <Text style={styles.headline}>Finding your place.</Text>
      <Text style={styles.description}>
        We're looking for visual clues, landmarks and location signals in the reel.
      </Text>

      {isLongRunning && (
        <Animated.View style={[styles.reassuranceWrapper, { opacity: reassuranceAnim }]}>
          <Text style={styles.reassuranceText}>
            Deep location resolution can take a little time. We're pinpointing the exact coordinates.
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl, // 24px horizontal padding
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  eyebrow: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(12, 12, 12, 0.45)', // Onyx muted
    marginBottom: Spacing.xs,
  },
  headline: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.7,
    color: Colors.onyx,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    color: 'rgba(12, 12, 12, 0.65)', // Onyx secondary
    marginTop: Spacing.sm,
    maxWidth: 320,
  },
  reassuranceWrapper: {
    marginTop: Spacing.sm + 2,
    paddingTop: Spacing.xs,
  },
  reassuranceText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    fontStyle: 'italic',
    color: 'rgba(12, 12, 12, 0.50)',
    maxWidth: 320,
  },
});

export default ProcessingHero;
