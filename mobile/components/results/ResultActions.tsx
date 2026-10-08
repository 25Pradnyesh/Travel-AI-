import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface ResultActionsProps {
  isSaved: boolean;
  onToggleSave: () => void;
  onShare: () => void;
  onOpenDirections: () => void;
}

export const ResultActions: React.FC<ResultActionsProps> = ({
  isSaved,
  onToggleSave,
  onShare,
  onOpenDirections,
}) => {
  return (
    <View style={styles.container}>
      {/* Primary Save Action */}
      <Pressable
        onPress={() => {
          hapticFeedback.light();
          onToggleSave();
        }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isSaved ? 'Remove from saved collection' : 'Save to collection'}
        style={({ pressed }) => [
          styles.saveButton,
          isSaved ? styles.saveButtonSaved : styles.saveButtonUnsaved,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name={isSaved ? 'bookmark' : 'bookmark-outline'}
          size={18}
          color={isSaved ? Colors.racingRed : Colors.ivoryMist}
        />
        <Text style={[styles.saveText, isSaved ? styles.saveTextSaved : styles.saveTextUnsaved]}>
          {isSaved ? 'Saved in Collection' : 'Save Destination'}
        </Text>
      </Pressable>

      {/* Secondary Actions Row */}
      <View style={styles.secondaryRow}>
        {/* Share Button */}
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            onShare();
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Share destination"
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Ionicons name="share-outline" size={17} color={Colors.onyx} />
          <Text style={styles.secondaryText}>Share</Text>
        </Pressable>

        {/* Directions / Maps Button */}
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            onOpenDirections();
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open in navigation maps"
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Ionicons name="navigate-outline" size={17} color={Colors.onyx} />
          <Text style={styles.secondaryText}>Maps</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl, // 24px horizontal padding
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: Radius.lg + 2, // 14px refined radius
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  saveButtonUnsaved: {
    backgroundColor: Colors.racingRed, // Racing Red #EB2627 primary CTA
    borderWidth: 1,
    borderColor: Colors.racingRed,
  },
  saveButtonSaved: {
    backgroundColor: Colors.ivoryMist,
    borderWidth: 1.5,
    borderColor: Colors.racingRed,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  saveTextUnsaved: {
    color: Colors.ivoryMist,
  },
  saveTextSaved: {
    color: Colors.racingRed,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.ivoryMist,
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.14)',
    minHeight: 46,
    borderRadius: Radius.lg + 2,
    paddingHorizontal: Spacing.md,
    gap: 6,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onyx,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});

export default ResultActions;
