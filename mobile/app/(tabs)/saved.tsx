import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Chip,
  EmptyState,
  PlaceCard,
  SectionHeader,
  TopBar,
} from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { analysisStore } from '@/lib/api/analysis-store';
import { openInExternalMaps } from '@/lib/maps';
import { SavedPlace, useSavedPlaces } from '@/lib/storage/saved-places';
import { useAuth } from '@/lib/supabase';
import { hapticFeedback } from '@/lib/haptics';

export default function SavedScreen() {
  const { savedPlaces, savedCount, toggleSave, isLoading, isSyncing, refreshCloudPlaces } =
    useSavedPlaces();
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Multi-device synchronization: Re-sync with cloud whenever Saved screen is focused
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        refreshCloudPlaces();
      }
    }, [isAuthenticated, refreshCloudPlaces])
  );

  // Extract unique categories from saved places
  const categories = useMemo(() => {
    const set = new Set<string>();
    savedPlaces.forEach((p) => {
      if (p.category) {
        set.add(p.category);
      }
    });
    return ['All', ...Array.from(set)];
  }, [savedPlaces]);

  // Single-pass memoized category counts O(N)
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
    router.push({
      pathname: '/place/[id]',
      params: {
        id: place.id,
        name: place.name,
      },
    });
  }, []);

  const handleOpenMaps = useCallback(async (place: SavedPlace) => {
    await openInExternalMaps({
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      formattedAddress: place.address,
      fallbackUrl: place.maps_url,
    });
  }, []);

  const renderPlaceItem: ListRenderItem<SavedPlace> = useCallback(
    ({ item: place }) => (
      <PlaceCard
        key={place.id}
        name={place.name}
        category={place.category || 'Saved Place'}
        formattedAddress={place.address}
        rating={place.rating}
        userRatingsTotal={place.review_count}
        distanceKm={place.distance}
        photoUrl={analysisStore.resolvePhotoUrl(place.photo)}
        isSaved={true}
        onPress={() => handleOpenPlace(place)}
        onSavePress={() => toggleSave(place)}
        onDirectionsPress={() => handleOpenMaps(place)}
      />
    ),
    [handleOpenPlace, toggleSave, handleOpenMaps]
  );

  const handleSignInPress = useCallback(() => {
    hapticFeedback.selection();
    router.push('/(auth)/login');
  }, []);

  const renderListHeader = () => (
    <View>
      {/* Editorial Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.eyebrow}>
              {isAuthenticated ? 'CLOUD LOCKER' : 'TRAVEL LOCKER'}
            </Text>
            <Text style={styles.title}>Your Places</Text>
          </View>
          {savedCount > 0 && (
            <View style={styles.countBadge}>
              <Ionicons
                name={isAuthenticated ? 'cloud-done-outline' : 'bookmark'}
                size={14}
                color={isAuthenticated ? Colors.verified : Colors.surfaceDark}
              />
              <Text style={styles.countText}>{savedCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>
          {isAuthenticated
            ? 'Cloud-synchronized collection of verified destinations and points of interest.'
            : 'Offline collection of verified destinations. Sign in to sync across devices.'}
        </Text>
      </View>

      {/* Guest Sign-In Notice Banner */}
      {!isAuthenticated && (
        <Pressable
          onPress={handleSignInPress}
          style={({ pressed }) => [styles.guestBanner, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Sign in to back up and sync your saved places"
        >
          <View style={styles.guestBannerIcon}>
            <Ionicons name="cloud-upload-outline" size={18} color={Colors.surfaceDark} />
          </View>
          <View style={styles.guestBannerText}>
            <Text style={styles.guestBannerTitle}>Sync Across Devices</Text>
            <Text style={styles.guestBannerDesc}>
              Sign in with Apple or Google to back up your places to personal cloud.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </Pressable>
      )}

      {savedPlaces.length > 0 ? (
        <>
          {/* Category Filter Chips */}
          {categories.length > 2 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {categories.map((filter) => (
                <Chip
                  key={filter}
                  label={filter}
                  selected={selectedCategory === filter}
                  onPress={() => {
                    hapticFeedback.selection();
                    setSelectedCategory(filter);
                  }}
                  count={categoryCounts[filter] ?? 0}
                />
              ))}
            </ScrollView>
          )}

          <SectionHeader
            eyebrow="SAVED REPOSITORY"
            title="Bookmarked Places"
            rightActionLabel={`${filteredPlaces.length} ${
              filteredPlaces.length === 1 ? 'place' : 'places'
            }`}
          />
        </>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.surfaceDark} />
          <Text style={styles.loadingText}>Syncing saved places...</Text>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={<Ionicons name="bookmark-outline" size={32} color={Colors.textMuted} />}
            eyebrow="NO SAVED PLACES YET"
            title="Your travel locker is empty."
            description={
              isAuthenticated
                ? 'Analyze a Reel and bookmark places or destinations you want to remember. Saved places sync to your personal cloud.'
                : 'Analyze a Reel and bookmark places or destinations you want to remember. Sign in to safeguard them across all your devices.'
            }
            actionLabel="Start Analyzing"
            onActionPress={() => router.push('/')}
          />
        </View>
      )}
    </View>
  );

  const renderListEmpty = () => {
    if (savedPlaces.length === 0) return null;
    return (
      <EmptyState
        icon={<Ionicons name="filter-outline" size={28} color={Colors.textMuted} />}
        eyebrow="CATEGORY FILTER"
        title={`No places saved under "${selectedCategory}"`}
        description="Select another category or view All to see your saved collection."
        actionLabel="Show All Places"
        onActionPress={() => {
          hapticFeedback.light();
          setSelectedCategory('All');
        }}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <TopBar brandTitle="Saved" />

      <FlatList
        data={savedPlaces.length > 0 ? filteredPlaces : []}
        keyExtractor={(item) => item.id}
        renderItem={renderPlaceItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshing={isSyncing}
        onRefresh={isAuthenticated ? refreshCloudPlaces : undefined}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
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
    flexGrow: 1,
  },
  header: {
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  title: {
    ...Typography.h1,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  countText: {
    ...Typography.mono,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  filterRow: {
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  guestBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBannerText: {
    flex: 1,
  },
  guestBannerTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  guestBannerDesc: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
