import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface ProcessingHeaderProps {
  onCancel: () => void;
  elapsedSeconds: number;
}

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const ProcessingHeader: React.FC<ProcessingHeaderProps> = ({
  onCancel,
  elapsedSeconds,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, Spacing.base) }]}>
      <View style={styles.contentRow}>
        {/* Cancel as Frosted Pill Top-Left */}
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            onCancel();
          }}
          hitSlop={8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Cancel reel analysis"
          style={({ pressed }) => [styles.cancelPill, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={15} color={Colors.ivoryMist} />
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>

        {/* Elapsed Timer as Frosted Pill Top-Right */}
        <GlassView
          variant="frosted"
          borderRadius={Radius.pill}
          style={styles.timerPill}
        >
          <Ionicons name="time-outline" size={13} color={Colors.icyBlue} />
          <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        </GlassView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  cancelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    gap: 6,
  },
  cancelText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ivoryMist,
    letterSpacing: -0.2,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    gap: 6,
  },
  timerText: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    color: Colors.ivoryMist,
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});

export default ProcessingHeader;
