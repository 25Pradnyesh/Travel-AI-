import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadows } from '@/constants/theme';

export interface MapMarkerProps {
  isPrimary?: boolean;
  isSelected?: boolean;
  title?: string;
  category?: string;
}

/**
 * Resolves category tint for nearby places
 */
const getCategoryTint = (cat?: string) => {
  const lower = (cat || '').toLowerCase();
  if (
    lower.includes('beach') ||
    lower.includes('water') ||
    lower.includes('lake') ||
    lower.includes('sea')
  ) {
    return { dot: 'rgba(166, 220, 248, 0.92)', halo: 'rgba(166, 220, 248, 0.26)' }; // Icy Blue
  }
  if (
    lower.includes('caf') ||
    lower.includes('food') ||
    lower.includes('bar') ||
    lower.includes('restaur')
  ) {
    return { dot: 'rgba(229, 168, 102, 0.92)', halo: 'rgba(229, 168, 102, 0.26)' }; // Warm Amber
  }
  if (
    lower.includes('trail') ||
    lower.includes('mountain') ||
    lower.includes('park') ||
    lower.includes('nature') ||
    lower.includes('viewpoint')
  ) {
    return { dot: 'rgba(132, 204, 165, 0.92)', halo: 'rgba(132, 204, 165, 0.26)' }; // Sage Green
  }
  if (lower.includes('hotel') || lower.includes('stay') || lower.includes('resort')) {
    return { dot: 'rgba(186, 180, 240, 0.92)', halo: 'rgba(186, 180, 240, 0.26)' }; // Periwinkle
  }
  if (
    lower.includes('historic') ||
    lower.includes('church') ||
    lower.includes('temple') ||
    lower.includes('museum')
  ) {
    return { dot: 'rgba(251, 244, 227, 0.92)', halo: 'rgba(251, 244, 227, 0.26)' }; // Ivory
  }
  return { dot: 'rgba(168, 182, 190, 0.85)', halo: 'rgba(168, 182, 190, 0.22)' }; // Muted Slate
};

export const MapMarker: React.FC<MapMarkerProps> = React.memo(
  ({ isPrimary = false, isSelected = false, category }) => {
    // 1. Primary Destination Pin: Racing Red with soft pulse halo
    if (isPrimary) {
      return (
        <View style={styles.container}>
          <View style={[styles.primaryPulseHalo, isSelected && styles.primaryPulseHaloSelected]} />
          <View
            style={[
              styles.primaryPin,
              isSelected ? styles.primaryPinSelected : styles.primaryPinDefault,
            ]}
          >
            <Ionicons
              name="star"
              size={isSelected ? 15 : 12}
              color={Colors.textOnRed}
            />
          </View>
        </View>
      );
    }

    // 2. Nearby Place: Muted translucent dot with category tint
    const tint = getCategoryTint(category);

    return (
      <View style={styles.container}>
        <View
          style={[
            styles.nearbyHalo,
            { backgroundColor: tint.halo },
            isSelected && styles.nearbyHaloSelected,
          ]}
        />
        <View
          style={[
            styles.nearbyDot,
            { backgroundColor: tint.dot },
            isSelected ? styles.nearbyDotSelected : styles.nearbyDotDefault,
          ]}
        >
          {isSelected && <View style={styles.nearbyInnerDot} />}
        </View>
      </View>
    );
  }
);

MapMarker.displayName = 'MapMarker';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
  },
  // Primary Destination Pin (Racing Red)
  primaryPulseHalo: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(235, 38, 39, 0.22)',
  },
  primaryPulseHaloSelected: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(235, 38, 39, 0.35)',
  },
  primaryPin: {
    backgroundColor: Colors.racingRed,
    borderColor: Colors.ivoryMist,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  primaryPinDefault: {
    width: 28,
    height: 28,
    borderWidth: 2,
  },
  primaryPinSelected: {
    width: 34,
    height: 34,
    borderWidth: 2.5,
  },

  // Nearby Place: Muted translucent dot with category tint
  nearbyHalo: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: Radius.full,
  },
  nearbyHaloSelected: {
    width: 32,
    height: 32,
  },
  nearbyDot: {
    borderRadius: Radius.full,
    borderColor: 'rgba(251, 244, 227, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  nearbyDotDefault: {
    width: 13,
    height: 13,
    borderWidth: 1.5,
  },
  nearbyDotSelected: {
    width: 19,
    height: 19,
    borderWidth: 2,
    borderColor: Colors.ivoryMist,
  },
  nearbyInnerDot: {
    width: 5,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.onyx,
  },
});

export default MapMarker;
