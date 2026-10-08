import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

export interface LocalAdviceSectionProps {
  tips: string[];
}

export const LocalAdviceSection: React.FC<LocalAdviceSectionProps> = ({ tips }) => {
  if (!tips || tips.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>LOCAL TRAVEL GUIDANCE</Text>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl, // 24px horizontal padding
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(12, 12, 12, 0.45)', // Onyx muted
    marginBottom: Spacing.md,
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
    borderColor: 'rgba(12, 12, 12, 0.16)',
    backgroundColor: 'rgba(12, 12, 12, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tipNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onyx,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(12, 12, 12, 0.80)',
    flex: 1,
  },
});

export default LocalAdviceSection;
