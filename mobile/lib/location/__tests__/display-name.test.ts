function assertStrictEqual(actual: unknown, expected: unknown, message?: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}. ${message || ''}`);
  }
}
const assert = { strictEqual: assertStrictEqual };

import {
  buildCanonicalLocationName,
  buildLocationSubtitle,
  canonicalizeCountry,
} from '../display-name';

console.log('Testing Canonical Display Name & Location Subtitle Builder...');

// 1. Jeju: Never produces duplicate country (Jeju Island, South Korea, South Korea)
{
  const res = buildCanonicalLocationName({
    name: 'Jeju Island, South Korea',
    city: 'Jeju-si',
    region: 'South Korea',
    country: 'South Korea',
  });
  assert.strictEqual(res, 'Jeju Island, South Korea', 'Jeju pre-concatenated country');

  const res2 = buildCanonicalLocationName({
    name: 'Jeju Island',
    city: 'Jeju',
    region: 'Jeju-do',
    country: 'South Korea',
  });
  assert.strictEqual(res2, 'Jeju Island, South Korea', 'Jeju structured fields');
}

// 2. Korea aliases: Korea, ROK, Republic of Korea deduplicate correctly
{
  assert.strictEqual(
    buildCanonicalLocationName({
      name: 'Jeju Island, Korea',
      country: 'South Korea',
    }),
    'Jeju Island, South Korea',
    'Korea alias upgrade'
  );

  assert.strictEqual(
    buildCanonicalLocationName({
      name: 'Jeju Island, Republic of Korea',
      country: 'South Korea',
    }),
    'Jeju Island, South Korea',
    'Republic of Korea alias upgrade'
  );

  assert.strictEqual(
    buildCanonicalLocationName({
      name: 'Jeju Island, ROK',
      country: 'South Korea',
    }),
    'Jeju Island, South Korea',
    'ROK alias upgrade'
  );

  assert.strictEqual(
    buildCanonicalLocationName({
      name: 'Jeju Island',
      country: 'Korea',
    }),
    'Jeju Island, South Korea',
    'Bare Korea country'
  );
}

// 3. Kyoto: Kyoto, Japan
{
  const res = buildCanonicalLocationName({
    name: 'Kyoto',
    city: 'Kyoto',
    region: 'Kansai',
    country: 'Japan',
  });
  assert.strictEqual(res, 'Kyoto, Japan', 'Kyoto structured');

  const resWithCountry = buildCanonicalLocationName({
    name: 'Kyoto, Japan',
    country: 'Japan',
  });
  assert.strictEqual(resWithCountry, 'Kyoto, Japan', 'Kyoto pre-concat');
}

// 4. Bali: Bali, Indonesia
{
  const res = buildCanonicalLocationName({
    name: 'Bali',
    region: 'Bali',
    country: 'Indonesia',
  });
  assert.strictEqual(res, 'Bali, Indonesia', 'Bali structured');

  const resPreConcat = buildCanonicalLocationName({
    name: 'Bali, Indonesia',
    country: 'Indonesia',
  });
  assert.strictEqual(resPreConcat, 'Bali, Indonesia', 'Bali pre-concat');
}

// 5. Paris: Paris, France
{
  const res = buildCanonicalLocationName({
    name: 'Paris',
    city: 'Paris',
    region: 'Île-de-France',
    country: 'France',
  });
  assert.strictEqual(res, 'Paris, France', 'Paris structured');

  const resPreConcat = buildCanonicalLocationName({
    name: 'Paris, France',
    country: 'France',
  });
  assert.strictEqual(resPreConcat, 'Paris, France', 'Paris pre-concat');
}

// 6. New York City: New York City, United States (with USA/US aliases)
{
  const res = buildCanonicalLocationName({
    name: 'New York City',
    city: 'New York',
    country: 'United States',
  });
  assert.strictEqual(res, 'New York City, United States', 'New York City structured');

  const resUSA = buildCanonicalLocationName({
    name: 'New York City, USA',
    country: 'United States',
  });
  assert.strictEqual(resUSA, 'New York City, United States', 'New York City USA alias');

  const resUS = buildCanonicalLocationName({
    name: 'New York City',
    country: 'US',
  });
  assert.strictEqual(resUS, 'New York City, United States', 'New York City US alias');
}

// 7. Punctuation and case insensitivity
{
  const res = buildCanonicalLocationName({
    name: '  jeju island, ',
    country: ' SOUTH KOREA. ',
  });
  assert.strictEqual(res, 'jeju island, South Korea', 'Case and punctuation trim');
}

console.log('✅ ALL Canonical Display Name & Location Subtitle tests PASSED!');
