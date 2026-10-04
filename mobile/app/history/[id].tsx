/**
 * Travel AI Mobile — Historical Analysis Detail Screen (Stage 6)
 *
 * Inspects a saved historical Reel analysis from Supabase:
 * - Verified destination metadata and confidence status
 * - Structured travel intelligence (overview, seasonality, vibe, tips, customs)
 * - Associated places with PlaceCard, directions, and bookmarking
 * - Graceful handling of missing or incomplete fields
 * - Direct link to original Instagram Reel if available
 * - Analysis deletion with confirmation
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ConfidenceBadge,
  EmptyState,
  IconButton,
  ImageCard,
  PlaceCard,
  SectionHeader,
  StatCard,
  TopBar,
} from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { openInExternalMaps } from '@/lib/maps';
import { useSavedPlaces } from '@/lib/storage/saved-places';
import {
  AnalysisDetail,
  AnalysisPlaceRow,
  deleteAnalysis,
  getAnalysisDetail,
  resolveThumbnailUrl,
} from '@/lib/supabase';
import { hapticFeedback } from '@/lib/haptics';

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isSaved, toggleSave } = useSavedPlaces();

  const [detail, setDetail] = useState<AnalysisDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) {
      setError('Invalid analysis ID.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await getAnalysisDetail(id);
      if (fetchErr || !data) {
        setError(fetchErr || 'Analysis not found.');
      } else {
        setDetail(data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load analysis details.';
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
  const ti = useMemo(() => {
    if (!analysis?.travel_intelligence) return {};
    if (typeof analysis.travel_intelligence === 'object') {
      return analysis.travel_intelligence as Record<string, unknown>;
    }
    return {};
  }, [analysis]);

  // Extract travel tips list
  const tipsList = useMemo(() => {
    const list: string[] = [];
    const rawTips = ti.travel_tips;
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
  }, [ti.travel_tips]);

  const handleBack = () => {
    hapticFeedback.light();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/history');
    }
  };

  const handleDelete = useCallback(() => {
    if (!analysis) return;
    hapticFeedback.light();
    Alert.alert(
      'Delete Analysis',
      `Permanently remove "${analysis.destination}" from your cloud history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { success, error: delErr } = await deleteAnalysis(analysis.id);
            if (success) {
              hapticFeedback.success();
              router.replace('/history');
            } else {
              Alert.alert('Error', delErr || 'Failed to delete record.');
            }
          },
        },
      ]
    );
  }, [analysis]);

  const handleOpenSourceReel = useCallback(async () => {
    if (!analysis?.reel_url) return;
    try {
      const canOpen = await Linking.canOpenURL(analysis.reel_url);
      if (canOpen) {
        await Linking.openURL(analysis.reel_url);
      }
    } catch {
      // Link open failure handled silently
    }
  }, [analysis?.reel_url]);

  const handleOpenPlaceDirections = useCallback(async (place: AnalysisPlaceRow) => {
    await openInExternalMaps({
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      formattedAddress: place.address || undefined,
    });
  }, []);

  const handleOpenPlace = useCallback((place: AnalysisPlaceRow) => {
    router.push({
      pathname: '/place/[id]',
      params: {
        id: place.place_id,
        name: place.name,
      },
    });
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Saved Record';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <TopBar title="Historical Analysis" showBack onBackPress={handleBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.surfaceDark} />
          <Text style={styles.loadingText}>Retrieving travel dossier...</Text>
        </View>
      </View>
    );
  }

  if (error || !analysis) {
    return (
      <View style={styles.screen}>
        <TopBar title="Historical Analysis" showBack onBackPress={handleBack} />
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={<Ionicons name="alert-circle-outline" size={36} color={Colors.error} />}
            eyebrow="ANALYSIS RECORD"
            title="Analysis Unavailable"
            description={error || 'This analysis could not be found or was deleted.'}
            actionLabel="Back to History"
            onActionPress={handleBack}
          />
        </View>
      </View>
    );
  }

  const confidence = analysis.confidence ?? 0;
  const status = confidence >= 80 ? 'VERIFIED' : confidence >= 50 ? 'PARTIAL' : 'AI_UNVERIFIED';
  const heroImageUrl = resolveThumbnailUrl(analysis.thumbnail_url);

  // Extract intelligence fields with fallbacks
  const destinationOverview =
    (ti.destination_overview as string) ||
    (ti.summary as string) ||
    (ti.overview as string) ||
    null;

  const bestTimeToVisit =
    (ti.best_time_to_visit as string) ||
    (ti.seasonality as string) ||
    'Information not specified in this analysis.';

  const vibe =
    (ti.vibe as string) ||
    (ti.atmosphere as string) ||
    'Scenic travel destination';

  const estimatedBudget =
    (ti.estimated_budget as string) ||
    (ti.budget as string) ||
    (ti.cost_level as string) ||
    'Moderate';

  const customs =
    (ti.cultural_etiquette as string) ||
    (ti.customs as string) ||
    (ti.local_customs as string) ||
    null;

  return (
    <View style={styles.screen}>
      <TopBar
        title={analysis.destination}
        showBack
        onBackPress={handleBack}
        rightAction={
          <View style={styles.topRightActions}>
            {analysis.reel_url ? (
              <IconButton
                size={36}
                variant="subtle"
                accessibilityLabel="View original Reel on Instagram"
                onPress={handleOpenSourceReel}
              >
                <Ionicons name="logo-instagram" size={18} color={Colors.textPrimary} />
              </IconButton>
            ) : null}
            <IconButton
              size={36}
              variant="subtle"
              accessibilityLabel="Delete analysis from history"
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
            </IconButton>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Destination Hero Photography Card */}
        <View style={styles.heroWrapper}>
          <ImageCard
            imageUrl={heroImageUrl || undefined}
            title={analysis.destination}
            subtitle={analysis.country || 'Verified Travel Destination'}
            photoCount={places.length}
            badge={<ConfidenceBadge status={status} confidence={confidence} />}
          />
        </View>

        {/* Intelligence Statistics Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            label="ANALYZED ON"
            value={formatDate(analysis.created_at)}
            icon={<Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />}
          />
          <StatCard
            label="CONFIDENCE"
            value={`${confidence}%`}
            icon={<Ionicons name="shield-checkmark-outline" size={14} color={Colors.verified} />}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="ATMOSPHERE"
            value={vibe}
            icon={<Ionicons name="sparkles-outline" size={14} color={Colors.info} />}
          />
          <StatCard
            label="EST. BUDGET"
            value={estimatedBudget}
            icon={<Ionicons name="wallet-outline" size={14} color={Colors.textMuted} />}
          />
        </View>

        {/* Destination Overview */}
        {destinationOverview && (
          <View style={styles.section}>
            <SectionHeader eyebrow="DESTINATION INTEL" title="Overview" />
            <View style={styles.card}>
              <Text style={styles.bodyText}>{destinationOverview}</Text>
            </View>
          </View>
        )}

        {/* Seasonality & Best Time */}
        <View style={styles.section}>
          <SectionHeader eyebrow="TIMING & CLIMATE" title="Best Time to Visit" />
          <View style={styles.card}>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.metaHeading}>Seasonality Recommendation</Text>
            </View>
            <Text style={styles.bodyText}>{bestTimeToVisit}</Text>
          </View>
        </View>

        {/* Travel Tips */}
        {tipsList.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              eyebrow="FIELD ADVICE"
              title="Travel Tips"
              rightActionLabel={`${tipsList.length} tips`}
            />
            <View style={styles.card}>
              {tipsList.map((tip, index) => (
                <View
                  key={index}
                  style={[styles.tipRow, index < tipsList.length - 1 && styles.tipBorder]}
                >
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Cultural Etiquette */}
        {customs && (
          <View style={styles.section}>
            <SectionHeader eyebrow="LOCAL CULTURE" title="Customs & Etiquette" />
            <View style={styles.card}>
              <Text style={styles.bodyText}>{customs}</Text>
            </View>
          </View>
        )}

        {/* Associated Discovered Places */}
        <View style={styles.section}>
          <SectionHeader
            eyebrow="SURROUNDING PLACES"
            title="Inspected Points of Interest"
            rightActionLabel={`${places.length} ${places.length === 1 ? 'place' : 'places'}`}
          />

          {places.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.mutedText}>
                No individual points of interest were saved for this analysis.
              </Text>
            </View>
          ) : (
            places.map((place) => (
              <PlaceCard
                key={place.id}
                name={place.name}
                category={place.category || 'Point of Interest'}
                formattedAddress={place.address || undefined}
                rating={place.rating ?? undefined}
                photoUrl={resolveThumbnailUrl(place.photo_url) || undefined}
                isSaved={isSaved(place.place_id)}
                onPress={() => handleOpenPlace(place)}
                onSavePress={() =>
                  toggleSave(
                    {
                      id: place.place_id,
                      name: place.name,
                      address: place.address || undefined,
                      latitude: place.latitude,
                      longitude: place.longitude,
                      rating: place.rating ?? undefined,
                      category: place.category || undefined,
                      saved_at: Date.now(),
                    },
                    resolveThumbnailUrl(place.photo_url) || undefined
                  )
                }
                onDirectionsPress={() => handleOpenPlaceDirections(place)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.huge,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroWrapper: {
    marginBottom: Spacing.base,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  section: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  bodyText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  mutedText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs + 2,
  },
  metaHeading: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs + 2,
  },
  tipBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceDark,
    marginTop: 7,
    marginRight: Spacing.sm,
  },
  tipText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    lineHeight: 20,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
  },
});
