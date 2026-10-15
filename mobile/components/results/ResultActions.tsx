import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { GlassView } from '@/components/ui';
import { hapticFeedback } from '@/lib/haptics';

export interface ResultActionsProps {
  isSaved: boolean;
  onToggleSave: () => void;
  onOpenMap: () => void;
  onOpenDirections: () => void;
}

export const ResultActions: React.FC<ResultActionsProps> = ({
  isSaved,
  onToggleSave,
  onOpenMap,
  onOpenDirections,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.floatingWrapper,
        { bottom: Math.max(insets.bottom, 12) + 6 },
      ]}
      pointerEvents="box-none"
    >
      <GlassView
        variant="dark"
        borderRadius={Radius.pill}
        intensity={80}
        style={styles.floatingBar}
      >
        {/* 1. Save (Bookmark Toggle) */}
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            onToggleSave();
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? 'Remove from saved places' : 'Save to my places'}
          style={({ pressed }) => [
            styles.actionButton,
            isSaved && styles.saveActiveButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={isSaved ? Colors.racingRed : Colors.ivoryMist}
          />
          <Text
            style={[
              styles.actionText,
              isSaved && styles.saveActiveText,
            ]}
          >
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </Pressable>

        <View style={styles.divider} />

        {/* 2. Map (Route to /analyze/map) */}
        <Pressable
          onPress={() => {
            hapticFeedback.selection();
            onOpenMap();
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open interactive map"
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <Ionicons name="map-outline" size={18} color={Colors.icyBlue} />
          <Text style={styles.actionText}>Map</Text>
        </Pressable>

        <View style={styles.divider} />

        {/* 3. Directions (External Map Handoff) */}
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            onOpenDirections();
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Get directions in external maps app"
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <Ionicons name="navigate-outline" size={18} color={Colors.ivoryMist} />
          <Text style={styles.actionText}>Directions</Text>
        </Pressable>
      </GlassView>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  floatingBar: {
    width: '100%',
    maxWidth: 380,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(10, 20, 28, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 7,
    minHeight: TouchTarget.minHeight,
    borderRadius: Radius.pill,
  },
  saveActiveButton: {
    backgroundColor: 'rgba(235, 38, 39, 0.08)',
  },
  actionText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ivoryMist,
    letterSpacing: -0.2,
  },
  saveActiveText: {
    color: Colors.ivoryMist,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(251, 244, 227, 0.12)',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});

export default ResultActions;
