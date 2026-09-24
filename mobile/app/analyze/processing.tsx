import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ErrorState, LoadingState, TopBar } from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { travelAiApi, getFriendlyErrorMessage } from '@/lib/api/travel-ai';
import { analysisStore } from '@/lib/api/analysis-store';
import { hapticFeedback } from '@/lib/haptics';

const STAGE_MESSAGES = [
  {
    title: 'Ingesting Reel media...',
    subtitle: 'Extracting video frames, on-screen text, audio & creator metadata.',
  },
  {
    title: 'Analyzing location clues...',
    subtitle: 'Multimodal analysis of speech transcription, OCR & landmark visuals.',
  },
  {
    title: 'Resolving geographic candidates...',
    subtitle: 'Matching coordinates and directory records via Google Places.',
  },
  {
    title: 'Synthesizing travel intelligence...',
    subtitle: 'Curating seasonality windows, daily budget & surrounding points of interest.',
  },
];

export default function ProcessingScreen() {
  const { url } = useLocalSearchParams<{ url?: string }>();
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState<string>('Analysis Unavailable');

  const abortControllerRef = useRef<AbortController | null>(null);
  const isAnalyzingRef = useRef(false);
  const reassuranceFade = useRef(new Animated.Value(0)).current;

  const runAnalysis = useCallback(async (targetUrl: string) => {
    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;

    // Immediately purge any previous analysis result to eliminate stale state leaks
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
            'We analyzed the visual frames, audio speech, and caption context of this Reel, but could not detect definitive geographic coordinates or confirmed landmarks.'
        );
        setIsLoading(false);
        return;
      }

      // Successful destination match -> navigate to Results
      hapticFeedback.success();
      setIsLoading(false);
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
        console.warn('[PROCESSING] Analysis failed:', err);
      }
      const friendlyMsg = getFriendlyErrorMessage(err);

      if (friendlyMsg.includes('timed out')) {
        setErrorTitle('Analysis Timed Out');
      } else if (friendlyMsg.includes('unreachable') || friendlyMsg.includes('network')) {
        setErrorTitle('Engine Unreachable');
      } else if (friendlyMsg.includes('could not be accessed')) {
        setErrorTitle('Reel Inaccessible');
      } else {
        setErrorTitle('Analysis Incomplete');
      }

      setErrorMessage(friendlyMsg);
      setIsLoading(false);
    } finally {
      isAnalyzingRef.current = false;
    }
  }, []);

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

  // Stage message rotation & elapsed timer
  useEffect(() => {
    if (!isLoading) return;

    const messageInterval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGE_MESSAGES.length);
    }, 6000);

    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(timerInterval);
    };
  }, [isLoading]);

  const handleCancel = () => {
    isAnalyzingRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    analysisStore.clearAnalysisResult();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleRetry = () => {
    if (url) {
      runAnalysis(url);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const currentStage = STAGE_MESSAGES[stageIndex];
  const isLongRunning = elapsedSeconds >= 35;

  useEffect(() => {
    if (isLongRunning) {
      Animated.timing(reassuranceFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      reassuranceFade.setValue(0);
    }
  }, [isLongRunning, reassuranceFade]);

  return (
    <View style={styles.screen}>
      <TopBar
        title={isLoading ? 'Processing Reel' : 'Analysis Status'}
        showBack
        onBackPress={handleCancel}
      />

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingWrapper}>
            <LoadingState
              title={currentStage.title}
              subtitle={currentStage.subtitle}
              onCancel={handleCancel}
              cancelLabel="Cancel Analysis"
            />

            {/* Elapsed Time & Cold Start Reassurance */}
            <View style={styles.telemetryCard}>
              <View style={styles.elapsedRow}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.elapsedText}>
                  {elapsedSeconds > 0 ? `Elapsed: ${elapsedSeconds}s` : 'Connecting to engine...'}
                </Text>
              </View>

              {isLongRunning && (
                <Animated.View style={[styles.reassuranceRow, { opacity: reassuranceFade }]}>
                  <Ionicons name="information-circle-outline" size={14} color={Colors.info} />
                  <Text style={styles.reassuranceText}>
                    Multimodal analysis and Google Places resolution can take up to 60–90 seconds
                    during heavy video processing or initial cold start.
                  </Text>
                </Animated.View>
              )}
            </View>
          </View>
        ) : (
          <ErrorState
            title={errorTitle}
            message={errorMessage || 'An error occurred during analysis.'}
            retryLabel="Try Again"
            onRetry={handleRetry}
            cancelLabel="Go Back"
            onCancel={handleCancel}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  content: {
    flex: 1,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  telemetryCard: {
    width: '100%',
    maxWidth: 360,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  elapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  elapsedText: {
    ...Typography.mono,
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },
  reassuranceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.infoSurface,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  reassuranceText: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
    marginLeft: Spacing.xs,
    lineHeight: 16,
  },
});
