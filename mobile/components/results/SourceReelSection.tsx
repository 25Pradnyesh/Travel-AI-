import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { GlassView } from '@/components/ui';
import { hapticFeedback } from '@/lib/haptics';

export interface SourceReelSectionProps {
  sourceUrl?: string;
  totalSeconds?: number | null;
  onOpenSourceReel: () => void;
}

export const SourceReelSection: React.FC<SourceReelSectionProps> = ({
  sourceUrl,
  totalSeconds,
  onOpenSourceReel,
}) => {
  if (!sourceUrl && !totalSeconds) return null;

  return (
    <View style={styles.container}>
      {sourceUrl ? (
        <>
          <View style={styles.headerRow}>
            <Ionicons name="logo-instagram" size={13} color={Colors.icyBlue} />
            <Text style={styles.sectionHeader}>SOURCE REEL</Text>
          </View>

          <Pressable
            onPress={() => {
              hapticFeedback.light();
              onOpenSourceReel();
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open original Instagram Reel link"
            style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
          >
            <GlassView variant="dark" borderRadius={Radius.lg} style={styles.card}>
              <View style={styles.contentLeft}>
                <View style={styles.iconBox}>
                  <Ionicons name="logo-instagram" size={18} color={Colors.ivoryMist} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.label}>DISCOVERED FROM REEL</Text>
                  <Text style={styles.urlText} numberOfLines={1}>
                    {sourceUrl}
                  </Text>
                </View>
              </View>

              <View style={styles.openBox}>
                <Ionicons name="open-outline" size={16} color={Colors.icyBlue} />
              </View>
            </GlassView>
          </Pressable>
        </>
      ) : null}

      {/* Resolution Telemetry Caption */}
      {typeof totalSeconds === 'number' && totalSeconds > 0 ? (
        <View style={styles.captionRow}>
          <Ionicons name="flash-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.captionText}>
            Resolved in {totalSeconds.toFixed(1)}s
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
    textTransform: 'uppercase',
  },
  pressable: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.12)',
  },
  contentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(251, 244, 227, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 1.2,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  urlText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 17,
    color: Colors.ivoryMist,
    letterSpacing: -0.2,
  },
  openBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(166, 220, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: Spacing.md,
  },
  captionText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

export default SourceReelSection;
