import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, TouchTarget } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface ResultHeaderProps {
  onBack: () => void;
  destinationName?: string;
  onShare?: () => void;
}

export const ResultHeader: React.FC<ResultHeaderProps> = ({
  onBack,
  destinationName,
  onShare,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, Spacing.base) }]}>
      <View style={styles.contentRow}>
        {/* Back to Home / Analyze */}
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            onBack();
          }}
          hitSlop={10}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Back to Analyze"
          accessibilityHint="Returns to the analyze screen"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.onyx} />
          <Text style={styles.backText}>Analyze</Text>
        </Pressable>

        {/* Editorial Section Label */}
        <View style={styles.centerContainer}>
          <Text style={styles.headerLabel}>DESTINATION DOSSIER</Text>
        </View>

        {/* Share Quick Action */}
        {onShare ? (
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              onShare();
            }}
            hitSlop={10}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Share ${destinationName || 'destination'}`}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Ionicons name="share-outline" size={20} color={Colors.onyx} />
          </Pressable>
        ) : (
          <View style={styles.actionPlaceholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.ivoryMist,
    paddingHorizontal: Spacing.xl, // 24px horizontal padding
    paddingBottom: Spacing.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TouchTarget.minHeight,
    paddingRight: Spacing.sm,
    gap: 6,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onyx,
    letterSpacing: -0.2,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: 'rgba(12, 12, 12, 0.45)', // Onyx muted
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.12)',
    backgroundColor: Colors.ivoryMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPlaceholder: {
    width: 38,
  },
  pressed: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }],
  },
});

export default ResultHeader;
