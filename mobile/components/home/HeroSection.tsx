import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

export const HeroSection: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>AI TRAVEL INTELLIGENCE</Text>
      <Text style={styles.headline}>
        Find the place{'\n'}behind the reel.
      </Text>
      <Text style={styles.description}>
        Drop an Instagram travel reel and discover where it was filmed.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl, // 24px editorial horizontal padding
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  eyebrow: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(12, 12, 12, 0.45)', // Onyx muted
    marginBottom: Spacing.sm,
  },
  headline: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.9,
    color: Colors.onyx,
    maxWidth: 320,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: 'rgba(12, 12, 12, 0.65)', // Onyx secondary
    marginTop: Spacing.md,
    maxWidth: 320,
  },
});

export default HeroSection;
