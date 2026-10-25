import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ConfidenceBadge, GlassView } from '@/components/ui';
import { DestinationOverview } from '@/types/analysis';

export interface DestinationIdentityProps {
  confidence?: number;
  verificationStatus?: string;
  category?: string;
  overview?: DestinationOverview | null;
  editorialSummary?: string | null;
  why?: string;
  geminiReason?: string;
}

export const DestinationIdentity: React.FC<DestinationIdentityProps> = ({
  confidence,
  verificationStatus,
  category,
  overview,
  editorialSummary,
}) => {
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

  const hasOverviewRows = overviewRows.length > 0;

  // Editorial fallback summary: first 1-2 sentences of Wikipedia summary with credit
  const rawSummary = (overview?.summary_fallback || editorialSummary || '').trim();
  const fallbackSummary = rawSummary
    ? rawSummary.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ')
    : `${category || 'Destination'} overview verified through open geographic and encyclopedia records.`;

  return (
    <View style={styles.container}>
      <GlassView variant="dark" borderRadius={Radius.xl} style={styles.card}>
        {/* Top Row: Verified Badge + Optional Category Pill */}
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

        {/* Factual Destination Overview / Location Details (Max 5 labeled rows) */}
        <View style={styles.overviewSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="information-circle-outline" size={13} color={Colors.icyBlue} />
            <Text style={styles.sectionHeader}>LOCATION DETAILS</Text>
          </View>

          {hasOverviewRows ? (
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
          ) : (
            <View style={styles.summaryFallbackBox}>
              <Text style={styles.summaryFallbackText}>{fallbackSummary}</Text>
              <View style={styles.wikipediaBadge}>
                <Ionicons name="book-outline" size={11} color={Colors.icyBlue} />
                <Text style={styles.wikipediaBadgeText}>Wikipedia</Text>
              </View>
            </View>
          )}
        </View>
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
  summaryFallbackBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: 8,
  },
  summaryFallbackText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(251, 244, 227, 0.85)',
  },
  wikipediaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(166, 220, 248, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  wikipediaBadgeText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    color: Colors.icyBlue,
    letterSpacing: 0.2,
  },
});

export default DestinationIdentity;
