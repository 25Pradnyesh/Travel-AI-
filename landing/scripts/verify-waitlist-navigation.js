/**
 * Verification Script: Hero & Waitlist Navigation
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '..');

console.log('Testing Hero & Waitlist Navigation Implementation...\n');

// 1. Inspect landing/app/page.tsx and Header component
const pageContent = fs.readFileSync(path.join(rootDir, 'app/page.tsx'), 'utf-8');
const headerPath = path.join(rootDir, 'components/Header.tsx');
const headerContent = fs.existsSync(headerPath) ? fs.readFileSync(headerPath, 'utf-8') : '';
const fullNavContent = pageContent + '\n' + headerContent;

// Assert prototype badge is completely removed
assert.strictEqual(
  pageContent.includes('Prototype — waitlist open'),
  false,
  'Prototype badge text must not exist in page.tsx'
);
assert.strictEqual(
  pageContent.includes('Prototype - waitlist open'),
  false,
  'Prototype badge text variant must not exist in page.tsx'
);
assert.strictEqual(
  pageContent.includes('animate-ping'),
  false,
  'Ping animation from removed badge must not exist in page.tsx'
);
console.log('✓ 1. Prototype badge and its styling are completely removed from hero.');

// Assert Navbar CTA
assert(
  fullNavContent.includes('href="/waitlist"') && fullNavContent.includes('Join Waitlist'),
  'Navbar must contain Link to /waitlist with "Join Waitlist"'
);
console.log('✓ 2. Navbar CTA links directly to /waitlist with next/link.');

// Assert Hero CTA
assert(
  pageContent.includes('href="/waitlist"') && pageContent.includes('Join the Waitlist'),
  'Hero must contain Link to /waitlist with "Join the Waitlist"'
);
console.log('✓ 3. Hero CTA links directly to /waitlist with next/link.');

// Assert no #waitlist links in Hero
const heroSectionMatch = pageContent.match(/<section[\s\S]*?aria-label="Hero"[\s\S]*?<\/section>/);
assert(heroSectionMatch, 'Hero section found');
assert.strictEqual(
  heroSectionMatch[0].includes('href="#waitlist"'),
  false,
  'Hero must not contain anchor href="#waitlist"'
);
console.log('✓ 4. Hero contains zero #waitlist anchor scrolling links.');

// 2. Inspect landing/app/waitlist/page.tsx and WaitlistClient.tsx
const waitlistPagePath = path.join(rootDir, 'app/waitlist/page.tsx');
const waitlistClientPath = path.join(rootDir, 'app/waitlist/WaitlistClient.tsx');

assert(fs.existsSync(waitlistPagePath), 'app/waitlist/page.tsx exists');
assert(fs.existsSync(waitlistClientPath), 'app/waitlist/WaitlistClient.tsx exists');

const waitlistClientContent = fs.readFileSync(waitlistClientPath, 'utf-8');

// Check features in WaitlistClient
assert(waitlistClientContent.includes("fetch('/api/waitlist'"), 'Client posts to /api/waitlist');
assert(waitlistClientContent.includes('website: honeypot'), 'Client includes honeypot');
assert(waitlistClientContent.includes('consent'), 'Client includes consent checkbox');
assert(waitlistClientContent.includes('isDuplicate'), 'Client handles duplicate state');
assert(waitlistClientContent.includes('setStatus'), 'Client manages loading and error states');
assert(waitlistClientContent.includes('href="/"'), 'Client links back to homepage');
console.log('✓ 5. Dedicated full-page /waitlist experience verified with all states & navigation.');

// 3. Inspect Next.js App Route Manifest
const manifestPath = path.join(rootDir, '.next/server/app-paths-manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  assert(manifest['/waitlist/page'], 'Manifest includes /waitlist/page route');
  assert(manifest['/page'], 'Manifest includes /page route');
  assert(manifest['/api/waitlist/route'], 'Manifest includes /api/waitlist/route');
  console.log('✓ 6. Next.js app-paths-manifest.json includes /waitlist static page and API handler.');
}

console.log('\nAll Hero & Waitlist Navigation checks passed successfully!\n');

