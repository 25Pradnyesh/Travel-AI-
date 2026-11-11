import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { DEMO_SCENARIOS, DemoScenario } from '@/lib/fixtures/demo-scenarios';
import { DemoScenarioId, useDemoMode } from '@/lib/demo/demo-mode';
import { useAtmosphere } from '@/context/AtmosphereContext';
import { hapticFeedback } from '@/lib/haptics';
import { logTap } from '@/lib/dev/tap-logger';

interface DemoScenarioSheetProps {
  visible: boolean;
  onClose: () => void;
}

interface ScenarioOption {
  id: DemoScenarioId;
  name: string;
  country: string;
  tagline: string;
  keySpots: string;
  image: any;
}

const SCENARIOS: ScenarioOption[] = [
  {
    id: 'jeju',
    name: 'Jeju Island',
    country: 'South Korea',
    tagline: 'Volcanic Island & UNESCO World Heritage',
    keySpots: 'Seongsan Ilchulbong · Hallasan',
    image: require('@/assets/backgrounds/jeju_island.webp'),
  },
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    tagline: 'Ancient Imperial Capital',
    keySpots: 'Colosseum · Roman Forum · Trastevere',
    image: require('@/assets/backgrounds/rome_colosseum.webp'),
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    tagline: 'Imperial Cultural Capital',
    keySpots: 'Kiyomizu-dera · Gion · Fushimi Inari',
    image: require('@/assets/backgrounds/cherry_blossom_pagoda.webp'),
  },
];

export const DemoScenarioSheet: React.FC<DemoScenarioSheetProps> = ({
  visible,
  onClose,
}) => {
  const { activeScenario, setScenarioId } = useDemoMode();
  const { setActivePlace } = useAtmosphere();
  const pathname = usePathname();

  const handleSelectScenario = async (id: DemoScenarioId) => {
    logTap('DemoScenarioSheet:SelectScenario', { id });
    hapticFeedback.selection();
    await setScenarioId(id);
    const chosen = DEMO_SCENARIOS[id];

    if (chosen?.data?.best_guess) {
      setActivePlace({
        place_id: chosen.primaryPlaceId,
        name: chosen.data.best_guess.name,
        city: chosen.data.best_guess.city,
        region: chosen.data.best_guess.region,
        country: chosen.data.best_guess.country,
        heroPhotoUrl: null,
      });
    }

    onClose();

    // If currently on Results, Map, or Place screens: replace route and scroll to top
    const isTargetScreen =
      pathname.includes('/results') ||
      pathname.includes('/map') ||
      pathname.includes('/place');

    if (isTargetScreen) {
      router.replace({
        pathname: '/analyze/results',
        params: { url: chosen.sourceUrl, isDemo: 'true' },
      });
    } else {
      // If currently on Analyze screen, replay demo scenario with processing animation
      router.push({
        pathname: '/analyze/processing',
        params: {
          url: chosen.sourceUrl,
          scenarioId: chosen.id,
          isDemo: 'true',
        },
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            logTap('DemoScenarioSheet:BackdropDismiss');
            onClose();
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Dismiss scenario chooser"
        />
        <View style={styles.sheetContainer} pointerEvents="auto">
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.sheetTitle}>CHOOSE DEMO DESTINATION</Text>
            </View>
            <Pressable
              onPress={() => {
                logTap('DemoScenarioSheet:CloseButton');
                onClose();
              }}
              hitSlop={8}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close scenario chooser"
            >
              <Ionicons name="close" size={18} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.sheetSubtitle}>
            Select a pre-analyzed offline destination to inspect Results, Map, and Place details.
          </Text>

          {/* Scenario Options List */}
          <View style={styles.optionsList}>
            {SCENARIOS.map((scenario) => {
              const isActive = activeScenario.id === scenario.id;
              return (
                <Pressable
                  key={scenario.id}
                  onPress={() => handleSelectScenario(scenario.id)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${scenario.name}, ${scenario.country}`}
                  style={({ pressed }) => [
                    styles.scenarioCard,
                    isActive && styles.scenarioCardActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Image
                    source={scenario.image}
                    style={styles.scenarioThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.scenarioInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.scenarioName}>{scenario.name}</Text>
                      <Text style={styles.scenarioCountry}>· {scenario.country}</Text>
                    </View>
                    <Text style={styles.scenarioTagline} numberOfLines={1}>
                      {scenario.tagline}
                    </Text>
                    <Text style={styles.scenarioSpots} numberOfLines={1}>
                      {scenario.keySpots}
                    </Text>
                  </View>
                  <View style={styles.checkSlot}>
                    {isActive ? (
                      <View style={styles.activeCheckPill}>
                        <Ionicons name="checkmark" size={14} color="#050b0e" />
                      </View>
                    ) : (
                      <View style={styles.inactiveRing} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 14, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0d151c',
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl + 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetTitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    color: '#f6d365',
  },
  closeBtn: {
    padding: 4,
  },
  sheetSubtitle: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  optionsList: {
    gap: Spacing.sm + 2,
  },
  scenarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.md,
  },
  scenarioCardActive: {
    backgroundColor: 'rgba(232, 168, 56, 0.10)',
    borderColor: 'rgba(232, 168, 56, 0.45)',
  },
  scenarioThumb: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: '#1a242f',
  },
  scenarioInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  scenarioName: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    color: Colors.ivoryMist,
  },
  scenarioCountry: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  scenarioTagline: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.icyBlue,
    marginBottom: 2,
  },
  scenarioSpots: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  checkSlot: {
    paddingRight: Spacing.xs,
  },
  activeCheckPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f6d365',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  pressed: {
    opacity: 0.75,
  },
});

