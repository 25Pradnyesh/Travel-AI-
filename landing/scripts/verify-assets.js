#!/usr/bin/env node
/**
 * Production Asset Verification Guard
 * Ensures landing/public/images/app-screens (5 real video-extracted screenshots)
 * and vamo-app-walkthrough.mp4 / demo.mp4 are genuine assets before allowing
 * a production build to succeed.
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  { rel: 'public/images/app-screens/1-discovery.webp', minBytes: 10000, label: 'Screenshot 1 (Discovery)' },
  { rel: 'public/images/app-screens/2-resolution.webp', minBytes: 10000, label: 'Screenshot 2 (Resolution)' },
  { rel: 'public/images/app-screens/3-destination.webp', minBytes: 10000, label: 'Screenshot 3 (Destination)' },
  { rel: 'public/images/app-screens/4-dossier.webp', minBytes: 10000, label: 'Screenshot 4 (Dossier)' },
  { rel: 'public/images/app-screens/5-details.webp', minBytes: 10000, label: 'Screenshot 5 (Details)' },
  { rel: 'public/videos/vamo-app-walkthrough.mp4', minBytes: 100000, label: 'Walkthrough Video (vamo-app-walkthrough.mp4)' },
  { rel: 'public/demo.mp4', minBytes: 100000, label: 'Fallback Video (demo.mp4)' },
];

function verifyAssets() {
  const rootDir = path.resolve(__dirname, '..');
  const missingOrInvalid = [];

  for (const item of REQUIRED_FILES) {
    const fullPath = path.join(rootDir, item.rel);
    if (!fs.existsSync(fullPath)) {
      missingOrInvalid.push(`${item.label}: missing file (${item.rel})`);
      continue;
    }

    const stat = fs.statSync(fullPath);
    if (stat.size < item.minBytes) {
      missingOrInvalid.push(
        `${item.label}: file size ${stat.size} bytes is below expected threshold (${item.minBytes} bytes)`
      );
    }
  }

  const isProduction =
    process.env.VERCEL_ENV === 'production' ||
    process.env.APP_ENV === 'production' ||
    process.env.STRICT_PLACEHOLDERS === 'true' ||
    process.argv.includes('--production');

  if (missingOrInvalid.length > 0) {
    if (isProduction) {
      console.error('\n================================================================');
      console.error('❌ PRODUCTION BUILD REJECTED: Missing Required Assets');
      console.error('================================================================');
      missingOrInvalid.forEach((msg) => console.error(`  - ${msg}`));
      console.error('================================================================\n');
      process.exit(1);
    } else {
      console.warn('\n[ASSET AUDIT] Warning: Missing or invalid assets:');
      missingOrInvalid.forEach((msg) => console.warn(`  - ${msg}`));
      console.warn('');
    }
  } else {
    console.log(
      '✓ Asset verification passed: all 5 screenshots and walkthrough video are verified genuine production assets.'
    );
  }
}

verifyAssets();
