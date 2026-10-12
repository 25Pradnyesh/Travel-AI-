import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Dynamic Expo Configuration for VAMO Mobile Client
 *
 * Reads Android Google Maps API Key securely from environment:
 * - process.env.GOOGLE_MAPS_ANDROID_API_KEY
 * - Never committed to version control
 * - Configured via EAS Secret for development client / cloud builds:
 *   eas secret:create --scope project --name GOOGLE_MAPS_ANDROID_API_KEY --value <KEY>
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY || '';

  return {
    ...config,
    name: config.name || 'Travel AI',
    slug: config.slug || 'travel-ai',
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        ...(googleMapsApiKey
          ? {
              googleMaps: {
                apiKey: googleMapsApiKey,
              },
            }
          : {}),
      },
    },
  };
};
