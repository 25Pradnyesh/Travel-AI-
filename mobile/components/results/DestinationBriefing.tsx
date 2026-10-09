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

/**
 * Safely format budget with Intl.NumberFormat and real currency, with no hardcoded '$'
 */
export function formatBudget(budget?: string | number, currencyCode?: string): string {
  if (!budget && budget !== 0) return '';
  const rawStr = String(budget).trim();
  if (!rawStr) return '';

  const cleanCurrency = (currencyCode || '').trim().toUpperCase();

  // If a numeric range is given, e.g. "120 - 180" or "$280 - $420"
  const rangeMatch = rawStr.match(/(\d+)\s*[-–—]\s*(\d+)/);
  if (rangeMatch) {
    const low = parseInt(rangeMatch[1], 10);
    const high = parseInt(rangeMatch[2], 10);
    if (!isNaN(low) && !isNaN(high)) {
      if (cleanCurrency && cleanCurrency.length === 3) {
        try {
          const formatter = new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: cleanCurrency,
            maximumFractionDigits: 0,
          });
          return `${formatter.format(low)} – ${formatter.format(high)}`;
        } catch {
          return `${cleanCurrency} ${low} – ${high}`;
        }
      }
      return `${low} – ${high}`;
    }
  }

  // If a single number is given
  const numericOnly = parseFloat(rawStr.replace(/[^0-9.]/g, ''));
  if (!isNaN(numericOnly)) {
    if (cleanCurrency && cleanCurrency.length === 3) {
      try {
        const formatter = new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: cleanCurrency,
          maximumFractionDigits: 0,
        });
        return formatter.format(numericOnly);
      } catch {
        return `${cleanCurrency} ${numericOnly}`;
      }
    }
    return String(numericOnly);
  }

  // Fallback: strip leading '$' if currency code provided
  return cleanCurrency ? `${cleanCurrency} ${rawStr.replace(/^\$+/, '')}` : rawStr;
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
  const [tipsExpanded, setTipsExpanded] = useState(false);

  const hasSeason = Boolean(intelligence.best_season && intelligence.best_season.trim().length > 0);
  const formattedBudget = formatBudget(
    intelligence.estimated_daily_budget,
    intelligence.currency
  );
  const hasBudget = Boolean(formattedBudget || (intelligence.budget_level && intelligence.budget_level.trim().length > 0));
  const hasStay = Boolean(
    intelligence.recommended_trip_days && intelligence.recommended_trip_days.trim().length > 0
  );
  const hasTips = Boolean(Array.isArray(tips) && tips.length > 0);

  const hasAnyDossierRow = hasSeason || hasBudget || hasStay || hasTips;

  if (!hasAnyDossierRow) {
    return null;
  }

  const handleToggleTips = () => {
    hapticFeedback.light();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTipsExpanded((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      {/* Travel Dossier Section Header */}
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
                    {formattedBudget || intelligence.budget_level || 'Moderate'}
                  </Text>
                  {intelligence.budget_level && formattedBudget ? (
                    <Text style={styles.rowSubtext}>
                      {intelligence.budget_level} tier
                    </Text>
                  ) : null}
                </View>
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
