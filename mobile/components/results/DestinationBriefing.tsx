import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { TravelIntelligence } from '@/types/analysis';

export interface DestinationBriefingProps {
  summary?: string;
  whyIdentified?: string;
  intelligence?: TravelIntelligence;
}

export const DestinationBriefing: React.FC<DestinationBriefingProps> = ({
  summary,
  whyIdentified,
  intelligence = {},
}) => {
  const hasSeason = Boolean(intelligence.best_season);
  const hasBudget = Boolean(intelligence.estimated_daily_budget || intelligence.budget_level);
  const hasStay = Boolean(intelligence.recommended_trip_days);
  const hasBriefing = hasSeason || hasBudget || hasStay;

  return (
    <View style={styles.container}>
      {/* About Section */}
      {summary ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>ABOUT THE DESTINATION</Text>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      ) : null}

      {/* Identification Story / Clues */}
      {whyIdentified ? (
        <View style={styles.evidenceBlock}>
          <View style={styles.evidenceHeaderRow}>
            <View style={styles.evidenceDot} />
            <Text style={styles.evidenceHeader}>HOW WE IDENTIFIED THIS</Text>
          </View>
          <Text style={styles.evidenceText}>{whyIdentified}</Text>
        </View>
      ) : null}

      {/* Practical Trip Intelligence Metrics */}
      {hasBriefing ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>TRIP BRIEFING</Text>

          <View style={styles.metricsGrid}>
            {hasSeason ? (
              <View style={styles.metricCard}>
                <View style={styles.metricIconRow}>
                  <Ionicons name="calendar-outline" size={15} color={Colors.onyx} />
                  <Text style={styles.metricLabel}>BEST SEASON</Text>
                </View>
                <Text style={styles.metricValue}>{intelligence.best_season}</Text>
                {Array.isArray(intelligence.peak_months) && intelligence.peak_months.length > 0 && (
                  <Text style={styles.metricSubtext}>
                    Peak: {intelligence.peak_months.join(', ')}
                  </Text>
                )}
              </View>
            ) : null}

            {hasBudget ? (
              <View style={styles.metricCard}>
                <View style={styles.metricIconRow}>
                  <Ionicons name="wallet-outline" size={15} color={Colors.onyx} />
                  <Text style={styles.metricLabel}>DAILY BUDGET</Text>
                </View>
                <Text style={styles.metricValue}>
                  {intelligence.estimated_daily_budget || intelligence.budget_level || 'Moderate'}
                </Text>
                {intelligence.budget_level && intelligence.estimated_daily_budget ? (
                  <Text style={styles.metricSubtext}>
                    {intelligence.budget_level} tier
                  </Text>
                ) : null}
              </View>
            ) : null}

            {hasStay ? (
              <View style={styles.metricCard}>
                <View style={styles.metricIconRow}>
                  <Ionicons name="time-outline" size={15} color={Colors.onyx} />
                  <Text style={styles.metricLabel}>RECOMMENDED STAY</Text>
                </View>
                <Text style={styles.metricValue}>{intelligence.recommended_trip_days}</Text>
                <Text style={styles.metricSubtext}>Ideal visit duration</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl, // 24px horizontal padding
    marginBottom: Spacing.xl,
  },
  sectionBlock: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(12, 12, 12, 0.45)', // Onyx muted
    marginBottom: Spacing.sm,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
    color: Colors.onyx,
  },
  evidenceBlock: {
    backgroundColor: 'rgba(12, 12, 12, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.10)',
    borderRadius: Radius.lg + 2,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  evidenceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs + 2,
  },
  evidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.icyBlue, // Icy Blue accent
  },
  evidenceHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: 'rgba(12, 12, 12, 0.60)',
  },
  evidenceText: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(12, 12, 12, 0.75)',
  },
  metricsGrid: {
    gap: Spacing.sm,
  },
  metricCard: {
    backgroundColor: Colors.ivoryMist,
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.12)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(12, 12, 12, 0.45)',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onyx,
  },
  metricSubtext: {
    fontSize: 12,
    color: 'rgba(12, 12, 12, 0.50)',
    marginTop: 2,
  },
});

export default DestinationBriefing;
