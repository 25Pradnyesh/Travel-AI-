"""
Tests for Stage 12: Production API Hardening & Security
Validates:
  - Input validation (valid, malformed, unsupported, oversized URLs)
  - Request size limits (HTTP 413)
  - Rate limiting (HTTP 429 with Retry-After)
  - Concurrency limiting (HTTP 503)
  - Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Cache-Control)
  - Photo proxy validation (SSRF / path traversal defense)
  - Error sanitization (no stack traces, local paths, or secrets leaked)
  - Graceful degradation (Place Details, Nearby Search, Gemini failures)
  - Request ID / Trace propagation
  - Configuration validation
"""

import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from engine.app.main import app, validate_configuration
from engine.core.security import (
    validate_instagram_url,
    validate_place_photo_name,
    rate_limiter,
    concurrency_limiter,
    mask_secret,
    MAX_URL_LENGTH,
)
from engine.app.services.location.location_resolver import LocationResolver


class TestStage12Security(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        rate_limiter.reset()

    def tearDown(self):
        rate_limiter.reset()

    # ==================================================
    # 1. URL Validation
    # ==================================================

    def test_valid_instagram_urls(self):
        """Verifies accepted Instagram Reel, Reels, and Post formats."""
        valid_urls = [
            "https://www.instagram.com/reel/DaAiVGUx7Cf/",
            "https://instagram.com/reel/DaAiVGUx7Cf",
            "http://www.instagram.com/reels/DaAiVGUx7Cf/",
            "https://m.instagram.com/p/DaAiVGUx7Cf/",
            "https://instagr.am/reel/DaAiVGUx7Cf/",
            "https://www.instagram.com/reel/DaAiVGUx7Cf/?igsh=MWx1&utm_source=ig",
        ]
        for u in valid_urls:
            valid, norm, err = validate_instagram_url(u)
            self.assertTrue(valid, f"Failed on valid URL: {u} (err: {err})")
            self.assertIn("DaAiVGUx7Cf", norm)

    def test_malformed_and_unsupported_urls(self):
        """Verifies rejection of invalid schemes, non-Instagram domains, and malformed paths."""
        invalid_cases = [
            ("", "Empty string"),
            ("not-a-url", "Non-URL string"),
            ("ftp://instagram.com/reel/abc123456", "Invalid scheme"),
            ("javascript:alert(1)", "XSS attempt"),
            ("https://tiktok.com/@user/video/123", "Unsupported domain"),
            ("https://youtube.com/shorts/abc1234", "YouTube domain"),
            ("https://malicious-instagram.com/reel/abc123456", "Phishing domain"),
            ("https://user:pass@instagram.com/reel/abc123456", "Userinfo injection"),
            ("https://instagram.com/explore/", "Non-reel/post path"),
            ("https://instagram.com/reel/", "Missing shortcode"),
            ("https://instagram.com/reel/../../etc/passwd", "Path traversal attempt"),
        ]
        for url, reason in invalid_cases:
            valid, _, err = validate_instagram_url(url)
            self.assertFalse(valid, f"Should have failed: {reason} ({url})")

    def test_oversized_url(self):
        """Rejects URLs exceeding MAX_URL_LENGTH (2048 chars)."""
        oversized = "https://www.instagram.com/reel/" + "A" * (MAX_URL_LENGTH + 10)
        valid, _, err = validate_instagram_url(oversized)
        self.assertFalse(valid)
        self.assertIn("maximum allowed length", err.lower())

    # ==================================================
    # 2. HTTP Endpoint Input Validation & Error Responses
    # ==================================================

    def test_analyze_rejects_malformed_url(self):
        """POST /analyze returns 422 for malformed URL payloads."""
        resp = self.client.post("/analyze", json={"reel_url": "https://tiktok.com/@travel/video/123"})
        self.assertEqual(resp.status_code, 422)
        data = resp.json()
        self.assertIn("detail", data)
        self.assertIn("request_id", data)

    def test_analyze_rejects_empty_payload(self):
        """POST /analyze returns 422 for missing URL."""
        resp = self.client.post("/analyze", json={})
        self.assertEqual(resp.status_code, 422)
        data = resp.json()
        self.assertIn("detail", data)

    # ==================================================
    # 3. Payload Size Limits
    # ==================================================

    def test_oversized_payload_rejected(self):
        """Enforces 100KB payload limit with HTTP 413."""
        huge_payload = {"reel_url": "https://www.instagram.com/reel/abc/", "junk": "X" * (120 * 1024)}
        resp = self.client.post("/analyze", json=huge_payload)
        self.assertEqual(resp.status_code, 413)
        data = resp.json()
        self.assertEqual(data.get("error_category"), "PAYLOAD_TOO_LARGE")

    # ==================================================
    # 4. Security Headers
    # ==================================================

    def test_security_headers_present(self):
        """Verifies that all responses include core production security headers."""
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(resp.headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(resp.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin")
        self.assertIn("camera=()", resp.headers.get("Permissions-Policy", ""))

    def test_cache_control_for_analyze(self):
        """Verifies that /analyze responses forbid client caching."""
        resp = self.client.post("/analyze", json={"reel_url": "invalid"})
        self.assertEqual(resp.headers.get("Cache-Control"), "no-store, no-cache, must-revalidate")

    # ==================================================
    # 5. Rate Limiting
    # ==================================================

    def test_rate_limiter_burst_and_quota(self):
        """Verifies that non-whitelisted IPs are rate limited when quota is exceeded."""
        test_ip = "203.0.113.195"  # Non-loopback test IP
        rate_limiter.whitelisted_ips.discard(test_ip)

        # Allow initial requests up to burst limit
        for _ in range(rate_limiter.burst):
            allowed, _ = rate_limiter.is_allowed(test_ip)
            if not allowed:
                break

        # Next immediate request should be throttled
        allowed, retry_after = rate_limiter.is_allowed(test_ip)
        self.assertFalse(allowed)
        self.assertGreater(retry_after, 0)

    # ==================================================
    # 6. Concurrency Protection
    # ==================================================

    def test_concurrency_limiter(self):
        """Verifies concurrency limiter enforces max slots and releases cleanly."""
        limiter = concurrency_limiter
        # Acquire all available slots
        acquired_slots = []
        for _ in range(limiter.max_concurrent):
            acq = limiter.acquire(timeout=0.1)
            acquired_slots.append(acq)
            self.assertTrue(acq)

        # Next acquisition should fail
        over_limit = limiter.acquire(timeout=0.05)
        self.assertFalse(over_limit)

        # Release one slot
        limiter.release()
        acquired_slots.pop()

        # Acquisition should now succeed
        can_acquire = limiter.acquire(timeout=0.1)
        self.assertTrue(can_acquire)

        # Release all
        limiter.release()
        for _ in acquired_slots:
            limiter.release()

    # ==================================================
    # 7. Photo Proxy Validation (SSRF & Path Traversal)
    # ==================================================

    def test_photo_proxy_validation(self):
        """Verifies that /places/photo rejects path traversal, schemes, and invalid references."""
        invalid_photo_names = [
            "../../etc/passwd",
            "places/123/../../secrets",
            "http://evil.com/image.jpg",
            "places/123",  # Missing photos/ suffix
            "random_string",
        ]
        for name in invalid_photo_names:
            resp = self.client.get("/places/photo", params={"name": name})
            self.assertEqual(resp.status_code, 400, f"Allowed invalid photo name: {name}")

    def test_valid_photo_proxy_reference(self):
        """Verifies valid photo reference format is accepted by validator."""
        valid_name = "places/ChIJN1t_tDeuEmsRUsoyG83frY4/photos/AUacShhB123_xyz-987"
        self.assertTrue(validate_place_photo_name(valid_name))

    # ==================================================
    # 8. Request ID / Tracing Propagation
    # ==================================================

    def test_request_id_preservation(self):
        """Verifies client-provided X-Request-ID is preserved across responses."""
        custom_id = "test-req-id-12345"
        resp = self.client.get("/", headers={"X-Request-ID": custom_id})
        self.assertEqual(resp.headers.get("X-Request-ID"), custom_id)

    # ==================================================
    # 9. Error Sanitization
    # ==================================================

    def test_generic_exception_sanitization(self):
        """Verifies that uncaught 500 exceptions do not leak stack traces or system paths."""
        with patch("engine.app.api.analyze.get_provider") as mock_prov, \
             patch("engine.app.api.analyze.get_pipeline") as mock_pipe:
            mock_prov.return_value.extract.return_value = {"metadata": {"title": "Test"}, "video_path": None}
            mock_pipe.return_value.run.side_effect = Exception("Fatal internal error at D:\\private\\secret_token.txt")
            resp = self.client.post("/analyze", json={"reel_url": "https://www.instagram.com/reel/DaAiVGUx7Cf/"})
            self.assertEqual(resp.status_code, 500)
            data = resp.json()
            # No internal path or token leakage
            self.assertNotIn("secret_token", str(data))
            self.assertNotIn("D:\\", str(data))
            self.assertEqual(data.get("error"), "Travel AI couldn't complete the analysis.")
            self.assertEqual(data.get("detail"), "Travel AI couldn't complete the analysis.")
            self.assertIn("request_id", data)

    # ==================================================
    # 10. Graceful Degradation on External Service Failures
    # ==================================================

    def test_graceful_degradation_details_failure(self):
        """Verifies that candidate resolution succeeds even if Google Place Details fails."""
        resolver = LocationResolver()
        candidate = {
            "place": {
                "id": "place_123",
                "travel_name": "Test Destination",
                "latitude": 45.0,
                "longitude": 9.0,
            }
        }
        # Simulate place details throwing a connection error
        with patch.object(resolver.details, "get_details", side_effect=Exception("Google Place Details 503")):
            enriched, nb_sec, tr_sec = resolver._enrich_candidate(candidate)
            self.assertIsNotNone(enriched)
            self.assertEqual(enriched["place"]["travel_name"], "Test Destination")

    def test_graceful_degradation_nearby_failure(self):
        """Verifies that candidate resolution succeeds even if Nearby Search fails."""
        resolver = LocationResolver()
        candidate = {
            "place": {
                "id": "place_123",
                "travel_name": "Test Destination",
                "latitude": 45.0,
                "longitude": 9.0,
                "photos": [{"url": "http://img"}],
            }
        }
        # Simulate nearby search throwing a timeout
        with patch.object(resolver.nearby, "search", side_effect=Exception("Nearby search timed out")):
            enriched, nb_sec, tr_sec = resolver._enrich_candidate(candidate)
            self.assertIsNotNone(enriched)
            self.assertEqual(enriched["place"]["travel_name"], "Test Destination")

    # ==================================================
    # 11. Configuration Safety & Secret Masking
    # ==================================================

    def test_secret_masking(self):
        """Verifies secret masking helper hides raw tokens."""
        self.assertEqual(mask_secret(None), "[NOT CONFIGURED]")
        self.assertEqual(mask_secret(""), "[NOT CONFIGURED]")
        masked = mask_secret("AIzaSyD1234567890abcdef")
        self.assertTrue(masked.startswith("AIza"))
        self.assertTrue(masked.endswith("cdef"))
        self.assertNotIn("1234567890", masked)

    def test_validate_configuration(self):
        """Verifies validate_configuration returns status dictionary."""
        status = validate_configuration()
        self.assertIn("google_places_configured", status)
        self.assertIn("gemini_configured", status)
        self.assertIn("rate_limiting_enabled", status)


if __name__ == "__main__":
    unittest.main()
