/**
 * VAMO — OfflineGuard
 *
 * Global network connectivity watcher rendered in RootLayout.
 * When real internet disconnection is detected, seamlessly presents the
 * cinematic sunset sailboat offline screen over active views, and automatically
 * restores the previous application screen when network connectivity resumes.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useNetwork } from '@/hooks/useNetwork';
import { OfflineScreen } from './OfflineScreen';

export const OfflineGuard: React.FC = () => {
  const { isOffline, isSimulatedOffline } = useNetwork();
  const [isDismissed, setIsDismissed] = useState(false);
  const pathname = usePathname();

  // Reset dismissed state whenever connectivity is restored,
  // so future disconnections will trigger the offline guard again.
  useEffect(() => {
    if (!isOffline) {
      setIsDismissed(false);
    }
  }, [isOffline]);

  // Don't render overlay if we are explicitly on the standalone /offline route
  // or on +not-found, or if user dismissed to browse saved offline content.
  if (!isOffline || isDismissed || pathname === '/offline') {
    return null;
  }

  const handleRetrySuccess = () => {
    setIsDismissed(true);
  };

  const handleNavigateHome = () => {
    setIsDismissed(true);
    router.replace('/' as any);
  };

  return (
    <View style={styles.overlayContainer} pointerEvents="auto">
      <OfflineScreen
        onRetrySuccess={handleRetrySuccess}
        onNavigateHome={handleNavigateHome}
        showHomeAction={pathname !== '/' && pathname !== '/(tabs)'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
  },
});

export default OfflineGuard;
