/**
 * VAMO — OfflineScreen Component
 *
 * Full-screen offline state powered by the TravelOceanError sailboat composition.
 * Connects directly to the VAMO network hook to perform active reachability checks
 * and auto-restore when connection resumes.
 */

import React, { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useNetwork } from '@/hooks/useNetwork';
import { TravelOceanError } from './TravelOceanError';

export interface OfflineScreenProps {
  onRetrySuccess?: () => void;
  onNavigateHome?: () => void;
  style?: StyleProp<ViewStyle>;
  customNotice?: string | null;
  showHomeAction?: boolean;
}

export const OfflineScreen: React.FC<OfflineScreenProps> = ({
  onRetrySuccess,
  onNavigateHome,
  style,
  customNotice,
  showHomeAction = true,
}) => {
  const network = useNetwork();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryNotice, setRetryNotice] = useState<string | null>(null);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryNotice(null);

    try {
      // Force active probe against real endpoints
      const isReachable = await network.checkConnectivity(true);

      if (isReachable) {
        setRetryNotice(null);
        if (onRetrySuccess) {
          onRetrySuccess();
        } else if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/' as any);
        }
      } else {
        setRetryNotice('Still offline. Please check your Wi-Fi or cellular connection.');
        throw new Error('Still offline');
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const handleBackHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      router.replace('/' as any);
    }
  };

  return (
    <TravelOceanError
      mode="offline"
      headline="Looks like we've drifted offline"
      supportingText="Your next adventure is still waiting. Check your internet connection and try again."
      statusLabel="CONNECTION LOST"
      retryLabel="Try Again"
      homeLabel="Back to Home"
      onRetry={handleRetry}
      onBackHome={handleBackHome}
      showHomeAction={showHomeAction}
      isRetrying={isRetrying || network.isChecking}
      customNotice={customNotice || retryNotice}
      style={style}
    />
  );
};

export default OfflineScreen;
