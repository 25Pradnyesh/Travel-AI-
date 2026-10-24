import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { GlassView } from '@/components/ui';
import { BudgetTier, SeasonCard, TravelIntelligence } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';

import { formatBudget, getCurrencySymbol } from '@/lib/format/budget';
export { formatBudget, getCurrencySymbol };

// Enable experimental LayoutAnimation on Android for the Old Architecture only.
const isNewArchitecture = Boolean(
  (globalThis as unknown as { RN$Bridgeless?: unknown }).RN$Bridgeless ||
  (globalThis as unknown as { nativeFabricUIManager?: unknown }).nativeFabricUIManager ||
  (globalThis as unknown as { _IS_FABRIC?: unknown })._IS_FABRIC
);
if (Platform.OS === 'android' && !isNewArchitecture && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface DestinationBriefingProps {
  summary?: string;
  intelligence?: TravelIntelligence;
  tips?: string[];
}

export const DestinationBriefing: React.FC<DestinationBriefingProps> = ({
  intelligence = {},
  tips = [],
}) => {
  const [seasonExpanded, setSeasonExpanded] = useState(false);
  const [selectedBudgetTier, setSelectedBudgetTier] = useState<'budget' | 'mid_range' | 'comfortable'>('mid_range');
  const [budgetExpanded, setBudgetExpanded] = useState(false);
  const [tipsExpanded, setTipsExpanded] = useState(false);

  // Best season determination
  const bestSeasonTitle = intelligence.best_season || intelligence.recommended_window || '';
  const hasSeason = Boolean(bestSeasonTitle.trim().length > 0);
  const seasonCards: SeasonCard[] = Array.isArray(intelligence.season_cards) ? intelligence.season_cards : [];
  const hasSeasonCards = seasonCards.length > 0;

  // Budget model determination
  const budgetModel = intelligence.budget_model;
  const hasBudgetModel = Boolean(budgetModel && budgetModel.tiers);
  const formattedBudget = formatBudget(
    intelligence.estimated_daily_budget,
    intelligence.currency
  );
  const hasLegacyBudget = Boolean(formattedBudget || (intelligence.budget_level && intelligence.budget_level.trim().length > 0));
  const hasBudget = hasBudgetModel || hasLegacyBudget;

  // Stay determination
  const hasStay = Boolean(
    intelligence.recommended_trip_days && intelligence.recommended_trip_days.trim().length > 0
  );

  // Sourced tips determination (strictly destination-specific)
  const hasTips = Boolean(Array.isArray(tips) && tips.length > 0);

  const hasAnyDossierRow = hasSeason || hasBudget || hasStay || hasTips;

  if (!hasAnyDossierRow) {
    return null;
  }

  const handleToggleSeason = () => {
    if (!hasSeasonCards) return;
    hapticFeedback.light();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSeasonExpanded((prev) => !prev);
  };

  const handleToggleBudget = () => {
    if (!hasBudgetModel) return;
    hapticFeedback.light();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setBudgetExpanded((prev) => !prev);
  };

  const handleToggleTips = () => {
    hapticFeedback.light();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTipsExpanded((prev) => !prev);
  };

  const currentTierData: BudgetTier | undefined = budgetModel?.tiers ? budgetModel.tiers[selectedBudgetTier] : undefined;

  return (
    <View style={styles.container}>
      {/* Travel Dossier Section Header */}
      <View style={styles.dossierSection}>
        <Text style={styles.dossierTitle}>
          Travel <Text style={styles.dossierTitleItalic}>Dossier</Text>
        </Text>

        <View style={styles.rowsStack}>
          {/* Row 1: Best Season (Based on historical weather, with expandable cards) */}
          {hasSeason ? (
            <GlassView variant="dark" borderRadius={Radius.lg} style={styles.cardContainer}>
              <Pressable
                onPress={handleToggleSeason}
                disabled={!hasSeasonCards}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Toggle historical weather seasons"
                style={({ pressed }) => [styles.headerPressable, pressed && hasSeasonCards && styles.pressed]}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.icyBlue} />
                  </View>
                  <View style={styles.rowTextCol}>
                    <View style={styles.labelBadgeRow}>
                      <Text style={styles.rowLabel}>BEST TIME TO VISIT</Text>
                      <Text style={styles.basisTag}>based on historical weather</Text>
                    </View>
                    <Text style={styles.rowValue}>{bestSeasonTitle}</Text>
                    {intelligence.recommended_reason ? (
                      <Text style={styles.rowSubtext}>{intelligence.recommended_reason}</Text>
                    ) : intelligence.temperature_range ? (
                      <Text style={styles.rowSubtext}>Typical temperatures: {intelligence.temperature_range}</Text>
                    ) : null}
                  </View>
                </View>

                {hasSeasonCards ? (
                  <View style={styles.circularArrowButton}>
                    <Ionicons
                      name={seasonExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={Colors.ivoryMist}
                    />
                  </View>
                ) : null}
              </Pressable>

              {/* Expandable Season Cards */}
              {seasonExpanded && hasSeasonCards ? (
                <View style={styles.seasonCardsList}>
                  {seasonCards.map((sc, index) => (
                    <View key={index} style={styles.seasonCardItem}>
                      <View style={styles.seasonCardHeader}>
                        <Text style={styles.seasonCardName}>{sc.name}</Text>
                        <Text style={styles.seasonCardMonths}>{sc.months}</Text>
                      </View>
                      <View style={styles.weatherMetricsRow}>
                        <View style={styles.metricPill}>
                          <Ionicons name="thermometer-outline" size={11} color={Colors.icyBlue} />
                          <Text style={styles.metricText}>{sc.avg_temp_range}</Text>
                        </View>
                        <View style={styles.metricPill}>
                          <Ionicons name="rainy-outline" size={11} color={Colors.icyBlue} />
                          <Text style={styles.metricText}>{sc.avg_rainfall}</Text>
                        </View>
                      </View>
                      <Text style={styles.seasonCardDesc}>{sc.description}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </GlassView>
          ) : null}

          {/* Row 2: Daily Budget (Transparent Model with components & INR conversion) */}
          {hasBudget ? (
            <GlassView variant="dark" borderRadius={Radius.lg} style={styles.cardContainer}>
              <Pressable
                onPress={handleToggleBudget}
                disabled={!hasBudgetModel}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Toggle daily budget details"
                style={({ pressed }) => [styles.headerPressable, pressed && hasBudgetModel && styles.pressed]}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="wallet-outline" size={16} color={Colors.icyBlue} />
                  </View>
                  <View style={styles.rowTextCol}>
                    <View style={styles.labelBadgeRow}>
                      <Text style={styles.rowLabel}>DAILY BUDGET</Text>
                      <Text style={styles.basisTag}>model estimate</Text>
                    </View>

                    {budgetModel && currentTierData ? (
                      <View>
                        <Text style={styles.rowValue}>
                          {budgetModel.local_currency} {currentTierData.total_local.toLocaleString()}
                          {'  '}
                          <Text style={styles.secondaryCurrency}>
                            (≈ ₹{currentTierData.total_inr.toLocaleString()})
                          </Text>
                        </Text>
                        <Text style={styles.rowSubtext}>
                          {currentTierData.name} tier • {currentTierData.style}
                        </Text>
                      </View>
                    ) : (
                      <View>
                        <Text style={styles.rowValue}>
                          {formattedBudget || intelligence.budget_level || 'Moderate'}
                        </Text>
                        {intelligence.budget_level && formattedBudget ? (
                          <Text style={styles.rowSubtext}>{intelligence.budget_level} tier</Text>
                        ) : null}
                      </View>
                    )}
                  </View>
                </View>

                {hasBudgetModel ? (
                  <View style={styles.circularArrowButton}>
                    <Ionicons
                      name={budgetExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={Colors.ivoryMist}
                    />
                  </View>
                ) : null}
              </Pressable>

              {/* Expandable Transparent Budget Breakdown */}
              {budgetExpanded && budgetModel && currentTierData ? (
                <View style={styles.budgetExpandedContent}>
                  {/* Tier Segmented Tabs */}
                  <View style={styles.tierTabsRow}>
                    {(['budget', 'mid_range', 'comfortable'] as const).map((tierKey) => {
                      const isSelected = selectedBudgetTier === tierKey;
                      const label = budgetModel.tiers[tierKey]?.name || tierKey;
                      return (
                        <Pressable
                          key={tierKey}
                          onPress={() => {
                            hapticFeedback.selection();
                            setSelectedBudgetTier(tierKey);
                          }}
                          style={[styles.tierTab, isSelected && styles.tierTabSelected]}
                        >
                          <Text style={[styles.tierTabText, isSelected && styles.tierTabTextSelected]}>
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Component Breakdown Table */}
                  <View style={styles.breakdownTable}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Accommodation (stay)</Text>
                      <Text style={styles.breakdownValue}>
                        {budgetModel.local_currency} {currentTierData.breakdown_local.stay.toLocaleString()}
                        {' '}(₹{currentTierData.breakdown_inr.stay.toLocaleString()})
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Food & Dining</Text>
                      <Text style={styles.breakdownValue}>
                        {budgetModel.local_currency} {currentTierData.breakdown_local.food.toLocaleString()}
                        {' '}(₹{currentTierData.breakdown_inr.food.toLocaleString()})
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Local Transport</Text>
                      <Text style={styles.breakdownValue}>
                        {budgetModel.local_currency} {currentTierData.breakdown_local.local_transport.toLocaleString()}
                        {' '}(₹{currentTierData.breakdown_inr.local_transport.toLocaleString()})
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Activities & Sights</Text>
                      <Text style={styles.breakdownValue}>
                        {budgetModel.local_currency} {currentTierData.breakdown_local.activities.toLocaleString()}
                        {' '}(₹{currentTierData.breakdown_inr.activities.toLocaleString()})
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Buffer & Incidentals</Text>
                      <Text style={styles.breakdownValue}>
                        {budgetModel.local_currency} {currentTierData.breakdown_local.buffer.toLocaleString()}
                        {' '}(₹{currentTierData.breakdown_inr.buffer.toLocaleString()})
                      </Text>
                    </View>
                    <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                      <Text style={styles.breakdownTotalLabel}>Total Daily Estimate</Text>
                      <Text style={styles.breakdownTotalValue}>
                        {budgetModel.local_currency} {currentTierData.total_local.toLocaleString()}
                        {' '}(₹{currentTierData.total_inr.toLocaleString()})
                      </Text>
                    </View>
                  </View>

                  {/* Required Transparency Metadata */}
                  <View style={styles.budgetMetaNotes}>
                    <Text style={styles.metaNoteText}>• Per person • Accommodation included</Text>
                    <Text style={styles.metaNoteText}>• Excludes: Flights, Visas, Travel insurance</Text>
                    <Text style={styles.metaNoteText}>• Reference exchange rate date: {budgetModel.rate_date}</Text>
                    <Text style={styles.disclaimerText}>{budgetModel.disclaimer}</Text>
                  </View>
                </View>
              ) : null}
            </GlassView>
          ) : null}

          {/* Row 3: Ideal Stay Duration */}
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
            </GlassView>
          ) : null}

          {/* Row 4: Sourced Destination Tips (Hidden if none) */}
          {hasTips ? (
            <GlassView variant="dark" borderRadius={Radius.lg} style={styles.cardContainer}>
              <Pressable
                onPress={handleToggleTips}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={tipsExpanded ? 'Collapse local tips' : 'Expand local tips'}
                style={({ pressed }) => [styles.headerPressable, pressed && styles.pressed]}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="bulb-outline" size={16} color={Colors.icyBlue} />
                  </View>
                  <View style={styles.rowTextCol}>
                    <Text style={styles.rowLabel}>DESTINATION TIPS</Text>
                    <Text style={styles.rowValue}>{tips.length} Sourced Insights</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
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
  cardContainer: {
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.12)',
    overflow: 'hidden',
  },
  headerPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
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
    marginRight: 14,
  },
  rowTextCol: {
    flex: 1,
  },
  labelBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  rowLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 1.1,
    color: Colors.icyBlue,
    textTransform: 'uppercase',
  },
  basisTag: {
    fontFamily: Fonts.sansRegular,
    fontSize: 8,
    letterSpacing: 0.5,
    color: 'rgba(251, 244, 227, 0.50)',
    backgroundColor: 'rgba(251, 244, 227, 0.06)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  rowValue: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.ivoryMist,
    letterSpacing: -0.2,
  },
  secondaryCurrency: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    color: 'rgba(251, 244, 227, 0.70)',
  },
  rowSubtext: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(251, 244, 227, 0.60)',
    marginTop: 2,
  },
  circularArrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 244, 227, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonCardsList: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 244, 227, 0.08)',
    paddingTop: Spacing.sm,
  },
  seasonCardItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.06)',
  },
  seasonCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  seasonCardName: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.ivoryMist,
  },
  seasonCardMonths: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.icyBlue,
  },
  weatherMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(166, 220, 248, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  metricText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.ivoryMist,
  },
  seasonCardDesc: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(251, 244, 227, 0.70)',
  },
  budgetExpandedContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 244, 227, 0.08)',
    paddingTop: Spacing.sm,
  },
  tierTabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.30)',
    borderRadius: Radius.pill,
    padding: 3,
    marginBottom: Spacing.sm,
  },
  tierTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: Radius.pill,
  },
  tierTabSelected: {
    backgroundColor: 'rgba(166, 220, 248, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.35)',
  },
  tierTabText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: 'rgba(251, 244, 227, 0.65)',
  },
  tierTabTextSelected: {
    fontFamily: Fonts.sansBold,
    color: Colors.ivoryMist,
  },
  breakdownTable: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  breakdownLabel: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: 'rgba(251, 244, 227, 0.75)',
  },
  breakdownValue: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.ivoryMist,
  },
  breakdownTotalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 244, 227, 0.12)',
    paddingTop: 6,
    marginTop: 4,
  },
  breakdownTotalLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    color: Colors.icyBlue,
  },
  breakdownTotalValue: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    color: Colors.ivoryMist,
  },
  budgetMetaNotes: {
    marginTop: Spacing.sm,
    gap: 2,
  },
  metaNoteText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: 'rgba(251, 244, 227, 0.55)',
  },
  disclaimerText: {
    fontFamily: Fonts.serifItalic,
    fontSize: 10,
    color: 'rgba(251, 244, 227, 0.45)',
    marginTop: 4,
  },
  expandedTipsList: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 244, 227, 0.08)',
    paddingTop: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.icyBlue,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(251, 244, 227, 0.85)',
  },
  pressed: {
    opacity: 0.7,
  },
});
