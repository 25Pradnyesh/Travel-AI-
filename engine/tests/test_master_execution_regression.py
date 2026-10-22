import os
import re
import unittest
from unittest.mock import MagicMock, patch

import requests

from engine.app.services.location.candidate_service import CandidateService
from engine.app.services.location.location_resolver import LocationResolver
from engine.app.services.scoring.scoring_service import ScoringService
from engine.app.services.gemini.gemini_service import GeminiService
from engine.app.services.gemini.gemini_verifier import GeminiVerifier
from engine.app.services.places.overpass_client import OverpassClient
from engine.app.pipelines.location_pipeline import LocationPipeline
from engine.app.services.response.response_builder import ResponseBuilder
from engine.domain.schemas.responses import AnalysisResponse
from fastapi.testclient import TestClient
from engine.app.main import app


class TestMasterExecutionRegression(unittest.TestCase):
    """
    Automated regression tests covering:
    1. OCR and caption both contain the same specific destination.
    2. OCR and caption provide complementary location evidence.
    3. Country possessive phrase does not override a specific destination.
    4. Equivalent candidates are deduplicated and evidence merged.
    5. Resolver works without Gemini.
    6. Resolver works when Overpass times out.
    7. Empty nearby results do not invalidate a strongly supported candidate.
    8. Gemini NotFound and empty responses are handled safely.
    9. Verification failure does not produce a verified-success status.
    10. Health endpoint conforms to contract schema.
    """

    def setUp(self):
        self.candidate_service = CandidateService()
        self.scoring_service = ScoringService()
        self.response_builder = ResponseBuilder()

    # -------------------------------------------------------------------------
    # 1. OCR and caption both contain the same specific destination
    # -------------------------------------------------------------------------
    def test_ocr_and_caption_same_destination(self):
        metadata = {
            "title": "Summer trip",
            "caption": "Exploring the serene beauty of Hallasan Mountain in South Korea! 📍 Hallasan Mountain",
        }
        ocr_text = "HALLASAN MOUNTAIN\nElevation 1,947m"

        candidates = self.candidate_service.generate(
            metadata=metadata,
            ocr_text=ocr_text,
            speech_text="",
        )

        # Hallasan Mountain should be extracted and have multiple source tags
        matched = [c for c in candidates if "hallasan" in c.lower()]
        self.assertTrue(len(matched) > 0, "Hallasan Mountain must be extracted as a candidate")

        mock_place = {
            "place_id": "osm_101",
            "id": "osm_101",
            "travel_name": "Hallasan Mountain, South Korea",
            "country": "South Korea",
            "latitude": 33.36,
            "longitude": 126.53,
            "primary_type": "mountain_peak",
            "types": ["mountain_peak", "natural_feature"],
            "matched_sources": ["caption", "ocr"],
        }

        evidence = {
            "title": metadata["title"],
            "caption": metadata["caption"],
            "ocr_text": ocr_text,
            "speech_text": "",
        }

        ranked = self.scoring_service.rank_places([mock_place], evidence)
        self.assertEqual(len(ranked), 1)
        top = ranked[0]["place"]
        # Both caption and OCR must be reflected in matched_sources
        self.assertIn("caption", top["matched_sources"])
        self.assertIn("ocr", top["matched_sources"])
        self.assertGreaterEqual(ranked[0]["score"], 70.0)

    # -------------------------------------------------------------------------
    # 2. OCR and caption provide complementary location evidence
    # -------------------------------------------------------------------------
    def test_ocr_and_caption_complementary_evidence(self):
        metadata = {
            "title": "Hidden Gems",
            "caption": "Found this incredible place while traveling in South Korea! #travel",
        }
        # Destination name only appears in the video OCR
        ocr_text = "Seongsan Ilchulbong\nSunrise Peak"

        candidates = self.candidate_service.generate(
            metadata=metadata,
            ocr_text=ocr_text,
            speech_text="",
        )

        matched = [c for c in candidates if "seongsan" in c.lower()]
        self.assertTrue(len(matched) > 0, "Destination from OCR must be extracted")

        mock_place = {
            "place_id": "osm_102",
            "id": "osm_102",
            "travel_name": "Seongsan Ilchulbong, South Korea",
            "country": "South Korea",
            "latitude": 33.458,
            "longitude": 126.942,
            "primary_type": "tourist_attraction",
            "types": ["natural_feature", "tourist_attraction"],
            "matched_sources": ["ocr"],
        }

        evidence = {
            "title": metadata["title"],
            "caption": metadata["caption"],
            "ocr_text": ocr_text,
            "speech_text": "",
        }

        ranked = self.scoring_service.rank_places([mock_place], evidence)
        self.assertEqual(len(ranked), 1)
        top = ranked[0]["place"]
        # OCR provided the place name, caption confirmed South Korea
        self.assertIn("ocr", top["matched_sources"])
        self.assertIn("caption", top["matched_sources"])
        self.assertGreaterEqual(ranked[0]["score"], 60.0)

    # -------------------------------------------------------------------------
    # 3. Country possessive phrase does not override a specific destination
    # -------------------------------------------------------------------------
    def test_country_possessive_does_not_override_destination(self):
        # Verify normalize_candidate strips trailing possessive
        norm_country = self.candidate_service.normalize_candidate("South Korea's")
        self.assertEqual(norm_country, "South Korea")

        norm_france = self.candidate_service.normalize_candidate("France's")
        self.assertEqual(norm_france, "France")

        norm_church = self.candidate_service.normalize_candidate("St. Joseph's Cathedral")
        self.assertEqual(norm_church, "St. Joseph's Cathedral", "Internal apostrophes must be preserved")

        # Now test scoring ranking between specific destination vs country possessive
        caption = "Visiting South Korea's most magical volcanic island: Hallasan National Park"
        evidence = {
            "title": "",
            "caption": caption,
            "ocr_text": "Hallasan National Park",
            "speech_text": "",
        }

        place_specific = {
            "place_id": "osm_specific",
            "id": "osm_specific",
            "travel_name": "Hallasan National Park, South Korea",
            "country": "South Korea",
            "latitude": 33.36,
            "longitude": 126.53,
            "primary_type": "national_park",
            "types": ["national_park", "natural_feature"],
            "matched_sources": ["caption", "ocr"],
        }

        place_country_possessive = {
            "place_id": "osm_country",
            "id": "osm_country",
            "travel_name": "South Korea, South Korea",
            "country": "South Korea",
            "latitude": 36.5,
            "longitude": 127.5,
            "primary_type": "country",
            "types": ["country"],
            "matched_sources": ["caption"],
        }

        ranked = self.scoring_service.rank_places(
            [place_country_possessive, place_specific],
            evidence,
        )

        # Specific landmark MUST rank higher than generic country
        self.assertGreater(len(ranked), 0)
        self.assertEqual(
            ranked[0]["place"]["travel_name"],
            "Hallasan National Park, South Korea",
            "Specific landmark must decisively outrank country candidate",
        )

    # -------------------------------------------------------------------------
    # 4. Equivalent candidates are deduplicated and evidence merged
    # -------------------------------------------------------------------------
    def test_equivalent_candidates_deduplicated_and_merged(self):
        caption = "Exploring the ancient ruins of Matera, Italy"
        evidence = {
            "title": "",
            "caption": caption,
            "ocr_text": "Sassi di Matera",
            "speech_text": "",
        }

        # Two records representing the same destination from different search hits
        place_node = {
            "place_id": "osm_node_1001",
            "id": "osm_node_1001",
            "travel_name": "Matera, Italy",
            "country": "Italy",
            "latitude": 40.666,
            "longitude": 16.604,
            "primary_type": "locality",
            "types": ["locality"],
            "matched_sources": ["caption"],
        }

        place_relation = {
            "place_id": "osm_relation_2002",
            "id": "osm_relation_2002",
            "travel_name": "Matera, Italy",
            "country": "Italy",
            "latitude": 40.668,
            "longitude": 16.605,
            "primary_type": "locality",
            "types": ["locality"],
            "matched_sources": ["ocr"],
            "photos": [{"url": "https://example.com/photo.jpg"}],
        }

        ranked = self.scoring_service.rank_places([place_node, place_relation], evidence)

        # Must be deduplicated down to 1 distinct entry
        self.assertEqual(len(ranked), 1, "Duplicate candidates must be deduplicated into 1")
        top = ranked[0]["place"]
        # Merged sources must contain both caption and ocr
        self.assertIn("caption", top["matched_sources"])
        self.assertIn("ocr", top["matched_sources"])

    # -------------------------------------------------------------------------
    # 5. Resolver works without Gemini
    # -------------------------------------------------------------------------
    def test_resolver_works_without_gemini(self):
        mock_provider = MagicMock()
        mock_provider.name = "osm"
        mock_provider.is_available = True
        mock_provider.search.return_value = [
            {
                "id": "osm_301",
                "display_name": "Fushimi Inari Taisha, Kyoto, Japan",
                "formatted_address": "Kyoto, Japan",
                "latitude": 34.967,
                "longitude": 135.772,
                "primary_type": "place_of_worship",
                "types": ["place_of_worship", "tourist_attraction"],
                "maps_url": "https://www.openstreetmap.org/node/301",
            }
        ]
        mock_provider.get_details.return_value = {}
        mock_provider.search_nearby.return_value = {"must_visit": [], "food": [], "stay": []}

        resolver = LocationResolver(provider=mock_provider)

        evidence = {
            "metadata": {"caption": "The thousands of vermilion torii gates at Fushimi Inari Taisha"},
            "title": "",
            "caption": "The thousands of vermilion torii gates at Fushimi Inari Taisha",
            "ocr_text": "Fushimi Inari Taisha",
            "speech_text": "",
        }

        result = resolver.resolve(evidence)
        self.assertIsNotNone(result)
        self.assertIn("winner", result)
        winner = result["winner"]
        self.assertIn("Fushimi Inari", winner["place"]["travel_name"])
        self.assertGreaterEqual(winner["score"], 60.0)

    # -------------------------------------------------------------------------
    # 6. Resolver works when Overpass times out
    # -------------------------------------------------------------------------
    def test_overpass_timeout_handled_gracefully(self):
        client = OverpassClient()
        with patch("requests.post", side_effect=requests.Timeout("Connection timed out after 6s")):
            nearby = client.search_nearby(latitude=33.36, longitude=126.53)
            self.assertEqual(nearby["must_visit"], [])
            self.assertEqual(nearby["food"], [])
            self.assertEqual(nearby["stay"], [])
            self.assertIn("timeout", nearby["message"])

    # -------------------------------------------------------------------------
    # 7. Empty nearby results do not invalidate a strongly supported candidate
    # -------------------------------------------------------------------------
    def test_empty_nearby_preserves_destination(self):
        winner = {
            "score": 85.0,
            "confidence": "HIGH",
            "place": {
                "id": "osm_401",
                "place_id": "osm_401",
                "travel_name": "Santorini, Greece",
                "display_name": "Santorini, Greece",
                "country": "Greece",
                "latitude": 36.393,
                "longitude": 25.461,
                "primary_type": "natural_feature",
                "types": ["natural_feature"],
                "matched_sources": ["caption", "ocr"],
                "nearby": {
                    "must_visit": [],
                    "food": [],
                    "stay": [],
                    "status": "Nearby unavailable (timeout)",
                },
            },
        }

        response = self.response_builder.build(
            winner=winner,
            gemini_result=None,
            stage="ocr",
        )

        self.assertTrue(response.success)
        self.assertIsNotNone(response.best_guess)
        self.assertEqual(response.best_guess.name, "Santorini, Greece")
        self.assertEqual(response.best_guess.confidence, 85)
        self.assertEqual(response.nearby_places, [])

    # -------------------------------------------------------------------------
    # 8. Gemini NotFound and empty responses are handled safely
    # -------------------------------------------------------------------------
    def test_gemini_not_found_handled_safely(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key_for_test", "GEMINI_MODEL": "invalid-model-name"}):
            gemini_svc = GeminiService()
            gemini_svc.available = True
            mock_model = MagicMock()
            # Simulate Google NotFound exception
            from google.api_core.exceptions import NotFound
            mock_model.generate_content.side_effect = NotFound("404 models/invalid-model-name is not found")
            gemini_svc.model = mock_model

            # Must not crash, falls back safely or returns None
            result = gemini_svc.generate_json("Test prompt")
            self.assertIsNone(result)

    def test_gemini_empty_response_handled_safely(self):
        gemini_verifier = GeminiVerifier()
        # Mock empty return from text model
        gemini_verifier.text_model.verify_location = MagicMock(return_value=None)

        top_candidates = [
            {
                "score": 75.0,
                "place": {
                    "travel_name": "Kyoto, Japan",
                    "country": "Japan",
                    "matched_sources": ["caption"],
                },
            }
        ]

        decision = gemini_verifier.run_text_verification(
            evidence={"caption": "Visiting Kyoto"},
            top_candidates=top_candidates,
        )
        self.assertEqual(decision["status"], "failed")
        self.assertIn("empty", decision["reason"].lower())

    # -------------------------------------------------------------------------
    # 9. Verification failure does not produce a verified-success status
    # -------------------------------------------------------------------------
    def test_verification_failure_never_produces_verified_status(self):
        winner = {
            "score": 62.0,
            "confidence": "LOW",
            "place": {
                "id": "osm_501",
                "travel_name": "South Korea, South Korea",
                "country": "South Korea",
                "latitude": 36.5,
                "longitude": 127.5,
                "primary_type": "country",
                "types": ["country"],
                "verification_status": "FAILED",
                "gemini_verified": False,
                "gemini_confidence": 0.0,
            },
        }

        gemini_failed_result = {
            "verification_status": "FAILED",
            "confidence": 0.0,
            "reason": "NotFound: Model not found",
        }

        best_guess = self.response_builder.build_best_guess(
            winner=winner,
            gemini_result=gemini_failed_result,
        )

        self.assertEqual(best_guess.verification_status, "FAILED")
        self.assertNotEqual(best_guess.confidence_level, "VERIFIED")
        self.assertEqual(best_guess.gemini_confidence, 0.0)

    # -------------------------------------------------------------------------
    # 11. Specific multiword destination survives text normalization
    # -------------------------------------------------------------------------
    def test_multiword_destination_survives_normalization(self):
        text = "Jeju Island – South Korea's hidden paradise"
        candidates = self.candidate_service.extract_compound_locations(text, source="caption")
        # Specific place must survive
        self.assertIn("Jeju Island", candidates)
        self.assertIn("Jeju Island, South Korea", candidates)

        # Another complex multiword place
        text2 = "St. Joseph's Cathedral – Mysore, India"
        cands2 = self.candidate_service.extract_compound_locations(text2, source="caption")
        self.assertTrue(any("st. joseph" in c.lower() for c in cands2))

    # -------------------------------------------------------------------------
    # 12. Country does not override specific supported destination in candidate generation
    # -------------------------------------------------------------------------
    def test_country_does_not_override_specific_destination_ranking(self):
        metadata = {
            "title": "Video by cam_snaps",
            "caption": "Jeju Island – South Korea's hidden paradise",
        }
        ranked = self.candidate_service.generate(
            metadata=metadata,
            ocr_text="",
            speech_text="",
        )
        self.assertTrue(len(ranked) >= 2)
        # Specific destination must be ranked ahead of generic country
        self.assertIn("Jeju Island", ranked[0] or ranked[1])
        if "South Korea" in ranked:
            country_idx = ranked.index("South Korea")
            specific_idx = min(
                ranked.index(c) for c in ranked if "jeju" in c.lower()
            )
            self.assertLess(specific_idx, country_idx, "Specific destination must rank ahead of broad country")

    # -------------------------------------------------------------------------
    # 13. Distinct places are not incorrectly deduplicated
    # -------------------------------------------------------------------------
    def test_distinct_places_not_incorrectly_deduplicated(self):
        candidates = ["Jeju Island", "Seoul", "Busan", "South Korea"]
        deduped = self.candidate_service.remove_child_candidates(candidates)
        self.assertIn("Jeju Island", deduped)
        self.assertIn("Seoul", deduped)
        self.assertIn("Busan", deduped)
        self.assertIn("South Korea", deduped)

    # -------------------------------------------------------------------------
    # 14. Gemini does not retry the same unavailable model
    # -------------------------------------------------------------------------
    def test_gemini_does_not_retry_same_unavailable_model(self):
        gemini_svc = GeminiService()
        gemini_svc.available = True
        gemini_svc.model_name = "gemini-flash-latest"

        mock_model = MagicMock()
        from google.api_core.exceptions import NotFound
        mock_model.generate_content.side_effect = NotFound("404 models/gemini-flash-latest is not found")
        gemini_svc.model = mock_model

        with patch("google.generativeai.GenerativeModel") as mock_gen_class:
            mock_fb_instance = MagicMock()
            mock_fb_instance.generate_content.return_value.text = '{"status": "ok"}'
            mock_gen_class.return_value = mock_fb_instance
            # Fallback should switch model, not reuse gemini-flash-latest
            gemini_svc.generate_json("Test prompt")
            if mock_gen_class.called:
                called_model = mock_gen_class.call_args[1].get("model_name") or mock_gen_class.call_args[0][0]
                self.assertNotEqual(called_model, "gemini-flash-latest", "Fallback must not retry the same model name")

    # -------------------------------------------------------------------------
    # 15. Gemini failure preserves local evidence
    # -------------------------------------------------------------------------
    def test_gemini_failure_preserves_local_evidence(self):
        pipeline = LocationPipeline()
        ranked_places = [
            {
                "score": 85.0,
                "confidence": "HIGH",
                "place": {
                    "id": "osm_888",
                    "travel_name": "Hallasan National Park, South Korea",
                    "country": "South Korea",
                    "matched_sources": ["caption", "ocr"],
                },
            }
        ]
        evidence = {"caption": "Visiting Hallasan", "ocr_text": "Hallasan"}
        with patch.object(pipeline.gemini, "verify", side_effect=RuntimeError("Gemini down")):
            res = pipeline.verify_if_needed(evidence, {"ranked_places": ranked_places}, [])
            self.assertIsNotNone(res)
            self.assertEqual(res["verification_status"], "FAILED")
            # Place and local evidence must be preserved
            self.assertEqual(res["winner"]["place"]["travel_name"], "Hallasan National Park, South Korea")
            self.assertIn("caption", res["winner"]["place"]["matched_sources"])

    # -------------------------------------------------------------------------
    # 16. Overpass HTTP 502 does not invalidate an otherwise credible candidate
    # -------------------------------------------------------------------------
    def test_overpass_http_502_gracefully_degrades(self):
        client = OverpassClient()
        mock_resp = MagicMock()
        mock_resp.status_code = 502

        with patch("requests.post", return_value=mock_resp), patch.object(client, "_check_slots_available", return_value=True):
            result = client.search_nearby(latitude=33.36, longitude=126.53)
            self.assertIsInstance(result, dict)
            self.assertIn("Nearby unavailable", result.get("status", ""))
            self.assertEqual(result.get("must_visit"), [])


    # -------------------------------------------------------------------------
    # 17. Health endpoint schema and readiness
    # -------------------------------------------------------------------------
    def test_health_endpoint_schema(self):
        client = TestClient(app)
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("status", data)
        self.assertIn("places_provider", data)
        self.assertIn("configuration", data)
        config = data["configuration"]
        self.assertIn("osm_ready", config)
        self.assertIn("places_provider_ready", config)
        self.assertIn("nearby_ready", config)
        self.assertIn("gemini_ready", config)
        self.assertIn("rate_limiting_active", config)


if __name__ == "__main__":
    unittest.main()

