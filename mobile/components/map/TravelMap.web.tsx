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
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { isValidCoordinate, openInExternalMaps } from '@/lib/maps';
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

type LeafletModule = typeof import('leaflet');

const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_CSS_ID = 'travel-ai-leaflet-css';
const CUSTOM_STYLE_ID = 'travel-ai-map-custom-css';

/**
 * Injects required Leaflet stylesheet and custom Travel AI tooltip/marker styles into document head.
 */
function ensureWebStyles(): void {
  if (typeof document === 'undefined') return;

  if (!document.getElementById(LEAFLET_CSS_ID)) {
    const link = document.createElement('link');
    link.id = LEAFLET_CSS_ID;
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS_URL;
    link.crossOrigin = '';
    document.head.appendChild(link);
  }

  if (!document.getElementById(CUSTOM_STYLE_ID)) {
    const styleEl = document.createElement('style');
    styleEl.id = CUSTOM_STYLE_ID;
    styleEl.innerHTML = `
      .leaflet-container {
        width: 100% !important;
        height: 100% !important;
        background-color: ${Colors.canvas} !important;
        font-family: inherit !important;
      }
      .travel-ai-map-tooltip {
        background: #111111 !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 4px 8px !important;
        font-size: 11px !important;
        font-weight: 500 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
      }
      .travel-ai-map-tooltip::before {
        border-top-color: #111111 !important;
      }
      .travel-map-marker-primary, .travel-map-marker-nearby {
        background: transparent !important;
        border: none !important;
      }
    `;
    document.head.appendChild(styleEl);
  }
}

/**
 * Creates custom HTML pin icon matching the native Travel AI design system.
 */
function createMarkerIcon(L: LeafletModule, isPrimary: boolean, isSelected: boolean) {
  if (isPrimary) {
    const pinSize = isSelected ? 34 : 28;
    const haloShadow = isSelected
      ? '0 0 0 8px rgba(17, 17, 17, 0.18), 0 4px 14px rgba(0, 0, 0, 0.45)'
      : '0 2px 8px rgba(0, 0, 0, 0.35)';

    return L.divIcon({
      className: 'travel-map-marker-primary',
      html: `
        <div style="
          width: ${pinSize}px;
          height: ${pinSize}px;
          background: #111111;
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          box-shadow: ${haloShadow};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
        ">
          <svg width="${isSelected ? 16 : 13}" height="${isSelected ? 16 : 13}" viewBox="0 0 24 24" fill="#ffffff">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
      `,
      iconSize: [pinSize, pinSize],
      iconAnchor: [pinSize / 2, pinSize / 2],
    });
  }

  const pinSize = isSelected ? 24 : 16;
  const bg = isSelected ? '#111111' : '#6B7280';
  const borderWidth = isSelected ? '2.5px' : '2px';
  const haloShadow = isSelected
    ? '0 0 0 6px rgba(17, 17, 17, 0.16), 0 3px 10px rgba(0, 0, 0, 0.35)'
    : '0 1px 4px rgba(0, 0, 0, 0.25)';

  return L.divIcon({
    className: 'travel-map-marker-nearby',
    html: `
      <div style="
        width: ${pinSize}px;
        height: ${pinSize}px;
        background: ${bg};
        border: ${borderWidth} solid #ffffff;
        border-radius: 50%;
        box-shadow: ${haloShadow};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
      ">
        ${
          isSelected
            ? '<div style="width: 5px; height: 5px; background: #ffffff; border-radius: 50%;"></div>'
            : ''
        }
      </div>
    `,
    iconSize: [pinSize, pinSize],
    iconAnchor: [pinSize / 2, pinSize / 2],
  });
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
    const containerRef = useRef<View>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<Map<string, any>>(new Map());
    const boundsRef = useRef<any>(null);
    const leafletRef = useRef<LeafletModule | null>(null);

    const [isMapReady, setIsMapReady] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // 1. Filter and normalize valid geographic coordinates
    const validMarkers = useMemo<ValidMarkerItem[]>(() => {
      const list: ValidMarkerItem[] = [];
      const seenIds = new Set<string>();

      // Primary destination marker
      if (
        bestGuess &&
        typeof bestGuess.latitude === 'number' &&
        typeof bestGuess.longitude === 'number' &&
        isValidCoordinate(bestGuess.latitude, bestGuess.longitude)
      ) {
        const primaryId = bestGuess.place_id || 'primary_destination';
        seenIds.add(primaryId);
        list.push({
          id: primaryId,
          name: bestGuess.name || 'Destination',
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
          let uniqueId = place.place_id || `nearby_${index}`;
          if (seenIds.has(uniqueId)) {
            uniqueId = `${uniqueId}_${index}`;
          }
          seenIds.add(uniqueId);

          list.push({
            id: uniqueId,
            name: place.name || 'Point of Interest',
            latitude: place.latitude,
            longitude: place.longitude,
            isPrimary: false,
            rawPlace: place,
          });
        }
      });

      return list;
    }, [bestGuess, nearbyPlaces]);

    // Recenter map view to fit all markers
    const handleRecenter = useCallback(() => {
      const map = mapRef.current;
      const bounds = boundsRef.current;
      if (!map || !bounds || validMarkers.length === 0) return;

      if (validMarkers.length === 1) {
        map.setView([validMarkers[0].latitude, validMarkers[0].longitude], 14, {
          animate: true,
        });
      } else if (bounds.isValid?.()) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
          animate: true,
        });
      }
    }, [validMarkers]);

    // Animate map view to specific place coordinates
    const animateToPlace = useCallback((lat: number, lng: number) => {
      const map = mapRef.current;
      if (!map || !isValidCoordinate(lat, lng)) return;
      map.setView([lat, lng], 15, { animate: true });
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

    // Initialize Leaflet map on web client
    useEffect(() => {
      if (typeof window === 'undefined' || validMarkers.length === 0) return;

      let isMounted = true;

      const initMap = async () => {
        try {
          ensureWebStyles();

          const L = await import('leaflet');
          if (!isMounted) return;
          leafletRef.current = L;

          const rawContainer = containerRef.current as unknown as HTMLElement | null;
          if (!rawContainer) return;

          // Destroy previous map instance if attached
          if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
          }

          // Clean up stale leaflet identifier on the DOM element if present
          if ((rawContainer as any)._leaflet_id) {
            (rawContainer as any)._leaflet_id = null;
          }

          const map = L.map(rawContainer, {
            zoomControl: false, // We supply custom recenter and touch ergonomics
            attributionControl: true,
            scrollWheelZoom: true,
          });

          // CartoDB Positron tiles — same as existing Travel AI web application
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19,
          }).addTo(map);

          const bounds = L.latLngBounds([]);
          const markersMap = new Map<string, any>();

          validMarkers.forEach((item) => {
            const latLng = L.latLng(item.latitude, item.longitude);
            bounds.extend(latLng);

            const isSelected = item.id === selectedPlaceId;
            const marker = L.marker(latLng, {
              icon: createMarkerIcon(L, item.isPrimary, isSelected),
              zIndexOffset: item.isPrimary ? (isSelected ? 2000 : 1000) : isSelected ? 950 : 500,
            })
              .addTo(map)
              .bindTooltip(item.isPrimary ? `★ ${item.name}` : item.name, {
                direction: 'top',
                offset: [0, -10],
                className: 'travel-ai-map-tooltip',
              });

            marker.on('click', () => {
              hapticFeedback.selection();
              onSelectPlace?.(item.id, item.isPrimary);
            });

            markersMap.set(item.id, marker);
          });

          markersRef.current = markersMap;
          boundsRef.current = bounds;

          if (validMarkers.length === 1) {
            map.setView([validMarkers[0].latitude, validMarkers[0].longitude], 14);
          } else if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
          }

          mapRef.current = map;
          setIsMapReady(true);
          setLoadError(null);

          // Invalidate size after layout stabilization
          setTimeout(() => {
            if (isMounted && mapRef.current) {
              mapRef.current.invalidateSize();
            }
          }, 200);
        } catch (err: any) {
          if (isMounted) {
            setLoadError(err?.message || 'Failed to render map');
          }
        }
      };

      initMap();

      return () => {
        isMounted = false;
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }, [validMarkers, onSelectPlace]);

    // Update marker styling and camera when selectedPlaceId changes
    useEffect(() => {
      const L = leafletRef.current;
      const map = mapRef.current;
      if (!isMapReady || !L || !map) return;

      markersRef.current.forEach((marker, id) => {
        const item = validMarkers.find((m) => m.id === id);
        if (!item) return;

        const isSelected = id === selectedPlaceId;
        marker.setIcon(createMarkerIcon(L, item.isPrimary, isSelected));
        marker.setZIndexOffset(
          item.isPrimary ? (isSelected ? 2000 : 1000) : isSelected ? 950 : 500
        );

        if (isSelected) {
          map.panTo([item.latitude, item.longitude], { animate: true, duration: 0.4 });
        }
      });
    }, [selectedPlaceId, isMapReady, validMarkers]);

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

    // Fallback if Leaflet encounters a critical runtime error on web
    if (loadError) {
      const primaryMarker = validMarkers.find((m) => m.isPrimary) || validMarkers[0];
      return (
        <View style={[styles.container, styles.emptyContainer, style]}>
          <EmptyState
            icon={<Ionicons name="navigate-outline" size={32} color={Colors.textMuted} />}
            eyebrow="MAP PREVIEW"
            title={primaryMarker.name}
            description={`${validMarkers.length} locations identified near ${primaryMarker.latitude.toFixed(4)}, ${primaryMarker.longitude.toFixed(4)}.`}
            actionLabel="Open in External Maps"
            onActionPress={() => {
              openInExternalMaps({
                latitude: primaryMarker.latitude,
                longitude: primaryMarker.longitude,
                name: primaryMarker.name,
              });
            }}
          />
        </View>
      );
    }

    return (
      <View style={[styles.container, style]}>
        {/* Real DOM Leaflet Container rendered via React Native Web View */}
        <View
          ref={containerRef}
          style={StyleSheet.absoluteFill}
          accessible={true}
          accessibilityLabel="Interactive destination map"
        />

        {/* Loading overlay before tiles initialize */}
        {!isMapReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Colors.textPrimary} />
            <Text style={styles.loadingText}>Rendering map…</Text>
          </View>
        )}

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
    position: 'relative',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 100,
  },
  loadingText: {
    ...Typography.mono,
    fontSize: 12,
    color: Colors.textMuted,
  },
  floatingControls: {
    position: 'absolute',
    top: Spacing.base,
    left: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 500,
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
