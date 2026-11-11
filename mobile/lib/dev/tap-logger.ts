/**
 * VAMO Mobile — Dev Tap Logger
 *
 * Diagnostic tap monitoring system for debugging touch responders,
 * swallowed events, and inactive handlers across all components in __DEV__.
 */

export interface TapLogEntry {
  id: string;
  timestamp: number;
  component: string;
  meta?: Record<string, any>;
}

const MAX_TAP_LOGS = 50;
const tapLogBuffer: TapLogEntry[] = [];
let tapCounter = 0;

export function logTap(component: string, meta?: Record<string, any>): void {
  if (!__DEV__) return;

  tapCounter += 1;
  const entry: TapLogEntry = {
    id: `tap_${tapCounter}`,
    timestamp: Date.now(),
    component,
    meta,
  };

  tapLogBuffer.unshift(entry);
  if (tapLogBuffer.length > MAX_TAP_LOGS) {
    tapLogBuffer.pop();
  }

  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  console.log(`[TAP #${tapCounter}] 👉 ${component}${metaStr}`);
}

export function getRecentTaps(): TapLogEntry[] {
  return [...tapLogBuffer];
}

export function clearTapLogs(): void {
  tapLogBuffer.length = 0;
}

/**
 * Ergonomically wraps an onPress handler with __DEV__ logging while
 * preserving exact handler signature and return value.
 */
export function wrapOnPress<T extends (...args: any[]) => any>(
  componentName: string,
  onPress?: T,
  meta?: Record<string, any>
): T | undefined {
  if (!onPress) return undefined;
  return ((...args: any[]) => {
    logTap(componentName, meta);
    return onPress(...args);
  }) as T;
}

