import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

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
      <View style={styles.eyebrowPill}>
        <Text style={styles.eyebrow}>EDITORIAL REEL RESOLUTION</Text>
      </View>
      <Text style={styles.headline}>Finding your place.</Text>
      <View style={styles.descriptionPill}>
        <Text style={styles.description}>
          We're looking for visual clues, landmarks and location signals in the reel.
        </Text>
      </View>

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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  eyebrowPill: {
    backgroundColor: 'rgba(8, 18, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.25)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    marginBottom: Spacing.sm,
  },
  eyebrow: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: Colors.icyBlue,
  },
  headline: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 38,
    lineHeight: 44,
    color: Colors.ivoryMist,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  descriptionPill: {
    backgroundColor: 'rgba(8, 18, 24, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    marginTop: Spacing.sm,
    maxWidth: 320,
  },
  description: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.ivoryMist,
    textAlign: 'center',
  },
  reassuranceWrapper: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(8, 18, 24, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.20)',
  },
  reassuranceText: {
    fontFamily: Fonts.serifItalic,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    color: Colors.icyBlue,
    maxWidth: 290,
    textAlign: 'center',
  },
});

export default ProcessingHero;
