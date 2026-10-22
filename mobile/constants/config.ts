/**
 * Travel AI — Mobile Configuration
 *
 * Centralized API and environment configuration.
 * Never hardcode localhost or secrets throughout components.
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

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

/**
 * Extracts the Metro / development host IP from Expo Constants.
 * When running in Expo Go or development client on a physical phone,
 * hostUri contains e.g. "10.71.100.184:8081".
 */
export function getDevHostIp(): string | null {
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })?.manifest2?.extra?.expoGo?.debuggerHost ||
      (Constants as unknown as { manifest?: { debuggerHost?: string } })?.manifest?.debuggerHost;

    if (!hostUri || typeof hostUri !== 'string') return null;
    const host = hostUri.split(':')[0]?.trim();
    if (!host || host === 'localhost' || host === '127.0.0.1') return null;
    return host;
  } catch {
    return null;
  }
}

export const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

  // 1. In development mode (__DEV__), provide seamless local development reachability
  if (__DEV__) {
    const isAndroid = Platform.OS === 'android';
    const isEmulator = !Device.isDevice;

    // A. Android Emulator requires 10.0.2.2 to access host machine loopback
    if (isAndroid && isEmulator) {
      if (envUrl) {
        if (envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
          return envUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
        }
        return envUrl;
      }
      return 'http://10.0.2.2:8000';
    }

    // B. Physical Device (Android or iOS):
    // If envUrl is explicitly provided with a LAN or public IP (not loopback), use it.
    if (Device.isDevice) {
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1') && !envUrl.includes('10.0.2.2')) {
        return envUrl;
      }
      // Dynamically detect Metro host IP from Expo Constants so physical devices on LAN connect automatically
      const hostIp = getDevHostIp();
      if (hostIp) {
        return `http://${hostIp}:8000`;
      }
      if (envUrl) {
        return envUrl;
      }
      return isAndroid ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
    }

    // C. iOS Simulator, Web, or non-device development
    if (envUrl) {
      return envUrl;
    }
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
