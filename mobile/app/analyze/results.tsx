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
import { AtmosphereBackground, EmptyState, PillButton } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { analysisStore } from '@/lib/api/analysis-store';
import { openInExternalMaps } from '@/lib/maps';
import { useSavedPlaces } from '@/lib/storage/saved-places';
import { NearbyPlace, TravelIntelligence } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const { data, sourceUrl } = analysisStore.getAnalysisResult();
  const { isSaved, toggleSave } = useSavedPlaces();
  const entranceFade = useRef(new Animated.Value(0)).current;

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

  // Extract location subtitle: City, Region, Country
  const locationSubtitle = useMemo(() => {
    if (!bestGuess) return '';
    return [bestGuess.city, bestGuess.region, bestGuess.country]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .join(', ');
  }, [bestGuess]);

  // Primary photography details
  const primaryPhoto = useMemo(() => {
    return Array.isArray(bestGuess?.photos) ? bestGuess.photos[0] : undefined;
  }, [bestGuess?.photos]);

  const heroImageUrl = useMemo(() => {
    return analysisStore.resolvePhotoUrl(primaryPhoto?.url);
  }, [primaryPhoto?.url]);

  const photoAuthor = primaryPhoto?.author;

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
      <AtmosphereBackground variant="sky">
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

  const scrollBottomPadding = 58 + Math.max(insets.bottom, 16) + Spacing.xl;

  return (
    <View style={styles.screen}>
      <AtmosphereBackground variant="sky">
        <Animated.View style={[styles.flex, { opacity: entranceFade }]}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: scrollBottomPadding },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Full-Bleed Poster Hero (Top ~54% of screen) */}
            <ResultHero
              imageUrl={heroImageUrl}
              destinationName={bestGuess.name}
              locationSubtitle={locationSubtitle}
              photoCount={Array.isArray(bestGuess.photos) ? bestGuess.photos.length : 0}
              photoAuthor={photoAuthor}
              onBack={handleBack}
              onShare={handleShare}
            />

            {/* 2. Glass Evidence Panel (Dark Glass with ConfidenceBadge & Gemini Clues) */}
            <DestinationIdentity
              confidence={bestGuess.confidence}
              verificationStatus={bestGuess.verification_status}
              category={ti.category || (Array.isArray(bestGuess.types) ? bestGuess.types[0] : undefined)}
              why={bestGuess.why}
              geminiReason={bestGuess.gemini_reason || data.gemini?.reason}
            />

            {/* 3. Travel Dossier (Stacked dark-glass rows with circular buttons & expandable tips) */}
            <DestinationBriefing
              summary={ti.travel_summary}
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
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
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
