import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Chip,
  EmptyState,
  PlaceCard,
  SearchBar,
  SectionHeader,
  TopBar,
} from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { analysisStore } from '@/lib/api/analysis-store';
import { openInExternalMaps } from '@/lib/maps';
import { useSavedPlaces } from '@/lib/storage/saved-places';
import { NearbyPlace } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data } = analysisStore.getAnalysisResult();
  const { isSaved, toggleSave } = useSavedPlaces();

  const bestGuess = data?.best_guess;
  const nearbyPlaces = useMemo(() => data?.nearby_places || [], [data?.nearby_places]);

  // Combine real destination and nearby places into an aggregated list of discoveries
  const allDiscoveredPlaces = useMemo<NearbyPlace[]>(() => {
    const list: NearbyPlace[] = [];

    // Add primary destination as first place if available
    if (bestGuess && bestGuess.name) {
      list.push({
        place_id: bestGuess.place_id || 'primary_destination',
        name: bestGuess.name,
        formatted_address: bestGuess.formatted_address,
        latitude: bestGuess.latitude,
        longitude: bestGuess.longitude,
        rating: bestGuess.rating,
        user_ratings_total: bestGuess.user_ratings_total,
        types: bestGuess.types,
        distance_km: 0,
        maps_url: bestGuess.maps_url,
        category: 'Destinations',
      });
    }

    // Add nearby places defensively
    if (Array.isArray(nearbyPlaces)) {
      nearbyPlaces.forEach((p) => {
        if (p && typeof p === 'object' && p.name) {
          list.push(p);
        }
      });
    }

    return list;
  }, [bestGuess, nearbyPlaces]);

  // Dynamically extract categories from real data
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    allDiscoveredPlaces.forEach((p) => {
      if (p.category) {
        categories.add(p.category);
      }
    });

    // Provide standard discovery categories
    const standard = ['All', 'Destinations', 'Attractions', 'Dining', 'Cafes', 'Hotels'];
    const merged = Array.from(new Set([...standard, ...Array.from(categories)]));

    // Filter to categories that either have items or are 'All'
    return merged.filter((cat) => {
      if (cat === 'All') return true;
      if (cat === 'Destinations') return allDiscoveredPlaces.some((p) => p.category === 'Destinations' || p.category === 'Primary Destination');
      return allDiscoveredPlaces.some((p) => p.category?.toLowerCase() === cat.toLowerCase());
    });
  }, [allDiscoveredPlaces]);

  // Filter places based on search query and category
  const filteredPlaces = useMemo(() => {
    return allDiscoveredPlaces.filter((place) => {
      // Category match
      let matchesCategory = true;
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Destinations') {
          matchesCategory =
            place.category === 'Destinations' ||
            place.category === 'Primary Destination';
        } else {
          matchesCategory =
            place.category?.toLowerCase() === selectedCategory.toLowerCase();
        }
      }

      // Search match
      let matchesSearch = true;
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const inName = (place.name || '').toLowerCase().includes(query);
        const inAddress = (place.formatted_address || '').toLowerCase().includes(query);
        const inCategory = (place.category || '').toLowerCase().includes(query);
        matchesSearch = inName || inAddress || inCategory;
      }

      return matchesCategory && matchesSearch;
    });
  }, [allDiscoveredPlaces, selectedCategory, search]);

  const handleOpenPlace = (place: NearbyPlace) => {
    router.push({
      pathname: '/place/[id]',
      params: {
        id: place.place_id,
        name: place.name,
      },
    });
  };

  const handleOpenPlaceDirections = async (place: NearbyPlace) => {
    await openInExternalMaps({
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      formattedAddress: place.formatted_address,
      fallbackUrl: place.maps_url,
    });
  };

  const hasAnyDiscoveries = allDiscoveredPlaces.length > 0;

  return (
    <View style={styles.screen}>
      <TopBar brandTitle="Explore" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Editorial Subtitle */}
        <View style={styles.editorialHeader}>
          <Text style={styles.eyebrow}>DISCOVERY FEED</Text>
          <Text style={styles.editorialTitle}>Discovered Destinations & Places</Text>
          <Text style={styles.editorialSubtitle}>
            Verified locations and points of interest extracted from travel reels.
          </Text>
        </View>

        {hasAnyDiscoveries ? (
          <>
            {/* Search Input */}
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search places, categories, addresses..."
              style={styles.searchBar}
            />

            {/* Category Chips Carousel */}
            {availableCategories.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesRow}
              >
                {availableCategories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    selected={selectedCategory === category}
                    onPress={() => {
                      hapticFeedback.selection();
                      setSelectedCategory(category);
                    }}
                    count={
                      category === 'All'
                        ? allDiscoveredPlaces.length
                        : allDiscoveredPlaces.filter((p) => {
                            if (category === 'Destinations') {
                              return (
                                p.category === 'Destinations' ||
                                p.category === 'Primary Destination'
                              );
                            }
                            return p.category?.toLowerCase() === category.toLowerCase();
                          }).length
                    }
                  />
                ))}
              </ScrollView>
            )}

            {/* Results Counter / Section Header */}
            <SectionHeader
              eyebrow="CURRENT SESSION"
              title="Discovered Highlights"
              rightActionLabel={`${filteredPlaces.length} ${
                filteredPlaces.length === 1 ? 'place' : 'places'
              }`}
            />

            {/* Place Cards List */}
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map((place) => {
                const photo =
                  analysisStore.getPlacePhotoUrl(place.place_id) ||
                  (place.place_id === bestGuess?.place_id ? bestGuess?.photos?.[0]?.url : undefined);

                return (
                  <PlaceCard
                    key={place.place_id || place.name}
                    name={place.name}
                    category={place.category || 'POI'}
                    formattedAddress={place.formatted_address}
                    rating={place.rating}
                    userRatingsTotal={place.user_ratings_total}
                    distanceKm={place.distance_km}
                    photoUrl={analysisStore.resolvePhotoUrl(photo)}
                    isSaved={isSaved(place.place_id)}
                    onPress={() => handleOpenPlace(place)}
                    onSavePress={() => toggleSave(place, photo)}
                    onDirectionsPress={() => handleOpenPlaceDirections(place)}
                  />
                );
              })
            ) : (
              <EmptyState
                icon={<Ionicons name="search-outline" size={28} color={Colors.textMuted} />}
                eyebrow="NO MATCHES"
                title={`No places match "${search}"`}
                description="Try searching with a different name or switch category filters to see more places."
                actionLabel="Clear Search"
                onActionPress={() => {
                  hapticFeedback.light();
                  setSearch('');
                  setSelectedCategory('All');
                }}
              />
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={<Ionicons name="compass-outline" size={32} color={Colors.textMuted} />}
              eyebrow="SESSION DISCOVERY"
              title="No Analyzed Destinations Yet"
              description="Analyze an Instagram travel reel to extract verified coordinates, highlights, and surrounding points of interest into your Explore stream."
              actionLabel="Analyze a Reel"
              onActionPress={() => router.push('/')}
            />
          </View>
        )}
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
    flexGrow: 1,
  },
  editorialHeader: {
    marginBottom: Spacing.md,
  },
  eyebrow: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  editorialTitle: {
    ...Typography.h1,
    fontSize: 22,
    lineHeight: 28,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  editorialSubtitle: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  searchBar: {
    marginBottom: Spacing.sm,
  },
  categoriesRow: {
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
});
