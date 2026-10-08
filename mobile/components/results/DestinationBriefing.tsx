import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { GlassView } from '@/components/ui';
import { TravelIntelligence } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface DestinationBriefingProps {
  summary?: string;
  intelligence?: TravelIntelligence;
  tips?: string[];
}

export const DestinationBriefing: React.FC<DestinationBriefingProps> = ({
  summary,
  intelligence = {},
  tips = [],
}) => {
  const [tipsExpanded, setTipsExpanded] = useState(false);

  const hasSummary = Boolean(summary && summary.trim().length > 0);
  const hasSeason = Boolean(intelligence.best_season && intelligence.best_season.trim().length > 0);
  const hasBudget = Boolean(
    (intelligence.estimated_daily_budget && intelligence.estimated_daily_budget.trim().length > 0) ||
      (intelligence.budget_level && intelligence.budget_level.trim().length > 0)
  );
  const hasStay = Boolean(
    intelligence.recommended_trip_days && intelligence.recommended_trip_days.trim().length > 0
  );
  const hasTips = Boolean(Array.isArray(tips) && tips.length > 0);

  const hasAnyDossierRow = hasSeason || hasBudget || hasStay || hasTips;

  if (!hasSummary && !hasAnyDossierRow) {
    return null;
  }

  const handleToggleTips = () => {
    hapticFeedback.light();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTipsExpanded((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      {/* Optional About Summary Card */}
      {hasSummary ? (
        <GlassView variant="dark" borderRadius={Radius.xl} style={styles.summaryCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="document-text-outline" size={13} color={Colors.icyBlue} />
            <Text style={styles.sectionHeader}>ABOUT THE DESTINATION</Text>
          </View>
          <Text style={styles.summaryText}>{summary}</Text>
        </GlassView>
      ) : null}

      {/* Travel Dossier Section Header */}
      {hasAnyDossierRow ? (
        <View style={styles.dossierSection}>
          <Text style={styles.dossierTitle}>
            Travel <Text style={styles.dossierTitleItalic}>Dossier</Text>
          </Text>

          <View style={styles.rowsStack}>
            {/* Row 1: Best Season */}
            {hasSeason ? (
              <GlassView variant="dark" borderRadius={Radius.lg} style={styles.dossierRow}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.icyBlue} />
                  </View>
                  <View style={styles.rowTextCol}>
                    <Text style={styles.rowLabel}>BEST SEASON</Text>
                    <Text style={styles.rowValue}>{intelligence.best_season}</Text>
                    {Array.isArray(intelligence.peak_months) &&
                    intelligence.peak_months.length > 0 ? (
                      <Text style={styles.rowSubtext}>
                        Peak: {intelligence.peak_months.join(', ')}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.rowRightStatic}>
                  <Ionicons name="sunny-outline" size={16} color={Colors.textSecondary} />
                </View>
              </GlassView>
            ) : null}

            {/* Row 2: Daily Budget */}
            {hasBudget ? (
              <GlassView variant="dark" borderRadius={Radius.lg} style={styles.dossierRow}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="wallet-outline" size={16} color={Colors.icyBlue} />
                  </View>
                  <View style={styles.rowTextCol}>
                    <Text style={styles.rowLabel}>DAILY BUDGET</Text>
                    <Text style={styles.rowValue}>
                      {intelligence.estimated_daily_budget || intelligence.budget_level}
                      {intelligence.currency ? ` (${intelligence.currency})` : ''}
                    </Text>
                    {intelligence.budget_level && intelligence.estimated_daily_budget ? (
                      <Text style={styles.rowSubtext}>
                        {intelligence.budget_level} tier
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.rowRightStatic}>
                  <Ionicons name="cash-outline" size={16} color={Colors.textSecondary} />
                </View>
              </GlassView>
            ) : null}

            {/* Row 3: Ideal Stay */}
            {hasStay ? (
              <GlassView variant="dark" borderRadius={Radius.lg} style={styles.dossierRow}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="time-outline" size={16} color={Colors.icyBlue} />
                  </View>
                  <View style={styles.rowTextCol}>
                    <Text style={styles.rowLabel}>IDEAL STAY</Text>
                    <Text style={styles.rowValue}>{intelligence.recommended_trip_days}</Text>
                    <Text style={styles.rowSubtext}>Recommended visit duration</Text>
                  </View>
                </View>
                <View style={styles.rowRightStatic}>
                  <Ionicons name="hourglass-outline" size={16} color={Colors.textSecondary} />
                </View>
              </GlassView>
            ) : null}

            {/* Row 4: Local Tips (Tap to expand inline!) */}
            {hasTips ? (
              <GlassView variant="dark" borderRadius={Radius.lg} style={styles.tipsRowContainer}>
                <Pressable
                  onPress={handleToggleTips}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={
                    tipsExpanded ? 'Collapse local tips' : 'Expand local tips'
                  }
                  style={({ pressed }) => [styles.tipsHeaderPressable, pressed && styles.pressed]}
                >
                  <View style={styles.rowLeft}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="bulb-outline" size={16} color={Colors.icyBlue} />
                    </View>
                    <View style={styles.rowTextCol}>
                      <Text style={styles.rowLabel}>LOCAL TIPS</Text>
                      <Text style={styles.rowValue}>{tips.length} Curated Insights</Text>
                      <Text style={styles.rowSubtext}>
                        {tipsExpanded ? 'Tap to collapse' : 'Tap to expand advice'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.circularArrowButton}>
                    <Ionicons
                      name={tipsExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={Colors.ivoryMist}
                    />
                  </View>
                </Pressable>

                {/* Inline Expanded Tips List */}
                {tipsExpanded ? (
                  <View style={styles.expandedTipsList}>
                    {tips.map((tip, index) => (
                      <View key={index} style={styles.tipItem}>
                        <View style={styles.tipDot} />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </GlassView>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.14)',
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionHeader: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
    textTransform: 'uppercase',
  },
  summaryText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.ivoryMist,
  },
  dossierSection: {
    marginTop: Spacing.xs,
  },
  dossierTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    lineHeight: 26,
    color: Colors.ivoryMist,
    letterSpacing: -0.3,
    marginBottom: Spacing.md,
  },
  dossierTitleItalic: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    fontWeight: 'normal',
  },
  rowsStack: {
    gap: Spacing.sm,
  },
  dossierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.12)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(166, 220, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowTextCol: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  rowValue: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    lineHeight: 19,
    color: Colors.ivoryMist,
    letterSpacing: -0.2,
  },
  rowSubtext: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rowRightStatic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 244, 227, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsRowContainer: {
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.12)',
    overflow: 'hidden',
  },
  tipsHeaderPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    minHeight: TouchTarget.minHeight,
  },
  circularArrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 244, 227, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedTipsList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 244, 227, 0.10)',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
    gap: Spacing.sm + 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.icyBlue,
    marginTop: 6,
  },
  tipText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(251, 244, 227, 0.92)',
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default DestinationBriefing;
