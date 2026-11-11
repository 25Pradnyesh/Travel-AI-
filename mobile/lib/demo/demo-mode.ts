/**
 * VAMO Mobile — In-App Demo Mode Engine
 *
 * Provides persistent toggle, scenario management, and strict data isolation:
 * - Hidden activation: 5 taps on version in Profile > About
 * - Persistent storage via AsyncStorage (@travel_ai_demo_mode_v1)
 * - Zero network execution (offline airplane mode presentation)
 * - 3 golden pre-analyzed scenarios (Jeju, Lake Como, Kyoto)
 * - Strict isolation: demo entries are tagged so real Saved & History entries are never mixed
 */

import { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_SCENARIOS, DemoScenario } from '@/lib/fixtures/demo-scenarios';
import { analysisStore } from '@/lib/api/analysis-store';
import { hapticFeedback } from '@/lib/haptics';

const DEMO_STORAGE_KEY = '@travel_ai_demo_mode_v1';
const DEMO_SCENARIO_KEY = '@travel_ai_demo_scenario_v1';
const RECORDING_MODE_STORAGE_KEY = '@travel_ai_recording_mode_v1';
export const DEMO_TAG = '__demo_mode__';

export type DemoScenarioId = 'jeju' | 'rome' | 'kyoto';

let isDemoModeCache = false;
let activeScenarioIdCache: DemoScenarioId = 'jeju';
let isRecordingModeCache = false;
let isHydrated = false;
let hydrationPromise: Promise<boolean> | null = null;
const listeners = new Set<(isDemo: boolean, scenario: DemoScenario, isRecording: boolean) => void>();

function notifyListeners() {
  const currentScenario = DEMO_SCENARIOS[activeScenarioIdCache] || DEMO_SCENARIOS.jeju;
  listeners.forEach((listener) => {
    try {
      listener(isDemoModeCache, currentScenario, isRecordingModeCache);
    } catch {
      // Quiet handler error
    }
  });
}

/**
 * Initializes demo mode state from AsyncStorage.
 */
export async function initDemoMode(): Promise<boolean> {
  if (isHydrated) return isDemoModeCache;
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    try {
      const [savedMode, savedScenario, savedRecording] = await Promise.all([
        AsyncStorage.getItem(DEMO_STORAGE_KEY),
        AsyncStorage.getItem(DEMO_SCENARIO_KEY),
        AsyncStorage.getItem(RECORDING_MODE_STORAGE_KEY),
      ]);

      if (savedMode !== null) {
        isDemoModeCache = savedMode === 'true';
      }
      if (savedScenario === 'jeju' || savedScenario === 'rome' || savedScenario === 'kyoto') {
        activeScenarioIdCache = savedScenario;
      } else if (savedScenario === 'como') {
        activeScenarioIdCache = 'rome';
      }
      if (savedRecording !== null) {
        isRecordingModeCache = savedRecording === 'true';
        if (isRecordingModeCache) {
          LogBox.ignoreAllLogs(true);
        }
      }
    } catch {
      // AsyncStorage read failure tolerated
    } finally {
      isHydrated = true;
      notifyListeners();
    }
    return isDemoModeCache;
  })();

  return hydrationPromise;
}

// Start hydration immediately on module load
initDemoMode().catch(() => {});

/**
 * Synchronous read of active demo mode state.
 */
export function isDemoModeActive(): boolean {
  return isDemoModeCache;
}

/**
 * Synchronous read of active recording mode state.
 */
export function isRecordingModeActive(): boolean {
  return isRecordingModeCache;
}

/**
 * Sets recording mode state (ignores all logs in dev when enabled).
 */
export async function setRecordingMode(enabled: boolean): Promise<void> {
  isRecordingModeCache = enabled;
  if (enabled) {
    LogBox.ignoreAllLogs(true);
  } else {
    LogBox.ignoreAllLogs(false);
  }
  notifyListeners();
  try {
    await AsyncStorage.setItem(RECORDING_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Tolerated
  }
}

/**
 * Toggles recording mode state.
 */
export async function toggleRecordingMode(): Promise<boolean> {
  const next = !isRecordingModeCache;
  await setRecordingMode(next);
  return next;
}

/**
 * Gets the active scenario ID.
 */
export function getActiveDemoScenarioId(): DemoScenarioId {
  return activeScenarioIdCache;
}

/**
 * Gets the active demo scenario object.
 */
export function getActiveDemoScenario(): DemoScenario {
  return DEMO_SCENARIOS[activeScenarioIdCache] || DEMO_SCENARIOS.jeju;
}

/**
 * Sets demo mode state and persists to storage.
 */
export async function setDemoMode(enabled: boolean): Promise<void> {
  isDemoModeCache = enabled;
  notifyListeners();
  try {
    await AsyncStorage.setItem(DEMO_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Write failure tolerated in memory
  }
}

/**
 * Toggles demo mode state.
 */
export async function toggleDemoMode(): Promise<boolean> {
  const next = !isDemoModeCache;
  await setDemoMode(next);
  return next;
}

/**
 * Sets the active demo scenario and loads it into analysisStore if demo mode is active.
 */
export async function setActiveDemoScenario(scenarioId: DemoScenarioId): Promise<void> {
  if (scenarioId !== 'jeju' && scenarioId !== 'rome' && scenarioId !== 'kyoto') return;
  activeScenarioIdCache = scenarioId;
  notifyListeners();

  try {
    await AsyncStorage.setItem(DEMO_SCENARIO_KEY, scenarioId);
  } catch {
    // Tolerated
  }

  // Pre-load active scenario into analysisStore
  const scenario = DEMO_SCENARIOS[scenarioId];
  if (scenario) {
    analysisStore.setAnalysisResult(scenario.data, scenario.sourceUrl);
  }
}

/**
 * Cycles to the next demo scenario (Jeju -> Rome -> Kyoto -> Jeju).
 */
export async function cycleNextDemoScenario(): Promise<DemoScenario> {
  const order: DemoScenarioId[] = ['jeju', 'rome', 'kyoto'];
  const currentIndex = order.indexOf(activeScenarioIdCache);
  const nextIndex = (currentIndex + 1) % order.length;
  const nextId = order[nextIndex];
  await setActiveDemoScenario(nextId);
  return DEMO_SCENARIOS[nextId];
}

/**
 * Checks if a place object is tagged as a demo entry.
 */
export function isDemoPlace(place?: { id?: string; place_id?: string; tags?: string[]; is_demo?: boolean } | null): boolean {
  if (!place) return false;
  if (place.is_demo === true) return true;
  if (Array.isArray(place.tags) && place.tags.includes(DEMO_TAG)) return true;
  const id = place.id || place.place_id || '';
  if (id.startsWith('demo_') || id.startsWith('poi_')) return true;
  return false;
}

/**
 * Checks if an analysis row is tagged as a demo entry.
 */
export function isDemoAnalysis(analysis?: { reel_url?: string; is_demo?: boolean } | null): boolean {
  if (!analysis) return false;
  if (analysis.is_demo === true) return true;
  if (analysis.reel_url && analysis.reel_url.includes('demo_')) return true;
  return false;
}

/**
 * React hook for consuming reactive Demo Mode state in any component.
 */
export function useDemoMode() {
  const [isDemo, setIsDemo] = useState<boolean>(isDemoModeCache);
  const [scenario, setScenario] = useState<DemoScenario>(getActiveDemoScenario());
  const [isRecording, setIsRecording] = useState<boolean>(isRecordingModeCache);

  useEffect(() => {
    // Sync initial state
    setIsDemo(isDemoModeCache);
    setScenario(getActiveDemoScenario());
    setIsRecording(isRecordingModeCache);

    const listener = (newIsDemo: boolean, newScenario: DemoScenario, newIsRecording: boolean) => {
      setIsDemo(newIsDemo);
      setScenario(newScenario);
      setIsRecording(newIsRecording);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    isDemoMode: isDemo,
    activeScenario: scenario,
    isRecordingMode: isRecording,
    setDemoMode,
    toggleDemoMode,
    setScenarioId: setActiveDemoScenario,
    cycleScenario: cycleNextDemoScenario,
    setRecordingMode,
    toggleRecordingMode,
  };
}

