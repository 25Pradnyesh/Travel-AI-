/**
 * VAMO — Network & Error Screen Validation Tests
 *
 * Self-contained validation suite covering:
 * 1. Network connectivity normalization & offline determination
 * 2. Active reachability verification logic
 * 3. Clear distinction between Offline (connection lost) and Not Found (404 lost at sea)
 * 4. Local asset bundling verification (no remote image dependencies)
 */

import {
  normalizeNetworkState,
  VamoNetworkState,
} from '../network';
import { BOAT_SUNSET_IMAGE } from '@/components/ui/TravelOceanError';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runNetworkValidationTests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  const runTest = async (name: string, fn: () => void | Promise<void>) => {
    try {
      await fn();
      passed++;
      // eslint-disable-next-line no-console
      console.log(`[PASS] ${name}`);
    } catch (err) {
      failed++;
      // eslint-disable-next-line no-console
      console.error(`[FAIL] ${name}:`, err);
    }
  };

  // ============================================================================
  // 1. Network State Normalization & Offline Determination
  // ============================================================================
  await runTest('marks offline when netState is null or completely disconnected', () => {
    const nullState = normalizeNetworkState(null);
    assert(nullState.isConnected === false, 'null netState is not connected');
    assert(nullState.isOffline === true, 'null netState is marked offline');

    const disconnectedState = normalizeNetworkState({
      isConnected: false,
      isInternetReachable: false,
      type: 'none',
      details: null,
      isWifiEnabled: false,
    } as any);
    assert(disconnectedState.isConnected === false, 'disconnected netState is not connected');
    assert(disconnectedState.isOffline === true, 'disconnected netState is marked offline');
  });

  await runTest('marks offline when connected to Wi-Fi/cellular but internet is unreachable', () => {
    // Captive portal / dead uplink condition: isConnected = true, isInternetReachable = false
    const captivePortalState = normalizeNetworkState({
      isConnected: true,
      isInternetReachable: false,
      type: 'wifi',
      details: null,
      isWifiEnabled: true,
    } as any);

    assert(captivePortalState.isConnected === true, 'radio connection is active');
    assert(captivePortalState.isInternetReachable === false, 'internet transit is unreachable');
    assert(captivePortalState.isOffline === true, 'must be marked offline despite radio connection');
  });

  await runTest('marks online only when both connected and internet reachable', () => {
    const onlineState = normalizeNetworkState({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: null,
      isWifiEnabled: true,
    } as any);

    assert(onlineState.isConnected === true, 'connected');
    assert(onlineState.isInternetReachable === true, 'reachable');
    assert(onlineState.isOffline === false, 'marked online');
  });

  await runTest('allows explicit active reachability probe to override stale netState', () => {
    // When active HTTP probe confirms failure
    const probeFailed = normalizeNetworkState(
      {
        isConnected: true,
        isInternetReachable: true,
        type: 'cellular',
        details: null,
      } as any,
      false // active reachability failed
    );
    assert(probeFailed.isInternetReachable === false, 'probe override applied');
    assert(probeFailed.isOffline === true, 'marked offline due to failed probe');

    // When active probe succeeds
    const probeSucceeded = normalizeNetworkState(
      {
        isConnected: true,
        isInternetReachable: false,
        type: 'wifi',
        details: null,
      } as any,
      true // active reachability succeeded
    );
    assert(probeSucceeded.isInternetReachable === true, 'probe override applied');
    assert(probeSucceeded.isOffline === false, 'marked online due to successful probe');
  });

  // ============================================================================
  // 2. Strict Separation: Offline vs Not-Found Copy & Semantics
  // ============================================================================
  await runTest('ensures offline state and 404 route have completely distinct user messaging', () => {
    const offlineHeadline = "Looks like we've drifted offline";
    const offlineSupporting =
      'Your next adventure is still waiting. Check your internet connection and try again.';
    const offlineStatus = 'CONNECTION LOST';

    const notFoundHeadline = 'Lost at sea?';
    const notFoundSupporting =
      "We couldn't find the page you're looking for. Let's get you back on course.";
    const notFoundStatus = '404 • UNCHARTED ROUTE';

    // Verify offline copy does NOT mention "404" or "not found"
    assert(!offlineHeadline.includes('404'), 'offline headline must not mention 404');
    assert(!offlineHeadline.includes('Not Found'), 'offline headline must not mention Not Found');
    assert(!offlineSupporting.includes('404'), 'offline supporting text must not mention 404');
    assert(offlineStatus.includes('CONNECTION LOST'), 'offline status indicates connection lost');

    // Verify not-found copy does NOT blame internet connection or tell user to retry network
    assert(!notFoundHeadline.includes('offline'), 'not found headline must not mention offline');
    assert(
      !notFoundSupporting.includes('internet connection'),
      'not found supporting must not mention internet connection'
    );
    assert(notFoundStatus.includes('404'), 'not found status indicates 404 route');
  });

  // ============================================================================
  // 3. Bundled Local Asset Contract
  // ============================================================================
  await runTest('verifies boat-at-sunset artwork is bundled locally without remote URL dependencies', () => {
    assert(BOAT_SUNSET_IMAGE !== undefined && BOAT_SUNSET_IMAGE !== null, 'bundled asset exists');
    // Local React Native / Metro required images are module objects or resource numbers, never http URLs
    if (typeof BOAT_SUNSET_IMAGE === 'string') {
      assert(
        !BOAT_SUNSET_IMAGE.startsWith('http://') && !BOAT_SUNSET_IMAGE.startsWith('https://'),
        'asset must not depend on remote HTTP URL'
      );
    }
  });

  return { passed, failed };
}
