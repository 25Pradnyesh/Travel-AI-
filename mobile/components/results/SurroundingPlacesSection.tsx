import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { NearbyPlace } from '@/types/analysis';
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
  onOpenDirections,
  onToggleSavePlace,
  onOpenMap,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Derive categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    places.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [places]);

  // Filtered places
  const filteredPlaces = useMemo(() => {
    if (selectedCategory === 'All') return places;
    return places.filter((p) => p.category === selectedCategory);
  }, [places, selectedCategory]);

  if (!places || places.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Section Header with Map Action */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionHeader}>SURROUNDING HIGHLIGHTS</Text>
          <Text style={styles.subHeader}>{places.length} places identified nearby</Text>
        </View>

        <Pressable
          onPress={() => {
            hapticFeedback.light();
            onOpenMap();
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open interactive map"
          style={({ pressed }) => [styles.mapButton, pressed && styles.pressed]}
        >
          <Ionicons name="map-outline" size={14} color={Colors.onyx} />
          <Text style={styles.mapButtonText}>Map</Text>
        </Pressable>
      </View>

      {/* Category Chips (if multiple categories) */}
      {categories.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => {
                  hapticFeedback.selection();
                  setSelectedCategory(cat);
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${cat}`}
                style={({ pressed }) => [
                  styles.categoryChip,
                  isSelected && styles.categoryChipSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Place Items List */}
      <View style={styles.placesList}>
        {filteredPlaces.map((place) => {
          const placeId = place.place_id || place.name;
          const saved = isPlaceSaved(placeId);

          return (
            <Pressable
              key={placeId}
              onPress={() => {
                hapticFeedback.selection();
                onOpenPlace(place);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`View ${place.name}`}
              style={({ pressed }) => [styles.placeCard, pressed && styles.cardPressed]}
            >
              <View style={styles.placeInfo}>
                <View style={styles.placeTitleRow}>
                  <Text style={styles.placeName} numberOfLines={1}>
                    {place.name}
                  </Text>
                </View>

                {place.category ? (
                  <Text style={styles.placeCategory}>{place.category.toUpperCase()}</Text>
                ) : null}

                {place.formatted_address ? (
                  <Text style={styles.placeAddress} numberOfLines={1}>
                    {place.formatted_address}
                  </Text>
                ) : null}

                {typeof place.distance_km === 'number' && place.distance_km > 0 ? (
                  <Text style={styles.placeDistance}>
                    {place.distance_km < 1
                      ? `${Math.round(place.distance_km * 1000)} m away`
                      : `${place.distance_km.toFixed(1)} km away`}
                  </Text>
                ) : null}
              </View>

              {/* Action Buttons for Place */}
              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => {
                    hapticFeedback.light();
                    onToggleSavePlace(place);
                  }}
                  hitSlop={8}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={saved ? 'Remove place from saved' : 'Save place'}
                  style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
                >
                  <Ionicons
                    name={saved ? 'bookmark' : 'bookmark-outline'}
                    size={18}
                    color={saved ? Colors.racingRed : Colors.onyx}
                  />
                </Pressable>

                <Pressable
                  onPress={() => {
                    hapticFeedback.light();
                    onOpenDirections(place);
                  }}
                  hitSlop={8}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Directions to ${place.name}`}
                  style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
                >
                  <Ionicons name="navigate-outline" size={17} color={Colors.onyx} />
                </Pressable>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl, // 24px horizontal padding
    marginBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(12, 12, 12, 0.45)', // Onyx muted
  },
  subHeader: {
    fontSize: 13,
    color: 'rgba(12, 12, 12, 0.65)',
    marginTop: 2,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ivoryMist,
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.16)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 4,
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onyx,
  },
  categoryScroll: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  categoryChip: {
    backgroundColor: Colors.ivoryMist,
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  categoryChipSelected: {
    backgroundColor: Colors.onyx,
    borderColor: Colors.onyx,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.onyx,
  },
  categoryChipTextSelected: {
    color: Colors.ivoryMist,
    fontWeight: '600',
  },
  placesList: {
    gap: Spacing.sm,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.ivoryMist,
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.12)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  placeInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onyx,
    lineHeight: 20,
  },
  placeCategory: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(12, 12, 12, 0.45)',
    marginTop: 2,
  },
  placeAddress: {
    fontSize: 12,
    color: 'rgba(12, 12, 12, 0.60)',
    marginTop: 2,
  },
  placeDistance: {
    fontSize: 11,
    color: 'rgba(12, 12, 12, 0.45)',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.04)',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});

export default SurroundingPlacesSection;
