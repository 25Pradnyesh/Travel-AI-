import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import MapView, {
  LatLng,
  Marker,
  PROVIDER_DEFAULT,
  Region,
} from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { MapMarker } from './MapMarker';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Radius, Shadows, Spacing, TouchTarget, Typography } from '@/constants/theme';
import { isValidCoordinate } from '@/lib/maps';
import { BestGuess, NearbyPlace } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';

export interface TravelMapProps {
  bestGuess?: BestGuess | null;
  nearbyPlaces?: NearbyPlace[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string, isPrimary: boolean) => void;
  showRecenterButton?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface TravelMapRef {
  recenter: () => void;
  animateToPlace: (latitude: number, longitude: number) => void;
}

interface ValidMarkerItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
  rawPlace?: NearbyPlace;
}

export const TravelMap = forwardRef<TravelMapRef, TravelMapProps>(
  (
    {
      bestGuess,
      nearbyPlaces = [],
      selectedPlaceId,
      onSelectPlace,
      showRecenterButton = true,
      style,
    },
    ref
  ) => {
    const mapRef = useRef<MapView>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    // 1. Filter and normalize valid geographic coordinates
    const validMarkers = useMemo<ValidMarkerItem[]>(() => {
      const list: ValidMarkerItem[] = [];

      // Primary destination marker
      if (
        bestGuess &&
        typeof bestGuess.latitude === 'number' &&
        typeof bestGuess.longitude === 'number' &&
        isValidCoordinate(bestGuess.latitude, bestGuess.longitude)
      ) {
        list.push({
          id: bestGuess.place_id || 'primary_destination',
          name: bestGuess.name,
          latitude: bestGuess.latitude,
          longitude: bestGuess.longitude,
          isPrimary: true,
        });
      }

      // Nearby places markers
      nearbyPlaces.forEach((place, index) => {
        if (
          place &&
          typeof place.latitude === 'number' &&
          typeof place.longitude === 'number' &&
          isValidCoordinate(place.latitude, place.longitude)
        ) {
          list.push({
            id: place.place_id || `nearby_${index}`,
            name: place.name,
            latitude: place.latitude,
            longitude: place.longitude,
            isPrimary: false,
            rawPlace: place,
          });
        }
      });

      return list;
    }, [bestGuess, nearbyPlaces]);

    // 2. Compute initial camera region
    const initialRegion = useMemo<Region | undefined>(() => {
      if (validMarkers.length === 0) return undefined;

      if (validMarkers.length === 1) {
        return {
          latitude: validMarkers[0].latitude,
          longitude: validMarkers[0].longitude,
          latitudeDelta: 0.035,
          longitudeDelta: 0.035,
        };
      }

      let minLat = 90;
      let maxLat = -90;
      let minLng = 180;
      let maxLng = -180;

      validMarkers.forEach((m) => {
        if (m.latitude < minLat) minLat = m.latitude;
        if (m.latitude > maxLat) maxLat = m.latitude;
        if (m.longitude < minLng) minLng = m.longitude;
        if (m.longitude > maxLng) maxLng = m.longitude;
      });

      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const latDelta = Math.max((maxLat - minLat) * 1.5, 0.03);
      const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.03);

      return {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      };
    }, [validMarkers]);

    // 3. Recenter function fitting all points
    const handleRecenter = useCallback(() => {
      if (!mapRef.current || validMarkers.length === 0) return;

      if (validMarkers.length === 1) {
        mapRef.current.animateToRegion(
          {
            latitude: validMarkers[0].latitude,
            longitude: validMarkers[0].longitude,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          },
          400
        );
        return;
      }

      const coordinates: LatLng[] = validMarkers.map((m) => ({
        latitude: m.latitude,
        longitude: m.longitude,
      }));

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 60,
          right: 40,
          bottom: 210, // Account for bottom sheet peek preview
          left: 40,
        },
        animated: true,
      });
    }, [validMarkers]);

    // 4. Animate to specific place
    const animateToPlace = useCallback((lat: number, lng: number) => {
      if (!mapRef.current || !isValidCoordinate(lat, lng)) return;
      mapRef.current.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        350
      );
    }, []);

    // Expose ref actions
    useImperativeHandle(
      ref,
      () => ({
        recenter: handleRecenter,
        animateToPlace,
      }),
      [handleRecenter, animateToPlace]
    );

    // Initial fit once map is ready
    useEffect(() => {
      if (isMapReady && validMarkers.length > 0) {
        // Small delay to ensure native view layout is complete
        const timer = setTimeout(() => {
          handleRecenter();
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [isMapReady, validMarkers.length, handleRecenter]);

    // Animate map when selectedPlaceId changes
    useEffect(() => {
      if (!selectedPlaceId || !isMapReady) return;
      const target = validMarkers.find((m) => m.id === selectedPlaceId);
      if (target) {
        animateToPlace(target.latitude, target.longitude);
      }
    }, [selectedPlaceId, isMapReady, validMarkers, animateToPlace]);

    // Empty state if no coordinates are valid
    if (validMarkers.length === 0) {
      return (
        <View style={[styles.container, styles.emptyContainer, style]}>
          <EmptyState
            icon={<Ionicons name="map-outline" size={32} color={Colors.textMuted} />}
            eyebrow="COORDINATES UNAVAILABLE"
            title="No Map Coordinates Found"
            description="Geographic coordinates could not be resolved from this destination's analysis."
          />
        </View>
      );
    }

    return (
      <View style={[styles.container, style]}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          onMapReady={() => setIsMapReady(true)}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          rotateEnabled={true}
          pitchEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          toolbarEnabled={false}
        >
          {validMarkers.map((marker) => {
            const isSelected = selectedPlaceId === marker.id;
            return (
              <Marker
                key={marker.id}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={marker.isPrimary ? (isSelected ? 1100 : 1000) : isSelected ? 950 : 500}
                onPress={() => {
                  hapticFeedback.selection();
                  onSelectPlace?.(marker.id, marker.isPrimary);
                }}
              >
                <MapMarker
                  isPrimary={marker.isPrimary}
                  isSelected={isSelected}
                  title={marker.name}
                />
              </Marker>
            );
          })}
        </MapView>

        {/* Floating Controls Bar (Recenter button + pin counter badge) */}
        <View style={styles.floatingControls}>
          <View style={styles.pinCountBadge}>
            <Ionicons name="location" size={12} color={Colors.textPrimary} />
            <Text style={styles.pinCountText}>
              {validMarkers.length} {validMarkers.length === 1 ? 'Pin' : 'Pins'}
            </Text>
          </View>

          {showRecenterButton && (
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                handleRecenter();
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Recenter map to show all places"
              style={({ pressed }) => [
                styles.recenterButton,
                pressed && styles.recenterButtonPressed,
              ]}
            >
              <Ionicons name="scan-outline" size={18} color={Colors.textPrimary} />
            </Pressable>
          )}
        </View>
      </View>
    );
  }
);

TravelMap.displayName = 'TravelMap';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: Colors.canvas,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  floatingControls: {
    position: 'absolute',
    top: Spacing.base,
    left: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  pinCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.sm,
    gap: 4,
  },
  pinCountText: {
    ...Typography.mono,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  recenterButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  recenterButtonPressed: {
    backgroundColor: Colors.surfaceSubtle,
    transform: [{ scale: 0.95 }],
  },
});

export default TravelMap;
