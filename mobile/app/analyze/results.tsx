import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useBackNavigation } from '@/lib/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  DestinationBriefing,
  DestinationIdentity,
  ResultActions,
  ResultHeader,
  ResultHero,
  SourceReelSection,
  SurroundingPlacesSection,
} from '@/components/results';
import { AtmosphereBackground, EmptyState } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAtmosphere } from '@/context/AtmosphereContext';
import { resolvePalette } from '@/lib/atmosphere/palette-resolver';
import { PlaceAtmosphereInput } from '@/types/atmosphere';
import { analysisStore } from '@/lib/api/analysis-store';
import { openInExternalMaps } from '@/lib/maps';
import { useSavedPlaces } from '@/lib/storage/saved-places';
import { NearbyPlace, TravelIntelligence } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';

import { buildLocationSubtitle } from '@/lib/location/display-name';
import { useDemoMode } from '@/lib/demo/demo-mode';

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const { isDemoMode, activeScenario } = useDemoMode();
  const storeResult = analysisStore.getAnalysisResult();
  const data = isDemoMode ? activeScenario.data : storeResult.data;
  const sourceUrl = isDemoMode ? activeScenario.sourceUrl : storeResult.sourceUrl;
  const { isSaved, toggleSave } = useSavedPlaces();
  const { setActivePlace } = useAtmosphere();
  const entranceFade = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // When active scenario changes in demo mode, scroll to top immediately
  useEffect(() => {
    if (isDemoMode) {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      setPhotoIndex(0);
    }
  }, [isDemoMode, activeScenario.id]);

  useEffect(() => {
    Animated.timing(entranceFade, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [entranceFade]);

  const bestGuess = data?.best_guess;
  const ti = (data?.travel_intelligence || {}) as TravelIntelligence;
  const nearbyPlaces = useMemo(
    () => (Array.isArray(data?.nearby_places) ? data.nearby_places : []),
    [data?.nearby_places]
  );

  // Extract canonical location subtitle: Never duplicates country/city/aliases
  const locationSubtitle = useMemo(() => {
    if (!bestGuess) return '';
    return buildLocationSubtitle({
      name: bestGuess.name,
      city: bestGuess.city,
      region: bestGuess.region,
      country: bestGuess.country,
    });
  }, [bestGuess]);

  // Photo list and cycling
  const [photoIndex, setPhotoIndex] = useState(0);
  const photosList = useMemo(() => {
    return Array.isArray(bestGuess?.photos) ? bestGuess.photos : [];
  }, [bestGuess?.photos]);

  const activePhoto = useMemo(() => {
    if (photosList.length === 0) return undefined;
    return photosList[photoIndex % photosList.length];
  }, [photosList, photoIndex]);

  const heroImageUrl = useMemo(() => {
    return analysisStore.resolvePhotoUrl(activePhoto?.url);
  }, [activePhoto?.url]);

  const photoAuthor = activePhoto?.author;

  const handleNextPhoto = useCallback(() => {
    if (photosList.length > 1) {
      setPhotoIndex((prev: number) => (prev + 1) % photosList.length);
    }
  }, [photosList.length]);

  const placeAtmosphereInput: PlaceAtmosphereInput | null = useMemo(() => {
    if (!bestGuess) return null;
    return {
      place_id: bestGuess.place_id,
      name: bestGuess.name,
      city: bestGuess.city,
      region: bestGuess.region,
      country: bestGuess.country,
      heroPhotoUrl: heroImageUrl || null,
    };
  }, [bestGuess, heroImageUrl]);

  const placePalette = useMemo(() => resolvePalette(placeAtmosphereInput), [placeAtmosphereInput]);

  // Restore destination atmosphere on focus when returning from map or place detail
  useFocusEffect(
    useCallback(() => {
      if (placeAtmosphereInput) {
        setActivePlace(placeAtmosphereInput, photoAuthor);
      }
    }, [placeAtmosphereInput, photoAuthor, setActivePlace])
  );

  // Curated travel advice tips
  const tipsList = useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(ti.travel_tips)) {
      ti.travel_tips.forEach((t) => {
        if (typeof t === 'string' && t.trim()) list.push(t.trim());
      });
    } else if (ti.travel_tips && typeof ti.travel_tips === 'object') {
      const rawTips = ti.travel_tips as Record<string, unknown>;
      ['travel_tips', 'local_tips', 'safety_tips'].forEach((k) => {
        const arr = rawTips[k];
        if (Array.isArray(arr)) {
          arr.forEach((t) => {
            if (typeof t === 'string' && t.trim()) list.push(t.trim());
          });
        }
      });
    }
    return list;
  }, [ti.travel_tips]);

  const handleBack = useBackNavigation('/(tabs)');

  const handleOpenMap = React.useCallback(() => {
    router.push('/analyze/map');
  }, []);

  const handleOpenDestinationMaps = React.useCallback(async () => {
    if (!bestGuess) return;
    await openInExternalMaps({
      latitude: bestGuess.latitude,
      longitude: bestGuess.longitude,
      name: bestGuess.name,
      formattedAddress: bestGuess.formatted_address,
      fallbackUrl: bestGuess.maps_url,
    });
  }, [bestGuess]);

  const handleOpenPlaceDirections = React.useCallback(async (place: NearbyPlace) => {
    await openInExternalMaps({
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      formattedAddress: place.formatted_address,
      fallbackUrl: place.maps_url,
    });
  }, []);

  const handleOpenSourceReel = React.useCallback(async () => {
    if (!sourceUrl) return;
    try {
      const canOpen = await Linking.canOpenURL(sourceUrl);
      if (canOpen) {
        await Linking.openURL(sourceUrl);
      }
    } catch {
      // Quiet fallback
    }
  }, [sourceUrl]);

  const handleOpenPlace = React.useCallback((place: NearbyPlace) => {
    router.push({
      pathname: '/place/[id]',
      params: {
        id: place.place_id,
        name: place.name,
      },
    });
  }, []);

  const handleShare = React.useCallback(async () => {
    if (!bestGuess) return;
    try {
      hapticFeedback.light();
      const messageParts = [
        `Discovered ${bestGuess.name}`,
        locationSubtitle ? `in ${locationSubtitle}` : '',
        'via VAMO.',
        sourceUrl ? `Source reel: ${sourceUrl}` : '',
      ].filter(Boolean);

      await Share.share({
        title: bestGuess.name,
        message: messageParts.join(' '),
      });
    } catch {
      // User cancelled share
    }
  }, [bestGuess, locationSubtitle, sourceUrl]);

  const destinationPlaceId = bestGuess?.place_id || bestGuess?.name || 'primary_destination';
  const isDestinationSaved = isSaved(destinationPlaceId);

  const handleToggleDestinationSave = React.useCallback(() => {
    if (!bestGuess) return;
    toggleSave(bestGuess, heroImageUrl);
  }, [bestGuess, heroImageUrl, toggleSave]);

  const handleTogglePlaceSave = React.useCallback(
    (place: NearbyPlace) => {
      toggleSave(place);
    },
    [toggleSave]
  );

  const isPlaceSavedCheck = React.useCallback(
    (placeId: string) => {
      return isSaved(placeId);
    },
    [isSaved]
  );

  // If no analysis result is in memory
  if (!data || !bestGuess) {
    return (
      <AtmosphereBackground>
        <ResultHeader onBack={handleBack} />
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={<Ionicons name="compass-outline" size={36} color={Colors.icyBlue} />}
            eyebrow="NO ANALYSIS ACTIVE"
            title="No Destination Selected"
            description="Paste an Instagram travel reel on the Analyze screen to discover verified places."
            actionLabel="Go to Analyze"
            onActionPress={handleBack}
          />
        </View>
      </AtmosphereBackground>
    );
  }

  const scrollBottomPadding = 80 + Math.max(insets.bottom, 16) + 56;

  return (
    <View style={styles.screen}>
      <AtmosphereBackground
        imageUrl={heroImageUrl}
        place={placeAtmosphereInput}
        palette={placePalette}
      >
        <Animated.View style={[styles.flex, { opacity: entranceFade }]}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: scrollBottomPadding },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Full-Bleed Destination Hero Viewport */}
            <ResultHero
              imageUrl={isDemoMode ? activeScenario.bundledPhotoAsset : heroImageUrl}
              destinationName={bestGuess.name}
              locationSubtitle={locationSubtitle}
              photoCount={photosList.length}
              currentPhotoIndex={photoIndex % Math.max(photosList.length, 1)}
              onNextPhoto={photosList.length > 1 ? handleNextPhoto : undefined}
              photoAuthor={photoAuthor}
              verificationStatus={bestGuess.verification_status}
              confidence={bestGuess.confidence}
              onBack={handleBack}
              onShare={handleShare}
            />

            {/* Demo data badge */}
            {isDemoMode && (
              <View style={styles.demoBanner}>
                <Text style={styles.demoBannerText}>Demo data · Sample output</Text>
              </View>
            )}



            {/* 2. Location Details Panel (ConfidenceBadge & Factual 5-line Overview / Editorial Summary) */}
            <DestinationIdentity
              confidence={bestGuess.confidence}
              verificationStatus={bestGuess.verification_status}
              category={ti.category || (Array.isArray(bestGuess.types) ? bestGuess.types[0] : undefined)}
              overview={bestGuess.overview}
              editorialSummary={bestGuess.editorial_summary || bestGuess.overview?.summary_fallback}
            />


            {/* 3. Travel Dossier (Stacked dark-glass rows with circular buttons & expandable tips) */}
            <DestinationBriefing
              intelligence={ti}
              tips={tipsList}
            />

            {/* 4. Explore Nearby (Category pills with counts + 2-column poster cards) */}
            <SurroundingPlacesSection
              places={nearbyPlaces}
              isPlaceSaved={isPlaceSavedCheck}
              onOpenPlace={handleOpenPlace}
              onOpenDirections={handleOpenPlaceDirections}
              onToggleSavePlace={handleTogglePlaceSave}
              onOpenMap={handleOpenMap}
            />

            {/* 5. Source Reel Context & Resolution Telemetry */}
            <SourceReelSection
              sourceUrl={sourceUrl}
              totalSeconds={data.performance?.total_seconds}
              onOpenSourceReel={handleOpenSourceReel}
            />
          </ScrollView>
        </Animated.View>

        {/* 6. Sticky Floating Glass Action Bar (Save, Map, Directions) */}
        <ResultActions
          isSaved={isDestinationSaved}
          onToggleSave={handleToggleDestinationSave}
          onOpenMap={handleOpenMap}
          onOpenDirections={handleOpenDestinationMaps}
        />
      </AtmosphereBackground>
    </View>
  );
}

const styles = StyleSheet.create({

  demoBanner: {

    flexDirection: 'row',

    alignItems: 'center',

    alignSelf: 'center',

    backgroundColor: 'rgba(16, 25, 34, 0.85)',

    borderWidth: 1,

    borderColor: 'rgba(232, 168, 56, 0.40)',

    borderRadius: Radius.pill,

    paddingHorizontal: Spacing.base,

    paddingVertical: 6,

    gap: 6,

    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  demoBannerText: {

    fontFamily: Fonts.sansMedium,

    fontSize: 12,

    color: '#f6d365',

    letterSpacing: 0.3,

  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
