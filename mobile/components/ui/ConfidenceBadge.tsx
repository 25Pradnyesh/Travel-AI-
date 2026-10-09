import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

export type VerificationState = 'VERIFIED' | 'PARTIAL' | 'UNVERIFIED' | 'SKIPPED' | string;

export interface ConfidenceBadgeProps {
  status?: VerificationState;
  confidence?: number;
  showIcon?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * ConfidenceBadge
 *
 * Truthful PRD verification states:
 * - VERIFIED: Icy Blue #A6DCF8 with checkmark
 * - PARTIAL: Warm Amber #E5A866
 * - UNVERIFIED / SKIPPED: Honest muted slate #7A8991 (STRICTLY NO Icy Blue)
 */
export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  status = 'UNVERIFIED',
  confidence,
  showIcon = true,
  style,
}) => {
  const normalized = (status || '').toUpperCase();

  const isVerified = normalized === 'VERIFIED';
  const isPartial = normalized === 'PARTIAL';
  const isUnverified = !isVerified && !isPartial;

  const label = isVerified
    ? 'VERIFIED'
    : isPartial
    ? 'PARTIAL MATCH'
    : 'UNVERIFIED';

  const badgeColor = isVerified
    ? Colors.verified
    : isPartial
    ? Colors.partial
    : Colors.unverified;

  const badgeSurface = isVerified
    ? Colors.verifiedSurface
    : isPartial
    ? Colors.partialSurface
    : Colors.unverifiedSurface;

  const badgeBorder = isVerified
    ? Colors.verifiedBorder
    : isPartial
    ? Colors.partialBorder
    : Colors.unverifiedBorder;

  const iconName = isVerified
    ? 'checkmark-circle-sharp'
    : isPartial
    ? 'alert-circle-sharp'
    : 'help-circle-sharp';

  let displayPercent: number | null = null;
  if (typeof confidence === 'number' && !isNaN(confidence) && confidence > 0) {
    if (confidence <= 1.0) {
      displayPercent = Math.round(confidence * 100);
    } else {
      displayPercent = Math.round(confidence);
    }
  }

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: badgeSurface, borderColor: badgeBorder },
        style,
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Verification status: ${label}${displayPercent != null ? `, ${displayPercent}% confidence` : ''}`}
    >
      {showIcon && (
        <Ionicons name={iconName} size={12} color={badgeColor} style={styles.icon} />
      )}
      <Text style={[styles.text, { color: badgeColor }]}>{label}</Text>
      {displayPercent != null && displayPercent > 0 && (
        <Text style={[styles.confidenceText, { color: badgeColor }]}>
          {displayPercent}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  confidenceText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    marginLeft: 4,
    opacity: 0.85,
  },
});

export default ConfidenceBadge;
