import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  DestinationBriefing,
  DestinationIdentity,
  LocalAdviceSection,
  ResultActions,
  ResultHeader,
  ResultHero,
  SourceReelSection,
  SurroundingPlacesSection,
} from '@/components/results';
import { Button, EmptyState } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { analysisStore } from '@/lib/api/analysis-store';
import { openInExternalMaps } from '@/lib/maps';
import { useSavedPlaces } from '@/lib/storage/saved-places';
import { NearbyPlace, TravelIntelligence } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';

export default function ResultsScreen() {
  const { data, sourceUrl } = analysisStore.getAnalysisResult();
  const { isSaved, toggleSave } = useSavedPlaces();
  const entranceFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entranceFade, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [entranceFade]);

  const bestGuess = data?.best_guess;
  const ti = (data?.travel_intelligence || {}) as TravelIntelligence;
  const nearbyPlaces = useMemo(
    () => (Array.isArray(data?.nearby_places) ? data.nearby_places : []),
    [data?.nearby_places]
  );

  // Extract location subtitle: City, Region, Country
  const locationSubtitle = useMemo(() => {
    if (!bestGuess) return '';
    return [bestGuess.city, bestGuess.region, bestGuess.country]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .join(', ');
  }, [bestGuess]);

  // Primary photography URL
  const heroImageUrl = useMemo(() => {
    const primaryPhoto = Array.isArray(bestGuess?.photos) ? bestGuess.photos[0] : undefined;
    return analysisStore.resolvePhotoUrl(primaryPhoto?.url);
  }, [bestGuess?.photos]);

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

  const handleBack = React.useCallback(() => {
    router.replace('/');
  }, []);

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
      // Ignore URL open error
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
        'via Travel AI.',
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
      <View style={styles.screen}>
        <ResultHeader onBack={handleBack} />
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={<Ionicons name="compass-outline" size={32} color={Colors.onyx} />}
            eyebrow="NO ANALYSIS ACTIVE"
            title="No Destination Selected"
            description="Paste an Instagram travel reel on the Analyze screen to discover verified places."
            actionLabel="Go to Analyze"
            onActionPress={handleBack}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Top Editorial Header */}
      <ResultHeader
        onBack={handleBack}
        destinationName={bestGuess.name}
        onShare={handleShare}
      />

      <Animated.View style={[styles.flex, { opacity: entranceFade }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Visual Anchor: Large Immersive Photography */}
          <ResultHero
            imageUrl={heroImageUrl}
            destinationName={bestGuess.name}
            photoCount={Array.isArray(bestGuess.photos) ? bestGuess.photos.length : 0}
          />

          {/* Destination Identity & Restrained "WE FOUND IT" Moment */}
          <DestinationIdentity
            name={bestGuess.name}
            locationSubtitle={locationSubtitle}
            category={ti.category || (Array.isArray(bestGuess.types) ? bestGuess.types[0] : undefined)}
            confidence={bestGuess.confidence}
            verificationStatus={bestGuess.verification_status}
          />

          {/* Primary Action Buttons (Save, Share, Maps) */}
          <ResultActions
            isSaved={isDestinationSaved}
            onToggleSave={handleToggleDestinationSave}
            onShare={handleShare}
            onOpenDirections={handleOpenDestinationMaps}
          />

          {/* Destination Briefing (About, Evidence, Trip Window/Budget/Stay) */}
          <DestinationBriefing
            summary={ti.travel_summary}
            whyIdentified={bestGuess.why}
            intelligence={ti}
          />

          {/* Curated Local Travel Guidance Tips */}
          <LocalAdviceSection tips={tipsList} />

          {/* Surrounding Highlights Points of Interest */}
          <SurroundingPlacesSection
            places={nearbyPlaces}
            isPlaceSaved={isPlaceSavedCheck}
            onOpenPlace={handleOpenPlace}
            onOpenDirections={handleOpenPlaceDirections}
            onToggleSavePlace={handleTogglePlaceSave}
            onOpenMap={handleOpenMap}
          />

          {/* Source Reel Context Reference */}
          <SourceReelSection
            sourceUrl={sourceUrl}
            onOpenSourceReel={handleOpenSourceReel}
          />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ivoryMist, // Dominant canvas background #FBF4E3
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.massive,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
