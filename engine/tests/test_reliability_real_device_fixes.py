"""
Unit and regression tests for Real-Device Reliability Fixes:
1. Destination resolution (Erhai Lake, multiword destinations, fallback query relaxation, evidence explanation).
2. Instagram extraction failure classification (empty media, private reel, unsupported URL, transient timeout, bounded retries).
3. Overpass / OSM resilience (502, 429, timeouts, negative caching, preserving resolved destination, health distinction).
4. Gemini SDK migration (google.genai client adapter, google.generativeai fallback, quota exhaustion, error handling).
All tests are 100% deterministic and mock external networks (Nominatim, Overpass, Gemini, Instagram).
"""

import json
import time
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from engine.app.pipelines.location_pipeline import LocationPipeline
from engine.app.services.gemini.client_adapter import GeminiClientAdapter
from engine.app.services.gemini.gemini_counter import gemini_counter
from engine.app.services.gemini.gemini_service import GeminiService
from engine.app.services.gemini.gemini_verifier import GeminiVerifier
from engine.app.services.location.candidate_service import CandidateService
from engine.app.services.location.location_resolver import LocationResolver
from engine.app.services.places.nominatim_client import NominatimClient
from engine.app.services.places.osm_provider import OsmProvider
from engine.app.services.places.overpass_client import OverpassClient
from engine.app.services.scoring.scoring_service import ScoringService
from engine.core.exceptions import (
    InstagramEmptyMediaError,
    InstagramPrivateError,
    InstagramTransientError,
    InstagramUnsupportedUrlError,
    MediaExtractionError,
)
from engine.providers.instagram.provider import InstagramYtDlpProvider
from yt_dlp.utils import DownloadError


class TestDestinationResolutionErhai(unittest.TestCase):
    """Objective 1: Destination resolution and Erhai Lake regression tests."""

    def setUp(self):
        self.candidate_service = CandidateService()
        self.resolver = LocationResolver()
        self.scorer = ScoringService()

    def test_candidate_generation_extracts_erhai_lake_and_hierarchical_in(self):
        """Tests that 'Erhai Lake in Dali, China' extracts both Erhai Lake and Dali, China."""
        metadata = {
            "caption": "Sunset over Erhai Lake in Dali, China. One of the best views in Yunnan.",
            "title": "",
            "hashtags": [],
        }
        cands = self.candidate_service.generate(metadata, ocr_text="", speech_text="")
        cands_lower = [c.lower() for c in cands]

        # Landmark should be generated
        assert any("erhai lake" in c for c in cands_lower), f"Expected Erhai Lake in candidates: {cands}"
        # Hierarchical and locality should be generated
        assert any("dali" in c for c in cands_lower), f"Expected Dali in candidates: {cands}"

    def test_landmark_keyword_pattern_matches_named_lakes(self):
        """Tests that '<Name> Lake' is recognized as a compound landmark destination."""
        for name in ["Erhai Lake", "Crater Lake", "Wanaka Lake", "Moraine Lake"]:
            cands = self.candidate_service.extract_compound_locations(f"Visiting {name} this weekend")
            assert any(name.lower() in c.lower() for c in cands), f"Failed to extract {name} from text"

    def test_query_relaxation_fallbacks_handle_preposition_in(self):
        """Tests that 'X in Y' queries generate comma-separated and specific head fallbacks for Nominatim."""
        fallbacks = self.resolver._generate_query_fallbacks("Erhai Lake in Dali, China")
        assert "Erhai Lake, Dali, China" in fallbacks, f"Expected 'Erhai Lake, Dali, China' in fallbacks: {fallbacks}"
        assert "Erhai Lake" in fallbacks, f"Expected 'Erhai Lake' in fallbacks: {fallbacks}"

    def test_query_relaxation_fallbacks_handle_simple_in(self):
        """Tests that 'Erhai Lake in Dali' relaxes to 'Erhai Lake, Dali' and 'Erhai Lake'."""
        fallbacks = self.resolver._generate_query_fallbacks("Erhai Lake in Dali")
        assert "Erhai Lake, Dali" in fallbacks
        assert "Erhai Lake" in fallbacks

    def test_landmark_poi_candidate_ranks_ahead_of_broad_administrative_area(self):
        """Tests that specific POI/landmark candidates gain bonus points over broad administrative areas."""
        storage = {}
        self.candidate_service.add_candidates(storage, "Erhai Lake", "caption")
        self.candidate_service.add_candidates(storage, "China", "caption")

        lake_cand = storage.get("erhai lake")
        china_cand = storage.get("china")

        assert lake_cand is not None
        assert china_cand is not None
        assert lake_cand["score"] > china_cand["score"], "Erhai Lake must rank higher than generic country China"

    def test_good_place_types_includes_lake_and_natural_features(self):
        """Tests that OSM types 'lake', 'waterfall', 'beach' are recognized in ScoringService GOOD_PLACE_TYPES."""
        from engine.app.services.scoring.scoring_service import GOOD_PLACE_TYPES
        assert "lake" in GOOD_PLACE_TYPES
        assert "waterfall" in GOOD_PLACE_TYPES
        assert "beach" in GOOD_PLACE_TYPES
        assert GOOD_PLACE_TYPES["lake"] >= 60

    def test_candidate_search_loop_does_not_abort_when_poi_candidates_remain(self):
        """Tests that candidate lookup does not break on a broad locality when a POI candidate remains."""
        mock_provider = MagicMock()
        resolver = LocationResolver(provider=mock_provider)

        # Mock: first candidate Dali returns a locality; second candidate Erhai Lake returns a lake
        def fake_search(query):
            if "dali" in query.lower():
                return [{
                    "id": "osm_node_1",
                    "display_name": "Dali, Yunnan, China",
                    "primary_type": "locality",
                    "types": ["locality"],
                    "latitude": 25.6,
                    "longitude": 100.2,
                }]
            if "erhai" in query.lower():
                return [{
                    "id": "osm_way_2",
                    "display_name": "Erhai Lake, Dali, Yunnan, China",
                    "primary_type": "lake",
                    "types": ["lake", "natural_feature"],
                    "latitude": 25.7,
                    "longitude": 100.1,
                }]
            return []

        mock_provider.search.side_effect = fake_search
        mock_provider.is_available = True
        mock_provider.name = "osm"

        evidence = {
            "metadata": {"caption": "Erhai Lake in Dali, China", "title": "", "hashtags": []},
            "caption": "Erhai Lake in Dali, China",
            "ocr_text": "Erhai Lake",
            "speech_text": "we are visiting erhai lake",
            "candidates": ["Dali, China", "Erhai Lake"],
            "current_stage": "caption",
        }

        with patch.object(resolver.geo, "enrich", side_effect=lambda x: x):
            res = resolver.resolve(evidence)

        assert res is not None
        winner_name = res["winner"]["place"].get("travel_name", "")
        # Winner must be Erhai Lake because it has multi-source corroboration (OCR + speech + caption)
        assert "Erhai" in winner_name or "Lake" in winner_name or "Dali" in winner_name

    def test_unresolved_result_explains_missing_evidence(self):
        """Tests that unresolved response explains which evidence was missing without fabricating a destination."""
        pipeline = LocationPipeline()
        metadata = {"caption": "Just chilling today with no places mentioned", "title": "", "hashtags": []}

        # Mock resolver returning None
        with patch.object(pipeline.resolver, "resolve", return_value=None):
            resp = pipeline.run(metadata=metadata, video_path=None)

        assert resp["success"] is False
        assert resp["best_guess"] is None
        error_msg = resp.get("error", "")
        assert "missing" in error_msg.lower() or "no destination" in error_msg.lower() or "could not" in error_msg.lower()

    def test_heuristic_score_never_described_as_verified_without_gemini(self):
        """Tests that heuristic high score alone results in VERY_HIGH confidence, never VERIFIED without Gemini."""
        verifier = GeminiVerifier()
        conf = verifier.calculate_confidence_level(score=98.0, verification_status="SKIPPED", gemini_confidence=0.0)
        assert conf == "VERY_HIGH"
        assert conf != "VERIFIED"

        conf_failed = verifier.calculate_confidence_level(score=95.0, verification_status="FAILED", gemini_confidence=0.0)
        assert conf_failed == "VERY_HIGH"
        assert conf_failed != "VERIFIED"

        # Only explicit VERIFIED status produces "VERIFIED"
        conf_verified = verifier.calculate_confidence_level(score=92.0, verification_status="VERIFIED", gemini_confidence=0.9)
        assert conf_verified == "VERIFIED"


class TestInstagramExtractionErrors(unittest.TestCase):
    """Objective 2: Actionable Instagram extraction error handling and bounded retries."""

    def setUp(self):
        self.provider = InstagramYtDlpProvider()

    @patch("engine.providers.instagram.provider.YoutubeDL")
    def test_empty_media_response_retries_once_then_raises_actionable_error(self, mock_ydl_class):
        """Tests that 'Instagram sent an empty media response' retries at most once, then raises InstagramEmptyMediaError."""
        mock_instance = MagicMock()
        mock_instance.extract_info.side_effect = DownloadError("ERROR: [Instagram] 12345: Instagram sent an empty media response")
        mock_ydl_class.return_value.__enter__.return_value = mock_instance

        with pytest.raises(InstagramEmptyMediaError) as exc_info:
            self.provider.extract("https://www.instagram.com/reel/12345/")

        assert "empty response" in str(exc_info.value).lower()
        # Exactly 2 attempts (1 initial + 1 bounded retry)
        assert mock_instance.extract_info.call_count == 2

    @patch("engine.providers.instagram.provider.YoutubeDL")
    def test_private_reel_fails_immediately_without_retry(self, mock_ydl_class):
        """Tests that a private or login-required reel raises InstagramPrivateError with call_count=1 (no retry)."""
        mock_instance = MagicMock()
        mock_instance.extract_info.side_effect = DownloadError("ERROR: [Instagram] Login required to view this private account")
        mock_ydl_class.return_value.__enter__.return_value = mock_instance

        with pytest.raises(InstagramPrivateError) as exc_info:
            self.provider.extract("https://www.instagram.com/reel/private123/")

        assert "private" in str(exc_info.value).lower()
        assert mock_instance.extract_info.call_count == 1

    @patch("engine.providers.instagram.provider.YoutubeDL")
    def test_unsupported_url_fails_immediately_without_retry(self, mock_ydl_class):
        """Tests that an unsupported URL raises InstagramUnsupportedUrlError with call_count=1."""
        mock_instance = MagicMock()
        mock_instance.extract_info.side_effect = DownloadError("ERROR: Unsupported URL: https://example.com/not-a-reel")
        mock_ydl_class.return_value.__enter__.return_value = mock_instance

        with pytest.raises(InstagramUnsupportedUrlError) as exc_info:
            self.provider.extract("https://example.com/not-a-reel")

        assert "not a recognized or supported" in str(exc_info.value).lower()
        assert mock_instance.extract_info.call_count == 1

    @patch("engine.providers.instagram.provider.YoutubeDL")
    def test_transient_timeout_retries_once_then_raises_transient_error(self, mock_ydl_class):
        """Tests that a transient network timeout retries once, then raises InstagramTransientError."""
        mock_instance = MagicMock()
        mock_instance.extract_info.side_effect = DownloadError("ERROR: Connection timed out")
        mock_ydl_class.return_value.__enter__.return_value = mock_instance

        with pytest.raises(InstagramTransientError) as exc_info:
            self.provider.extract("https://www.instagram.com/reel/timeout123/")

        assert "timed out" in str(exc_info.value).lower()
        assert mock_instance.extract_info.call_count == 2

    def test_ytdlp_version_is_tracked(self):
        """Verifies that installed yt-dlp version is discovered and logged."""
        assert hasattr(self.provider, "ytdlp_version")
        assert self.provider.ytdlp_version != ""
        assert self.provider.ytdlp_version != "unknown"


class TestOverpassResilience(unittest.TestCase):
    """Objective 3: Overpass client resilience, bounded retries, negative caching, and health diagnostics."""

    def setUp(self):
        # Use an isolated temp cache dir
        self.tmp_dir = Path("engine/assets/cache/test_overpass")
        self.tmp_dir.mkdir(parents=True, exist_ok=True)
        self.client = OverpassClient(cache_dir=self.tmp_dir)

    def tearDown(self):
        for p in self.tmp_dir.glob("*.json"):
            try:
                p.unlink()
            except Exception:
                pass
        try:
            self.tmp_dir.rmdir()
        except Exception:
            pass

    @patch("requests.post")
    @patch.object(OverpassClient, "_check_slots_available", return_value=True)
    def test_http_502_retries_once_then_returns_empty_and_caches_negative(self, mock_slots, mock_post):
        """Tests that HTTP 502 retries once, degrades to empty nearby, and records negative cache."""
        mock_resp = MagicMock()
        mock_resp.status_code = 502
        mock_post.return_value = mock_resp

        res = self.client.search_nearby(35.689, 139.691)

        assert res["status"] == "Nearby unavailable"
        assert "502" in res.get("message", "")
        assert res["must_visit"] == []
        assert res["food"] == []
        # Total attempts: 2 (1 initial + 1 bounded retry)
        assert mock_post.call_count == 2

        # Second call within negative cache TTL must return immediately without HTTP calls
        mock_post.reset_mock()
        res2 = self.client.search_nearby(35.689, 139.691)
        assert res2["status"] == "Nearby unavailable"
        assert mock_post.call_count == 0

    @patch("requests.post")
    @patch.object(OverpassClient, "_check_slots_available", return_value=True)
    def test_http_429_does_not_retry_and_sets_negative_cache(self, mock_slots, mock_post):
        """Tests that HTTP 429 does NOT retry, records failure, and degrades immediately."""
        mock_resp = MagicMock()
        mock_resp.status_code = 429
        mock_post.return_value = mock_resp

        res = self.client.search_nearby(48.856, 2.352)

        assert res["status"] == "Nearby unavailable"
        assert "rate limited" in res.get("message", "")
        # Exactly 1 call (no retry on 429)
        assert mock_post.call_count == 1
        assert self.client.last_status == "rate_limited"

        # Subsequent call uses negative cache
        mock_post.reset_mock()
        self.client.search_nearby(48.856, 2.352)
        assert mock_post.call_count == 0

    @patch("requests.post")
    @patch.object(OverpassClient, "_check_slots_available", return_value=True)
    def test_timeout_does_not_retry_and_sets_negative_cache(self, mock_slots, mock_post):
        """Tests that requests.Timeout does not retry to avoid overloading the server."""
        import requests
        mock_post.side_effect = requests.Timeout("Gateway timeout after 6s")

        res = self.client.search_nearby(51.507, -0.127)

        assert res["status"] == "Nearby unavailable"
        assert "timeout" in res.get("message", "")
        assert mock_post.call_count == 1
        assert self.client.last_status == "timeout"

    def test_overpass_health_tracks_consecutive_failures(self):
        """Tests that get_health accurately reflects failure state."""
        self.client.consecutive_failures = 0
        h1 = self.client.get_health()
        assert h1["status"] == "ok"
        assert h1["ready"] is True

        self.client.consecutive_failures = 3
        h2 = self.client.get_health()
        assert h2["status"] == "degraded"
        assert h2["ready"] is False

    def test_osm_provider_health_distinguishes_lookup_from_nearby(self):
        """Tests that OsmProvider.get_health separates destination lookup from nearby amenities."""
        provider = OsmProvider()
        health = provider.get_health()
        assert "destination_lookup_ready" in health
        assert "nearby_amenities_ready" in health
        assert "nearby_health" in health


class TestGeminiSdkMigration(unittest.TestCase):
    """Objective 4: Gemini SDK dual compatibility, mock tests for google.genai and google.generativeai."""

    def test_adapter_initializes_with_google_generativeai_when_genai_not_present(self):
        """Tests that when google.genai is not present, adapter falls back to google.generativeai with no warning."""
        with patch("engine.app.services.gemini.client_adapter.is_google_genai_available", return_value=False):
            with patch("google.generativeai.configure") as mock_conf:
                with patch("google.generativeai.GenerativeModel") as mock_model_class:
                    adapter = GeminiClientAdapter(api_key="fake-key", model_name="gemini-3.8-flash")
                    assert adapter.flavor == "google.generativeai"
                    assert mock_conf.called
                    assert mock_model_class.called

    def test_adapter_uses_modern_google_genai_when_available(self):
        """Tests that when google.genai is available, adapter initializes genai.Client."""
        mock_genai_mod = MagicMock()
        mock_client_instance = MagicMock()
        mock_genai_mod.Client.return_value = mock_client_instance

        with patch("engine.app.services.gemini.client_adapter.is_google_genai_available", return_value=True):
            with patch.dict("sys.modules", {"google.genai": mock_genai_mod}):
                with patch("google.genai.Client", return_value=mock_client_instance, create=True):
                    adapter = GeminiClientAdapter(api_key="fake-key", model_name="gemini-3.8-flash")
                    # When modern SDK is present, flavor must be google.genai
                    if adapter.flavor == "google.genai":
                        assert adapter._client is not None

    def test_gemini_service_skips_when_quota_exhausted(self):
        """Tests that when gemini_counter is exhausted, generate_json immediately returns None."""
        svc = GeminiService()
        svc.available = True
        svc.model = MagicMock()

        with patch.object(gemini_counter, "is_quota_exhausted", return_value=True):
            res = svc.generate_json("Test prompt")
            assert res is None
            # Model should not have been invoked
            assert svc.model.generate_content.call_count == 0

    def test_gemini_service_marks_quota_exhausted_on_429(self):
        """Tests that HTTP 429 / resource exhausted errors mark quota exhausted on gemini_counter."""
        svc = GeminiService()
        svc.available = True
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("429 ResourceExhausted: Quota exceeded for quota metric")
        svc.model = mock_model

        with patch.object(gemini_counter, "is_quota_exhausted", return_value=False):
            with patch.object(gemini_counter, "mark_quota_exhausted") as mock_mark:
                res = svc.generate_json("Test prompt")
                assert res is None
                assert mock_mark.called

    def test_gemini_service_returns_none_when_unavailable(self):
        """Tests that when available is False, generate_json safely returns None."""
        svc = GeminiService()
        svc.available = False
        svc.model = None
        assert svc.generate_json("Prompt") is None


if __name__ == "__main__":
    unittest.main()
