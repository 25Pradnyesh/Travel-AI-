import React, { useCallback, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  AnalyzeButton,
  DiscoveryRow,
  HeroSection,
  HomeHeader,
  RecentSection,
  ReelInput,
} from '@/components/home';
import { Colors } from '@/constants/theme';
import { validateReelUrl } from '@/lib/utils';
import { hapticFeedback } from '@/lib/haptics';
import { analysisStore } from '@/lib/api/analysis-store';
import { AnalysisRow, getUserAnalyses, useAuth } from '@/lib/supabase';

const EXAMPLE_REELS = [
  {
    label: 'Alpine Lakes Reel',
    url: 'https://www.instagram.com/reel/C8xyzExample1/',
  },
  {
    label: 'Coastal Retreat Reel',
    url: 'https://www.instagram.com/reel/C9abcExample2/',
  },
];

export default function AnalyzeScreen() {
  const { isAuthenticated, user } = useAuth();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisRow[]>([]);

  // Multi-device and state synchronization: fetch recent analyses when authenticated
  const fetchRecent = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setRecentAnalyses([]);
      return;
    }
    try {
      const { data } = await getUserAnalyses({ limit: 3 });
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
    setUrl(exampleUrl);
    setError('');
  };

  const handleOpenAnalysis = (item: AnalysisRow) => {
    router.push({
      pathname: '/history/[id]',
      params: { id: item.id },
    });
  };

  const handleViewAllHistory = () => {
    router.push('/history');
  };

  const isFilled = url.trim().length > 0;

  return (
    <View style={styles.screen}>
      {/* Editorial Top Area */}
      <HomeHeader onPressHistory={handleViewAllHistory} />

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
            {/* Primary Editorial Hero */}
            <HeroSection />

            {/* Tactile Reel Input Surface */}
            <ReelInput
              value={url}
              onChangeText={handleTextChange}
              onSubmit={handleAnalyze}
              onClear={handleClear}
              error={error}
              disabled={isSubmitting}
            />

            {/* Primary Action CTA (Racing Red #EB2627) */}
            <AnalyzeButton
              onPress={handleAnalyze}
              loading={isSubmitting}
              isFilled={isFilled}
            />

            {/* Supporting Discovery Horizon & Demo Reels */}
            <DiscoveryRow
              exampleReels={EXAMPLE_REELS}
              onSelectExample={handleSelectExample}
            />

            {/* Compact Recent Discoveries or Quiet Empty State */}
            <RecentSection
              recentAnalyses={recentAnalyses}
              onOpenAnalysis={handleOpenAnalysis}
              onViewAllHistory={handleViewAllHistory}
            />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ivoryMist, // Dominant canvas #FBF4E3
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
});
