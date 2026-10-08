import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface ProcessingHeaderProps {
  onCancel: () => void;
  url?: string;
}

export const ProcessingHeader: React.FC<ProcessingHeaderProps> = ({
  onCancel,
  url,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, Spacing.base) }]}>
      <View style={styles.contentRow}>
        {/* Minimal Cancel / Back Affordance */}
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            onCancel();
          }}
          hitSlop={10}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Cancel analysis"
          accessibilityHint="Stops the current reel analysis and returns to Home"
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.onyx} />
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>

        {/* Quiet Reel Reference Pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {url ? 'ANALYZING REEL' : 'PROCESSING'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.ivoryMist,
    paddingHorizontal: Spacing.xl, // 24px horizontal padding
    paddingBottom: Spacing.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TouchTarget.minHeight,
    paddingRight: Spacing.md,
    gap: 6,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onyx,
    letterSpacing: -0.2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 5,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.icyBlue, // Icy Blue #A6DCF8 supporting detail
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.onyx,
  },
  pressed: {
    opacity: 0.65,
    transform: [{ scale: 0.97 }],
  },
});

export default ProcessingHeader;
