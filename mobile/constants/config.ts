/**
 * Travel AI — Mobile Configuration
 *
 * Centralized API and environment configuration.
 * Never hardcode localhost or secrets throughout components.
 */

import { Platform } from 'react-native';

/**
 * Detects whether a URL points to local loopback, private LAN addresses, or insecure HTTP.
 */
export function isDevelopmentOrLoopbackUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return true;
  const lower = url.trim().toLowerCase();

  if (
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('10.0.2.2') ||
    lower.includes('0.0.0.0')
  ) {
    return true;
  }

  // Private RFC 1918 / link-local LAN patterns
  if (
    /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(lower) ||
    /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}/.test(lower) ||
    /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}/.test(lower) ||
    /^https?:\/\/169\.254\.\d{1,3}\.\d{1,3}/.test(lower)
  ) {
    return true;
  }

  return false;
}

/**
 * Validates whether an API URL is suitable for production releases.
 * Requires HTTPS and a public domain or non-loopback host.
 */
export function isValidProductionApiUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();

  // Must begin with https:// in production builds
  if (!lower.startsWith('https://')) {
    return false;
  }

  return !isDevelopmentOrLoopbackUrl(lower);
}

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

  // 2. In production release builds (!__DEV__), require an explicit non-loopback HTTPS backend URL
  if (envUrl) {
    if (isValidProductionApiUrl(envUrl)) {
      return envUrl;
    }
    // eslint-disable-next-line no-console
    console.error(
      '[Travel AI Production Guard] Insecure, private IP, or loopback EXPO_PUBLIC_API_URL rejected for production release: ' +
        envUrl +
        '. Production builds require a valid public HTTPS endpoint.'
    );
    return '';
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

  // Supabase Cloud Configuration (Stage 1 V2)
  SUPABASE: {
    URL: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '',
    ANON_KEY: (
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      ''
    ).trim(),
  },
} as const;

export default Config;
