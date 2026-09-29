"""
Travel AI — Core Security, Input Validation & Abuse Prevention Module
Stage 12: Production API Hardening & Security
"""

import collections
import ipaddress
import logging
import os
import re
import threading
import time
import urllib.parse
from typing import Any

logger = logging.getLogger(__name__)

# ==================================================
# Exceptions
# ==================================================

class SecurityError(Exception):
    """Base exception for security and validation failures."""
    pass


class InvalidUrlError(SecurityError):
    """Raised when an external URL fails safety or domain validation."""
    pass


class RateLimitExceeded(SecurityError):
    """Raised when an IP exceeds configured request quotas."""
    def __init__(self, retry_after: int, message: str | None = None):
        self.retry_after = retry_after
        super().__init__(message or f"Rate limit exceeded. Please try again in {retry_after} seconds.")


class ConcurrencyLimitExceeded(SecurityError):
    """Raised when the maximum concurrent analysis capacity is reached."""
    def __init__(self, retry_after: int = 5, message: str | None = None):
        self.retry_after = retry_after
        super().__init__(message or "Server is processing maximum concurrent requests. Please try again shortly.")


class PayloadTooLargeError(SecurityError):
    """Raised when request payload exceeds size limits."""
    pass


# ==================================================
# URL Validation & Sanitization
# ==================================================

# Maximum permissible length for an Instagram URL
MAX_URL_LENGTH = 2048

# Allowed Instagram hostnames
ALLOWED_INSTAGRAM_HOSTS = {
    "instagram.com",
    "www.instagram.com",
    "m.instagram.com",
    "instagr.am",
    "www.instagr.am",
}

# Strict Instagram Reel / Post Path Regex: /reel/<id>, /reels/<id>, /p/<id>
# Instagram shortcodes consist of alphanumeric characters, underscores, and hyphens (usually 9-15 chars, bounded to 3-100)
INSTAGRAM_PATH_REGEX = re.compile(
    r"^/(?:reel|reels|p)/([A-Za-z0-9_-]{3,100})/?$",
    re.IGNORECASE,
)

# Photo reference validation regex for /places/photo proxy: places/<place_id>/photos/<photo_id>
PHOTO_REFERENCE_REGEX = re.compile(
    r"^places/[A-Za-z0-9_-]{5,100}/photos/[A-Za-z0-9_.-]{5,250}$",
    re.IGNORECASE,
)


def validate_instagram_url(url: str) -> tuple[bool, str, str | None]:
    """
    Hardened validation of incoming Instagram URLs.
    Checks:
      1. Non-empty string and length <= MAX_URL_LENGTH.
      2. Valid HTTP/HTTPS scheme only (rejects ftp, file, javascript, data).
      3. Strict hostname matching (disallows port manipulation, userinfo, IP addresses, SSRF).
      4. Strict path matching (must be /reel/, /reels/, or /p/ with a valid shortcode).
    
    Returns:
      (is_valid: bool, normalized_url: str, shortcode_or_error: str | None)
    """
    if not url or not isinstance(url, str):
        return False, "", "Enter a valid public Instagram Reel URL."

    raw = url.strip()
    if len(raw) > MAX_URL_LENGTH:
        return False, "", f"URL exceeds maximum allowed length of {MAX_URL_LENGTH} characters."

    # Reject null bytes or control characters
    if any(ord(c) < 32 or ord(c) == 127 for c in raw):
        return False, "", "URL contains invalid or unprintable characters."

    try:
        parsed = urllib.parse.urlsplit(raw)
    except Exception:
        return False, "", "Malformed URL structure."

    # 1. Scheme Check
    scheme = (parsed.scheme or "").lower()
    if scheme not in ("http", "https"):
        return False, "", "Invalid URL scheme. Only HTTP and HTTPS are supported."

    # 2. Hostname Check (disallow userinfo, port numbers, or non-Instagram domains)
    netloc = parsed.netloc.lower()
    if "@" in netloc:
        return False, "", "Userinfo in URL is not permitted."

    # Strip port if present
    host = netloc.split(":")[0].strip()
    if host not in ALLOWED_INSTAGRAM_HOSTS:
        return False, "", f"Unsupported domain '{host}'. Only Instagram URLs are supported."

    # 3. Path & Shortcode Check
    path = parsed.path
    match = INSTAGRAM_PATH_REGEX.match(path)
    if not match:
        return False, "", "URL must be a public Instagram Reel or Post link (e.g., https://www.instagram.com/reel/xyz/)."

    shortcode = match.group(1)

    # 4. Normalized canonical URL (HTTPS, standard host, canonical path)
    canonical_url = f"https://www.instagram.com/reel/{shortcode}/"
    return True, canonical_url, shortcode


def validate_place_photo_name(name: str) -> bool:
    """
    Validates a Google Places photo resource name.
    Must conform to 'places/<place_id>/photos/<photo_id>' without path traversal or injection.
    """
    if not name or not isinstance(name, str):
        return False

    clean = name.strip()
    if len(clean) > 512:
        return False

    # Block path traversal and special characters
    if ".." in clean or "\\" in clean or "//" in clean or "%" in clean:
        return False

    return bool(PHOTO_REFERENCE_REGEX.match(clean))


def mask_secret(secret: str | None, visible_chars: int = 4) -> str:
    """
    Safely masks an API key or sensitive token for logging.
    Example: 'AIzaSyD...1234'
    """
    if not secret:
        return "[NOT CONFIGURED]"
    s = str(secret).strip()
    if len(s) <= visible_chars * 2:
        return "***"
    return f"{s[:visible_chars]}...{s[-visible_chars:]}"


# ==================================================
# In-Memory Sliding-Window Rate Limiter
# ==================================================

class SlidingWindowRateLimiter:
    """
    Thread-safe, lightweight, in-memory sliding-window rate limiter.
    Does not require an external database or Redis.
    Configurable via environment variables:
      - RATE_LIMIT_ENABLED (default True)
      - RATE_LIMIT_PER_MINUTE (default 60 requests/min)
      - RATE_LIMIT_BURST (default 15)
    """

    def __init__(
        self,
        requests_per_minute: int | None = None,
        burst: int | None = None,
        enabled: bool | None = None,
    ):
        if enabled is None:
            self.enabled = os.getenv("RATE_LIMIT_ENABLED", "true").lower() in ("true", "1", "yes")
        else:
            self.enabled = enabled

        if requests_per_minute is None:
            self.requests_per_minute = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
        else:
            self.requests_per_minute = requests_per_minute

        if burst is None:
            self.burst = int(os.getenv("RATE_LIMIT_BURST", "15"))
        else:
            self.burst = burst

        self._window_seconds = 60.0
        # IP -> deque of timestamps
        self._history: dict[str, collections.deque] = {}
        self._lock = threading.Lock()
        self._last_cleanup = time.time()

        # Whitelisted loopback / benchmark clients
        self.whitelisted_ips = {"127.0.0.1", "::1", "localhost", "testclient"}

    def is_whitelisted(self, client_ip: str) -> bool:
        """Determines if the client IP is whitelisted (e.g. local loopback or benchmark)."""
        if not client_ip:
            return False
        clean_ip = client_ip.strip().lower()
        if clean_ip in self.whitelisted_ips:
            return True
        try:
            ip_obj = ipaddress.ip_address(clean_ip)
            return ip_obj.is_loopback
        except ValueError:
            return False

    def is_allowed(self, client_ip: str) -> tuple[bool, int]:
        """
        Evaluates whether a request from client_ip is allowed.
        Returns: (is_allowed: bool, retry_after_seconds: int)
        """
        if not self.enabled:
            return True, 0

        if self.is_whitelisted(client_ip):
            return True, 0

        now = time.time()
        window_start = now - self._window_seconds

        with self._lock:
            # Periodic cleanup of inactive IPs (every 60s or if cache > 5000)
            if now - self._last_cleanup > 60.0 or len(self._history) > 5000:
                self._cleanup(now)

            if client_ip not in self._history:
                self._history[client_ip] = collections.deque()

            timestamps = self._history[client_ip]

            # Purge entries older than sliding window
            while timestamps and timestamps[0] < window_start:
                timestamps.popleft()

            # Check quota
            if len(timestamps) >= self.requests_per_minute:
                # Oldest request in the window dictates retry after
                oldest = timestamps[0]
                retry_after = max(1, int(oldest + self._window_seconds - now) + 1)
                return False, retry_after

            # Check burst limit (e.g. within last 2 seconds)
            burst_window = now - 2.0
            recent_burst = sum(1 for t in timestamps if t >= burst_window)
            if recent_burst >= self.burst:
                return False, 2

            # Record this request
            timestamps.append(now)
            return True, 0

    def _cleanup(self, now: float) -> None:
        """Removes expired entries from tracking history."""
        cutoff = now - self._window_seconds
        expired_ips = [ip for ip, deq in self._history.items() if not deq or deq[-1] < cutoff]
        for ip in expired_ips:
            del self._history[ip]
        self._last_cleanup = now

    def reset(self) -> None:
        """Clears all tracking history (useful in test teardown)."""
        with self._lock:
            self._history.clear()


# ==================================================
# Concurrency Limiter
# ==================================================

class ConcurrencyLimiter:
    """
    Limits the number of heavy analysis pipeline executions running simultaneously
    in the process to prevent memory thrashing or CPU exhaustion.
    """

    def __init__(self, max_concurrent: int | None = None):
        if max_concurrent is None:
            self.max_concurrent = int(os.getenv("MAX_CONCURRENT_ANALYSIS", "4"))
        else:
            self.max_concurrent = max_concurrent

        self._semaphore = threading.Semaphore(self.max_concurrent)
        self._current_count = 0
        self._lock = threading.Lock()

    @property
    def current_active(self) -> int:
        with self._lock:
            return self._current_count

    def acquire(self, timeout: float = 1.0) -> bool:
        """Attempts to acquire an execution slot within timeout seconds."""
        acquired = self._semaphore.acquire(timeout=timeout)
        if acquired:
            with self._lock:
                self._current_count += 1
        return acquired

    def release(self) -> None:
        """Releases an execution slot."""
        with self._lock:
            if self._current_count > 0:
                self._current_count -= 1
        self._semaphore.release()


# Global Singleton Instances
rate_limiter = SlidingWindowRateLimiter()
concurrency_limiter = ConcurrencyLimiter()
