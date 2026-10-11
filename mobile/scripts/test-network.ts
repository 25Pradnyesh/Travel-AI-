/**
 * Standalone test runner for Network and Error Screen validation
 */

// Mock React Native and native modules for headless execution
const mockModule = {
  Platform: { OS: 'ios' },
  default: {},
};

const mockNetInfo = {
  fetch: async () => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
  addEventListener: () => () => {},
  default: {
    fetch: async () => ({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    }),
    addEventListener: () => () => {},
  },
};

const mockExpoNetwork = {
  getNetworkStateAsync: async () => ({
    isConnected: true,
    isInternetReachable: true,
    type: 1,
  }),
  isAirplaneModeEnabledAsync: async () => false,
};

const mockExpoDevice = {
  isDevice: true,
};

const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id: string) {
  if (id === 'react-native') {
    return mockModule;
  }
  if (id === '@react-native-community/netinfo') {
    return mockNetInfo;
  }
  if (id === 'expo-network') {
    return mockExpoNetwork;
  }
  if (id === 'expo-device') {
    return mockExpoDevice;
  }
  return originalRequire.apply(this, arguments);
};

// Handle bundled image requirements under node
(require as any).extensions['.jpg'] = (module: any, filename: string) => {
  module.exports = { uri: filename, width: 1080, height: 1920 };
};
(require as any).extensions['.png'] = (module: any, filename: string) => {
  module.exports = { uri: filename, width: 512, height: 512 };
};

(globalThis as any).__DEV__ = true;

async function main() {
  const { runNetworkValidationTests } = await import('../lib/network/__tests__/network.test');
  console.log('Running VAMO Network & Error Screen Validation Tests...');
  const { passed, failed } = await runNetworkValidationTests();
  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
