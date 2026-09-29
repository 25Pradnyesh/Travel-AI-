"""
Stage 10 — Production Reliability & Observability Regression Tests.

Validates:
1. Request ID creation, Propagation, and Middleware.
2. Pipeline Stage Timing and Granular Measurement.
3. Successful Pipeline Instrumentation and Telemetry Serialization.
4. Failed-Stage Instrumentation and Error Categorization.
5. Production Logging and Sensitive Value Redaction.
6. Metrics Aggregation across analysis lifecycles.
"""

import time
import unittest
from unittest.mock import MagicMock, patch
import uuid

from fastapi.testclient import TestClient

from engine.app.main import app
from engine.domain.schemas.responses import AnalysisResponse
from engine.observability import (
    ErrorCategory,
    PipelineStage,
    RequestContext,
    StructuredLogger,
    categorize_error,
    get_current_context,
    get_metrics_aggregator,
    measure_stage,
    redact_sensitive_data,
    sanitize_dict,
    sanitize_url,
    set_current_context,
    start_request_context,
)
from engine.app.services.response.response_builder import ResponseBuilder
from engine.app.pipelines.location_pipeline import LocationPipeline


class TestRequestIDAndContext(unittest.TestCase):
    """Tests for Request ID generation, propagation, and context handling."""

    def tearDown(self):
        set_current_context(None)

    def test_start_request_context_generates_uuid(self):
        ctx = start_request_context()
        self.assertIsNotNone(ctx.request_id)
        # Should be a valid UUID format
        parsed = uuid.UUID(ctx.request_id)
        self.assertEqual(str(parsed), ctx.request_id)
        self.assertIs(get_current_context(), ctx)

    def test_start_request_context_preserves_explicit_id(self):
        custom_id = "req-custom-trace-12345"
        ctx = start_request_context(request_id=custom_id, url="https://instagram.com/reel/xyz")
        self.assertEqual(ctx.request_id, custom_id)
        self.assertIn("instagram.com/reel/xyz", ctx.url)
        self.assertIs(get_current_context(), ctx)

    def test_fastapi_middleware_propagates_incoming_request_id(self):
        client = TestClient(app)
        custom_trace = "trace-test-header-999"
        resp = client.get("/", headers={"X-Request-ID": custom_trace})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.headers.get("X-Request-ID"), custom_trace)

    def test_fastapi_middleware_generates_request_id_if_missing(self):
        client = TestClient(app)
        resp = client.get("/")
        self.assertEqual(resp.status_code, 200)
        generated_id = resp.headers.get("X-Request-ID")
        self.assertIsNotNone(generated_id)
        # Must parse as valid UUID
        parsed = uuid.UUID(generated_id)
        self.assertEqual(str(parsed), generated_id)


class TestStageTimingAndTelemetry(unittest.TestCase):
    """Tests for stage execution timing, external latency tracking, and telemetry formatting."""

    def setUp(self):
        self.ctx = start_request_context(request_id="test-timing-123")

    def tearDown(self):
        set_current_context(None)

    def test_measure_stage_timing(self):
        with measure_stage(PipelineStage.CANDIDATE_GENERATION):
            time.sleep(0.02)

        self.assertIn(str(PipelineStage.CANDIDATE_GENERATION), self.ctx.stage_durations)
        dur = self.ctx.stage_durations[str(PipelineStage.CANDIDATE_GENERATION)]
        self.assertGreaterEqual(dur, 0.015)

    def test_record_external_call_accumulates_latencies_and_retries(self):
        self.ctx.record_external_call("google_places_search", 0.15, retries=0)
        self.ctx.record_external_call("google_places_search", 0.20, retries=1)
        self.ctx.record_external_call("gemini_verification", 0.85, retries=0)

        self.assertAlmostEqual(self.ctx.external_latencies["google_places_search"], 0.35, places=2)
        self.assertAlmostEqual(self.ctx.external_latencies["gemini_verification"], 0.85, places=2)
        self.assertEqual(self.ctx.retry_counts["google_places_search"], 1)

    def test_get_telemetry_dict_contains_all_14_required_fields(self):
        self.ctx.success = True
        self.ctx.selected_candidate = "Lake Como, Italy"
        self.ctx.confidence = 95.0
        self.ctx.confidence_level = "VERY_HIGH"
        self.ctx.places_resolution_status = "FOUND"
        self.ctx.gemini_verification_status = "VERIFIED"
        self.ctx.final_stage = "caption"
        self.ctx.evidence_sources = ["caption", "ocr"]
        self.ctx.candidate_count = 3
        self.ctx.stage_durations["candidate_generation"] = 0.05

        telemetry = self.ctx.get_telemetry_dict()

        expected_fields = [
            "request_id",
            "total_request_duration_seconds",
            "stage_durations",
            "success",
            "failure_stage",
            "error_category",
            "external_service_latency",
            "retry_counts",
            "evidence_sources_used",
            "candidate_count",
            "selected_candidate",
            "confidence",
            "confidence_level",
            "google_places_resolution_status",
            "gemini_verification_status",
            "final_pipeline_stage",
        ]

        for f in expected_fields:
            self.assertIn(f, telemetry, f"Missing required telemetry field: {f}")

        self.assertEqual(telemetry["request_id"], "test-timing-123")
        self.assertTrue(telemetry["success"])
        self.assertEqual(telemetry["selected_candidate"], "Lake Como, Italy")
        self.assertEqual(telemetry["final_pipeline_stage"], "caption")


class TestErrorCategorization(unittest.TestCase):
    """Tests for structured, machine-readable error categorization."""

    def test_timeout_categorization(self):
        self.assertEqual(categorize_error(TimeoutError("Connection timed out")), ErrorCategory.TIMEOUT)
        self.assertEqual(categorize_error(Exception("Read timed out on socket")), ErrorCategory.TIMEOUT)

    def test_media_unavailable_categorization(self):
        exc = FileNotFoundError("Video file not found at path")
        self.assertEqual(categorize_error(exc), ErrorCategory.MEDIA_UNAVAILABLE)
        self.assertEqual(categorize_error(Exception("This Reel is a private post and unavailable")), ErrorCategory.MEDIA_UNAVAILABLE)

    def test_extraction_failure_categorization(self):
        self.assertEqual(categorize_error(Exception("yt_dlp extractor error"), stage="instagram_extraction"), ErrorCategory.EXTRACTION_FAILURE)

    def test_ocr_failure_categorization(self):
        self.assertEqual(categorize_error(Exception("EasyOCR failed to load model"), stage="evidence_ocr"), ErrorCategory.OCR_FAILURE)

    def test_speech_failure_categorization(self):
        self.assertEqual(categorize_error(Exception("Whisper subprocess returned non-zero exit code"), stage="evidence_speech"), ErrorCategory.SPEECH_FAILURE)

    def test_candidate_generation_failure_categorization(self):
        self.assertEqual(categorize_error(Exception("Regex parsing crash in entity extractor"), stage="candidate_generation"), ErrorCategory.CANDIDATE_GENERATION_FAILURE)

    def test_external_api_failure_categorization(self):
        self.assertEqual(categorize_error(Exception("Google Places API quota exceeded (HTTP 429)")), ErrorCategory.EXTERNAL_API_FAILURE)
        self.assertEqual(categorize_error(Exception("Google Places API 403 Forbidden: Invalid API Key")), ErrorCategory.EXTERNAL_API_FAILURE)

    def test_verification_failure_categorization(self):
        self.assertEqual(categorize_error(Exception("Gemini Vision response parser error"), stage="gemini_verification"), ErrorCategory.VERIFICATION_FAILURE)

    def test_resolution_failure_categorization(self):
        self.assertEqual(categorize_error(message="No credible travel destination found"), ErrorCategory.RESOLUTION_FAILURE)
        self.assertEqual(categorize_error(message="No verified destination candidate resolved"), ErrorCategory.RESOLUTION_FAILURE)

    def test_unexpected_internal_failure_fallback(self):
        self.assertEqual(categorize_error(ZeroDivisionError("division by zero")), ErrorCategory.UNEXPECTED_INTERNAL_FAILURE)


class TestSensitiveDataRedaction(unittest.TestCase):
    """Tests for redacting secrets, API keys, credentials, cookies, and raw media."""

    def test_google_places_api_key_redaction(self):
        sample_key = "AIzaSyD-1234567890abcdefghijklmnopqrstuv"
        text = f"Calling Google Places with key: {sample_key} for query"
        redacted = redact_sensitive_data(text)
        self.assertNotIn(sample_key, redacted)
        self.assertIn("AIza...[REDACTED_API_KEY]", redacted)

    def test_bearer_token_redaction(self):
        header = "Authorization: Bearer ya29.a0AfH6SMDh498fjsd98fsd987fsdf"
        redacted = redact_sensitive_data(header)
        self.assertNotIn("ya29.", redacted)
        self.assertIn("Bearer [REDACTED_TOKEN]", redacted)

    def test_cookie_redaction(self):
        cookie = "sessionid=abcd1234efgh; csrftoken=token998877; ds_user_id=12345678"
        redacted = redact_sensitive_data(cookie)
        self.assertNotIn("abcd1234efgh", redacted)
        self.assertNotIn("token998877", redacted)
        self.assertNotIn("12345678", redacted)
        self.assertIn("sessionid=[REDACTED]", redacted)
        self.assertIn("csrftoken=[REDACTED]", redacted)
        self.assertIn("ds_user_id=[REDACTED]", redacted)

    def test_data_uri_redaction(self):
        data_uri = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
        redacted = redact_sensitive_data(f"Thumbnail preview: {data_uri}")
        self.assertNotIn("/9j/4AAQSkZJRg", redacted)
        self.assertIn("[REDACTED_MEDIA]", redacted)

    def test_sanitize_url(self):
        url = "https://places.googleapis.com/v1/places:searchText?key=AIzaSyD-SecretKey&query=Eiffel+Tower&fields=places.id"
        sanitized = sanitize_url(url)
        self.assertNotIn("AIzaSyD-SecretKey", sanitized)
        self.assertIn("key=%5BREDACTED%5D", sanitized)
        self.assertIn("query=Eiffel+Tower", sanitized)

    def test_sanitize_dict_recursively(self):
        payload = {
            "api_key": "AIzaSySecret",
            "headers": {
                "Cookie": "sessionid=xyz123",
                "normal": "value",
            },
            "destinations": [
                {"name": "Colosseum", "token": "secret_token"},
            ],
        }
        cleaned = sanitize_dict(payload)
        self.assertEqual(cleaned["api_key"], "[REDACTED]")
        self.assertIn("[REDACTED]", cleaned["headers"]["Cookie"])
        self.assertEqual(cleaned["headers"]["normal"], "value")
        self.assertEqual(cleaned["destinations"][0]["token"], "[REDACTED]")


class TestPipelineInstrumentationAndIntegration(unittest.TestCase):
    """Integration-level regression tests for pipeline observability."""

    def setUp(self):
        self.builder = ResponseBuilder()

    def tearDown(self):
        set_current_context(None)

    def test_response_builder_embeds_request_id_and_metrics_when_context_active(self):
        ctx = start_request_context(request_id="trace-resp-builder-42")
        ctx.selected_candidate = "Hallstatt, Austria"
        ctx.success = True
        ctx.confidence = 96.0

        winner = {
            "score": 96.0,
            "confidence": "VERY_HIGH",
            "place": {
                "place_id": "test_id_1",
                "travel_name": "Hallstatt, Austria",
                "display_name": "Hallstatt",
                "country": "Austria",
                "latitude": 47.5622,
                "longitude": 13.6493,
                "types": ["tourist_attraction"],
            },
        }

        perf = {"total_seconds": 1.5, "stages": {"caption": 0.5}}
        resp = self.builder.build(
            winner=winner,
            gemini_result=None,
            stage="caption",
            performance=perf,
        )

        self.assertEqual(resp.request_id, "trace-resp-builder-42")
        self.assertTrue(resp.success)
        self.assertIsNotNone(resp.performance)
        self.assertEqual(resp.performance["request_id"], "trace-resp-builder-42")
        self.assertIn("metrics", resp.performance)
        self.assertEqual(resp.performance["metrics"]["selected_candidate"], "Hallstatt, Austria")

    def test_response_builder_unresolved_contains_error_category(self):
        ctx = start_request_context(request_id="trace-unresolved-99")
        perf = {"total_seconds": 0.8, "stages": {}}
        resp = self.builder.build_unresolved(
            stage="failed",
            error="No destination could be verified from the provided Reel.",
            performance=perf,
            error_category=ErrorCategory.RESOLUTION_FAILURE,
        )

        self.assertEqual(resp.request_id, "trace-unresolved-99")
        self.assertFalse(resp.success)
        self.assertEqual(resp.error_category, "RESOLUTION_FAILURE")
        self.assertIn("No destination could be verified", resp.error)
        # Verify stack traces are NOT in error
        self.assertNotIn("Traceback", resp.error)

    def test_metrics_aggregator_tracks_request_history(self):
        aggregator = get_metrics_aggregator()
        aggregator.reset()

        telemetry_success = {
            "request_id": "req-1",
            "total_request_duration_seconds": 2.0,
            "stage_durations": {"candidate_generation": 0.1, "scoring": 0.05},
            "success": True,
        }
        telemetry_fail = {
            "request_id": "req-2",
            "total_request_duration_seconds": 1.0,
            "stage_durations": {"candidate_generation": 0.05},
            "success": False,
            "error_category": "RESOLUTION_FAILURE",
            "failure_stage": "location_resolution",
        }

        aggregator.record_request(telemetry_success)
        aggregator.record_request(telemetry_fail)

        summary = aggregator.get_summary()
        self.assertEqual(summary["total_requests"], 2)
        self.assertEqual(summary["successful_requests"], 1)
        self.assertEqual(summary["failed_requests"], 1)
        self.assertEqual(summary["success_rate_percent"], 50.0)
        self.assertEqual(summary["error_categories"].get("RESOLUTION_FAILURE"), 1)
        self.assertEqual(summary["failure_stages"].get("location_resolution"), 1)


if __name__ == "__main__":
    unittest.main()
