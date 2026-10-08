import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';

export interface StageItem {
  id: string;
  label: string;
  detail: string;
}

export const SEMANTIC_STAGES: StageItem[] = [
  {
    id: 'ingest',
    label: 'REEL RECEIVED',
    detail: 'Reading visual clues and audio context',
  },
  {
    id: 'clues',
    label: 'INSPECTING SCENERY',
    detail: 'Scanning landmarks, signs and terrain',
  },
  {
    id: 'geo',
    label: 'RESOLVING LOCATION',
    detail: 'Pinpointing geographic coordinates',
  },
  {
    id: 'dossier',
    label: 'BUILDING YOUR DOSSIER',
    detail: 'Preparing destination intelligence',
  },
];

export interface ProcessingStagesProps {
  currentStageIndex: number;
}

export const ProcessingStages: React.FC<ProcessingStagesProps> = ({
  currentStageIndex,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.stagesHeader}>ANALYSIS STAGES</Text>

      <View style={styles.stageList}>
        {SEMANTIC_STAGES.map((stage, index) => {
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isUpcoming = index > currentStageIndex;
          const isLast = index === SEMANTIC_STAGES.length - 1;

          return (
            <View key={stage.id} style={styles.stageRow}>
              {/* Left Timeline Indicator */}
              <View style={styles.indicatorColumn}>
                <View
                  style={[
                    styles.nodeCircle,
                    isCompleted && styles.nodeCompleted,
                    isCurrent && styles.nodeCurrent,
                    isUpcoming && styles.nodeUpcoming,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark-sharp" size={10} color={Colors.ivoryMist} />
                  ) : isCurrent ? (
                    <View style={styles.currentNodeDot} />
                  ) : null}
                </View>

                {!isLast && (
                  <View
                    style={[
                      styles.connectorLine,
                      isCompleted ? styles.connectorCompleted : styles.connectorPending,
                    ]}
                  />
                )}
              </View>

              {/* Right Content */}
              <View style={[styles.contentColumn, isCurrent && styles.currentContent]}>
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
                  numberOfLines={2}
                >
                  {stage.detail}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl, // 24px horizontal padding
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stagesHeader: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(12, 12, 12, 0.45)',
    marginBottom: Spacing.md,
  },
  stageList: {
    width: '100%',
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 52,
  },
  indicatorColumn: {
    alignItems: 'center',
    width: 20,
    marginRight: Spacing.md,
  },
  nodeCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCompleted: {
    backgroundColor: Colors.onyx,
  },
  nodeCurrent: {
    backgroundColor: Colors.ivoryMist,
    borderWidth: 1.5,
    borderColor: Colors.racingRed, // Racing Red active focus
  },
  currentNodeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.racingRed,
  },
  nodeUpcoming: {
    backgroundColor: Colors.ivoryMist,
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.18)',
  },
  connectorLine: {
    width: 1.5,
    flex: 1,
    minHeight: 28,
    marginVertical: 2,
  },
  connectorCompleted: {
    backgroundColor: Colors.onyx,
  },
  connectorPending: {
    backgroundColor: 'rgba(12, 12, 12, 0.12)',
  },
  contentColumn: {
    flex: 1,
    paddingBottom: Spacing.md,
  },
  currentContent: {
    backgroundColor: 'rgba(12, 12, 12, 0.03)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    marginLeft: -Spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  stageLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  labelCompleted: {
    color: 'rgba(12, 12, 12, 0.65)',
  },
  labelCurrent: {
    color: Colors.onyx,
  },
  labelUpcoming: {
    color: 'rgba(12, 12, 12, 0.28)',
  },
  activePill: {
    backgroundColor: 'rgba(235, 38, 39, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(235, 38, 39, 0.20)',
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.racingRed,
  },
  stageDetail: {
    fontSize: 12,
    lineHeight: 17,
  },
  detailCompleted: {
    color: 'rgba(12, 12, 12, 0.45)',
  },
  detailCurrent: {
    color: 'rgba(12, 12, 12, 0.75)',
    fontWeight: '500',
  },
  detailUpcoming: {
    color: 'rgba(12, 12, 12, 0.22)',
  },
});

export default ProcessingStages;
