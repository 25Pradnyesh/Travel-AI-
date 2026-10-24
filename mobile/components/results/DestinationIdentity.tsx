import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ConfidenceBadge, GlassView } from '@/components/ui';
import { DestinationOverview } from '@/types/analysis';

export interface DestinationIdentityProps {
  confidence?: number;
  verificationStatus?: string;
  category?: string;
  overview?: DestinationOverview | null;
  why?: string;
  geminiReason?: string;
}

export const DestinationIdentity: React.FC<DestinationIdentityProps> = ({
  confidence,
  verificationStatus,
  category,
  overview,
  why,
  geminiReason,
}) => {
  const [debugExpanded, setDebugExpanded] = useState(false);

  const hasStatus = Boolean(verificationStatus || (confidence !== undefined && confidence !== null));

  // Extract up to 5 labeled overview items (omit any with missing data)
  const overviewRows: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }[] = [];

  if (overview?.where && overview.where.trim()) {
    overviewRows.push({ label: 'WHERE', value: overview.where.trim(), icon: 'map-outline' });
  }
  if (overview?.size && overview.size.trim()) {
    overviewRows.push({ label: 'SIZE', value: overview.size.trim(), icon: 'resize-outline' });
  }
  if (overview?.main_city_landmark && overview.main_city_landmark.trim()) {
    overviewRows.push({ label: 'MAIN CITY / LANDMARK', value: overview.main_city_landmark.trim(), icon: 'business-outline' });
  }
  if (overview?.recognition && overview.recognition.trim()) {
    overviewRows.push({ label: 'RECOGNITION', value: overview.recognition.trim(), icon: 'ribbon-outline' });
  }
  if (overview?.climate && overview.climate.trim()) {
    overviewRows.push({ label: 'CLIMATE', value: overview.climate.trim(), icon: 'partly-sunny-outline' });
  }

  const hasOverview = overviewRows.length > 0;
  const hasWhy = Boolean(why && why.trim().length > 0);
  const hasGemini = Boolean(geminiReason && geminiReason.trim().length > 0);
  const hasDebugData = hasWhy || hasGemini;

  // If no status and no overview and no debug, hide cleanly
  if (!hasStatus && !hasOverview && !(__DEV__ && hasDebugData)) {
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

        {/* Factual Destination Overview (Max 5 labeled rows) */}
        {hasOverview ? (
          <View style={styles.overviewSection}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="information-circle-outline" size={13} color={Colors.icyBlue} />
              <Text style={styles.sectionHeader}>DESTINATION OVERVIEW</Text>
            </View>

            <View style={styles.overviewList}>
              {overviewRows.map((row, idx) => (
                <View key={idx} style={styles.overviewRow}>
                  <View style={styles.rowLabelGroup}>
                    <Ionicons name={row.icon} size={12} color={Colors.icyBlue} />
                    <Text style={styles.overviewLabel}>{row.label}</Text>
                  </View>
                  <Text style={styles.overviewValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* __DEV__ ONLY: Raw Identification Evidence & Gemini Notes */}
        {__DEV__ && hasDebugData ? (
          <View style={styles.devSection}>
            <Pressable
              onPress={() => setDebugExpanded(!debugExpanded)}
              style={({ pressed }) => [styles.devToggle, pressed && styles.pressed]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Toggle debug evidence"
            >
              <View style={styles.devHeaderLeft}>
                <Ionicons name="bug-outline" size={12} color="rgba(251, 244, 227, 0.45)" />
                <Text style={styles.devHeaderText}>__DEV__ DEBUG EVIDENCE</Text>
              </View>
              <Ionicons
                name={debugExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="rgba(251, 244, 227, 0.45)"
              />
            </Pressable>

            {debugExpanded ? (
              <View style={styles.devContent}>
                {hasWhy ? (
                  <View style={styles.debugItem}>
                    <Text style={styles.debugSubheader}>Raw Identification Evidence:</Text>
                    <Text style={styles.debugBody}>{why}</Text>
                  </View>
                ) : null}

                {hasGemini ? (
                  <View style={styles.debugItem}>
                    <Text style={styles.debugSubheader}>Raw Gemini Vision Notes:</Text>
                    <Text style={styles.debugBody}>{geminiReason}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
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
  overviewSection: {
    marginTop: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
    textTransform: 'uppercase',
  },
  overviewList: {
    gap: 10,
  },
  overviewRow: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251, 244, 227, 0.06)',
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  overviewLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1,
    color: 'rgba(166, 220, 248, 0.85)',
    textTransform: 'uppercase',
  },
  overviewValue: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.ivoryMist,
  },
  devSection: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 244, 227, 0.08)',
    paddingTop: Spacing.sm,
  },
  devToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  devHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  devHeaderText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 9,
    letterSpacing: 0.8,
    color: 'rgba(251, 244, 227, 0.45)',
  },
  devContent: {
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  debugItem: {
    gap: 2,
  },
  debugSubheader: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    color: 'rgba(251, 244, 227, 0.60)',
  },
  debugBody: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(251, 244, 227, 0.80)',
  },
  pressed: {
    opacity: 0.7,
  },
});
