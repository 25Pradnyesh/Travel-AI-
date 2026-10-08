import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, TouchTarget } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface HomeHeaderProps {
  onPressHistory?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ onPressHistory }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, Spacing.base) }]}>
      <View style={styles.contentRow}>
        {/* Brand Wordmark with signature Racing Red moment */}
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>TRAVEL AI</Text>
          <View style={styles.brandDot} />
        </View>

        {/* Minimal History Action */}
        {onPressHistory && (
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              onPressHistory();
            }}
            hitSlop={8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="View analysis history"
            accessibilityHint="Navigates to your past analyzed travel reels"
            style={({ pressed }) => [styles.historyButton, pressed && styles.pressed]}
          >
            <Ionicons name="time-outline" size={20} color={Colors.onyx} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.ivoryMist,
    paddingHorizontal: Spacing.xl, // 24px editorial horizontal padding
    paddingBottom: Spacing.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2.2,
    color: Colors.onyx,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.racingRed,
    marginLeft: 6,
  },
  historyButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.12)',
    backgroundColor: Colors.ivoryMist,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: TouchTarget.minWidth / 1.2,
    minHeight: TouchTarget.minHeight / 1.2,
  },
  pressed: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }],
  },
});

export default HomeHeader;
