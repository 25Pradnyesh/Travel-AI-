import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TravelMap, TravelMapRef } from '@/components/map/TravelMap';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { PlaceBottomSheet } from '@/components/ui/PlaceBottomSheet';
import { TopBar } from '@/components/ui/TopBar';
import { Colors } from '@/constants/theme';
import { analysisStore } from '@/lib/api/analysis-store';
import { openInExternalMaps } from '@/lib/maps';
import { NearbyPlace } from '@/types/analysis';

export default function ExplorationMapScreen() {
  const mapRef = useRef<TravelMapRef>(null);
  const { data } = analysisStore.getAnalysisResult();

  const bestGuess = data?.best_guess;
  const nearbyPlaces = useMemo(() => data?.nearby_places || [], [data?.nearby_places]);

  // Selected place ID state — default to primary destination if available
  const initialPlaceId = bestGuess?.place_id || 'primary_destination';
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(initialPlaceId);

  // Derive active selected place object
  const selectedPlace = useMemo<NearbyPlace | null>(() => {
    if (!selectedPlaceId) return null;
    return analysisStore.getPlaceById(selectedPlaceId);
  }, [selectedPlaceId]);

  // Derive photo URL for the selected place
  const selectedPhotoUrl = useMemo<string | undefined>(() => {
    if (!selectedPlaceId) return undefined;
    return analysisStore.getPlacePhotoUrl(selectedPlaceId);
  }, [selectedPlaceId]);

  const isPrimarySelected = useMemo(() => {
    if (!bestGuess || !selectedPlace) return false;
    return (
      selectedPlace.place_id === bestGuess.place_id ||
      selectedPlace.place_id === 'primary_destination' ||
      selectedPlace.category === 'Primary Destination'
    );
  }, [bestGuess, selectedPlace]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/analyze/results');
    }
  };

  const handleSelectPlace = (placeId: string) => {
    setSelectedPlaceId(placeId);
  };

  const handleViewDetails = (place: NearbyPlace) => {
    router.push({
      pathname: '/place/[id]',
      params: {
        id: place.place_id,
        name: place.name,
      },
    });
  };

  const handleOpenGlobalMaps = async () => {
    if (!bestGuess) return;
    await openInExternalMaps({
      latitude: bestGuess.latitude,
      longitude: bestGuess.longitude,
      name: bestGuess.name,
      formattedAddress: bestGuess.formatted_address,
      fallbackUrl: bestGuess.maps_url,
    });
  };

  if (!data || !bestGuess) {
    return (
      <View style={styles.screen}>
        <TopBar title="Exploration Map" showBack onBackPress={handleBack} />
        <View style={styles.centerContainer}>
          <EmptyState
            icon={<Ionicons name="compass-outline" size={32} color={Colors.textMuted} />}
            eyebrow="NO DESTINATION ACTIVE"
            title="Analysis Required"
            description="Process an Instagram reel on the Analyze screen to view interactive cartography."
            actionLabel="Return to Analyze"
            onActionPress={() => router.replace('/')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <TopBar
        title={bestGuess.name}
        showBack
        onBackPress={handleBack}
        rightAction={
          <IconButton
            size={36}
            variant="surface"
            accessibilityLabel="Open destination in external maps application"
            onPress={handleOpenGlobalMaps}
          >
            <Ionicons name="open-outline" size={18} color={Colors.textPrimary} />
          </IconButton>
        }
      />

      <View style={styles.mapContainer}>
        <TravelMap
          ref={mapRef}
          bestGuess={bestGuess}
          nearbyPlaces={nearbyPlaces}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={handleSelectPlace}
          showRecenterButton={true}
        />
      </View>

      {/* Selected Place Bottom Sheet with peek & expanded states */}
      <PlaceBottomSheet
        place={selectedPlace}
        photoUrl={selectedPhotoUrl}
        isPrimary={isPrimarySelected}
        onViewDetails={handleViewDetails}
        onClose={() => setSelectedPlaceId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mapContainer: {
    flex: 1,
  },
});
