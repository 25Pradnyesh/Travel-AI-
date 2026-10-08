import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ProcessingError,
  ProcessingHeader,
  ProcessingHero,
  ProcessingIndicator,
  ProcessingStages,
} from '@/components/processing';
import { Colors, Spacing } from '@/constants/theme';
import { travelAiApi, getFriendlyErrorMessage } from '@/lib/api/travel-ai';
import { analysisStore } from '@/lib/api/analysis-store';
import { hapticFeedback } from '@/lib/haptics';
import { saveAnalysisToCloudHistory } from '@/lib/supabase';

export default function ProcessingScreen() {
  const { url } = useLocalSearchParams<{ url?: string }>();
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState<string>("Couldn't identify this place.");

  const abortControllerRef = useRef<AbortController | null>(null);
  const isAnalyzingRef = useRef(false);

  const runAnalysis = useCallback(async (targetUrl: string) => {
    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;

    // Immediately purge previous analysis result to eliminate stale state leaks
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
            'We analyzed the visual frames and caption context of this reel, but could not detect definitive geographic coordinates or confirmed landmarks. Try another reel with recognizable scenery.'
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

  // Elapsed timer and realistic semantic stage transitions
  useEffect(() => {
    if (!isLoading) return;

    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // Map elapsed seconds to realistic semantic stages
        if (next < 8) {
          setStageIndex(0); // Reel Received
        } else if (next < 22) {
          setStageIndex(1); // Inspecting Scenery
        } else if (next < 40) {
          setStageIndex(2); // Resolving Location
        } else {
          setStageIndex(3); // Building Your Dossier
        }
        return next;
      });
    }, 1000);

    return () => {
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

  const isLongRunning = elapsedSeconds >= 30;

  return (
    <View style={styles.screen}>
      <ProcessingHeader onCancel={handleCancel} url={url} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <>
            {/* Editorial Processing Hero */}
            <ProcessingHero isLongRunning={isLongRunning} />

            {/* Travel-Oriented Cartographic Radar Viewfinder */}
            <ProcessingIndicator />

            {/* Semantic Processing Progression Stages */}
            <ProcessingStages currentStageIndex={stageIndex} />
          </>
        ) : (
          /* Editorial Error Recovery State */
          <ProcessingError
            title={errorTitle}
            message={errorMessage || 'An error occurred during analysis.'}
            onRetry={handleRetry}
            onCancel={handleCancel}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ivoryMist, // Dominant canvas background #FBF4E3
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.huge,
  },
});
