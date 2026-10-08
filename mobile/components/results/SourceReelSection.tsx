import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface SourceReelSectionProps {
  sourceUrl?: string;
  onOpenSourceReel: () => void;
}

export const SourceReelSection: React.FC<SourceReelSectionProps> = ({
  sourceUrl,
  onOpenSourceReel,
}) => {
  if (!sourceUrl) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>SOURCE REEL</Text>

      <Pressable
        onPress={() => {
          hapticFeedback.light();
          onOpenSourceReel();
        }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Open original Instagram Reel"
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
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

        <Ionicons name="open-outline" size={16} color="rgba(12, 12, 12, 0.45)" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl, // 24px horizontal padding
    marginBottom: Spacing.huge,
  },
  sectionHeader: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(12, 12, 12, 0.45)', // Onyx muted
    marginBottom: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.ivoryMist,
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.12)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  contentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.onyx,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(12, 12, 12, 0.45)',
  },
  urlText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.onyx,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});

export default SourceReelSection;
