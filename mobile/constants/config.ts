/**
 * Travel AI — Mobile Configuration
 *
 * Centralized API and environment configuration.
 * Never hardcode localhost or secrets throughout components.
 */

import { Platform } from 'react-native';

const getDevHost = () => {
  // If explicitly configured via Expo env variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // Android emulator uses 10.0.2.2 to access the host machine
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  // iOS simulator, web, and default fallback
  return 'http://localhost:8000';
};

export const Config = {
  // Default API base URL for FastAPI engine
  API_BASE_URL: getDevHost(),

  // Analysis timeout in milliseconds (180s to accommodate video downloading, OCR, Whisper & Gemini)
  ANALYSIS_TIMEOUT_MS: 180000,

  // Health check timeout in milliseconds
  HEALTH_TIMEOUT_MS: 5000,

  // App version
  APP_VERSION: '1.0.0',
} as const;

export default Config;
