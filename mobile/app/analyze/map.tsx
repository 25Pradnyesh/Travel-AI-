import React, { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TravelMap, TravelMapRef } from '@/components/map/TravelMap';
import { AtmosphereBackground, EmptyState, GlassView } from '@/components/ui';
import { PlaceBottomSheet } from '@/components/ui/PlaceBottomSheet';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { analysisStore } from '@/lib/api/analysis-store';
import { openInExternalMaps } from '@/lib/maps';
import { useSavedPlaces } from '@/lib/storage/saved-places';
import { NearbyPlace } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';

export default function ExplorationMapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<TravelMapRef>(null);
  const { data } = analysisStore.getAnalysisResult();
  const { isSaved, toggleSave } = useSavedPlaces();

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
    hapticFeedback.light();
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

  const handleToggleSaveSelectedPlace = () => {
    if (!selectedPlace) return;
    toggleSave(selectedPlace, selectedPhotoUrl);
  };

  const handleOpenGlobalMaps = async () => {
    if (!bestGuess) return;
    hapticFeedback.light();
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
      <AtmosphereBackground variant="sky">
        <View style={[styles.topPillWrapper, { top: Math.max(insets.top, 16) + 4 }]}>
          <GlassView variant="frosted" borderRadius={Radius.pill} style={styles.floatingTopPill}>
            <Pressable onPress={handleBack} style={styles.topPillBackBtn} hitSlop={10}>
              <Ionicons name="arrow-back" size={16} color={Colors.ivoryMist} />
            </Pressable>
            <Text style={styles.topPillTitle} numberOfLines={1}>
              Exploration Map
            </Text>
            <View style={styles.placeholderAction} />
          </GlassView>
        </View>

        <View style={styles.centerContainer}>
          <EmptyState
            icon={<Ionicons name="compass-outline" size={36} color={Colors.icyBlue} />}
            eyebrow="NO DESTINATION ACTIVE"
            title="Analysis Required"
            description="Process an Instagram reel on the Analyze screen to view interactive cartography."
            actionLabel="Return to Analyze"
            onActionPress={() => router.replace('/')}
          />
        </View>
      </AtmosphereBackground>
    );
  }

  return (
    <View style={styles.screen}>
      {/* 1. Full-Bleed Native Map */}
      <View style={StyleSheet.absoluteFill}>
        <TravelMap
          ref={mapRef}
          bestGuess={bestGuess}
          nearbyPlaces={nearbyPlaces}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={handleSelectPlace}
          showRecenterButton={true}
        />
      </View>

      {/* 2. Floating Frosted Top Pill: Back + Destination Name + External Maps */}
      <View
        style={[styles.topPillWrapper, { top: Math.max(insets.top, 16) + 6 }]}
        pointerEvents="box-none"
      >
        <GlassView
          variant="frosted"
          borderRadius={Radius.pill}
          intensity={85}
          style={styles.floatingTopPill}
        >
          {/* Back Pill Button */}
          <Pressable
            onPress={handleBack}
            hitSlop={10}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Back to results"
            style={({ pressed }) => [styles.topPillBackBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={17} color={Colors.ivoryMist} />
          </Pressable>

          {/* Destination Name Center */}
          <View style={styles.topPillTitleContainer}>
            <Text
              style={styles.topPillTitle}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              {bestGuess.name}
            </Text>
          </View>

          {/* Open in External Maps Button */}
          <Pressable
            onPress={handleOpenGlobalMaps}
            hitSlop={10}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open destination in external maps application"
            style={({ pressed }) => [styles.topPillActionBtn, pressed && styles.pressed]}
          >
            <Ionicons name="open-outline" size={16} color={Colors.icyBlue} />
          </Pressable>
        </GlassView>
      </View>

      {/* 3. Glass Bottom Sheet with Peek ~160px & Expanded Mode */}
      <PlaceBottomSheet
        place={selectedPlace}
        photoUrl={selectedPhotoUrl}
        isPrimary={isPrimarySelected}
        isSaved={selectedPlace ? isSaved(selectedPlace.place_id) : false}
        onToggleSave={handleToggleSaveSelectedPlace}
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
  topPillWrapper: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    zIndex: 100,
    alignItems: 'center',
  },
  floatingTopPill: {
    width: '100%',
    maxWidth: 420,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(8, 18, 24, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  topPillBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(251, 244, 227, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minHeight,
    minWidth: TouchTarget.minWidth,
  },
  topPillTitleContainer: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topPillTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.ivoryMist,
    letterSpacing: -0.2,
  },
  topPillActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(166, 220, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minHeight,
    minWidth: TouchTarget.minWidth,
  },
  placeholderAction: {
    width: 36,
    height: 36,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});
