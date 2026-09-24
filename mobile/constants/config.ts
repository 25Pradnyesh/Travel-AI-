/**
 * Travel AI — Mobile Configuration
 *
 * Centralized API and environment configuration.
 * Never hardcode localhost or secrets throughout components.
 */

import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

  // 1. In development mode (__DEV__), provide seamless local loopback defaults
  if (__DEV__) {
    if (envUrl) {
      return envUrl;
    }
    // Android emulator uses 10.0.2.2 to access the host machine loopback
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    }
    // iOS simulator, web, and default fallback
    return 'http://localhost:8000';
  }

  // 2. In production release builds (!__DEV__), require an explicit non-loopback backend URL
  if (envUrl) {
    return envUrl;
  }

  // Production build with no EXPO_PUBLIC_API_URL configured:
  // Return empty string to prevent accidental loopback connection attempts.
  return '';
};

export const Config = {
  // Configured API base URL for FastAPI engine
  API_BASE_URL: getApiBaseUrl(),

  // Analysis timeout in milliseconds (180s to accommodate video downloading, OCR, Whisper & Gemini)
  ANALYSIS_TIMEOUT_MS: 180000,

  // Health check timeout in milliseconds
  HEALTH_TIMEOUT_MS: 5000,

  // App version matching package.json and app.json
  APP_VERSION: '1.0.0',

  // Application bundle identifier
  BUNDLE_ID: 'com.travelai.mobile',
} as const;

export default Config;
