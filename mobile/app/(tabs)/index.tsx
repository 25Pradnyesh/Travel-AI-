import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  GlassInput,
  PillChip,
  PosterCard,
} from '@/components/ui';
import { HomeHeader } from '@/components/home/HomeHeader';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { extractInstagramUrl, validateReelUrl } from '@/lib/utils';
import { hapticFeedback } from '@/lib/haptics';
import { analysisStore } from '@/lib/api/analysis-store';
import {
  AnalysisRow,
  getUserAnalyses,
  resolveThumbnailUrl,
  useAuth,
} from '@/lib/supabase';
import { useSavedPlaces } from '@/lib/storage/saved-places';
import { DemoScenarioId, useDemoMode } from '@/lib/demo/demo-mode';
import { DEMO_SCENARIOS } from '@/lib/fixtures/demo-scenarios';
import { logTap } from '@/lib/dev/tap-logger';
import { useAtmosphere } from '@/context/AtmosphereContext';

const SAMPLE_REEL = {
  label: 'Tokyo Street Reel',
  url: 'https://www.instagram.com/reel/C8xyzExample1/',
};

const DISCOVERY_CHIPS = [
  { label: 'Hidden Stays', icon: 'bed-outline' },
  { label: 'Viewpoints', icon: 'eye-outline' },
  { label: 'Beaches', icon: 'sunny-outline' },
  { label: 'Cafés', icon: 'cafe-outline' },
  { label: 'Mountain Escapes', icon: 'trail-sign-outline' },
] as const;

export default function AnalyzeScreen() {
  const insets = useSafeAreaInsets();
  const { preserveUrl } = useLocalSearchParams<{ preserveUrl?: string }>();
  const { width: screenWidth } = useWindowDimensions();
  const { isAuthenticated, user } = useAuth();
  const { savedPlaces, isSaved, toggleSave } = useSavedPlaces();
  const { isDemoMode, activeScenario, setScenarioId } = useDemoMode();
  const { resetActivePlace } = useAtmosphere();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisRow[]>([]);
  const [activeChip, setActiveChip] = useState<string>('Hidden Stays');

  // Resume homepage discovery slideshow when focusing Analyze screen in normal mode
  useFocusEffect(
    useCallback(() => {
      if (!isDemoMode) {
        resetActivePlace();
      }
    }, [isDemoMode, resetActivePlace])
  );

  // Restore preserved input URL on fallback from cancel/error
  useEffect(() => {
    if (preserveUrl) {
      setUrl(preserveUrl);
    }
  }, [preserveUrl]);

  // Carousel dimensions: card width ~72% so next card peeks in
  const cardWidth = Math.round(screenWidth * 0.72);
  const cardGap = Spacing.md;
  const snapInterval = cardWidth + cardGap;
  const scrollBottomPadding = 60 + Math.max(insets.bottom, 16) + Spacing.lg;

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
    // Clear inline error on edit
    if (error) setError('');

    if (isDemoMode) {
      const clean = text.replace(/\s+/g, ' ').slice(0, 300);
      setUrl(clean);
      return;
    }

    // If pasted text contains multiline content or an Instagram URL
    if (text.includes('\n') || text.includes('instagram.com') || text.length > 80) {
      const extracted = extractInstagramUrl(text);
      if (extracted) {
        setUrl(extracted);
        return;
      }
      // If pasted text has newlines or is non-URL junk (e.g. stack trace):
      if (text.includes('\n') || text.trim().length > 30) {
        // Do NOT insert the junk into the input, show inline error under the pill
        setError('No valid Instagram link found in pasted text.');
        return;
      }
    }

    // Collapse whitespace and cap at 300 chars
    const clean = text.replace(/\s+/g, ' ').slice(0, 300);
    setUrl(clean);
  };

  const handleSelectDemoScenario = useCallback(
    async (scenarioId: DemoScenarioId) => {
      logTap('AnalyzeScreen:DemoScenarioChip', { scenarioId });
      hapticFeedback.selection();
      await setScenarioId(scenarioId);
      const scenario = DEMO_SCENARIOS[scenarioId];
      router.push({
        pathname: '/analyze/processing',
        params: {
          url: scenario.sourceUrl,
          scenarioId: scenario.id,
          isDemo: 'true',
        },
      });
    },
    [setScenarioId]
  );

  const handleClear = () => {
    logTap('AnalyzeScreen:ClearInput');
    setUrl('');
    setError('');
  };

  const handleAnalyze = () => {
    logTap('AnalyzeScreen:AnalyzeButton', { url });
    if (isSubmitting) return;
    Keyboard.dismiss();

    const trimmed = url.trim();
    if (!trimmed) {
      hapticFeedback.medium();
      setError('Paste an Instagram Reel link first.');
      return;
    }

    let targetUrl = trimmed;

    if (!isDemoMode) {
      const validation = validateReelUrl(trimmed);
      if (!validation.isValid) {
        hapticFeedback.medium();
        setError(validation.error || 'Enter a valid public Instagram Reel link.');
        return;
      }
      targetUrl = validation.normalizedUrl || trimmed;
    } else {
      targetUrl = trimmed.startsWith('http') ? trimmed : `https://instagram.com/reel/demo_${encodeURIComponent(trimmed)}`;
    }
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
    logTap('AnalyzeScreen:SampleReelLink', { url: exampleUrl });
    hapticFeedback.selection();
    setUrl(exampleUrl);
    setError('');
  };

  const handleOpenAnalysis = (item: AnalysisRow) => {
    logTap('AnalyzeScreen:OpenAnalysisCard', { id: item.id });
    router.push({
      pathname: '/history/[id]',
      params: { id: item.id },
    });
  };

  const handleOpenSavedPlace = (placeId: string) => {
    logTap('AnalyzeScreen:OpenSavedPlace', { placeId });
    router.push({
      pathname: '/place/[id]',
      params: { id: placeId },
    });
  };

  const handleViewAllHistory = () => {
    logTap('AnalyzeScreen:ViewAllHistory');
    hapticFeedback.light();
    router.push({ pathname: '/(tabs)/saved', params: { tab: 'history' } });
  };

  const handleOpenProfile = () => {
    logTap('AnalyzeScreen:OpenProfile');
    hapticFeedback.light();
    router.push('/profile');
  };

  // Combine real recent analyses & saved places for the "In Focus" carousel
  const inFocusItems = useMemo(() => {
    const items: {
      id: string;
      title: string;
      subtitle: string;
      imageUrl: string | null;
      category: string;
      isSavedPlace: boolean;
      originalItem: any;
    }[] = [];

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
    <View style={styles.container}>
      {/* Top Editorial Header (history clock removed per rule 7) */}
      <HomeHeader
        onPressProfile={handleOpenProfile}
        userName={userGreetingName}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: scrollBottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
            {/* Editorial Greeting & Display Headline */}
            <View style={styles.heroSection}>
              {userGreetingName ? (
                <View style={styles.userGreetingPill}>
                  <Ionicons name="sparkles" size={11} color={Colors.icyBlue} />
                  <Text style={styles.userGreeting}>
                    Hello, {userGreetingName}
                  </Text>
                </View>
              ) : null}

              {/* 56-58px Display headline: Inter Bold + Instrument Serif Italic */}
              <Text style={styles.displayHeadline}>
                Drop a reel.
              </Text>
              <Text style={styles.displayItalicAccent}>
                Find the place.
              </Text>

              {/* Ivory subtitle on darkened zone (>= 6.13:1 contrast) */}
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
                onError={setError}
                error={error}
                loading={isSubmitting}
                disabled={isSubmitting}
                placeholder={isDemoMode ? "Paste any link to replay demo..." : "Paste Instagram Reel link"}
              />

              {/* Demo Mode 3-Chip Chooser or Default Sample Reel Link */}
              {isDemoMode ? (
                <View style={styles.demoChipsSection}>
                  <Text style={styles.demoChipsLabel}>DEMO DESTINATIONS (OFFLINE)</Text>
                  <View style={styles.demoChipsRow}>
                    {([
                      { id: 'jeju' as const, label: 'Jeju Island' },
                      { id: 'rome' as const, label: 'Rome' },
                      { id: 'kyoto' as const, label: 'Kyoto' },
                    ]).map((chip) => {
                      const isSelected = activeScenario.id === chip.id;
                      return (
                        <Pressable
                          key={chip.id}
                          onPress={() => handleSelectDemoScenario(chip.id)}
                          hitSlop={6}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Run demo scenario for ${chip.label}`}
                          style={({ pressed }) => [
                            styles.demoChip,
                            isSelected && styles.demoChipSelected,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.demoChipText,
                              isSelected && styles.demoChipTextSelected,
                            ]}
                          >
                            {chip.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : (
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
              )}
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

            {/* "In Focus" Poster Carousel Section - only shown when real recents or saved places exist */}
            {hasInFocus ? (
              <View style={styles.focusSection}>
                <View style={styles.focusHeaderRow}>
                  <Text style={styles.focusTitle}>
                    In <Text style={styles.focusTitleItalic}>Focus</Text>
                  </Text>
                  <Pressable
                    onPress={handleViewAllHistory}
                    hitSlop={8}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="View all recent destinations"
                  >
                    <Text style={styles.viewAllText}>View All</Text>
                  </Pressable>
                </View>

                {/* Horizontal FlatList Carousel with ~72% card peek */}
                <FlatList
                  data={inFocusItems}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={snapInterval}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  contentContainerStyle={[
                    styles.focusCarousel,
                    { paddingRight: screenWidth - cardWidth },
                  ]}
                  renderItem={({ item }) => (
                    <View style={{ width: cardWidth, marginRight: cardGap }}>
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
                  )}
                />
              </View>
            ) : null}
          </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110, // Generous padding so floating tab bar never obscures content
    flexGrow: 1,
  },
  heroSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  userGreetingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(8, 18, 24, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    gap: 6,
    marginBottom: Spacing.sm,
  },
  userGreeting: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.ivoryMist,
    letterSpacing: 0.3,
  },
  displayHeadline: {
    fontFamily: Fonts.sansBold,
    fontSize: 56,
    lineHeight: 58,
    color: Colors.ivoryMist,
    letterSpacing: -1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  displayItalicAccent: {
    fontFamily: Fonts.serifItalic,
    fontSize: 58,
    lineHeight: 62,
    color: Colors.ivoryMist,
    letterSpacing: -0.5,
    marginTop: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroDescription: {
    fontFamily: Fonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.ivoryMist,
    marginTop: Spacing.md,
    maxWidth: 320,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
  demoChipsSection: {
    marginTop: Spacing.md,
  },
  demoChipsLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#f6d365',
    marginBottom: Spacing.xs,
  },
  demoChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 25, 34, 0.80)',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 56, 0.35)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    gap: 6,
  },
  demoChipSelected: {
    backgroundColor: 'rgba(232, 168, 56, 0.18)',
    borderColor: '#e8a838',
  },
  demoChipText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.ivoryMist,
  },
  demoChipTextSelected: {
    fontFamily: Fonts.sansBold,
    color: '#f6d365',
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
    color: Colors.ivoryMist,
  },
  viewAllText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.icyBlue,
  },
  focusCarousel: {
    paddingLeft: Spacing.xl,
  },
  emptyContainer: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'flex-start',
  },
  emptyCaption: {
    fontFamily: Fonts.sansRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'left',
    marginTop: Spacing.sm + 2,
    maxWidth: 280,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
