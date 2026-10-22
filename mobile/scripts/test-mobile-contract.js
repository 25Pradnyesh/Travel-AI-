/**
 * Mobile API contract and error classification verification
 */
const assert = require('assert');

// 1. Validate error classes
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class NetworkError extends Error {
  constructor(message = 'VAMO engine is unreachable. Please verify network connectivity.') {
    super(message);
    this.name = 'NetworkError';
  }
}

class TimeoutError extends Error {
  constructor(message = 'The analysis is taking too long. Please try again.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

function getFriendlyErrorMessage(err) {
  if (err instanceof TimeoutError) {
    return 'The analysis took longer than expected. Please try again.';
  }
  if (err instanceof NetworkError) {
    return "Can't reach VAMO engine. Please check your connection and verify the engine is running.";
  }
  if (err instanceof ApiError) {
    const backendMsg = (err.message || '').trim();
    if (
      backendMsg &&
      (backendMsg.includes('No destination') ||
        backendMsg.includes('No verified destination') ||
        backendMsg.includes('unresolved') ||
        backendMsg.includes('Place lookup is unavailable') ||
        backendMsg.includes('unavailable right now'))
    ) {
      return backendMsg;
    }
    if (backendMsg && (backendMsg.includes('empty response') || backendMsg.includes('empty media'))) {
      return 'Instagram sent an empty response. This Reel may be restricted, blocked, or unavailable.';
    }
    if (backendMsg && (backendMsg.includes('private') || backendMsg.includes('login to view') || backendMsg.includes('age-restricted'))) {
      return 'This Reel is private, restricted, or requires login to view.';
    }
    switch (err.status) {
      case 400:
        return 'Check the Reel URL.';
      case 401:
      case 403:
        return 'Access denied. The Reel could not be retrieved.';
      case 404:
        return 'The requested engine endpoint was not found.';
      case 422:
        return 'The Reel URL is invalid or could not be processed.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 502:
      case 503:
      case 504:
        return 'Travel AI service is temporarily unavailable. Please try again in a moment.';
      case 500:
      default:
        return "VAMO couldn't complete the analysis. Please try again.";
    }
  }
  return "VAMO couldn't complete the analysis. Please try again.";
}

function classifyError(err, baseUrl = 'http://10.71.100.184:8000') {
  if (err instanceof TimeoutError) {
    return {
      title: 'Analysis Timed Out',
      message: 'The analysis took longer than expected. Please try again.',
      isNetworkFailure: false,
      isTimeout: true,
      isHttpError: false,
    };
  }

  if (err instanceof NetworkError) {
    return {
      title: 'Engine Unreachable',
      message: `Can't reach VAMO engine at ${baseUrl || 'unconfigured'}. Check your network connection.`,
      isNetworkFailure: true,
      isTimeout: false,
      isHttpError: false,
    };
  }

  if (err instanceof ApiError) {
    const friendlyMsg = getFriendlyErrorMessage(err);
    let title = 'Analysis Incomplete';
    if (err.status === 400) {
      title = 'Invalid Reel URL';
    } else if (err.status === 404) {
      title = 'Endpoint Not Found';
    } else if (err.status === 422) {
      title = 'Reel Inaccessible';
    } else if (err.status === 429) {
      title = 'Rate Limit Exceeded';
    } else if (err.status >= 502 && err.status <= 504) {
      title = 'Service Unavailable';
    } else if (err.status === 500) {
      title = 'Analysis Incomplete';
    }

    return {
      title,
      message: friendlyMsg,
      isNetworkFailure: false,
      isTimeout: false,
      isHttpError: true,
      statusCode: err.status,
    };
  }

  return {
    title: 'Analysis Incomplete',
    message: getFriendlyErrorMessage(err),
    isNetworkFailure: false,
    isTimeout: false,
    isHttpError: false,
  };
}

console.log('Testing Mobile Client Error Classification...\n');

// Test 1: Network Failure
const netErr = classifyError(new NetworkError());
assert.strictEqual(netErr.title, 'Engine Unreachable');
assert.strictEqual(netErr.isNetworkFailure, true);
assert.strictEqual(netErr.isHttpError, false);
console.log('✓ NetworkError correctly classified as Engine Unreachable');

// Test 2: Timeout
const timeErr = classifyError(new TimeoutError());
assert.strictEqual(timeErr.title, 'Analysis Timed Out');
assert.strictEqual(timeErr.isTimeout, true);
assert.strictEqual(timeErr.isNetworkFailure, false);
console.log('✓ TimeoutError correctly classified as Analysis Timed Out');

// Test 3: HTTP 404
const notFoundErr = classifyError(new ApiError('Endpoint not found', 404));
assert.strictEqual(notFoundErr.title, 'Endpoint Not Found');
assert.strictEqual(notFoundErr.isHttpError, true);
assert.strictEqual(notFoundErr.statusCode, 404);
console.log('✓ HTTP 404 correctly classified as Endpoint Not Found');

// Test 4: HTTP 422
const unprocErr = classifyError(new ApiError('Validation error', 422));
assert.strictEqual(unprocErr.title, 'Reel Inaccessible');
assert.strictEqual(unprocErr.isHttpError, true);
assert.strictEqual(unprocErr.statusCode, 422);
console.log('✓ HTTP 422 correctly classified as Reel Inaccessible');

// Test 5: HTTP 503
const svcErr = classifyError(new ApiError('Place lookup is unavailable right now', 503));
assert.strictEqual(svcErr.title, 'Service Unavailable');
assert.strictEqual(svcErr.isHttpError, true);
assert.strictEqual(svcErr.statusCode, 503);
console.log('✓ HTTP 503 correctly classified as Service Unavailable');

// Test 6: HTTP 500
const srvErr = classifyError(new ApiError('Internal pipeline error', 500));
assert.strictEqual(srvErr.title, 'Analysis Incomplete');
assert.strictEqual(srvErr.isHttpError, true);
assert.strictEqual(srvErr.statusCode, 500);
console.log('✓ HTTP 500 correctly classified as Analysis Incomplete');

// Test 7: Destination Unresolved (backend returned 200 but success: false)
const unresolvedErr = classifyError(new ApiError('No verified destination candidate resolved.', 200));
assert.strictEqual(unresolvedErr.message, 'No verified destination candidate resolved.');
console.log('✓ Unresolved destination message preserved');

// Test 8: Empty Media Response
const emptyMediaErr = classifyError(new ApiError('Instagram sent an empty response. The Reel may be restricted, blocked, or unavailable.', 422));
assert.strictEqual(emptyMediaErr.title, 'Reel Inaccessible');
assert.strictEqual(emptyMediaErr.message, 'Instagram sent an empty response. This Reel may be restricted, blocked, or unavailable.');
console.log('✓ Instagram empty media response correctly translated to actionable message');

// Test 9: Private / Restricted Reel
const privateErr = classifyError(new ApiError('This Reel is private, age-restricted, or requires login to view.', 422));
assert.strictEqual(privateErr.title, 'Reel Inaccessible');
assert.strictEqual(privateErr.message, 'This Reel is private, restricted, or requires login to view.');
console.log('✓ Private/restricted reel error correctly translated to actionable message');

console.log('\nAll 9 Mobile Classification Tests Passed Successfully! ✅');
