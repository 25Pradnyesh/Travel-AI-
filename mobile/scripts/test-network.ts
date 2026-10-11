/**
 * Standalone test runner for Network and Error Screen validation
 */

import { runNetworkValidationTests } from '../lib/network/__tests__/network.test';

async function main() {
  console.log('Running VAMO Network & Error Screen Validation Tests...');
  const { passed, failed } = await runNetworkValidationTests();
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
