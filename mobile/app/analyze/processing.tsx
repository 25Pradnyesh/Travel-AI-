import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AtmosphereBackground, GlassView } from '@/components/ui';
import {
  ProcessingError,
  ProcessingHeader,
  ProcessingHero,
  ProcessingIndicator,
  ProcessingStages,
} from '@/components/processing';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { travelAiApi, classifyError } from '@/lib/api/travel-ai';
import { analysisStore } from '@/lib/api/analysis-store';
import { hapticFeedback } from '@/lib/haptics';
import { saveAnalysisToCloudHistory } from '@/lib/supabase';

import { useAtmosphere } from '@/context/AtmosphereContext';
import { useBackNavigation } from '@/lib/navigation';
import {
  useDemoMode,
  getActiveDemoScenario,
  isDemoModeActive,
  setActiveDemoScenario,
  DemoScenarioId,
} from '@/lib/demo/demo-mode';

function shortenReelUrl(fullUrl?: string): string {
  if (!fullUrl) return '';
  try {
    const cleaned = fullUrl.replace(/^https?:\/\/(www\.)?/, '');
    if (cleaned.length > 38) {
      return cleaned.slice(0, 35) + '...';
    }
    return cleaned;
  } catch {
    return fullUrl;
  }
}

export default function ProcessingScreen() {
  const insets = useSafeAreaInsets();
  const { resetActivePlace, setActivePlace } = useAtmosphere();
  const { url, scenarioId } = useLocalSearchParams<{ url?: string; scenarioId?: string }>();
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState<string>("Couldn't identify this place.");

  const abortControllerRef = useRef<AbortController | null>(null);
  const isAnalyzingRef = useRef(false);
  const { isDemoMode } = useDemoMode();

  const runAnalysis = useCallback(async (targetUrl: string) => {
    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;

    // Immediately purge active destination photo and previous analysis result to eliminate stale state leaks
    resetActivePlace();
    analysisStore.clearAnalysisResult();
    setIsLoading(true);
    setErrorMessage(null);
    setElapsedSeconds(0);
    setStageIndex(0);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (isDemoModeActive()) {
        if (scenarioId === 'jeju' || scenarioId === 'rome' || scenarioId === 'kyoto') {
          await setActiveDemoScenario(scenarioId as DemoScenarioId);
        }
        const scenario = getActiveDemoScenario();

        // Run ~6s authentic processing animation
        await new Promise((r) => setTimeout(r, 1500));
        setStageIndex(1);
        await new Promise((r) => setTimeout(r, 1700));
        setStageIndex(2);
        await new Promise((r) => setTimeout(r, 1600));
        setStageIndex(3);
        await new Promise((r) => setTimeout(r, 1200));

        // Crossfade background to the scenario photo as analysis completes
        if (scenario.data?.best_guess) {
          setActivePlace({
            place_id: scenario.primaryPlaceId,
            name: scenario.data.best_guess.name,
            city: scenario.data.best_guess.city,
            region: scenario.data.best_guess.region,
            country: scenario.data.best_guess.country,
            heroPhotoUrl: null,
          });
        }

        hapticFeedback.success();
        setIsLoading(false);
        analysisStore.setAnalysisResult(scenario.data, targetUrl);

        router.replace({
          pathname: '/analyze/results',
          params: { url: targetUrl, isDemo: 'true' },
        });
        return;
      }

      const response = await travelAiApi.analyzeReel(targetUrl, {
        signal: controller.signal,
      });

      // Handle application-level failure where HTTP = 200 but success = false
      if (!response.success) {
        hapticFeedback.medium();
        const errorDetail =
          response.error || 'No verified destination could be resolved from this Reel.';
        setErrorTitle(
          errorDetail.includes('No destination') || errorDetail.includes('unresolved')
            ? 'Destination Unresolved'
            : 'Analysis Incomplete'
        );
        setErrorMessage(errorDetail);
        setIsLoading(false);
        return;
      }

      // Check if destination could not be identified
      if (!response.best_guess || !response.best_guess.name) {
        hapticFeedback.medium();
        setErrorTitle('Destination Unresolved');
        setErrorMessage(
          response.error ||
            'We analyzed this reel, but could not detect definitive geographic coordinates or confirmed landmarks. Try another reel with recognizable scenery.'
        );
        setIsLoading(false);
        return;
      }

      // Successful destination match -> navigate to Results
      hapticFeedback.success();
      setIsLoading(false);

      // Automatically persist successful analysis to cloud history for authenticated users (non-blocking)
      saveAnalysisToCloudHistory(response, targetUrl).catch((historyErr) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[Processing] Background cloud history persistence warning:', historyErr);
        }
      });

      router.replace({
        pathname: '/analyze/results',
        params: { url: targetUrl },
      });
    } catch (err: unknown) {
      const errObj = err as Error | undefined;
      if (errObj?.name === 'AbortError' || errObj?.message === 'Request cancelled') {
        return;
      }

      hapticFeedback.medium();
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[PROCESSING] Analysis failed:', err);
      }
      const classification = classifyError(err);
      setErrorTitle(classification.title);
      setErrorMessage(classification.message);
      setIsLoading(false);
    } finally {
      isAnalyzingRef.current = false;
    }
  }, [resetActivePlace]);

  useEffect(() => {
    if (!url) {
      setErrorTitle('No Reel URL Provided');
      setErrorMessage('Please return to the Analyze screen and paste an Instagram Reel URL.');
      setIsLoading(false);
      return;
    }

    runAnalysis(url);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url, runAnalysis]);

  // Elapsed timer and realistic honest semantic stage transitions (no fake percentages)
  useEffect(() => {
    if (!isLoading) return;

    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // Map elapsed seconds to realistic semantic stages
        if (next < 8) {
          setStageIndex(0); // Reel received
        } else if (next < 20) {
          setStageIndex(1); // Inspecting scenery
        } else if (next < 38) {
          setStageIndex(2); // Resolving location
        } else {
          setStageIndex(3); // Building your dossier
        }
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, [isLoading]);

  const handleCancel = useCallback(() => {
    isAnalyzingRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    analysisStore.clearAnalysisResult();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({
        pathname: '/(tabs)',
        params: url ? { preserveUrl: url } : undefined,
      });
    }
  }, [url]);

  useBackNavigation('/(tabs)', handleCancel);

  const handleRetry = () => {
    if (url) {
      runAnalysis(url);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  // Reassurance notice triggers at 35s per rule
  const isLongRunning = elapsedSeconds >= 35;

  return (
    <AtmosphereBackground>
      {/* Top Header with Frosted Cancel Pill Top-Left and Frosted Timer Pill Top-Right */}
      <ProcessingHeader
        onCancel={handleCancel}
        elapsedSeconds={elapsedSeconds}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <>
            {/* Status Line: Instrument Serif Italic "Finding your place." */}
            <ProcessingHero isLongRunning={isLongRunning} />
            {isDemoMode && (
              <View style={styles.demoBadgeRow}>
                <Text style={styles.demoBadgeText}>Demo data</Text>
              </View>
            )}

            {/* Centered Large Reticle with Ivory strokes, Icy Blue sweep, and Racing Red center dot */}
            <ProcessingIndicator />

            {/* 4 Dark Glass Rows with done check, active pulsing dot, and pending hollow dot */}
            <ProcessingStages currentStageIndex={stageIndex} />
          </>
        ) : (
          /* Dark Glass Error Card (clear message + Retry + Back), no red walls */
          <ProcessingError
            title={errorTitle}
            message={errorMessage || 'An error occurred during analysis.'}
            onRetry={handleRetry}
            onCancel={handleCancel}
          />
        )}
      </ScrollView>

      {/* Bottom Frosted Glass Pill showing Shortened Reel URL */}
      {url ? (
        <View
          style={[
            styles.bottomPillWrapper,
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
          ]}
        >
          <GlassView
            variant="frosted"
            borderRadius={Radius.pill}
            style={styles.reelPill}
          >
            <Ionicons name="logo-instagram" size={14} color={Colors.icyBlue} />
            <Text numberOfLines={1} style={styles.reelUrlText}>
              {shortenReelUrl(url)}
            </Text>
          </GlassView>
        </View>
      ) : null}
    </AtmosphereBackground>
  );
}

const styles = StyleSheet.create({
  demoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(16, 25, 34, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 56, 0.45)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    gap: 6,
    marginTop: -8,
    marginBottom: Spacing.sm,
  },
  demoBadgeText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: '#f6d365',
    letterSpacing: 0.3,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 130,
  },
  bottomPillWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    pointerEvents: 'box-none',
  },
  reelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    gap: 8,
    maxWidth: 320,
  },
  reelUrlText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.ivoryMist,
    letterSpacing: -0.2,
  },
});
