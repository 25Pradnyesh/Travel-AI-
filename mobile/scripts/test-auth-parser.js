/**
 * Travel AI Mobile — Auth URL Parser & OAuth Redirect Boundary Verification
 */

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
};

function parseAuthUrl(url) {
  const result = {};

  if (!url || typeof url !== 'string') {
    return result;
  }

  const queryIndex = url.indexOf('?');
  const hashIndex = url.indexOf('#');

  let queryString = '';
  let hashString = '';

  if (queryIndex !== -1) {
    if (hashIndex !== -1 && hashIndex > queryIndex) {
      queryString = url.substring(queryIndex + 1, hashIndex);
      hashString = url.substring(hashIndex + 1);
    } else {
      queryString = url.substring(queryIndex + 1);
    }
  } else if (hashIndex !== -1) {
    hashString = url.substring(hashIndex + 1);
  }

  const parseKeyValuePairs = (paramStr) => {
    if (!paramStr) return;
    const pairs = paramStr.split('&');
    for (const pair of pairs) {
      if (!pair) continue;
      const [rawKey, ...valueParts] = pair.split('=');
      if (!rawKey) continue;
      const key = decodeURIComponent(rawKey.trim());
      const rawVal = valueParts.join('=');
      const val = decodeURIComponent((rawVal || '').replace(/\+/g, ' '));

      if (key === 'code') result.code = val;
      if (key === 'access_token') result.accessToken = val;
      if (key === 'refresh_token') result.refreshToken = val;
      if (key === 'error') result.error = val;
      if (key === 'error_description') result.errorDescription = val;
    }
  };

  parseKeyValuePairs(queryString);
  parseKeyValuePairs(hashString);

  return result;
}

console.log('--- Running Mobile Auth URL Parser Tests ---');

// Test 1: PKCE code grant
const pkceUrl = 'travelai://auth/callback?code=pkce-auth-code-12345';
const pkceRes = parseAuthUrl(pkceUrl);
assert(pkceRes.code === 'pkce-auth-code-12345', 'PKCE code parsed correctly');
assert(!pkceRes.accessToken, 'No access token in PKCE code response');
console.log('✓ PKCE code grant parsed');

// Test 2: Implicit token grant
const tokenUrl =
  'travelai://auth/callback#access_token=eyJhbGciOi...&refresh_token=refresh-token-xyz&token_type=bearer&expires_in=3600';
const tokenRes = parseAuthUrl(tokenUrl);
assert(tokenRes.accessToken === 'eyJhbGciOi...', 'Access token parsed correctly');
assert(tokenRes.refreshToken === 'refresh-token-xyz', 'Refresh token parsed correctly');
assert(!tokenRes.code, 'No code in token response');
console.log('✓ Implicit token grant parsed');

// Test 3: OAuth error response
const errorUrl =
  'travelai://auth/callback?error=access_denied&error_description=User+declined+the+authorization+request';
const errorRes = parseAuthUrl(errorUrl);
assert(errorRes.error === 'access_denied', 'Error code parsed correctly');
assert(
  errorRes.errorDescription === 'User declined the authorization request',
  'Error description parsed correctly'
);
console.log('✓ OAuth error response parsed');

// Test 4: Mixed URL with query and hash
const mixedUrl = 'travelai://auth/callback?code=mock_code#access_token=mock_token';
const mixedRes = parseAuthUrl(mixedUrl);
assert(mixedRes.code === 'mock_code', 'Code parsed from mixed url');
assert(mixedRes.accessToken === 'mock_token', 'Token parsed from mixed url');
console.log('✓ Mixed query and hash parsed');

// Test 5: Empty / malformed inputs
assert(Object.keys(parseAuthUrl('')).length === 0, 'Empty string returns empty object');
assert(Object.keys(parseAuthUrl(null)).length === 0, 'Null returns empty object');
assert(Object.keys(parseAuthUrl('travelai://something-else')).length === 0, 'Non-query returns empty');
console.log('✓ Empty and malformed inputs handled gracefully');

console.log('All 5 Auth Parser tests passed successfully!');
