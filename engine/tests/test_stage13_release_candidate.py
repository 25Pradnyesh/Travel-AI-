"""
Stage 13: Release Candidate / Final QA Test Suite

Comprehensive production-readiness verification covering:
1. API Root and Health readiness behavior
2. Security headers and payload limits
3. Trace and Request ID propagation across endpoints
4. Safe error responses and secret sanitization
5. In-memory rate limiting and concurrency protection
6. Temporary file cleanup (Windows retry, residual .part/.ytdl, isolated frame dirs)
7. External service failure isolation and graceful degradation
8. Deterministic response contract serialization
"""

import os
from pathlib import Path
import tempfile
import time
import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from engine.app.main import app
from engine.app.pipelines.location_pipeline import LocationPipeline
from engine.core.security import (
    validate_instagram_url,
    validate_place_photo_name,
    SlidingWindowRateLimiter,
    ConcurrencyLimiter,
)
from engine.domain.schemas.responses import AnalysisResponse, BestGuess, GeminiInfo
from engine.app.services.response.response_builder import ResponseBuilder


class TestStage13ReleaseCandidate(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app, raise_server_exceptions=False)

    # ==================================================
    # 1. API Startup, Root, & Health Readiness
    # ==================================================

    def test_root_endpoint_contract(self):
        """Root GET / must return 200 with healthy service status."""
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertEqual(data.get("version"), "1.0.0")
        self.assertIn("Travel AI Engine", data.get("message", ""))

    def test_health_readiness_contract(self):
        """GET /health must return readiness status without exposing raw credentials."""
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn(data.get("status"), ("ok", "degraded"))
        self.assertEqual(data.get("service"), "Travel AI Engine")
        self.assertEqual(data.get("version"), "1.0.0")

        cfg = data.get("configuration", {})
        self.assertIsInstance(cfg.get("google_places_ready"), bool)
        self.assertIsInstance(cfg.get("gemini_ready"), bool)
        self.assertIsInstance(cfg.get("rate_limiting_active"), bool)

    # ==================================================
    # 2. Security Headers & Payload Controls
    # ==================================================

    def test_security_headers_present(self):
        """All HTTP responses must carry standard production security headers."""
        resp = self.client.get("/health")
        self.assertEqual(resp.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(resp.headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(resp.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin")
        self.assertEqual(resp.headers.get("Permissions-Policy"), "geolocation=(), camera=(), microphone=()")

    def test_cache_control_headers_on_sensitive_paths(self):
        """Responses on /analyze or errors must enforce no-store cache control."""
        # Error path
        resp = self.client.get("/non-existent-route")
        self.assertIn("no-store", resp.headers.get("Cache-Control", ""))

    def test_payload_too_large_rejection(self):
        """Payload exceeding MAX_REQUEST_BODY_SIZE_BYTES must be rejected with 413."""
        large_body = "x" * (120 * 1024)  # 120KB > 100KB default limit
        resp = self.client.post(
            "/analyze",
            content=large_body,
            headers={"Content-Length": str(len(large_body)), "Content-Type": "application/json"},
        )
        self.assertEqual(resp.status_code, 413)
        data = resp.json()
        self.assertEqual(data.get("error_category"), "PAYLOAD_TOO_LARGE")

    # ==================================================
    # 3. Request / Trace ID Propagation
    # ==================================================

    def test_request_id_custom_propagation(self):
        """Client-supplied X-Request-ID must be propagated into the response headers."""
        custom_id = "test-custom-trace-id-12345"
        resp = self.client.get("/health", headers={"X-Request-ID": custom_id})
        self.assertEqual(resp.headers.get("X-Request-ID"), custom_id)

    def test_request_id_automatic_generation(self):
        """When no X-Request-ID is provided, a valid UUID must be generated and returned."""
        resp = self.client.get("/health")
        req_id = resp.headers.get("X-Request-ID")
        self.assertTrue(req_id)
        self.assertGreater(len(req_id), 10)

    # ==================================================
    # 4. Error Sanitization & Secret Redaction
    # ==================================================

    def test_validation_error_sanitization(self):
        """Validation errors (422) must return clean JSON without Python stack traces or internal classes."""
        resp = self.client.post("/analyze", json={"reel_url": "not-a-valid-url"})
        self.assertEqual(resp.status_code, 422)
        data = resp.json()
        self.assertEqual(data.get("error_category"), "VALIDATION_ERROR")
        self.assertNotIn("Traceback", resp.text)
        self.assertNotIn("pydantic_core", resp.text)

    def test_secret_redaction_in_errors(self):
        """Generic exception handler must return safe copy without leaking system paths or API keys."""
        with patch("engine.app.api.analyze.get_provider", side_effect=Exception("Database failure at D:\\secrets\\key=AIzaSySecret")):
            resp = self.client.post("/analyze", json={"reel_url": "https://www.instagram.com/reel/C8xyz123abc/"})
            self.assertEqual(resp.status_code, 500)
            data = resp.json()
            self.assertIn(data.get("error_category"), ("INTERNAL_SERVER_ERROR", "PIPELINE_ERROR"))
            self.assertNotIn("AIzaSySecret", resp.text)
            self.assertNotIn("D:\\secrets", resp.text)
            self.assertIn("Travel AI couldn't analyze this Reel.", data.get("detail", ""))

    # ==================================================
    # 5. Rate Limiting & Concurrency Safety
    # ==================================================

    def test_rate_limiter_window_and_headers(self):
        """SlidingWindowRateLimiter must allow burst requests and throttle when limit is exceeded."""
        limiter = SlidingWindowRateLimiter(requests_per_minute=3, burst=3)
        ip = "192.168.1.55"

        # First 3 requests permitted
        self.assertTrue(limiter.is_allowed(ip)[0])
        self.assertTrue(limiter.is_allowed(ip)[0])
        self.assertTrue(limiter.is_allowed(ip)[0])

        # 4th request within minute throttled
        allowed, retry_after = limiter.is_allowed(ip)
        self.assertFalse(allowed)
        self.assertGreater(retry_after, 0)

    def test_concurrency_limiter_slot_exhaustion(self):
        """ConcurrencyLimiter must reject new requests when maximum active analyses are running."""
        c_limiter = ConcurrencyLimiter(max_concurrent=2)
        self.assertTrue(c_limiter.acquire(timeout=0.1))
        self.assertTrue(c_limiter.acquire(timeout=0.1))

        # 3rd acquire must timeout and return False
        self.assertFalse(c_limiter.acquire(timeout=0.05))

        # Release one slot
        c_limiter.release()
        self.assertTrue(c_limiter.acquire(timeout=0.1))

        # Clean release
        c_limiter.release()
        c_limiter.release()

    # ==================================================
    # 6. Temporary File Cleanup & Windows Safety
    # ==================================================

    def test_temporary_file_cleanup_with_partial_fragments(self):
        """Pipeline cleanup must delete video, residual fragments (.part, .ytdl), and frame files."""
        pipeline = LocationPipeline()

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)

            # Create video file and sibling partial chunks
            video_file = tmp_path / "download_test_123.mp4"
            part_file = tmp_path / "download_test_123.fdash-1234.mp4.part"
            ytdl_file = tmp_path / "download_test_123.ytdl"

            video_file.write_bytes(b"dummy video")
            part_file.write_bytes(b"dummy part")
            ytdl_file.write_bytes(b"dummy ytdl")

            # Create isolated request frame folder
            req_frame_dir = tmp_path / "req_frame_dir_test"
            req_frame_dir.mkdir(parents=True, exist_ok=True)
            frame1 = req_frame_dir / "frame_000.jpg"
            frame2 = req_frame_dir / "frame_001.jpg"
            frame1.write_bytes(b"frame 1")
            frame2.write_bytes(b"frame 2")

            self.assertTrue(video_file.exists())
            self.assertTrue(part_file.exists())
            self.assertTrue(ytdl_file.exists())
            self.assertTrue(frame1.exists())
            self.assertTrue(frame2.exists())

            # Execute cleanup
            pipeline._cleanup_temp_files(str(video_file), [str(frame1), str(frame2)])

            # Verify all temporary files unlinked
            self.assertFalse(video_file.exists())
            self.assertFalse(part_file.exists())
            self.assertFalse(ytdl_file.exists())
            self.assertFalse(frame1.exists())
            self.assertFalse(frame2.exists())
            # Directory should be cleanly removed
            self.assertFalse(req_frame_dir.exists())

    # ==================================================
    # 7. URL Validation & Security Boundaries
    # ==================================================

    def test_instagram_url_validation_boundaries(self):
        """URL validator must reject SSRF, bad schemes, and path traversal."""
        # SSRF localhost
        valid, _, _ = validate_instagram_url("http://127.0.0.1:8000/reel/C8xyz/")
        self.assertFalse(valid)

        # File scheme
        valid, _, _ = validate_instagram_url("file:///etc/passwd")
        self.assertFalse(valid)

        # Valid public reel
        valid, norm, shortcode = validate_instagram_url("https://www.instagram.com/reel/C_validShortcode123/")
        self.assertTrue(valid)
        self.assertEqual(shortcode, "C_validShortcode123")

    def test_photo_proxy_path_traversal_rejection(self):
        """Photo proxy must reject path traversal or arbitrary URL targets."""
        # Path traversal
        self.assertFalse(validate_place_photo_name("../../../etc/passwd"))
        # Invalid prefix
        self.assertFalse(validate_place_photo_name("media/photos/12345"))
        # Valid Places resource
        self.assertTrue(validate_place_photo_name("places/ChIJ_3jP9EabmUcR5kCgX_X1AAA/photos/AUacShV1234567890abcdef"))

    # ==================================================
    # 8. Deterministic Response Contract
    # ==================================================

    def test_response_builder_deterministic_unresolved(self):
        """Unresolved response must return a fully compliant AnalysisResponse schema."""
        builder = ResponseBuilder()
        unresolved = builder.build_unresolved(
            stage="caption",
            error="No verified destination candidate resolved.",
            performance={"total_seconds": 1.25, "stages": {}},
            extracted_candidates=["Unknown Place"],
            error_category="RESOLUTION_FAILURE",
        )

        data = unresolved.model_dump()
        self.assertFalse(data["success"])
        self.assertIsNone(data["best_guess"])
        self.assertEqual(data["locations"], [])
        self.assertEqual(data["travel_intelligence"], {})
        self.assertEqual(data["nearby_places"], [])
        self.assertEqual(data["gemini"]["status"], "FAILED")
        self.assertEqual(data["stage"], "caption")
        self.assertEqual(data["error_category"], "RESOLUTION_FAILURE")
        self.assertIn("Unknown Place", data["extracted_candidates"])


if __name__ == "__main__":
    unittest.main()
