import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { GlassView } from '@/components/ui';

export interface LocalAdviceSectionProps {
  tips: string[];
}

export const LocalAdviceSection: React.FC<LocalAdviceSectionProps> = ({ tips }) => {
  if (!tips || tips.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>LOCAL TRAVEL GUIDANCE</Text>

      <GlassView variant="dark" borderRadius={Radius.xl} style={styles.card}>
        <View style={styles.tipsList}>
          {tips.slice(0, 5).map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <View style={styles.tipNumberWrapper}>
                <Text style={styles.tipNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </GlassView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.icyBlue,
    marginBottom: Spacing.sm,
  },
  card: {
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.12)',
  },
  tipsList: {
    gap: Spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  tipNumberWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.25)',
    backgroundColor: 'rgba(166, 220, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipNumber: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    color: Colors.icyBlue,
  },
  tipText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.ivoryMist,
    flex: 1,
  },
});

export default LocalAdviceSection;
