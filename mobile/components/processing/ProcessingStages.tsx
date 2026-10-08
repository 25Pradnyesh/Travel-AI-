import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

export interface StageItem {
  id: string;
  label: string;
  detail: string;
}

export const SEMANTIC_STAGES: StageItem[] = [
  {
    id: 'ingest',
    label: 'Reel received',
    detail: 'Reading visual clues and audio context',
  },
  {
    id: 'clues',
    label: 'Inspecting scenery',
    detail: 'Scanning landmarks, signs and terrain',
  },
  {
    id: 'geo',
    label: 'Resolving location',
    detail: 'Pinpointing geographic coordinates',
  },
  {
    id: 'dossier',
    label: 'Building your dossier',
    detail: 'Preparing destination intelligence',
  },
];

export interface ProcessingStagesProps {
  currentStageIndex: number;
}

export const ProcessingStages: React.FC<ProcessingStagesProps> = ({
  currentStageIndex,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      <Text style={styles.stagesHeader}>ANALYSIS STAGES</Text>

      <View style={styles.stageList}>
        {SEMANTIC_STAGES.map((stage, index) => {
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isUpcoming = index > currentStageIndex;

          return (
            <GlassView
              key={stage.id}
              variant="dark"
              borderRadius={Radius.lg}
              style={[
                styles.glassStageRow,
                isCurrent && styles.glassStageRowCurrent,
              ]}
            >
              {/* Left State Indicator */}
              <View style={styles.indicatorWrapper}>
                {isCompleted ? (
                  <View style={styles.passedDot} />
                ) : isCurrent ? (
                  <View style={styles.pulsingWrapper}>
                    <Animated.View
                      style={[
                        styles.pulsingRing,
                        {
                          opacity: pulseAnim,
                          transform: [
                            {
                              scale: pulseAnim.interpolate({
                                inputRange: [0.4, 1],
                                outputRange: [0.9, 1.25],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                    <View style={styles.pulsingCenterDot} />
                  </View>
                ) : (
                  <View style={styles.hollowDot} />
                )}
              </View>

              {/* Center Content */}
              <View style={styles.contentColumn}>
                <View style={styles.labelRow}>
                  <Text
                    style={[
                      styles.stageLabel,
                      isCompleted && styles.labelCompleted,
                      isCurrent && styles.labelCurrent,
                      isUpcoming && styles.labelUpcoming,
                    ]}
                  >
                    {stage.label}
                  </Text>
                  {isCurrent && (
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>IN PROGRESS</Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[
                    styles.stageDetail,
                    isCompleted && styles.detailCompleted,
                    isCurrent && styles.detailCurrent,
                    isUpcoming && styles.detailUpcoming,
                  ]}
                  numberOfLines={1}
                >
                  {stage.detail}
                </Text>
              </View>
            </GlassView>
          );
        })}
      </View>

      {/* Honest estimation disclaimer */}
      <View style={styles.captionRow}>
        <Ionicons name="information-circle-outline" size={13} color={Colors.textSecondary} />
        <Text style={styles.captionText}>Steps are estimated while the engine works.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stagesHeader: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.icyBlue,
    marginBottom: Spacing.sm,
  },
  stageList: {
    gap: Spacing.sm,
  },
  glassStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
  },
  glassStageRowCurrent: {
    borderColor: 'rgba(166, 220, 248, 0.35)',
  },
  indicatorWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  pulsingWrapper: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulsingRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(166, 220, 248, 0.20)',
    borderWidth: 1.5,
    borderColor: Colors.icyBlue,
  },
  pulsingCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.icyBlue,
  },
  passedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(251, 244, 227, 0.55)',
  },
  hollowDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 244, 227, 0.25)',
    backgroundColor: 'transparent',
  },
  contentColumn: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  stageLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  labelCompleted: {
    color: Colors.ivoryMist,
  },
  labelCurrent: {
    color: Colors.ivoryMist,
  },
  labelUpcoming: {
    color: Colors.textMuted,
  },
  activePill: {
    backgroundColor: 'rgba(166, 220, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.35)',
    borderRadius: Radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  activePillText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: Colors.icyBlue,
  },
  stageDetail: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  detailCompleted: {
    color: Colors.textSecondary,
  },
  detailCurrent: {
    color: Colors.ivoryMist,
    opacity: 0.9,
  },
  detailUpcoming: {
    color: 'rgba(110, 126, 134, 0.70)',
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  captionText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default ProcessingStages;
