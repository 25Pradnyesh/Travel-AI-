/**
 * VAMO Mobile — Saved & History Screen (Stage B)
 *
 * Unified traveler repository featuring:
 * - Segmented glass pill: "Saved | History"
 * - Saved Tab:
 *     - Multi-device cloud sync indicator
 *     - Guest backup & sync banner as a glass card
 *     - Dynamic category PillChips with counts
 *     - 2-column virtualized PosterCard grid
 *     - Optimistic unsave with haptic feedback
 *     - Designed empty states
 * - History Tab:
 *     - Persisted analysis dossier stream
 *     - Pull-to-refresh & individual analysis deletion
 *     - PRD tier-only verification badges
 *     - Direct navigation to historical dossier (/history/[id])
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  ListRenderItem,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  AtmosphereBackground,
  ConfidenceBadge,
  EmptyState,
  GlassView,
  PillChip,
  PosterCard,
} from '@/components/ui';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { analysisStore } from '@/lib/api/analysis-store';
import { SavedPlace, useSavedPlaces } from '@/lib/storage/saved-places';
import {
  AnalysisRow,
  deleteAnalysis,
  getUserAnalyses,
  resolveThumbnailUrl,
  useAuth,
} from '@/lib/supabase';
import { hapticFeedback } from '@/lib/haptics';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<'saved' | 'history'>(
    tab === 'history' ? 'history' : 'saved'
  );

  // Sync route param tab updates
  useEffect(() => {
    if (tab === 'history') {
      setActiveTab('history');
    } else if (tab === 'saved') {
      setActiveTab('saved');
    }
  }, [tab]);

  // Saved Places store hook
  const { savedPlaces, toggleSave, isLoading: isSavedLoading, isSyncing, refreshCloudPlaces } =
    useSavedPlaces();

  // Auth context
  const { isAuthenticated, user } = useAuth();

  // Category filter state for Saved tab
  const [selectedCategory, setSelectedCategory] = useState('All');

  // History state
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isRefreshingHistory, setIsRefreshingHistory] = useState(false);

  // Focus effect: synchronize cloud saved places and analysis history
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        refreshCloudPlaces();
        fetchHistory(true);
      }
    }, [isAuthenticated, refreshCloudPlaces])
  );

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated || !user?.id) return;
    if (!isRefresh) setIsHistoryLoading(true);

    try {
      const { data, error } = await getUserAnalyses({ limit: 50 });
      if (!error && data) {
        setAnalyses(data);
      }
    } catch {
      // Quiet fallback
    } finally {
      setIsHistoryLoading(false);
      setIsRefreshingHistory(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchHistory();
    } else {
      setAnalyses([]);
    }
  }, [isAuthenticated, user?.id, fetchHistory]);

  const handleRefreshHistory = useCallback(() => {
    setIsRefreshingHistory(true);
    fetchHistory(true);
  }, [fetchHistory]);

  const handleDeleteHistoryItem = useCallback((item: AnalysisRow) => {
    hapticFeedback.medium();
    Alert.alert(
      'Delete Analysis',
      `Remove "${item.destination}" from your cloud analysis history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              hapticFeedback.light();
              setAnalyses((prev) => prev.filter((a) => a.id !== item.id));
              await deleteAnalysis(item.id);
            } catch (err) {
              console.warn('[SavedScreen] Failed to delete analysis:', err);
              fetchHistory(true);
            }
          },
        },
      ]
    );
  }, [fetchHistory]);

  // Categories extracted from saved places
  const categories = useMemo(() => {
    const set = new Set<string>();
    savedPlaces.forEach((p) => {
      if (p.category) {
        set.add(p.category);
      }
    });
    return ['All', ...Array.from(set)];
  }, [savedPlaces]);

  // Memoized category counts O(N)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: savedPlaces.length };
    savedPlaces.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [savedPlaces]);

  // Filter saved places by category
  const filteredPlaces = useMemo(() => {
    if (selectedCategory === 'All') return savedPlaces;
    return savedPlaces.filter(
      (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [savedPlaces, selectedCategory]);

  const handleOpenPlace = useCallback((place: SavedPlace) => {
    hapticFeedback.light();
    router.push({
      pathname: '/place/[id]',
      params: {
        id: place.id,
        name: place.name,
      },
    });
  }, []);

  const handleOpenHistoryDetail = useCallback((item: AnalysisRow) => {
    hapticFeedback.light();
    router.push({
      pathname: '/history/[id]',
      params: { id: item.id },
    });
  }, []);

  const handleSignInPress = useCallback(() => {
    hapticFeedback.light();
    router.push('/(auth)/login');
  }, []);

  const handleOpenProfile = useCallback(() => {
    hapticFeedback.light();
    router.push('/profile');
  }, []);

  const handleOptimisticUnsave = useCallback((place: SavedPlace) => {
    hapticFeedback.light();
    toggleSave(place);
  }, [toggleSave]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderSavedItem: ListRenderItem<SavedPlace> = useCallback(
    ({ item: place }) => {
      const resolvedPhoto = analysisStore.resolvePhotoUrl(place.photo);

      return (
        <View style={styles.gridCell}>
          <PosterCard
            title={place.name}
            subtitle={place.address || place.category}
            imageUrl={resolvedPhoto}
            category={place.category || 'Saved'}
            isSaved={true}
            onPress={() => handleOpenPlace(place)}
            onToggleSave={() => handleOptimisticUnsave(place)}
            aspectRatio={3 / 4}
          />
        </View>
      );
    },
    [handleOpenPlace, handleOptimisticUnsave]
  );

  const renderHistoryItem: ListRenderItem<AnalysisRow> = useCallback(
    ({ item }) => {
      const thumbUrl = resolveThumbnailUrl(item.thumbnail_url);
      const conf = item.confidence ?? 0;
      const status = conf >= 80 ? 'VERIFIED' : conf >= 50 ? 'PARTIAL' : 'UNVERIFIED';

      return (
        <Pressable
          onPress={() => handleOpenHistoryDetail(item)}
          style={({ pressed }) => [styles.historyCardPressable, pressed && styles.pressed]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Analysis for ${item.destination}, ${item.country || ''}`}
        >
          <GlassView variant="dark" borderRadius={Radius.xl} style={styles.historyCard}>
            <View style={styles.historyCardRow}>
              {/* Destination Thumbnail */}
              <View style={styles.thumbWrapper}>
                {thumbUrl ? (
                  <Image
                    source={{ uri: thumbUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    cachePolicy="disk"
                    transition={200}
                  />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Ionicons name="compass-outline" size={24} color={Colors.textMuted} />
                  </View>
                )}
              </View>

              {/* Destination Metadata */}
              <View style={styles.historyMetaCol}>
                <View style={styles.historyMetaTop}>
                  <Text style={styles.historyTitle} numberOfLines={1}>
                    {item.destination}
                  </Text>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteHistoryItem(item);
                    }}
                    hitSlop={8}
                    style={styles.deleteBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${item.destination} from history`}
                  >
                    <Ionicons name="trash-outline" size={15} color={Colors.textMuted} />
                  </Pressable>
                </View>

                {item.country ? (
                  <View style={styles.countryRow}>
                    <Ionicons name="location-sharp" size={12} color={Colors.textSecondary} />
                    <Text style={styles.countryText} numberOfLines={1}>
                      {item.country}
                    </Text>
                  </View>
                ) : null}

                {/* Footer: Tier-Only ConfidenceBadge + Date */}
                <View style={styles.historyFooter}>
                  <ConfidenceBadge status={status} />
                  <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                </View>
              </View>
            </View>
          </GlassView>
        </Pressable>
      );
    },
    [handleOpenHistoryDetail, handleDeleteHistoryItem]
  );

  const renderSavedHeader = () => (
    <View style={styles.headerBlock}>
      {/* Top Segmented Glass Pill: Saved | History */}
      <View style={styles.segmentWrapper}>
        <GlassView variant="frosted" borderRadius={Radius.pill} style={styles.segmentPill}>
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setActiveTab('saved');
            }}
            style={[styles.segmentTab, activeTab === 'saved' && styles.segmentTabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'saved' }}
          >
            <Ionicons
              name={activeTab === 'saved' ? 'bookmark' : 'bookmark-outline'}
              size={13}
              color={activeTab === 'saved' ? Colors.ivoryMist : Colors.textMuted}
            />
            <Text style={[styles.segmentLabel, activeTab === 'saved' && styles.segmentLabelActive]}>
              Saved
            </Text>
            {savedPlaces.length > 0 && (
              <View style={[styles.tabBadge, activeTab === 'saved' && styles.tabBadgeActive]}>
                <Text style={styles.tabBadgeText}>{savedPlaces.length}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setActiveTab('history');
            }}
            style={[styles.segmentTab, activeTab === 'history' && styles.segmentTabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'history' }}
          >
            <Ionicons
              name={activeTab === 'history' ? 'time' : 'time-outline'}
              size={13}
              color={activeTab === 'history' ? Colors.ivoryMist : Colors.textMuted}
            />
            <Text style={[styles.segmentLabel, activeTab === 'history' && styles.segmentLabelActive]}>
              History
            </Text>
            {analyses.length > 0 && (
              <View style={[styles.tabBadge, activeTab === 'history' && styles.tabBadgeActive]}>
                <Text style={styles.tabBadgeText}>{analyses.length}</Text>
              </View>
            )}
          </Pressable>
        </GlassView>

        {/* Header Right Actions: Sync Status Pill + Avatar */}
        <View style={styles.headerRightActions}>
          <View style={styles.syncStatusPill}>
            {isSyncing ? (
              <View style={styles.syncRow}>
                <ActivityIndicator size="small" color={Colors.icyBlue} />
                <Text style={styles.syncText}>Syncing...</Text>
              </View>
            ) : isAuthenticated ? (
              <View style={styles.syncRow}>
                <Ionicons name="cloud-done" size={13} color={Colors.verified} />
                <Text style={styles.syncText}>Cloud Synced</Text>
              </View>
            ) : (
              <View style={styles.syncRow}>
                <Ionicons name="save-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.syncText}>Offline</Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={handleOpenProfile}
            hitSlop={8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open profile and settings"
            style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
          >
            <Ionicons name="person" size={14} color={Colors.ivoryMist} />
          </Pressable>
        </View>
      </View>

      {/* Editorial Title Block */}
      <View style={styles.titleSection}>
        <Text style={styles.eyebrow}>
          {isAuthenticated ? 'CLOUD LOCKER' : 'TRAVEL LOCKER'}
        </Text>
        <Text style={styles.heroTitle}>
          Your collection, <Text style={styles.serifAccent}>bookmarked.</Text>
        </Text>
      </View>

      {/* Guest Sign-In Sync Banner (Glass Card) */}
      {!isAuthenticated && (
        <Pressable
          onPress={handleSignInPress}
          style={({ pressed }) => [styles.bannerPressable, pressed && styles.pressed]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Sign in to sync your saved places across devices"
        >
          <GlassView variant="dark" borderRadius={Radius.xl} style={styles.syncBanner}>
            <View style={styles.bannerIconWrapper}>
              <Ionicons name="cloud-upload-outline" size={20} color={Colors.icyBlue} />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>Sync Across Devices</Text>
              <Text style={styles.bannerDesc}>
                Sign in with Apple or Google to safeguard and back up your saved places to your personal cloud.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </GlassView>
        </Pressable>
      )}

      {/* Category Filter Chips */}
      {savedPlaces.length > 0 && categories.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {categories.map((filter) => (
            <PillChip
              key={filter}
              label={filter}
              count={categoryCounts[filter] ?? 0}
              selected={selectedCategory === filter}
              onPress={() => setSelectedCategory(filter)}
            />
          ))}
        </ScrollView>
      )}

      {/* Section Counter */}
      {savedPlaces.length > 0 && filteredPlaces.length > 0 && (
        <View style={styles.counterRow}>
          <Text style={styles.counterLabel}>
            {filteredPlaces.length} {filteredPlaces.length === 1 ? 'SAVED PLACE' : 'SAVED PLACES'}
          </Text>
          <Text style={styles.counterSub}>{selectedCategory} Filter</Text>
        </View>
      )}
    </View>
  );

  const renderHistoryHeader = () => (
    <View style={styles.headerBlock}>
      {/* Top Segmented Glass Pill: Saved | History */}
      <View style={styles.segmentWrapper}>
        <GlassView variant="frosted" borderRadius={Radius.pill} style={styles.segmentPill}>
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setActiveTab('saved');
            }}
            style={[styles.segmentTab, activeTab === 'saved' && styles.segmentTabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'saved' }}
          >
            <Ionicons
              name={activeTab === 'saved' ? 'bookmark' : 'bookmark-outline'}
              size={13}
              color={activeTab === 'saved' ? Colors.ivoryMist : Colors.textMuted}
            />
            <Text style={[styles.segmentLabel, activeTab === 'saved' && styles.segmentLabelActive]}>
              Saved
            </Text>
            {savedPlaces.length > 0 && (
              <View style={[styles.tabBadge, activeTab === 'saved' && styles.tabBadgeActive]}>
                <Text style={styles.tabBadgeText}>{savedPlaces.length}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setActiveTab('history');
            }}
            style={[styles.segmentTab, activeTab === 'history' && styles.segmentTabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'history' }}
          >
            <Ionicons
              name={activeTab === 'history' ? 'time' : 'time-outline'}
              size={13}
              color={activeTab === 'history' ? Colors.ivoryMist : Colors.textMuted}
            />
            <Text style={[styles.segmentLabel, activeTab === 'history' && styles.segmentLabelActive]}>
              History
            </Text>
            {analyses.length > 0 && (
              <View style={[styles.tabBadge, activeTab === 'history' && styles.tabBadgeActive]}>
                <Text style={styles.tabBadgeText}>{analyses.length}</Text>
              </View>
            )}
          </Pressable>
        </GlassView>

        {/* Header Right Actions: History Sync Status + Avatar */}
        <View style={styles.headerRightActions}>
          <View style={styles.syncStatusPill}>
            <View style={styles.syncRow}>
              <Ionicons name="cloud-outline" size={13} color={Colors.icyBlue} />
              <Text style={styles.syncText}>
                {isAuthenticated ? `${analyses.length} Dossiers` : 'Sign-In Required'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleOpenProfile}
            hitSlop={8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open profile and settings"
            style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
          >
            <Ionicons name="person" size={14} color={Colors.ivoryMist} />
          </Pressable>
        </View>
      </View>

      {/* Editorial Title Block */}
      <View style={styles.titleSection}>
        <Text style={styles.eyebrow}>ANALYSIS VAULT</Text>
        <Text style={styles.heroTitle}>
          Past reels, <Text style={styles.serifAccent}>persisted.</Text>
        </Text>
      </View>

      {!isAuthenticated && (
        <Pressable
          onPress={handleSignInPress}
          style={({ pressed }) => [styles.bannerPressable, pressed && styles.pressed]}
        >
          <GlassView variant="dark" borderRadius={Radius.xl} style={styles.syncBanner}>
            <View style={styles.bannerIconWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.icyBlue} />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>Sign In for Analysis History</Text>
              <Text style={styles.bannerDesc}>
                Every Reel you analyze is automatically archived into a full destination dossier when signed in.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </GlassView>
        </Pressable>
      )}

      {isAuthenticated && analyses.length > 0 && (
        <View style={styles.counterRow}>
          <Text style={styles.counterLabel}>
            {analyses.length} {analyses.length === 1 ? 'ANALYSIS' : 'ANALYSES'}
          </Text>
          <Text style={styles.counterSub}>Pull to refresh</Text>
        </View>
      )}
    </View>
  );

  const renderSavedEmpty = () => {
    if (savedPlaces.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={<Ionicons name="bookmark-outline" size={36} color={Colors.textMuted} />}
            eyebrow="NO SAVED PLACES"
            title="Your locker is waiting."
            description="Bookmark places from analyzed travel reels to build your personal itinerary and offline map collection."
            actionLabel="Start Analyzing"
            onActionPress={() => router.push('/')}
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon={<Ionicons name="filter-outline" size={32} color={Colors.textMuted} />}
          eyebrow="CATEGORY FILTER"
          title={`No places in "${selectedCategory}"`}
          description="Select another category or view All to see your bookmarked places."
          actionLabel="Show All Places"
          onActionPress={() => {
            hapticFeedback.light();
            setSelectedCategory('All');
          }}
        />
      </View>
    );
  };

  const renderHistoryEmpty = () => {
    if (!isAuthenticated) return null;

    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon={<Ionicons name="time-outline" size={36} color={Colors.textMuted} />}
          eyebrow="NO HISTORY YET"
          title="No analyzed reels saved."
          description="Analyze an Instagram travel reel while signed in to automatically persist verified travel dossiers to your cloud vault."
          actionLabel="Analyze First Reel"
          onActionPress={() => router.push('/')}
        />
      </View>
    );
  };

  const bottomScrollPadding = Math.max(insets.bottom, 16) + 100;

  return (
    <AtmosphereBackground>
      {activeTab === 'saved' ? (
        <FlatList
          data={filteredPlaces}
          keyExtractor={(item) => item.id}
          numColumns={2}
          key="saved-grid-2col"
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.listContainer,
            {
              paddingTop: Math.max(insets.top, 16) + 8,
              paddingBottom: bottomScrollPadding,
            },
          ]}
          ListHeaderComponent={renderSavedHeader}
          ListEmptyComponent={renderSavedEmpty}
          renderItem={renderSavedItem}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      ) : (
        <FlatList
          data={isAuthenticated ? analyses : []}
          keyExtractor={(item) => item.id}
          key="history-list-single"
          contentContainerStyle={[
            styles.listContainer,
            {
              paddingTop: Math.max(insets.top, 16) + 8,
              paddingBottom: bottomScrollPadding,
            },
          ]}
          ListHeaderComponent={renderHistoryHeader}
          ListEmptyComponent={renderHistoryEmpty}
          renderItem={renderHistoryItem}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshingHistory}
          onRefresh={handleRefreshHistory}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
    </AtmosphereBackground>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: Spacing.xl,
  },
  headerBlock: {
    marginBottom: Spacing.md,
  },
  segmentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TouchTarget.minHeight,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  segmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    backgroundColor: 'rgba(8, 18, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
  },
  segmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    gap: 6,
    minHeight: 34,
  },
  segmentTabActive: {
    backgroundColor: Colors.onyx,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.28)',
  },
  segmentLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.textMuted,
  },
  segmentLabelActive: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.ivoryMist,
  },
  tabBadge: {
    backgroundColor: 'rgba(251, 244, 227, 0.12)',
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(166, 220, 248, 0.25)',
  },
  tabBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    color: Colors.ivoryMist,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.onyx,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 244, 227, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncStatusPill: {
    backgroundColor: 'rgba(8, 18, 24, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.14)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm + 3,
    paddingVertical: 6,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  syncText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  titleSection: {
    marginBottom: Spacing.lg,
  },
  eyebrow: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: Colors.icyBlue,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: Fonts.serifRegular,
    fontSize: 32,
    lineHeight: 36,
    color: Colors.ivoryMist,
    letterSpacing: -0.4,
  },
  serifAccent: {
    fontFamily: Fonts.serifItalic,
    color: Colors.ivoryMist,
  },
  bannerPressable: {
    marginBottom: Spacing.lg,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    backgroundColor: 'rgba(8, 18, 24, 0.78)',
    gap: Spacing.md,
  },
  bannerIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(166, 220, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.ivoryMist,
    marginBottom: 3,
  },
  bannerDesc: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textSecondary,
  },
  categoriesRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.base,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(251, 244, 227, 0.12)',
  },
  counterLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.icyBlue,
  },
  counterSub: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  columnWrapper: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  gridCell: {
    flex: 1,
    maxWidth: '50%',
  },
  historyCardPressable: {
    marginBottom: Spacing.md,
  },
  historyCard: {
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.14)',
    backgroundColor: 'rgba(8, 18, 24, 0.80)',
  },
  historyCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  thumbWrapper: {
    width: 76,
    height: 76,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.canvasDeep,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.12)',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyMetaCol: {
    flex: 1,
  },
  historyMetaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  historyTitle: {
    flex: 1,
    fontFamily: Fonts.serifRegular,
    fontSize: 20,
    color: Colors.ivoryMist,
    letterSpacing: -0.3,
    marginRight: Spacing.xs,
  },
  deleteBtn: {
    padding: 4,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  countryText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDate: {
    fontFamily: Fonts.sansRegular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
});
