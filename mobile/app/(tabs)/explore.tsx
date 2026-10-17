/**
 * VAMO Mobile — Explore Screen (Stage B)
 *
 * Virtualized 2-column discovery stream displaying verified destinations
 * and surrounding points of interest extracted from travel reels:
 * - Full-bleed AtmosphereBackground (sky variant)
 * - Top brand bar with avatar button opening Profile
 * - Frosted search pill with clear action
 * - Dynamic category PillChips with counts
 * - Virtualized 2-column PosterCard grid (no per-card blur)
 * - Designed empty states for initial session and search filtering
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  ListRenderItem,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  AtmosphereBackground,
  EmptyState,
  GlassView,
  PillChip,
  PosterCard,
} from '@/components/ui';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { analysisStore } from '@/lib/api/analysis-store';
import { useSavedPlaces } from '@/lib/storage/saved-places';
import { NearbyPlace } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
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

    const standard = ['All', 'Destinations', 'Attractions', 'Beaches', 'Dining', 'Cafes', 'Hotels'];
    const merged = Array.from(new Set([...standard, ...Array.from(categories)]));

    // Filter to categories that either have items or are 'All'
    return merged.filter((cat) => {
      if (cat === 'All') return true;
      if (cat === 'Destinations') {
        return allDiscoveredPlaces.some(
          (p) => p.category === 'Destinations' || p.category === 'Primary Destination'
        );
      }
      return allDiscoveredPlaces.some((p) => p.category?.toLowerCase() === cat.toLowerCase());
    });
  }, [allDiscoveredPlaces]);

  // Single-pass memoized category counts O(N)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allDiscoveredPlaces.length };
    allDiscoveredPlaces.forEach((p) => {
      const cat = p.category;
      if (cat === 'Destinations' || cat === 'Primary Destination') {
        counts['Destinations'] = (counts['Destinations'] || 0) + 1;
      } else if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return counts;
  }, [allDiscoveredPlaces]);

  // Filter places based on search query and category
  const filteredPlaces = useMemo(() => {
    return allDiscoveredPlaces.filter((place) => {
      let matchesCategory = true;
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Destinations') {
          matchesCategory =
            place.category === 'Destinations' || place.category === 'Primary Destination';
        } else {
          matchesCategory = place.category?.toLowerCase() === selectedCategory.toLowerCase();
        }
      }

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

  const handleOpenProfile = useCallback(() => {
    hapticFeedback.light();
    router.push('/profile');
  }, []);

  const hasAnyDiscoveries = allDiscoveredPlaces.length > 0;

  const renderPlaceItem: ListRenderItem<NearbyPlace> = useCallback(
    ({ item: place }) => {
      const photo =
        analysisStore.getPlacePhotoUrl(place.place_id) ||
        (place.place_id === bestGuess?.place_id ? bestGuess?.photos?.[0]?.url : undefined);

      const resolvedPhoto = analysisStore.resolvePhotoUrl(photo);
      const isPlaceSaved = isSaved(place.place_id);

      const subtitle = place.formatted_address || (place.distance_km ? `${place.distance_km.toFixed(1)} km away` : undefined);

      return (
        <View style={styles.gridCell}>
          <PosterCard
            title={place.name}
            subtitle={subtitle}
            imageUrl={resolvedPhoto}
            category={place.category || 'Highlight'}
            isSaved={isPlaceSaved}
            onPress={() => handleOpenPlace(place)}
            onToggleSave={() => toggleSave(place, photo)}
            aspectRatio={3 / 4}
          />
        </View>
      );
    },
    [bestGuess, isSaved, toggleSave, handleOpenPlace]
  );

  const renderListHeader = () => (
    <View style={styles.headerBlock}>
      {/* Top Header Bar: Brand pill + Avatar button opening Profile */}
      <View style={styles.topBar}>
        <View style={styles.brandPill}>
          <Text style={styles.brandText}>EXPLORE</Text>
          <View style={styles.brandDot} />
        </View>

        <Pressable
          onPress={handleOpenProfile}
          hitSlop={8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open profile and settings"
          style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
        >
          <Ionicons name="person" size={15} color={Colors.ivoryMist} />
        </Pressable>
      </View>

      {/* Editorial Title */}
      <View style={styles.editorialTitleSection}>
        <Text style={styles.eyebrow}>DISCOVERY STREAM</Text>
        <Text style={styles.heroTitle}>
          Curated spots,{' '}
          <Text style={styles.serifAccent}>verified.</Text>
        </Text>
      </View>

      {/* Frosted Search Pill */}
      {hasAnyDiscoveries ? (
        <View style={styles.searchWrapper}>
          <GlassView variant="frosted" borderRadius={Radius.pill} style={styles.searchPill}>
            <Ionicons name="search" size={16} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search destinations, places, categories..."
              placeholderTextColor={Colors.textMuted}
              selectionColor={Colors.racingRed}
              style={styles.searchInput}
              autoCorrect={false}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <Pressable
                onPress={() => {
                  hapticFeedback.light();
                  setSearch('');
                }}
                hitSlop={8}
                style={styles.clearBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear search text"
              >
                <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
              </Pressable>
            )}
          </GlassView>
        </View>
      ) : null}

      {/* Category PillChips Carousel */}
      {hasAnyDiscoveries && availableCategories.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {availableCategories.map((category) => (
            <PillChip
              key={category}
              label={category}
              count={categoryCounts[category] ?? 0}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </ScrollView>
      ) : null}

      {/* Section Counter */}
      {hasAnyDiscoveries && filteredPlaces.length > 0 ? (
        <View style={styles.counterRow}>
          <Text style={styles.counterLabel}>
            {filteredPlaces.length} {filteredPlaces.length === 1 ? 'SPOT' : 'SPOTS'}
          </Text>
          <Text style={styles.counterSub}>{selectedCategory} Category</Text>
        </View>
      ) : null}
    </View>
  );

  const renderEmptyComponent = () => {
    if (!hasAnyDiscoveries) {
      return (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={<Ionicons name="compass-outline" size={36} color={Colors.icyBlue} />}
            eyebrow="SESSION DISCOVERIES"
            title="No Analyzed Destinations Yet"
            description="Analyze an Instagram travel reel to extract verified coordinates, highlights, and surrounding points of interest into your Explore feed."
            actionLabel="Analyze a Reel"
            onActionPress={() => router.push('/')}
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon={<Ionicons name="search-outline" size={32} color={Colors.textMuted} />}
          eyebrow="NO MATCHES FOUND"
          title={`No places found for "${search}"`}
          description="Try searching for another place name, category, or clear filters."
          actionLabel="Clear Search"
          onActionPress={() => {
            hapticFeedback.light();
            setSearch('');
            setSelectedCategory('All');
          }}
        />
      </View>
    );
  };

  const bottomScrollPadding = Math.max(insets.bottom, 16) + 100;

  return (
    <AtmosphereBackground>
      <FlatList
        data={filteredPlaces}
        keyExtractor={(item) => item.place_id || item.name}
        numColumns={2}
        key="explore-grid-2col"
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContainer,
          {
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingBottom: bottomScrollPadding,
          },
        ]}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyComponent}
        renderItem={renderPlaceItem}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TouchTarget.minHeight,
    marginBottom: Spacing.md,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 6,
  },
  brandText: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    letterSpacing: 2,
    color: Colors.ivoryMist,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.racingRed,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.onyx,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 244, 227, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorialTitleSection: {
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
  searchWrapper: {
    marginBottom: Spacing.md,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.20)',
    backgroundColor: 'rgba(8, 18, 24, 0.65)',
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.sansRegular,
    fontSize: 14,
    color: Colors.ivoryMist,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
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
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
