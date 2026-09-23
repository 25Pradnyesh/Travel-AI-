import io
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import MagicMock, patch

from engine.app.api.analyze import AnalyzeRequest, analyze
from engine.app.main import configure_cors, validate_configuration
from engine.app.pipelines.location_pipeline import LocationPipeline
from engine.app.services.maps.google_places_service import GooglePlacesService
from engine.app.services.travel.weather_service import WeatherService
from engine.providers.instagram.provider import InstagramYtDlpProvider


class TestPhase5ProductionHardening(unittest.TestCase):

    # ==================================================
    # 1. API Boundary: Malformed URL Validation
    # ==================================================

    def test_malformed_url_rejected_at_api_boundary(self):
        """Malformed or non-Instagram Reel URLs must be rejected before expensive processing."""
        invalid_urls = [
            "",
            "   ",
            "not-a-url",
            "https://example.com/video.mp4",
            "https://youtube.com/watch?v=12345",
            "https://www.instagram.com/p/post_id_not_a_reel/",
            "https://instagram.com/stories/username/12345/",
            "ftp://instagram.com/reel/123",
        ]

        for bad_url in invalid_urls:
            with self.subTest(url=bad_url):
                with self.assertRaises(ValueError) as ctx:
                    AnalyzeRequest(reel_url=bad_url)
                self.assertIn("Enter a valid public Instagram Reel URL", str(ctx.exception))

        # Valid Reel URLs should pass validation
        valid_urls = [
            "https://www.instagram.com/reel/DN2XxxY2O7-/",
            "https://instagram.com/reel/DN2XxxY2O7-",
            "https://www.instagram.com/reels/C_xyz123-ABC/",
            "http://instagram.com/reel/1234567890_test",
        ]
        for good_url in valid_urls:
            with self.subTest(url=good_url):
                req = AnalyzeRequest(reel_url=good_url)
                self.assertEqual(req.target_url, good_url)

    # ==================================================
    # 2. Temporary Resource Cleanup: Partial Download Cleanup
    # ==================================================

    def test_temp_download_cleanup_on_failure(self):
        """Partial files (.part, .ytdl) are cleanly deleted on download failure."""
        provider = InstagramYtDlpProvider()
        test_id = "test_uuid_failure_cleanup"

        # Create simulated partial files
        part_file = provider.download_dir / f"{test_id}.fdash.mp4.part"
        ytdl_file = provider.download_dir / f"{test_id}.ytdl"
        full_file = provider.download_dir / f"{test_id}.mp4"

        part_file.write_text("partial data", encoding="utf-8")
        ytdl_file.write_text("ytdl state", encoding="utf-8")
        full_file.write_text("video content", encoding="utf-8")

        self.assertTrue(part_file.exists())
        self.assertTrue(ytdl_file.exists())
        self.assertTrue(full_file.exists())

        # Trigger cleanup
        provider._cleanup_partial_files(test_id)

        self.assertFalse(part_file.exists())
        self.assertFalse(ytdl_file.exists())
        self.assertFalse(full_file.exists())

    # ==================================================
    # 3. Temporary Resource Cleanup: Pipeline Exception Handling
    # ==================================================

    def test_pipeline_temp_cleanup_on_exception(self):
        """Video and extracted frames are unlinked when pipeline encounters an exception."""
        pipeline = LocationPipeline()

        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_vid:
            tmp_vid.write(b"video bytes")
            video_path = tmp_vid.name

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_frame1:
            tmp_frame1.write(b"frame 1")
            frame1_path = tmp_frame1.name

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_frame2:
            tmp_frame2.write(b"frame 2")
            frame2_path = tmp_frame2.name

        self.assertTrue(Path(video_path).exists())
        self.assertTrue(Path(frame1_path).exists())
        self.assertTrue(Path(frame2_path).exists())

        # Cleanup should remove all created temp resources
        pipeline._cleanup_temp_files(video_path, [frame1_path, frame2_path])

        self.assertFalse(Path(video_path).exists())
        self.assertFalse(Path(frame1_path).exists())
        self.assertFalse(Path(frame2_path).exists())

        # Idempotency: Calling cleanup again on already unlinked paths must not raise
        pipeline._cleanup_temp_files(video_path, [frame1_path, frame2_path])

    # ==================================================
    # 4. External Service Secret Leakage Prevention: Weather
    # ==================================================

    def test_secret_sanitization_in_weather_service(self):
        """WeatherService must never leak OPENWEATHER_API_KEY in stdout, logs, or error responses."""
        secret_key = "SECRET_OPENWEATHER_KEY_ABC123"
        weather_service = WeatherService()
        weather_service.api_key = secret_key

        import requests
        fake_exception = requests.RequestException(
            f"Error connecting to https://api.openweathermap.org/data/2.5/weather?appid={secret_key}&lat=47.1"
        )

        with patch("requests.get", side_effect=fake_exception):
            output_capture = io.StringIO()
            with patch("sys.stdout", output_capture):
                result = weather_service.get_weather(47.368, 10.923)

            logged_output = output_capture.getvalue()
            # Must NOT contain the secret API key
            self.assertNotIn(secret_key, logged_output)
            # Must degrade gracefully to empty weather dictionary
            self.assertEqual(result, weather_service.empty())

    # ==================================================
    # 5. External Service Secret Leakage Prevention: Google Places
    # ==================================================

    def test_secret_sanitization_in_google_places(self):
        """GooglePlacesService must not leak raw secrets or dump sensitive responses."""
        secret_key = "AIzaSyTestPlacesSecretKey"
        service = GooglePlacesService()
        service.api_key = secret_key

        import requests
        fake_error = requests.RequestException(f"Connection error to API with header X-Goog-Api-Key: {secret_key}")

        with patch("requests.post", side_effect=fake_error):
            output_capture = io.StringIO()
            with patch("sys.stdout", output_capture):
                results = service.search("Seebensee")

            logged_output = output_capture.getvalue()
            self.assertNotIn(secret_key, logged_output)
            self.assertEqual(results, [])

    # ==================================================
    # 6. CORS Configuration Hardening
    # ==================================================

    def test_cors_configuration_hardening(self):
        """CORS configuration handles explicit production origins and disallows wildcard with credentials."""
        # Case A: Default (no env var)
        origins, allow_creds = configure_cors(None)
        self.assertIn("http://localhost:3000", origins)
        self.assertIn("http://127.0.0.1:3000", origins)
        self.assertTrue(allow_creds)

        # Case B: Explicit production domains
        prod_origins_str = "https://travel-ai.com, https://app.travel-ai.com"
        origins, allow_creds = configure_cors(prod_origins_str)
        self.assertIn("https://travel-ai.com", origins)
        self.assertIn("https://app.travel-ai.com", origins)
        self.assertIn("http://localhost:3000", origins)
        self.assertTrue(allow_creds)

        # Case C: Wildcard '*' disables credentials for CORS compliance
        origins, allow_creds = configure_cors("*")
        self.assertEqual(origins, ["*"])
        self.assertFalse(allow_creds, "Wildcard origin must disallow credentials to avoid security violation")

    # ==================================================
    # 7. Required Configuration Validation
    # ==================================================

    def test_configuration_validation(self):
        """Startup validation correctly diagnoses missing configuration without leaking secrets."""
        with patch.dict(os.environ, {"GOOGLE_PLACES_API_KEY": "test_key", "GEMINI_API_KEY": ""}):
            status = validate_configuration()
            self.assertTrue(status["google_places_configured"])
            self.assertFalse(status["gemini_configured"])

        with patch.dict(os.environ, {"GOOGLE_PLACES_API_KEY": "", "GEMINI_API_KEY": ""}):
            output_capture = io.StringIO()
            with patch("sys.stdout", output_capture):
                status = validate_configuration()
            self.assertFalse(status["google_places_configured"])
            self.assertIn("CONFIGURATION WARNING", output_capture.getvalue())


if __name__ == "__main__":
    unittest.main()
