import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface ProcessingErrorProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  onCancel: () => void;
}

export const ProcessingError: React.FC<ProcessingErrorProps> = ({
  title = "Couldn't identify this place.",
  message = 'We analyzed the visual frames and caption context of this reel, but could not detect definitive geographic coordinates or confirmed landmarks. Try another reel with recognizable scenery.',
  onRetry,
  onCancel,
}) => {
  return (
    <View style={styles.container} accessible={true} accessibilityRole="alert">
      <View style={styles.card}>
        {/* Subtle Icon Accent */}
        <View style={styles.iconWrapper}>
          <Ionicons name="alert-circle-outline" size={26} color={Colors.racingRed} />
        </View>

        <Text style={styles.label}>ANALYSIS NOTICE</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {/* Recovery Actions */}
        <View style={styles.actionColumn}>
          {/* Primary Action in Racing Red */}
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              onRetry();
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Retry reel analysis"
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          >
            <Ionicons name="refresh-outline" size={17} color={Colors.ivoryMist} />
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>

          {/* Secondary Action in Ivory / Subtle Onyx */}
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              onCancel();
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Return to analyze screen"
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backText}>Back to Home</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl, // 24px horizontal padding
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.ivoryMist,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.ivoryMist,
    borderRadius: Radius.xl + 4,
    borderWidth: 1.5,
    borderColor: 'rgba(12, 12, 12, 0.14)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl + 4,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(235, 38, 39, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(235, 38, 39, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(12, 12, 12, 0.45)',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: Colors.onyx,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
    color: 'rgba(12, 12, 12, 0.65)',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  actionColumn: {
    width: '100%',
    gap: Spacing.sm,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.racingRed, // Racing Red #EB2627 primary action
    minHeight: 50,
    borderRadius: Radius.lg + 2,
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: Colors.ivoryMist,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.ivoryMist,
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.16)',
    minHeight: 48,
    borderRadius: Radius.lg + 2,
    paddingHorizontal: Spacing.lg,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onyx,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});

export default ProcessingError;
