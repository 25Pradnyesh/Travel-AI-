import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  AtmosphereBackground,
  GlassInput,
  PillChip,
  PosterCard,
} from '@/components/ui';
import { HomeHeader } from '@/components/home/HomeHeader';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { validateReelUrl } from '@/lib/utils';
import { hapticFeedback } from '@/lib/haptics';
import { analysisStore } from '@/lib/api/analysis-store';
import {
  AnalysisRow,
  getUserAnalyses,
  resolveThumbnailUrl,
  useAuth,
} from '@/lib/supabase';
import { useSavedPlaces } from '@/lib/storage/saved-places';

const SAMPLE_REEL = {
  label: 'Alpine Lakes Reel',
  url: 'https://www.instagram.com/reel/C8xyzExample1/',
  destination: 'Dolomites Alpine Lake',
  country: 'South Tyrol · Italy',
  photoUrl:
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
};

const DISCOVERY_CHIPS = [
  { label: 'Hidden Stays', icon: 'bed-outline' },
  { label: 'Viewpoints', icon: 'eye-outline' },
  { label: 'Beaches', icon: 'sunny-outline' },
  { label: 'Cafés', icon: 'cafe-outline' },
  { label: 'Mountain Escapes', icon: 'trail-sign-outline' },
] as const;

export default function AnalyzeScreen() {
  const { isAuthenticated, user } = useAuth();
  const { savedPlaces, isSaved, toggleSave } = useSavedPlaces();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisRow[]>([]);
  const [activeChip, setActiveChip] = useState<string>('Hidden Stays');

  // Greet by real user name only if signed in, otherwise drop greeting completely
  const userGreetingName = useMemo(() => {
    if (!isAuthenticated || !user) return null;
    const fullName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split('@')[0] ||
      null;
    if (!fullName) return null;
    // Extract first name
    return fullName.trim().split(' ')[0];
  }, [isAuthenticated, user]);

  // Synchronize recent cloud analyses for authenticated users
  const fetchRecent = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setRecentAnalyses([]);
      return;
    }
    try {
      const { data } = await getUserAnalyses({ limit: 6 });
      if (data) {
        setRecentAnalyses(data);
      }
    } catch {
      // Quiet fallback
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  useFocusEffect(
    useCallback(() => {
      fetchRecent();
    }, [fetchRecent])
  );

  const handleTextChange = (text: string) => {
    setUrl(text);
    if (error) setError('');
  };

  const handleClear = () => {
    setUrl('');
    setError('');
  };

  const handleAnalyze = () => {
    if (isSubmitting) return;
    Keyboard.dismiss();

    const trimmed = url.trim();
    if (!trimmed) {
      hapticFeedback.medium();
      setError('Paste an Instagram Reel link first.');
      return;
    }

    const validation = validateReelUrl(trimmed);

    if (!validation.isValid) {
      hapticFeedback.medium();
      setError(validation.error || 'Enter a valid public Instagram Reel link.');
      return;
    }

    const targetUrl = validation.normalizedUrl || trimmed;
    hapticFeedback.light();
    setError('');
    setIsSubmitting(true);

    // Clear stale analysis state so results from a previous Reel cannot leak
    analysisStore.clearAnalysisResult();

    // Transition cleanly to processing route
    setTimeout(() => {
      setIsSubmitting(false);
      router.push({
        pathname: '/analyze/processing',
        params: { url: targetUrl },
      });
    }, 200);
  };

  const handleSelectExample = (exampleUrl: string) => {
    hapticFeedback.selection();
    setUrl(exampleUrl);
    setError('');
  };

  const handleOpenAnalysis = (item: AnalysisRow) => {
    router.push({
      pathname: '/history/[id]',
      params: { id: item.id },
    });
  };

  const handleOpenSavedPlace = (placeId: string) => {
    router.push({
      pathname: '/place/[id]',
      params: { id: placeId },
    });
  };

  const handleViewAllHistory = () => {
    hapticFeedback.light();
    router.push('/history');
  };

  const handleOpenProfile = () => {
    hapticFeedback.light();
    router.push('/(tabs)/profile');
  };

  // Combine real recent analyses & saved places for the "In Focus" carousel
  const inFocusItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      imageUrl: string | null;
      category: string;
      isSavedPlace: boolean;
      originalItem: any;
    }> = [];

    // Prioritize recent analyses
    recentAnalyses.forEach((a) => {
      items.push({
        id: a.id,
        title: a.destination,
        subtitle: a.country || 'Verified Location',
        imageUrl: resolveThumbnailUrl(a.thumbnail_url),
        category: a.confidence && a.confidence >= 80 ? 'Verified' : 'Analysis',
        isSavedPlace: false,
        originalItem: a,
      });
    });

    // Append bookmarked saved places if available
    savedPlaces.forEach((sp) => {
      if (!items.some((existing) => existing.title.toLowerCase() === sp.name.toLowerCase())) {
        items.push({
          id: sp.id,
          title: sp.name,
          subtitle: sp.address || 'Saved Destination',
          imageUrl: sp.photo || null,
          category: sp.category || 'Saved',
          isSavedPlace: true,
          originalItem: sp,
        });
      }
    });

    return items;
  }, [recentAnalyses, savedPlaces]);

  const hasInFocus = inFocusItems.length > 0;

  return (
    <AtmosphereBackground variant="sky">
      {/* Top Editorial Header */}
      <HomeHeader
        onPressHistory={handleViewAllHistory}
        onPressProfile={handleOpenProfile}
        userName={userGreetingName}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Editorial Greeting & Display Headline */}
            <View style={styles.heroSection}>
              {userGreetingName ? (
                <Text style={styles.userGreeting}>
                  Hello, {userGreetingName}
                </Text>
              ) : null}

              <Text style={styles.displayHeadline}>
                Drop a reel.{'\n'}
                <Text style={styles.displayItalicAccent}>Find the place.</Text>
              </Text>

              <Text style={styles.heroDescription}>
                Paste an Instagram travel reel to discover where it was filmed.
              </Text>
            </View>

            {/* Translucent Glass Input with embedded paste & send CTA */}
            <View style={styles.inputWrapper}>
              <GlassInput
                value={url}
                onChangeText={handleTextChange}
                onSubmit={handleAnalyze}
                onClear={handleClear}
                error={error}
                loading={isSubmitting}
                disabled={isSubmitting}
                placeholder="Paste Instagram Reel link"
              />

              {/* Collapsed Secondary Sample Reel Link */}
              <Pressable
                onPress={() => handleSelectExample(SAMPLE_REEL.url)}
                hitSlop={8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Try sample reel link"
                style={({ pressed }) => [styles.sampleLinkPill, pressed && styles.pressed]}
              >
                <Ionicons name="sparkles-outline" size={13} color={Colors.icyBlue} />
                <Text style={styles.sampleLinkText}>
                  Or try sample: <Text style={styles.sampleHighlight}>{SAMPLE_REEL.label}</Text>
                </Text>
              </Pressable>
            </View>

            {/* Discovery Category Pill Chips */}
            <View style={styles.chipsSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {DISCOVERY_CHIPS.map((chip) => {
                  const isSelected = activeChip === chip.label;
                  return (
                    <PillChip
                      key={chip.label}
                      label={chip.label}
                      selected={isSelected}
                      onPress={() => setActiveChip(chip.label)}
                      icon={
                        <Ionicons
                          name={chip.icon as any}
                          size={13}
                          color={isSelected ? Colors.ivoryMist : Colors.textSecondary}
                        />
                      }
                    />
                  );
                })}
              </ScrollView>
            </View>

            {/* "In Focus" Poster Carousel Section */}
            <View style={styles.focusSection}>
              <View style={styles.focusHeaderRow}>
                <Text style={styles.focusTitle}>
                  In <Text style={styles.focusTitleItalic}>Focus</Text>
                </Text>
                {hasInFocus ? (
                  <Pressable
                    onPress={handleViewAllHistory}
                    hitSlop={8}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="View all recent destinations"
                  >
                    <Text style={styles.viewAllText}>View All</Text>
                  </Pressable>
                ) : null}
              </View>

              {hasInFocus ? (
                /* Horizontal Carousel of Poster Cards */
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.focusCarousel}
                >
                  {inFocusItems.map((item) => (
                    <View key={item.id} style={styles.posterWrapper}>
                      <PosterCard
                        title={item.title}
                        subtitle={item.subtitle}
                        imageUrl={item.imageUrl}
                        category={item.category}
                        isSaved={isSaved(item.id)}
                        onPress={() => {
                          if (item.isSavedPlace) {
                            handleOpenSavedPlace(item.id);
                          } else {
                            handleOpenAnalysis(item.originalItem);
                          }
                        }}
                        onToggleSave={() => {
                          if (item.isSavedPlace) {
                            toggleSave(item.originalItem, item.imageUrl || undefined);
                          } else {
                            toggleSave(
                              {
                                place_id: item.id,
                                name: item.title,
                                formatted_address: item.subtitle,
                              } as any,
                              item.imageUrl || undefined
                            );
                          }
                        }}
                      />
                    </View>
                  ))}
                </ScrollView>
              ) : (
                /* Designed Empty State: Single Featured Sample Reel Poster Card */
                <View style={styles.emptyContainer}>
                  <View style={styles.samplePosterWrapper}>
                    <PosterCard
                      title={SAMPLE_REEL.destination}
                      subtitle={SAMPLE_REEL.country}
                      imageUrl={SAMPLE_REEL.photoUrl}
                      category="Sample Discovery"
                      isSaved={isSaved('sample_dolomites')}
                      onPress={() => handleSelectExample(SAMPLE_REEL.url)}
                      onToggleSave={() => {}}
                    />
                  </View>
                  <Text style={styles.emptyCaption}>
                    Tap to analyze this sample reel or paste any travel reel above.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </AtmosphereBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110, // Generous padding so floating tab bar never obscures content
    flexGrow: 1,
  },
  heroSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  userGreeting: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.icyBlue,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  displayHeadline: {
    fontFamily: Fonts.sansBold,
    fontSize: 34,
    lineHeight: 40,
    color: Colors.ivoryMist,
    letterSpacing: -0.9,
  },
  displayItalicAccent: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    color: Colors.ivoryMist,
  },
  heroDescription: {
    fontFamily: Fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    maxWidth: 320,
  },
  inputWrapper: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sampleLinkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(8, 18, 24, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.25)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 6,
    marginTop: Spacing.md,
  },
  sampleLinkText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sampleHighlight: {
    color: Colors.ivoryMist,
    fontFamily: Fonts.sansSemiBold,
  },
  chipsSection: {
    marginBottom: Spacing.xl,
  },
  chipsScroll: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  focusSection: {
    marginTop: Spacing.xs,
  },
  focusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  focusTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 20,
    color: Colors.ivoryMist,
    letterSpacing: -0.3,
  },
  focusTitleItalic: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    color: Colors.ivoryMist,
  },
  viewAllText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.icyBlue,
  },
  focusCarousel: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  posterWrapper: {
    width: 200,
  },
  emptyContainer: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  samplePosterWrapper: {
    width: '100%',
    maxWidth: 280,
  },
  emptyCaption: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm + 2,
    maxWidth: 260,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
