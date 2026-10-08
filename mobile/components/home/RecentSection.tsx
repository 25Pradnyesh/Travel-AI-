import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { AnalysisRow, resolveThumbnailUrl } from '@/lib/supabase';
import { hapticFeedback } from '@/lib/haptics';

export interface RecentSectionProps {
  recentAnalyses: AnalysisRow[];
  onOpenAnalysis: (item: AnalysisRow) => void;
  onViewAllHistory: () => void;
}

export const RecentSection: React.FC<RecentSectionProps> = ({
  recentAnalyses,
  onOpenAnalysis,
  onViewAllHistory,
}) => {
  const hasRecent = recentAnalyses && recentAnalyses.length > 0;

  if (!hasRecent) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.quietEmptyText}>Your discoveries will appear here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>RECENT</Text>
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            onViewAllHistory();
          }}
          hitSlop={8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="View all recent analyses"
        >
          <Text style={styles.viewAllText}>See all</Text>
        </Pressable>
      </View>

      {/* Compact Recent List */}
      <View style={styles.listContainer}>
        {recentAnalyses.slice(0, 3).map((item) => {
          const thumbnailUrl = resolveThumbnailUrl(item.thumbnail_url);

          return (
            <Pressable
              key={item.id}
              onPress={() => {
                hapticFeedback.selection();
                onOpenAnalysis(item);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`View analysis for ${item.destination}`}
              style={({ pressed }) => [
                styles.itemCard,
                pressed && styles.itemCardPressed,
              ]}
            >
              <View style={styles.thumbnailWrapper}>
                {thumbnailUrl ? (
                  <Image
                    source={{ uri: thumbnailUrl }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.thumbnailFallback}>
                    <Ionicons name="location-outline" size={16} color={Colors.onyx} />
                  </View>
                )}
              </View>

              <View style={styles.itemInfo}>
                <Text style={styles.destinationText} numberOfLines={1}>
                  {item.destination}
                </Text>
                {item.country && (
                  <Text style={styles.countryText} numberOfLines={1}>
                    {item.country}
                  </Text>
                )}
              </View>

              <View style={styles.chevronWrapper}>
                <Ionicons name="chevron-forward" size={14} color="rgba(12, 12, 12, 0.40)" />
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
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl, // 24px editorial horizontal padding
    paddingBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(12, 12, 12, 0.50)',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onyx,
  },
  listContainer: {
    gap: Spacing.xs + 3,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ivoryMist,
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.12)',
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
  },
  itemCardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  thumbnailWrapper: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(12, 12, 12, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(12, 12, 12, 0.10)',
    marginRight: Spacing.md,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  destinationText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onyx,
    lineHeight: 18,
  },
  countryText: {
    fontSize: 12,
    color: 'rgba(12, 12, 12, 0.55)',
    marginTop: 2,
  },
  chevronWrapper: {
    marginLeft: Spacing.sm,
  },
  emptyContainer: {
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.huge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quietEmptyText: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(12, 12, 12, 0.35)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default RecentSection;
