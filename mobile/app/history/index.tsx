/**
 * Travel AI Mobile — Analysis History List Screen (Stage 6)
 *
 * Displays signed-in users' previous Reel analyses retrieved from Supabase:
 * - Destination name, country, and analysis date
 * - Photography thumbnail where available
 * - Confidence score and verification status badge
 * - Pull-to-refresh and individual analysis deletion
 * - Navigation to historical travel intelligence dossier
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ListRenderItem,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ConfidenceBadge,
  EmptyState,
  IconButton,
  TopBar,
} from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import {
  AnalysisRow,
  deleteAnalysis,
  getUserAnalyses,
  resolveThumbnailUrl,
  useAuth,
} from '@/lib/supabase';
import { hapticFeedback } from '@/lib/haptics';

export default function HistoryListScreen() {
  const { isAuthenticated, user } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await getUserAnalyses({ limit: 50 });
      if (fetchErr) {
        setError(fetchErr);
      } else {
        setAnalyses(data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load analysis history.';
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchHistory();
    } else {
      setAnalyses([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, fetchHistory]);

  // Multi-device synchronization: Re-fetch history whenever screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?.id) {
        fetchHistory(true);
      }
    }, [isAuthenticated, user?.id, fetchHistory])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchHistory(true);
  }, [fetchHistory]);

  const handleOpenDetail = useCallback((item: AnalysisRow) => {
    hapticFeedback.selection();
    router.push({
      pathname: '/history/[id]',
      params: { id: item.id },
    });
  }, []);

  const handleDelete = useCallback((item: AnalysisRow) => {
    hapticFeedback.light();
    Alert.alert(
      'Delete Analysis',
      `Are you sure you want to remove "${item.destination}" from your cloud history? Associated places will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { success, error: delErr } = await deleteAnalysis(item.id);
            if (success) {
              hapticFeedback.success();
              setAnalyses((prev) => prev.filter((a) => a.id !== item.id));
            } else {
              Alert.alert('Error', delErr || 'Failed to delete analysis record.');
            }
          },
        },
      ]
    );
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const renderItem: ListRenderItem<AnalysisRow> = useCallback(
    ({ item }) => {
      const thumbnailUrl = resolveThumbnailUrl(item.thumbnail_url);
      const confidence = item.confidence ?? 0;
      const status =
        confidence >= 80 ? 'VERIFIED' : confidence >= 50 ? 'PARTIAL' : 'AI_UNVERIFIED';

      return (
        <Pressable
          onPress={() => handleOpenDetail(item)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Analysis for ${item.destination}`}
        >
          <View style={styles.cardHeader}>
            <View style={styles.thumbnailWrapper}>
              {thumbnailUrl ? (
                <Image
                  source={{ uri: thumbnailUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.thumbnailFallback}>
                  <Ionicons name="image-outline" size={24} color={Colors.textMuted} />
                </View>
              )}
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.destinationRow}>
                <Text style={styles.destinationName} numberOfLines={1}>
                  {item.destination}
                </Text>
                <IconButton
                  size={32}
                  variant="subtle"
                  accessibilityLabel="Delete analysis from history"
                  onPress={() => handleDelete(item)}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
                </IconButton>
              </View>

              {item.country && (
                <View style={styles.countryRow}>
                  <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.countryText} numberOfLines={1}>
                    {item.country}
                  </Text>
                </View>
              )}

              <View style={styles.cardFooter}>
                <ConfidenceBadge status={status} confidence={confidence} />
                <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [handleOpenDetail, handleDelete]
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>CLOUD PERSISTENCE</Text>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Analysis History</Text>
        {analyses.length > 0 && (
          <View style={styles.countBadge}>
            <Ionicons name="layers-outline" size={13} color={Colors.surfaceDark} />
            <Text style={styles.countText}>{analyses.length}</Text>
          </View>
        )}
      </View>
      <Text style={styles.subtitle}>
        Review past Reel analyses, inspected places, and saved travel intelligence.
      </Text>
    </View>
  );

  const handleBack = () => {
    hapticFeedback.light();
    router.back();
  };

  const handleSignIn = () => {
    hapticFeedback.selection();
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.screen}>
      <TopBar
        title="Analysis History"
        showBack
        onBackPress={handleBack}
        rightAction={
          isAuthenticated ? (
            <IconButton
              size={36}
              variant="subtle"
              accessibilityLabel="Refresh analysis history"
              onPress={() => handleRefresh()}
            >
              <Ionicons name="refresh-outline" size={18} color={Colors.textPrimary} />
            </IconButton>
          ) : null
        }
      />

      {!isAuthenticated ? (
        <View style={styles.guestContainer}>
          <EmptyState
            icon={<Ionicons name="cloud-offline-outline" size={36} color={Colors.textMuted} />}
            eyebrow="GUEST TRAVELER"
            title="Sign in to view history"
            description="Reel analyses are persisted to your personal cloud when you are signed in. Connect with Apple or Google to unlock cloud history."
            actionLabel="Sign In"
            onActionPress={handleSignIn}
          />
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.surfaceDark} />
          <Text style={styles.loadingText}>Loading analysis history...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <EmptyState
            icon={<Ionicons name="alert-circle-outline" size={36} color={Colors.error} />}
            eyebrow="CLOUD SYNC ERROR"
            title="Could not load history"
            description={error}
            actionLabel="Try Again"
            onActionPress={() => fetchHistory()}
          />
        </View>
      ) : analyses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={<Ionicons name="time-outline" size={36} color={Colors.textMuted} />}
            eyebrow="NO SAVED ANALYSES"
            title="No analysis history yet"
            description="When you analyze Instagram travel Reels while signed in, your travel intelligence dossiers will automatically appear here."
            actionLabel="Analyze a Reel"
            onActionPress={() => router.replace('/')}
          />
        </View>
      ) : (
        <FlatList
          data={analyses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
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
  eyebrow: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    ...Typography.h1,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.textPrimary,
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.sm + 4,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumbnailWrapper: {
    width: 76,
    height: 76,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
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
    backgroundColor: Colors.surfaceSubtle,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 76,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  destinationName: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.xs,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: 6,
  },
  countryText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dateText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textMuted,
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
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
  },
});
