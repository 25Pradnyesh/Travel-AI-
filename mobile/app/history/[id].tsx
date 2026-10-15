/**
 * VAMO Mobile — Historical Analysis Detail Screen (Stage B)
 *
 * Reuses the state-of-the-art Results components to render a persisted
 * travel intelligence dossier from Supabase:
 * - ResultHero (full poster photography header with Back & Share pills)
 * - DestinationIdentity (PRD tier-only verification badge & clues)
 * - DestinationBriefing (stacked glass dossier: season, budget, stay, tips)
 * - SurroundingPlacesSection (category pills & 2-column poster cards)
 * - Source Reel & Delete Dossier action controls
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  AtmosphereBackground,
  EmptyState,
  GlassView,
} from '@/components/ui';
import { ResultHero } from '@/components/results/ResultHero';
import { DestinationIdentity } from '@/components/results/DestinationIdentity';
import { DestinationBriefing } from '@/components/results/DestinationBriefing';
import { SurroundingPlacesSection } from '@/components/results/SurroundingPlacesSection';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { analysisStore } from '@/lib/api/analysis-store';
import { openInExternalMaps } from '@/lib/maps';
import { useSavedPlaces } from '@/lib/storage/saved-places';
import {
  AnalysisDetail,
  deleteAnalysis,
  getAnalysisDetail,
  resolveThumbnailUrl,
} from '@/lib/supabase';
import { NearbyPlace, TravelIntelligence } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';

export default function HistoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isSaved, toggleSave } = useSavedPlaces();

  const [detail, setDetail] = useState<AnalysisDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) {
      setError('Invalid analysis identifier.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await getAnalysisDetail(id);
      if (fetchErr || !data) {
        setError(fetchErr || 'Analysis dossier could not be found.');
      } else {
        setDetail(data);

        // Pre-populate analysis store so map and place details resolve smoothly
        const a = data.analysis;
        const mappedNearby: NearbyPlace[] = (data.places || []).map((p) => ({
          place_id: p.place_id || p.id,
          name: p.name,
          category: p.category || 'POI',
          formatted_address: p.address || '',
          latitude: p.latitude,
          longitude: p.longitude,
          rating: p.rating ?? 0,
          user_ratings_total: 0,
          distance_km: null,
          types: p.category ? [p.category] : [],
          maps_url: '',
        }));

        const ti =
          a.travel_intelligence && typeof a.travel_intelligence === 'object'
            ? (a.travel_intelligence as Record<string, any>)
            : {};

        const whyText = String(ti.why || `Verified destination identified from reel analysis.`);

        analysisStore.setAnalysisResult(
          {
            success: true,
            best_guess: {
              place_id: a.id,
              name: a.destination,
              country: a.country || undefined,
              formatted_address: a.country || a.destination,
              confidence: a.confidence ? a.confidence / 100 : 0.9,
              confidence_level: a.confidence && a.confidence >= 80 ? 'VERY_HIGH' : 'MEDIUM',
              verification_status:
                a.confidence && a.confidence >= 80
                  ? 'VERIFIED'
                  : a.confidence && a.confidence >= 50
                  ? 'PARTIAL'
                  : 'UNVERIFIED',
              why: whyText,
              gemini_confidence: a.confidence ? a.confidence / 100 : 0.9,
              gemini_reason: String(ti.gemini_reason || whyText),
              photos: a.thumbnail_url ? [{ url: resolveThumbnailUrl(a.thumbnail_url) || a.thumbnail_url }] : [],
              rating: 0,
              user_ratings_total: 0,
              types: [],
              maps_url: '',
            },
            travel_intelligence: ti,
            nearby_places: mappedNearby,
          },
          a.reel_url
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load historical dossier.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const analysis = detail?.analysis;
  const places = detail?.places || [];

  // Parse structured travel intelligence safely
  const ti = useMemo<TravelIntelligence>(() => {
    if (!analysis?.travel_intelligence) return {};
    if (typeof analysis.travel_intelligence === 'object') {
      return analysis.travel_intelligence as TravelIntelligence;
    }
    return {};
  }, [analysis]);

  // Extract travel tips list
  const tipsList = useMemo(() => {
    const list: string[] = [];
    const rawTips = (ti as Record<string, any>).travel_tips;
    if (Array.isArray(rawTips)) {
      rawTips.forEach((t) => {
        if (typeof t === 'string' && t.trim()) list.push(t.trim());
      });
    } else if (rawTips && typeof rawTips === 'object') {
      const tipsObj = rawTips as Record<string, unknown>;
      ['travel_tips', 'local_tips', 'safety_tips'].forEach((k) => {
        const arr = tipsObj[k];
        if (Array.isArray(arr)) {
          arr.forEach((t) => {
            if (typeof t === 'string' && t.trim()) list.push(t.trim());
          });
        }
      });
    }
    return list;
  }, [ti]);

  // Map historical places to NearbyPlace[] for SurroundingPlacesSection
  const mappedNearbyPlaces = useMemo<NearbyPlace[]>(() => {
    return places.map((p) => ({
      place_id: p.place_id || p.id,
      name: p.name,
      category: p.category || 'POI',
      formatted_address: p.address || '',
      latitude: p.latitude ?? null,
      longitude: p.longitude ?? null,
      rating: p.rating ?? 0,
      user_ratings_total: 0,
      distance_km: null,
      types: p.category ? [p.category] : [],
      maps_url: '',
    }));
  }, [places]);

  const handleBack = () => {
    hapticFeedback.light();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/(tabs)/saved', params: { tab: 'history' } });
    }
  };

  const handleDelete = useCallback(() => {
    if (!analysis) return;
    hapticFeedback.medium();
    Alert.alert(
      'Delete Analysis',
      `Permanently delete "${analysis.destination}" from your cloud analysis history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { success, error: delErr } = await deleteAnalysis(analysis.id);
            if (success) {
              hapticFeedback.success();
              router.replace({ pathname: '/(tabs)/saved', params: { tab: 'history' } });
            } else {
              Alert.alert('Error', delErr || 'Failed to delete record.');
            }
          },
        },
      ]
    );
  }, [analysis]);

  const handleShare = useCallback(async () => {
    if (!analysis) return;
    try {
      hapticFeedback.light();
      await Share.share({
        message: `Discovered ${analysis.destination} (${analysis.country || 'Verified'}) via VAMO.${
          analysis.reel_url ? ` Source reel: ${analysis.reel_url}` : ''
        }`,
      });
    } catch {
      // Quiet fallback
    }
  }, [analysis]);

  const handleOpenSourceReel = useCallback(async () => {
    if (!analysis?.reel_url) return;
    try {
      hapticFeedback.light();
      const canOpen = await Linking.canOpenURL(analysis.reel_url);
      if (canOpen) {
        await Linking.openURL(analysis.reel_url);
      }
    } catch {
      // Quiet fallback
    }
  }, [analysis?.reel_url]);

  const handleOpenPlace = useCallback((place: NearbyPlace) => {
    hapticFeedback.light();
    router.push({
      pathname: '/place/[id]',
      params: {
        id: place.place_id,
        name: place.name,
      },
    });
  }, []);

  const handleOpenPlaceDirections = useCallback(async (place: NearbyPlace) => {
    await openInExternalMaps({
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      formattedAddress: place.formatted_address,
    });
  }, []);

  const handleToggleSaveNearby = useCallback(
    (place: NearbyPlace) => {
      hapticFeedback.light();
      toggleSave(place);
    },
    [toggleSave]
  );

  const handleOpenMap = useCallback(() => {
    hapticFeedback.light();
    router.push('/analyze/map');
  }, []);

  const isPlaceSavedCheck = useCallback(
    (placeId: string) => isSaved(placeId),
    [isSaved]
  );

  if (isLoading) {
    return (
      <AtmosphereBackground variant="sky">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.icyBlue} />
          <Text style={styles.loadingText}>Retrieving saved dossier...</Text>
        </View>
      </AtmosphereBackground>
    );
  }

  if (error || !analysis) {
    return (
      <AtmosphereBackground variant="sky">
        <View style={styles.centerContainer}>
          <EmptyState
            icon={<Ionicons name="alert-circle-outline" size={36} color={Colors.racingRed} />}
            eyebrow="DOSSIER NOT FOUND"
            title="Analysis Unavailable"
            description={error || 'This historical analysis record could not be loaded.'}
            actionLabel="Back to History"
            onActionPress={handleBack}
          />
        </View>
      </AtmosphereBackground>
    );
  }

  const heroImageUrl = resolveThumbnailUrl(analysis.thumbnail_url);
  const confidenceScore = analysis.confidence ?? 0;
  const verificationTier =
    confidenceScore >= 80 ? 'VERIFIED' : confidenceScore >= 50 ? 'PARTIAL' : 'UNVERIFIED';

  const bottomScrollPadding = Math.max(insets.bottom, 16) + 100;

  return (
    <AtmosphereBackground variant="sky">
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomScrollPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Results Hero Header (Full-bleed photo, dark Back & Share pills) */}
        <ResultHero
          imageUrl={heroImageUrl}
          destinationName={analysis.destination}
          locationSubtitle={analysis.country || 'Verified Destination'}
          photoCount={heroImageUrl ? 1 : 0}
          onBack={handleBack}
          onShare={handleShare}
        />

        {/* 2. Destination Evidence Panel */}
        <DestinationIdentity
          verificationStatus={verificationTier}
          category={ti.category as string | undefined}
          why={((ti as Record<string, any>).why as string) || `Analyzed from saved Reel on ${new Date(analysis.created_at).toLocaleDateString()}.`}
          geminiReason={(ti as Record<string, any>).gemini_reason as string | undefined}
        />

        {/* 3. Travel Intelligence Dossier */}
        <DestinationBriefing
          intelligence={ti}
          tips={tipsList}
        />

        {/* 4. Surrounding Places Section (Category PillChips & 2-column poster cards) */}
        {mappedNearbyPlaces.length > 0 && (
          <SurroundingPlacesSection
            places={mappedNearbyPlaces}
            isPlaceSaved={isPlaceSavedCheck}
            onOpenPlace={handleOpenPlace}
            onOpenDirections={handleOpenPlaceDirections}
            onToggleSavePlace={handleToggleSaveNearby}
            onOpenMap={handleOpenMap}
          />
        )}

        {/* 5. Historical Record Actions Block */}
        <View style={styles.actionsSection}>
          {analysis.reel_url ? (
            <Pressable
              onPress={handleOpenSourceReel}
              style={({ pressed }) => [styles.sourceBtn, pressed && styles.pressed]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Open original Instagram Reel"
            >
              <GlassView variant="dark" borderRadius={Radius.pill} style={styles.sourcePill}>
                <Ionicons name="logo-instagram" size={17} color={Colors.icyBlue} />
                <Text style={styles.sourceBtnText}>Open Original Instagram Reel</Text>
                <Ionicons name="open-outline" size={14} color={Colors.textSecondary} />
              </GlassView>
            </Pressable>
          ) : null}

          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.deleteRecordBtn, pressed && styles.pressed]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Delete analysis from cloud history"
          >
            <Ionicons name="trash-outline" size={15} color={Colors.racingRed} />
            <Text style={styles.deleteRecordText}>Delete from Cloud Vault</Text>
          </Pressable>
        </View>
      </ScrollView>
    </AtmosphereBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.huge,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  actionsSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    gap: Spacing.md,
    alignItems: 'center',
  },
  sourceBtn: {
    width: '100%',
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    backgroundColor: 'rgba(8, 18, 24, 0.75)',
  },
  sourceBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ivoryMist,
  },
  deleteRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: TouchTarget.minHeight,
  },
  deleteRecordText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.racingRed,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
});
