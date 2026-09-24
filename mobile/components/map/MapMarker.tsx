import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadows } from '@/constants/theme';

export interface MapMarkerProps {
  isPrimary?: boolean;
  isSelected?: boolean;
  title?: string;
}

export const MapMarker: React.FC<MapMarkerProps> = React.memo(
  ({ isPrimary = false, isSelected = false }) => {
    if (isPrimary) {
      return (
        <View style={styles.container}>
          {isSelected && <View style={styles.primaryHalo} />}
          <View
            style={[
              styles.primaryPin,
              isSelected ? styles.primaryPinSelected : styles.primaryPinDefault,
            ]}
          >
            <Ionicons
              name="star"
              size={isSelected ? 15 : 13}
              color={Colors.surface}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        {isSelected && <View style={styles.nearbyHalo} />}
        <View
          style={[
            styles.nearbyPin,
            isSelected ? styles.nearbyPinSelected : styles.nearbyPinDefault,
          ]}
        >
          {isSelected ? (
            <View style={styles.innerDotSelected} />
          ) : (
            <View style={styles.innerDotDefault} />
          )}
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
  },
  // Primary Destination Pin
  primaryPin: {
    backgroundColor: Colors.surfaceDark,
    borderColor: Colors.surface,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  primaryPinDefault: {
    width: 30,
    height: 30,
    borderWidth: 2.5,
  },
  primaryPinSelected: {
    width: 36,
    height: 36,
    borderWidth: 3,
  },
  primaryHalo: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(17, 17, 17, 0.16)',
  },

  // Nearby Place Pin
  nearbyPin: {
    borderColor: Colors.surface,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  nearbyPinDefault: {
    width: 18,
    height: 18,
    borderWidth: 2,
    backgroundColor: Colors.textSecondary,
  },
  nearbyPinSelected: {
    width: 26,
    height: 26,
    borderWidth: 2.5,
    backgroundColor: Colors.surfaceDark,
    ...Shadows.md,
  },
  nearbyHalo: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(17, 17, 17, 0.14)',
  },
  innerDotDefault: {
    width: 4,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
  },
  innerDotSelected: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
  },
});

export default MapMarker;
