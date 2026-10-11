/**
 * VAMO — Network Connectivity & Reachability Service
 *
 * Combines @react-native-community/netinfo and expo-network to provide:
 * 1. Native connection monitoring (Wi-Fi, cellular, none)
 * 2. Active internet reachability verification (not just carrier radio state)
 * 3. Graceful offline detection and debounced retry verification
 */

import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import * as Network from 'expo-network';
import { Config } from '@/constants/config';

export interface VamoNetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  isOffline: boolean;
  connectionType: string;
  isChecking: boolean;
  lastCheckedAt: number;
}

/**
 * Actively verifies whether device can reach the internet / backend.
 * Many devices are connected to Wi-Fi/cellular without actual internet transit
 * (e.g., captive portals, dead uplinks, airplane mode glitches).
 */
export async function testActualInternetReachability(timeoutMs = 4000): Promise<boolean> {
  // 1. First consult native Expo Network layer if available
  try {
    const expoState = await Network.getNetworkStateAsync();
    if (expoState.isConnected === false) {
      return false;
    }
  } catch {
    // Gracefully continue to ping verification
  }

  // 2. Ping configured backend or high-reliability endpoints
  const endpointsToTry: string[] = [];

  if (Config.API_BASE_URL) {
    endpointsToTry.push(`${Config.API_BASE_URL}/health`);
  }
  // Universal lightweight 204/health probes
  endpointsToTry.push('https://clients3.google.com/generate_204');
  endpointsToTry.push('https://cloudflare.com/cdn-cgi/trace');

  for (const url of endpointsToTry) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: { 'Cache-Control': 'no-cache' },
        signal: controller.signal,
      }).catch(() => {
        // Fallback to GET with small timeout if HEAD is blocked by CORS/proxy
        return fetch(url, {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' },
          signal: controller.signal,
        });
      });

      clearTimeout(timer);
      if (response && (response.ok || response.status === 204 || response.status === 200)) {
        return true;
      }
    } catch {
      clearTimeout(timer);
      // Try next endpoint
    }
  }

  return false;
}

/**
 * Normalizes NetInfo state into VAMO's simplified connectivity contract.
 */
export function normalizeNetworkState(
  netState: NetInfoState | null,
  activeReachability?: boolean
): VamoNetworkState {
  const isConnected = Boolean(netState?.isConnected);
  // If activeReachability is explicitly determined, prefer it; otherwise check netState
  const isInternetReachable =
    activeReachability !== undefined
      ? activeReachability
      : Boolean(netState?.isInternetReachable ?? isConnected);

  const isOffline = !isConnected || isInternetReachable === false;

  return {
    isConnected,
    isInternetReachable,
    isOffline,
    connectionType: netState?.type || 'unknown',
    isChecking: false,
    lastCheckedAt: Date.now(),
  };
}

/**
 * Subscribes to real-time network connectivity updates.
 */
export function subscribeToNetworkState(
  onChange: (state: VamoNetworkState) => void
): NetInfoSubscription {
  return NetInfo.addEventListener((netState) => {
    const isOffline = !netState.isConnected || netState.isInternetReachable === false;
    onChange({
      isConnected: Boolean(netState.isConnected),
      isInternetReachable: Boolean(netState.isInternetReachable ?? netState.isConnected),
      isOffline,
      connectionType: netState.type,
      isChecking: false,
      lastCheckedAt: Date.now(),
    });
  });
}
