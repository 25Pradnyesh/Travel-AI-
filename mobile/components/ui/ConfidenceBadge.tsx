import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { VerificationStatus } from '@/types/theme';

export interface ConfidenceBadgeProps {
  status: VerificationStatus | string;
  confidence?: number;
  style?: StyleProp<ViewStyle>;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  status,
  confidence,
  style,
}) => {
  const normalized = (status || 'SKIPPED').toUpperCase();

  const getConfig = () => {
    switch (normalized) {
      case 'VERIFIED':
        return {
          label: 'Verified Match',
          dotColor: Colors.verified,
          backgroundColor: Colors.verifiedSurface,
          borderColor: Colors.verifiedBorder,
          textColor: Colors.verified,
        };
      case 'PARTIAL':
        return {
          label: 'Partially Verified',
          dotColor: Colors.partial,
          backgroundColor: Colors.partialSurface,
          borderColor: Colors.partialBorder,
          textColor: Colors.partial,
        };
      case 'FAILED':
      case 'AI_UNVERIFIED':
        return {
          label: 'Location Identified (AI Unverified)',
          dotColor: Colors.aiUnverified,
          backgroundColor: Colors.aiUnverifiedSurface,
          borderColor: Colors.aiUnverifiedBorder,
          textColor: Colors.textSecondary,
        };
      default:
        return {
          label: 'Algorithmic Placement',
          dotColor: Colors.algorithmic,
          backgroundColor: Colors.algorithmicSurface,
          borderColor: Colors.algorithmicBorder,
          textColor: Colors.textMuted,
        };
    }
  };

  const config = getConfig();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Verification status: ${config.label}${
        confidence != null ? `, ${confidence}% confidence` : ''
      }`}
    >
      <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
      <Text style={[styles.label, { color: config.textColor }]}>{config.label}</Text>
      {confidence != null && confidence > 0 && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreSeparator}>·</Text>
          <Text style={[styles.scoreText, { color: config.textColor }]}>{confidence}%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    marginRight: Spacing.xs + 2,
  },
  label: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  scoreSeparator: {
    color: Colors.textMuted,
    marginRight: Spacing.xs,
    fontSize: 12,
  },
  scoreText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ConfidenceBadge;
