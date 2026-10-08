import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ConfidenceBadge, GlassView } from '@/components/ui';

export interface DestinationIdentityProps {
  confidence?: number;
  verificationStatus?: string;
  category?: string;
  why?: string;
  geminiReason?: string;
}

export const DestinationIdentity: React.FC<DestinationIdentityProps> = ({
  confidence,
  verificationStatus,
  category,
  why,
  geminiReason,
}) => {
  const hasWhy = Boolean(why && why.trim().length > 0);
  const hasGemini = Boolean(geminiReason && geminiReason.trim().length > 0);
  const hasStatus = Boolean(verificationStatus || (confidence !== undefined && confidence !== null));

  // If absolutely no evidence data is present, hide the evidence panel cleanly
  if (!hasStatus && !hasWhy && !hasGemini) {
    return null;
  }

  return (
    <View style={styles.container}>
      <GlassView variant="dark" borderRadius={Radius.xl} style={styles.card}>
        {/* Top Row: PRD Truthful Confidence Badge + Optional Category Pill */}
        <View style={styles.topRow}>
          {hasStatus ? (
            <ConfidenceBadge
              status={verificationStatus}
              confidence={confidence}
            />
          ) : null}

          {category ? (
            <View style={styles.categoryPill}>
              <View style={styles.categoryDot} />
              <Text style={styles.categoryText}>{category.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>

        {/* Identification Clues / Why We Identified This */}
        {hasWhy ? (
          <View style={styles.whySection}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="scan-outline" size={13} color={Colors.icyBlue} />
              <Text style={styles.sectionHeader}>IDENTIFICATION EVIDENCE</Text>
            </View>
            <Text style={styles.evidenceBody}>{why}</Text>
          </View>
        ) : null}

        {/* Gemini Vision Notes (when present) */}
        {hasGemini ? (
          <View style={styles.geminiBlock}>
            <View style={styles.geminiHeaderRow}>
              <Ionicons name="sparkles" size={13} color={Colors.icyBlue} />
              <Text style={styles.geminiHeader}>GEMINI VISION NOTES</Text>
            </View>
            <Text style={styles.geminiBody}>{geminiReason}</Text>
          </View>
        ) : null}
      </GlassView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  card: {
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.14)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 244, 227, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 5,
  },
  categoryDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.icyBlue,
  },
  categoryText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.ivoryMist,
  },
  whySection: {
    marginTop: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionHeader: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
    textTransform: 'uppercase',
  },
  evidenceBody: {
    fontFamily: Fonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.ivoryMist,
    letterSpacing: -0.1,
  },
  geminiBlock: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(166, 220, 248, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.20)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  geminiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  geminiHeader: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    color: Colors.icyBlue,
  },
  geminiBody: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(251, 244, 227, 0.90)',
  },
});

export default DestinationIdentity;
