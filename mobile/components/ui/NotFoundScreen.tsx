/**
 * VAMO — NotFoundScreen Component (404)
 *
 * Rendered when a route or requested resource does not exist.
 * Keeps the visual distinction clear: this is an uncharted route, not an internet disconnection.
 */

import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { TravelOceanError } from './TravelOceanError';

export interface NotFoundScreenProps {
  onNavigateHome?: () => void;
  style?: StyleProp<ViewStyle>;
  customMessage?: string;
}

export const NotFoundScreen: React.FC<NotFoundScreenProps> = ({
  onNavigateHome,
  style,
  customMessage,
}) => {
  const handleBackHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      router.replace('/' as any);
    }
  };

  return (
    <TravelOceanError
      mode="not-found"
      headline="Lost at sea?"
      supportingText={
        customMessage ||
        "We couldn't find the page you're looking for. Let's get you back on course."
      }
      statusLabel="404 • UNCHARTED ROUTE"
      homeLabel="Back to Home"
      onBackHome={handleBackHome}
      showHomeAction={true}
      style={style}
    />
  );
};

export default NotFoundScreen;
