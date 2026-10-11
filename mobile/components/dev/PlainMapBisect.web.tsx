/**
 * VAMO — Web-Safe Map Bisect Component (Web Platform Fallback)
 *
 * Provides a lightweight, web-compatible cartography preview for the
 * development harness without importing react-native-maps into the web bundle.
 * Styled with VAMO atmospheric glass tokens and provides external maps navigation.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { openInExternalMaps } from '@/lib/maps';
import { hapticFeedback } from '@/lib/haptics';

export interface NearbyMapPin {
  place_id?: string;
  name?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PlainMapBisectProps {
  latitude: number;
  longitude: number;
  title?: string;
  nearby?: NearbyMapPin[];
}

export const PlainMapBisect: React.FC<PlainMapBisectProps> = ({
  latitude,
  longitude,
  title = 'Primary Destination',
  nearby = [],
}) => {
  const validNearby = nearby.filter(
    (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number'
  );

  const handleOpenMaps = async () => {
    hapticFeedback.light();
    await openInExternalMaps({
      latitude,
      longitude,
      name: title,
    });
  };

  return (
    <View style={styles.container}>
      {/* Background cartography grid motif */}
      <View style={styles.gridOverlay} pointerEvents="none">
        <View style={styles.gridLineH} />
        <View style={styles.gridLineV} />
        <View style={styles.radarRing} />
      </View>

      {/* Header with status and coordinates */}
      <View style={styles.headerRow}>
        <View style={styles.tagPill}>
          <Ionicons name="map-outline" size={12} color={Colors.icyBlue} />
          <Text style={styles.tagText}>WEB CARTOGRAPHY PREVIEW</Text>
        </View>

        <Text style={styles.coordText}>
          {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
        </Text>
      </View>

      {/* Center Pin Indicator */}
      <View style={styles.pinCenter}>
        <View style={styles.pinBadge}>
          <View style={styles.pinDot} />
          <Text style={styles.pinTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {validNearby.length > 0 && (
          <Text style={styles.nearbyCountText}>
            +{validNearby.length} nearby landmark{validNearby.length > 1 ? 's' : ''} charted
          </Text>
        )}
      </View>

      {/* Footer CTA */}
      <View style={styles.footerRow}>
        <Pressable
          onPress={handleOpenMaps}
          hitSlop={6}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Open ${title} in maps`}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
        >
          <Ionicons name="compass-outline" size={14} color={Colors.ivoryMist} />
          <Text style={styles.actionBtnText}>Open in Google Maps</Text>
        </Pressable>

        <Text style={styles.webNotice}>
          Native tiles simulated on Web
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 18, 24, 0.95)',
    padding: Spacing.base,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(166, 220, 248, 0.08)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(166, 220, 248, 0.08)',
  },
  radarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.10)',
    borderStyle: 'dashed',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(166, 220, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.28)',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  tagText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1.1,
    color: Colors.icyBlue,
  },
  coordText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  pinCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginVertical: Spacing.sm,
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.onyx,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.22)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 6,
    maxWidth: '90%',
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.racingRed,
  },
  pinTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ivoryMist,
  },
  nearbyCountText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 244, 227, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.22)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 6,
    minHeight: 32,
  },
  actionBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    color: Colors.ivoryMist,
  },
  webNotice: {
    fontFamily: Fonts.sansRegular,
    fontSize: 10,
    color: Colors.textMuted,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});

export default PlainMapBisect;
