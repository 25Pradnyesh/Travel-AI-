/**
 * VAMO — Native Map Bisect Component (iOS & Android)
 *
 * Renders native Google Maps raster tiles using react-native-maps.
 * Strictly used in development harness screens on mobile platforms.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

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
  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={styles.map}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      toolbarEnabled={false}
    >
      <Marker
        coordinate={{ latitude, longitude }}
        title={title}
        description="Primary Destination"
      />
      {nearby.map((p, idx) =>
        p.latitude != null && p.longitude != null ? (
          <Marker
            key={p.place_id || idx}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            title={p.name}
            pinColor="blue"
          />
        ) : null
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFill,
  },
});

export default PlainMapBisect;
