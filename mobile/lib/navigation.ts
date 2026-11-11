import { useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { router } from 'expo-router';
import { hapticFeedback } from '@/lib/haptics';

/**
 * Shared safe back navigation helper.
 * If the navigation history contains a previous screen, pops back.
 * Otherwise, falls back to a sane route (default '/(tabs)').
 */
export function goBack(fallbackRoute: string = '/(tabs)'): void {
  hapticFeedback.light();
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackRoute as any);
  }
}

/**
 * Hook to wire both hardware back (Android) and provide a safe back handler
 * for header back buttons.
 *
 * @param fallbackRoute Route to replace with if no navigation history exists.
 * @param onBeforeBack Optional callback to run before navigating back (e.g. aborting requests).
 */
export function useBackNavigation(
  fallbackRoute: string = '/(tabs)',
  onBeforeBack?: () => void
): () => void {
  const handleBack = useCallback(() => {
    if (onBeforeBack) {
      onBeforeBack();
    }
    goBack(fallbackRoute);
    return true; // prevent default Android hardware back exit
  }, [fallbackRoute, onBeforeBack]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleBack();
        return true; // handled
      }
    );
    return () => subscription.remove();
  }, [handleBack]);

  return handleBack;
}

