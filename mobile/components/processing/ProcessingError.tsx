import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView, PillButton } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
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
      <GlassView variant="dark" borderRadius={Radius.xl} style={styles.card}>
        {/* Subtle Icon Accent */}
        <View style={styles.iconWrapper}>
          <Ionicons name="alert-circle-outline" size={26} color={Colors.racingRed} />
        </View>

        <Text style={styles.label}>ANALYSIS NOTICE</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {/* Recovery Actions */}
        <View style={styles.actionColumn}>
          <PillButton
            title="Try Again"
            variant="brand"
            onPress={() => {
              hapticFeedback.light();
              onRetry();
            }}
            iconLeft={<Ionicons name="refresh-outline" size={16} color={Colors.textOnRed} />}
          />

          <PillButton
            title="Back to Home"
            variant="glass"
            onPress={() => {
              hapticFeedback.light();
              onCancel();
            }}
          />
        </View>
      </GlassView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    alignItems: 'center',
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(235, 38, 39, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(235, 38, 39, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.icyBlue,
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 24,
    lineHeight: 28,
    color: Colors.ivoryMist,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    maxWidth: 300,
  },
  actionColumn: {
    width: '100%',
    gap: Spacing.sm,
  },
});

export default ProcessingError;
