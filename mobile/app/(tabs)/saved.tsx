import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
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
import { hapticFeedback } from '@/lib/haptics';

export default function SavedScreen() {
  const { savedPlaces, savedCount, toggleSave } = useSavedPlaces();
  const [selectedCategory, setSelectedCategory] = useState('All');

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

  // Filter saved places by category
  const filteredPlaces = useMemo(() => {
    if (selectedCategory === 'All') return savedPlaces;
    return savedPlaces.filter(
      (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [savedPlaces, selectedCategory]);

  const handleOpenPlace = (place: SavedPlace) => {
    router.push({
      pathname: '/place/[id]',
      params: {
        id: place.id,
        name: place.name,
      },
    });
  };

  const handleOpenMaps = async (place: SavedPlace) => {
    await openInExternalMaps({
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      formattedAddress: place.address,
      fallbackUrl: place.maps_url,
    });
  };

  return (
    <View style={styles.screen}>
      <TopBar brandTitle="Saved" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Editorial Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.eyebrow}>TRAVEL LOCKER</Text>
              <Text style={styles.title}>Your Places</Text>
            </View>
            {savedCount > 0 && (
              <View style={styles.countBadge}>
                <Ionicons name="bookmark" size={13} color={Colors.surfaceDark} />
                <Text style={styles.countText}>{savedCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>
            Offline collection of verified destinations and points of interest.
          </Text>
        </View>

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
                    count={
                      filter === 'All'
                        ? savedPlaces.length
                        : savedPlaces.filter(
                            (p) => p.category?.toLowerCase() === filter.toLowerCase()
                          ).length
                    }
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

            {/* Saved Place Cards */}
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map((place) => (
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
              ))
            ) : (
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
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={<Ionicons name="bookmark-outline" size={32} color={Colors.textMuted} />}
              eyebrow="NO SAVED PLACES YET"
              title="Your travel locker is empty."
              description="Analyze a Reel and bookmark places or destinations you want to remember. All saved places are kept offline on your device."
              actionLabel="Start Analyzing"
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
});
