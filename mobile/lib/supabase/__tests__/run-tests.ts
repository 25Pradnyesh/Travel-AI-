/**
 * Travel AI Mobile — Supabase Boundary Test Runner
 *
 * Provides a standalone test runner for node environments.
 */

// Mock React Native and Expo browser/linking modules if running outside React Native
const mockAsyncStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
  clear: async () => {},
};

const mockModule = {
  createURL: (path: string, options?: any) => `travelai://${path}`,
  addEventListener: () => ({ remove: () => {} }),
  openAuthSessionAsync: async () => ({ type: 'cancel' }),
  dismissAuthSession: () => {},
  maybeCompleteAuthSession: () => ({ type: 'success' }),
  Platform: { OS: 'ios' },
  default: mockAsyncStorage,
  ...mockAsyncStorage,
};

// Intercept require calls for native modules
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id: string) {
  if (id === '@react-native-async-storage/async-storage') {
    return mockAsyncStorage;
  }
  if (
    id === 'react-native' ||
    id === 'expo-linking' ||
    id === 'expo-web-browser'
  ) {
    return mockModule;
  }
  return originalRequire.apply(this, arguments);
};

// Set development flag
(globalThis as any).__DEV__ = true;

async function run() {
  const { runSupabaseBoundaryTests } = await import('./supabase.test');
  console.log('🚀 Running Supabase Boundary Tests...');
  const results = await runSupabaseBoundaryTests();
  console.log(`\n========================================`);
  console.log(`Test Results: ${results.passed} Passed, ${results.failed} Failed`);
  console.log(`========================================\n`);
  if (results.failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
