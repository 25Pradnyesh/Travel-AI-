import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  AtmosphereBackground,
  ConfidenceBadge,
  GlassView,
  PillButton,
  PillChip,
} from '@/components/ui';
import { ResultHero } from '@/components/results/ResultHero';
import { DestinationIdentity } from '@/components/results/DestinationIdentity';
import { DestinationBriefing } from '@/components/results/DestinationBriefing';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { FIXTURES, FixtureScenario } from '@/lib/fixtures/results-fixtures';
import { analysisStore } from '@/lib/api/analysis-store';
import { hapticFeedback } from '@/lib/haptics';

export default function ResultsFixturesScreen() {
  const insets = useSafeAreaInsets();
  const [activeScenarioId, setActiveScenarioId] = useState<string>('full');

  // Gated strictly by __DEV__
  if (!__DEV__) {
    return null;
  }

  const activeFixture: FixtureScenario = FIXTURES[activeScenarioId] || FIXTURES.full;
  const bestGuess = activeFixture.data.best_guess;
  const ti = activeFixture.data.travel_intelligence || {};
  const photos = Array.isArray(bestGuess?.photos) ? bestGuess.photos : [];
  const nearby = Array.isArray(activeFixture.data.nearby_places) ? activeFixture.data.nearby_places : [];

  const handleSelectScenario = (id: string) => {
    hapticFeedback.selection();
    setActiveScenarioId(id);
    const scenario = FIXTURES[id];
    if (scenario) {
      analysisStore.setAnalysisResult(scenario.data, scenario.sourceUrl);
    }
  };

  const loadAndNavigate = (route: 'results' | 'map' | 'place') => {
    hapticFeedback.light();
    analysisStore.setAnalysisResult(activeFixture.data, activeFixture.sourceUrl);

    if (route === 'results') {
      router.push('/analyze/results');
    } else if (route === 'map') {
      router.push('/analyze/map');
    } else if (route === 'place') {
      router.push({
        pathname: '/place/[id]',
        params: {
          id: activeFixture.primaryPlaceId,
          name: activeFixture.primaryPlaceName,
        },
      });
    }
  };

  return (
    <AtmosphereBackground variant="sky">
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16) + 10,
            paddingBottom: Math.max(insets.bottom, 24) + 60,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backPill, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.ivoryMist} />
            <Text style={styles.backPillText}>Dev Hub</Text>
          </Pressable>

          <View style={styles.statusPill}>
            <Ionicons name="construct-outline" size={13} color={Colors.icyBlue} />
            <Text style={styles.statusPillText}>__DEV__ ONLY</Text>
          </View>
        </View>

        {/* Title Block */}
        <View style={styles.titleCard}>
          <Text style={styles.eyebrow}>TEST HARNESS</Text>
          <Text style={styles.title}>Results & Map Fixtures</Text>
          <Text style={styles.description}>
            Stress-test Results, Exploration Map, and Place Detail across real-world edge cases.
          </Text>
        </View>

        {/* Scenario Switcher Chips */}
        <View style={styles.scenariosSection}>
          <Text style={styles.sectionLabel}>SELECT TEST FIXTURE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {Object.values(FIXTURES).map((f) => {
              const isSelected = activeScenarioId === f.id;
              return (
                <PillChip
                  key={f.id}
                  label={f.label}
                  selected={isSelected}
                  onPress={() => handleSelectScenario(f.id)}
                />
              );
            })}
          </ScrollView>
        </View>

        {/* Active Scenario Diagnostic Card */}
        <GlassView variant="dark" borderRadius={Radius.xl} style={styles.diagCard}>
          <View style={styles.diagHeader}>
            <View style={styles.diagTitleCol}>
              <Text style={styles.diagTitle}>{activeFixture.label}</Text>
              <Text style={styles.diagDesc}>{activeFixture.description}</Text>
            </View>
            <View style={styles.scenarioBadge}>
              <Text style={styles.scenarioBadgeText}>{activeFixture.badge}</Text>
            </View>
          </View>

          <View style={styles.diagGrid}>
            <View style={styles.diagCell}>
              <Text style={styles.diagKey}>PHOTOS</Text>
              <Text style={styles.diagVal}>
                {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
              </Text>
            </View>
            <View style={styles.diagCell}>
              <Text style={styles.diagKey}>NEARBY POIS</Text>
              <Text style={styles.diagVal}>{nearby.length} places</Text>
            </View>
            <View style={styles.diagCell}>
              <Text style={styles.diagKey}>STATUS</Text>
              <Text style={styles.diagVal}>
                {bestGuess?.verification_status || 'NONE'}
              </Text>
            </View>
            <View style={styles.diagCell}>
              <Text style={styles.diagKey}>COORDINATES</Text>
              <Text style={styles.diagVal}>
                {bestGuess?.latitude != null ? `${bestGuess.latitude.toFixed(2)}, ${bestGuess.longitude?.toFixed(2)}` : 'None'}
              </Text>
            </View>
          </View>
        </GlassView>

        {/* Direct Navigation Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionLabel}>TEST ON TARGET SCREENS</Text>
          <View style={styles.buttonsStack}>
            <PillButton
              title="Open in Results Screen (/analyze/results)"
              variant="brand"
              onPress={() => loadAndNavigate('results')}
              iconRight={<Ionicons name="arrow-forward" size={16} color={Colors.textOnRed} />}
            />
            <PillButton
              title="Open in Exploration Map (/analyze/map)"
              variant="primary"
              onPress={() => loadAndNavigate('map')}
              iconLeft={<Ionicons name="map-outline" size={16} color={Colors.icyBlue} />}
            />
            <PillButton
              title="Open in Place Detail (/place/[id])"
              variant="glass"
              onPress={() => loadAndNavigate('place')}
              iconLeft={<Ionicons name="location-outline" size={16} color={Colors.ivoryMist} />}
            />
          </View>
        </View>

        {/* Live Inline Preview Section */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionLabel}>INLINE LIVE COMPONENT PREVIEW</Text>
          <View style={styles.previewHeroContainer}>
            <ResultHero
              imageUrl={photos[0]?.url}
              destinationName={bestGuess?.name || 'Unknown'}
              locationSubtitle={
                [bestGuess?.city, bestGuess?.region, bestGuess?.country]
                  .filter(Boolean)
                  .join(', ') || bestGuess?.formatted_address
              }
              photoCount={photos.length}
              photoAuthor={photos[0]?.author}
              onBack={() => {}}
            />
          </View>

          {/* Evidence Panel Preview */}
          <DestinationIdentity
            confidence={bestGuess?.confidence}
            verificationStatus={bestGuess?.verification_status}
            category={ti.category as string | undefined}
            why={bestGuess?.why}
            geminiReason={bestGuess?.gemini_reason}
          />

          {/* Dossier Preview */}
          <DestinationBriefing
            summary={ti.travel_summary as string | undefined}
            intelligence={ti}
            tips={Array.isArray(ti.travel_tips) ? (ti.travel_tips as string[]) : []}
          />
        </View>
      </ScrollView>
    </AtmosphereBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 6,
    minHeight: TouchTarget.minHeight,
  },
  backPillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.ivoryMist,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(166, 220, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.28)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
  },
  statusPillText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    color: Colors.icyBlue,
    letterSpacing: 0.8,
  },
  titleCard: {
    backgroundColor: 'rgba(8, 18, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.14)',
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  eyebrow: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: Colors.icyBlue,
    marginBottom: 4,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 24,
    lineHeight: 28,
    color: Colors.ivoryMist,
    letterSpacing: -0.4,
  },
  description: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  scenariosSection: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  chipsRow: {
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  diagCard: {
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.14)',
    marginBottom: Spacing.xl,
  },
  diagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  diagTitleCol: {
    flex: 1,
  },
  diagTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.ivoryMist,
    letterSpacing: -0.2,
  },
  diagDesc: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scenarioBadge: {
    backgroundColor: 'rgba(251, 244, 227, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.20)',
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  scenarioBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    color: Colors.ivoryMist,
    letterSpacing: 0.5,
  },
  diagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(5, 11, 14, 0.55)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  diagCell: {
    width: '45%',
  },
  diagKey: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  diagVal: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ivoryMist,
  },
  actionsSection: {
    marginBottom: Spacing.xxl,
  },
  buttonsStack: {
    gap: Spacing.md,
  },
  previewSection: {
    marginBottom: Spacing.huge,
  },
  previewHeroContainer: {
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    marginBottom: Spacing.md,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});
