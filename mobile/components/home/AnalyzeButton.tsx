import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';

export interface AnalyzeButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  isFilled?: boolean;
}

export const AnalyzeButton: React.FC<AnalyzeButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  isFilled = true,
}) => {
  const isInteractive = !loading && !disabled;

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={isInteractive ? onPress : undefined}
        disabled={!isInteractive}
        accessible={true}
        accessibilityRole="button"
        accessibilityState={{ disabled: !isInteractive, busy: loading }}
        accessibilityLabel="Analyze reel"
        accessibilityHint="Submits the reel link to discover destination coordinates and travel briefing"
        style={({ pressed }) => [
          styles.button,
          !isFilled && styles.unfilled,
          disabled && styles.disabled,
          pressed && isInteractive && styles.pressed,
        ]}
      >
        {loading ? (
          <View style={styles.contentRow}>
            <ActivityIndicator size="small" color={Colors.ivoryMist} />
            <Text style={styles.loadingText}>Analyzing reel...</Text>
          </View>
        ) : (
          <View style={styles.contentRow}>
            <Text style={styles.title}>Analyze Reel</Text>
            <View style={styles.iconContainer}>
              <Ionicons name="arrow-forward" size={17} color={Colors.ivoryMist} />
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: Spacing.xl, // 24px editorial horizontal padding
    marginTop: Spacing.md,
  },
  button: {
    backgroundColor: Colors.racingRed, // Primary brand action color #EB2627
    minHeight: 54, // Generous touch target
    borderRadius: Radius.lg + 4, // 14px refined radius matching ReelInput
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.racingRed,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: Colors.ivoryMist, // High contrast on Racing Red
    marginRight: Spacing.sm,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ivoryMist,
    marginLeft: Spacing.sm + 2,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
  unfilled: {
    opacity: 0.85,
  },
});

export default AnalyzeButton;
