import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { NearbyPlace } from '@/types/analysis';
import { PosterCard } from '@/components/ui';
import { analysisStore } from '@/lib/api/analysis-store';
import { hapticFeedback } from '@/lib/haptics';

export interface SurroundingPlacesSectionProps {
  places: NearbyPlace[];
  isPlaceSaved: (id: string) => boolean;
  onOpenPlace: (place: NearbyPlace) => void;
  onOpenDirections: (place: NearbyPlace) => void;
  onToggleSavePlace: (place: NearbyPlace) => void;
  onOpenMap: () => void;
}

export const SurroundingPlacesSection: React.FC<SurroundingPlacesSectionProps> = ({
  places,
  isPlaceSaved,
  onOpenPlace,
  onToggleSavePlace,
  onOpenMap,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Compute category counts
  const { categories, categoryCounts } = useMemo(() => {
    const counts: Record<string, number> = { All: places?.length || 0 };
    const cats = new Set<string>();

    (places || []).forEach((p) => {
      const cat = p.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
      cats.add(cat);
    });

    return {
      categories: ['All', ...Array.from(cats)],
      categoryCounts: counts,
    };
  }, [places]);

  // Filtered places
  const filteredPlaces = useMemo(() => {
    if (!places) return [];
    if (selectedCategory === 'All') return places;
    return places.filter((p) => (p.category || 'Other') === selectedCategory);
  }, [places, selectedCategory]);

  if (!places || places.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Section Header with Map Action */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>
            Explore <Text style={styles.sectionTitleItalic}>Nearby</Text>
          </Text>
          <Text style={styles.subHeader}>
            {places.length} confirmed points of interest
          </Text>
        </View>

        <Pressable
          onPress={() => {
            hapticFeedback.light();
            onOpenMap();
          }}
          hitSlop={8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open interactive map of nearby places"
          style={({ pressed }) => [styles.mapButton, pressed && styles.pressed]}
        >
          <Ionicons name="map-outline" size={14} color={Colors.icyBlue} />
          <Text style={styles.mapButtonText}>Map</Text>
        </Pressable>
      </View>

      {/* Category Filter Pills with Counts */}
      {categories.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <Pressable
                key={cat}
                onPress={() => {
                  hapticFeedback.selection();
                  setSelectedCategory(cat);
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${cat}, ${count} places`}
                style={({ pressed }) => [
                  styles.categoryPill,
                  isSelected && styles.categoryPillSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextSelected,
                  ]}
                >
                  {cat}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    isSelected && styles.countBadgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      isSelected && styles.countTextSelected,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* 2-Column Poster Cards Grid */}
      <View style={styles.grid}>
        {filteredPlaces.map((place) => {
          const placeId = place.place_id || place.name;
          const photoUrl = analysisStore.getPlacePhotoUrl(placeId);
          const saved = isPlaceSaved(placeId);

          return (
            <View key={placeId} style={styles.gridItem}>
              <PosterCard
                title={place.name}
                subtitle={
                  place.formatted_address ||
                  (place.distance_km ? `${place.distance_km.toFixed(1)} km away` : undefined)
                }
                category={place.category}
                imageUrl={photoUrl}
                isSaved={saved}
                onPress={() => onOpenPlace(place)}
                onToggleSave={() => onToggleSavePlace(place)}
                aspectRatio={3 / 4}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    lineHeight: 26,
    color: Colors.ivoryMist,
    letterSpacing: -0.3,
  },
  sectionTitleItalic: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    fontWeight: 'normal',
  },
  subHeader: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.25)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    gap: 5,
    minHeight: TouchTarget.minHeight,
  },
  mapButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.icyBlue,
    letterSpacing: -0.2,
  },
  categoryScroll: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 244, 227, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    gap: 6,
    minHeight: TouchTarget.minHeight,
  },
  categoryPillSelected: {
    backgroundColor: Colors.onyx,
    borderColor: 'rgba(166, 220, 248, 0.35)',
  },
  categoryText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  categoryTextSelected: {
    color: Colors.ivoryMist,
    fontFamily: Fonts.sansSemiBold,
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 244, 227, 0.10)',
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(166, 220, 248, 0.20)',
  },
  countText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  countTextSelected: {
    color: Colors.icyBlue,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  gridItem: {
    width: '47.5%',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});

export default SurroundingPlacesSection;
