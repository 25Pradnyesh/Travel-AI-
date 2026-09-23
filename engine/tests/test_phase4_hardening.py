import unittest
from unittest.mock import MagicMock, patch

from engine.app.services.maps.nearby_search_service import (
    TRAVEL_CATEGORIES,
    SUPPORTED_PLACE_TYPES,
    NearbySearchService,
)
from engine.app.services.scoring.scoring_service import ScoringService
from engine.app.services.gemini.gemini_verifier import GeminiVerifier
from engine.app.services.response.response_builder import ResponseBuilder
from engine.app.pipelines.location_pipeline import LocationPipeline


class TestPhase4Hardening(unittest.TestCase):

    # ==================================================
    # 1. natural_feature is no longer requested
    # ==================================================

    def test_natural_feature_not_requested(self):
        """Verify natural_feature is completely removed from supported types and categories."""
        # Must not be in SUPPORTED_PLACE_TYPES
        self.assertNotIn("natural_feature", SUPPORTED_PLACE_TYPES)

        # Must not be in any travel category
        for cat, types in TRAVEL_CATEGORIES.items():
            self.assertNotIn(
                "natural_feature",
                types,
                f"natural_feature found in category '{cat}'",
            )

        # Nature category must still contain valid types like park
        self.assertIn("park", TRAVEL_CATEGORIES["nature"])

        # Calling search_single_type with natural_feature should be rejected without network calls
        service = NearbySearchService()
        with patch("requests.post") as mock_post:
            result = service.search_single_type(47.368, 10.934, "natural_feature")
            self.assertEqual(result, [])
            mock_post.assert_not_called()

        # Calling full search should never issue requests with natural_feature
        with patch.object(service, "search_single_type", return_value=[]) as mock_single:
            service.search(47.368, 10.934)
            requested_types = [call.args[2] for call in mock_single.call_args_list]
            self.assertNotIn("natural_feature", requested_types)

    # ==================================================
    # 2. Gemini failure remains failed/unavailable state
    # ==================================================

    def test_gemini_failure_semantics(self):
        """Verify Gemini failure does not claim verification while preserving scoring destination and score."""
        scoring = ScoringService()
        # Scoring alone must never label confidence as VERIFIED
        self.assertEqual(scoring.confidence(98.0), "VERY_HIGH")
        self.assertEqual(scoring.confidence(91.0), "VERY_HIGH")
        self.assertEqual(scoring.confidence(85.0), "HIGH")

        verifier = GeminiVerifier()
        verifier.text_model = MagicMock()
        verifier.text_model.available = False  # Simulates unavailable / NotFound

        candidates = [
            {
                "place": {
                    "place_id": "test_1",
                    "travel_name": "Seebensee",
                    "country": "Austria",
                    "city": "Ehrwald",
                    "types": ["lake"],
                    "matched_sources": ["caption"],
                },
                "score": 92.0,
                "confidence": "VERY_HIGH",
            },
            {
                "place": {
                    "place_id": "test_2",
                    "travel_name": "Plansee",
                    "country": "Austria",
                    "city": "Reutte",
                    "types": ["lake"],
                    "matched_sources": ["caption"],
                },
                "score": 88.0,
                "confidence": "HIGH",
            },
        ]
        evidence = {"caption": "Seebensee hike"}

        # Verification result when Gemini unavailable
        result = verifier.verify(evidence, candidates)
        self.assertEqual(result["verification_status"], "FAILED")
        self.assertEqual(result["winner"]["place"]["place_id"], "test_1")
        self.assertFalse(result["winner"]["place"]["gemini_verified"])
        self.assertEqual(result["winner"]["place"]["gemini_confidence"], 0.0)
        self.assertNotEqual(result["winner"]["confidence"], "VERIFIED")
        self.assertEqual(result["winner"]["confidence"], "VERY_HIGH")

        # ResponseBuilder should not claim "Verified from..." in why explanation
        builder = ResponseBuilder()
        why_unverified = builder.build_why_explanation(
            place=result["winner"]["place"],
            gemini_reason=result["reason"],
            verification_status="FAILED",
        )
        self.assertNotIn("Verified from", why_unverified)
        self.assertIn("unverified", why_unverified.lower())

        # Final AnalysisResponse structure
        resp = builder.build(
            winner=result["winner"],
            gemini_result=result,
            stage="caption",
        )
        self.assertTrue(resp.success)
        self.assertEqual(resp.best_guess.verification_status, "FAILED")
        self.assertEqual(resp.best_guess.confidence, 92)
        self.assertEqual(resp.best_guess.confidence_level, "VERY_HIGH")
        self.assertEqual(resp.best_guess.gemini_confidence, 0.0)
        self.assertFalse(resp.gemini.used)
        self.assertEqual(resp.gemini.status, "FAILED")

    # ==================================================
    # 3. Performance contains total_seconds
    # ==================================================

    def test_performance_total_seconds(self):
        """Verify performance.total_seconds is exposed and valid in response."""
        pipeline = LocationPipeline()
        pipeline.builder = MagicMock()
        pipeline.resolver = MagicMock()
        pipeline.gemini = MagicMock()

        mock_candidate = {
            "place": {
                "place_id": "p1",
                "travel_name": "Innsbruck",
                "country": "Austria",
                "matched_sources": ["caption"],
            },
            "score": 88.0,
            "confidence": "HIGH",
        }
        pipeline.builder.build_caption.return_value = {"caption": "Innsbruck"}
        pipeline.builder.combine.return_value = {"caption": "Innsbruck"}
        pipeline.resolver.resolve.return_value = {
            "winner": mock_candidate,
            "ranked_places": [mock_candidate],
            "stage_timings": {
                "candidate_resolution": 0.12,
                "nearby_places": 0.34,
                "travel_intelligence": 0.05,
            },
        }
        pipeline.gemini.verify.return_value = {
            "winner": mock_candidate,
            "verification_status": "SKIPPED",
            "confidence": 0.0,
            "reason": "High confidence",
            "vision": None,
        }

        resp = pipeline.run(
            metadata={"caption": "Innsbruck"},
            video_path=None,
            total_start=None,
            provider_duration=1.23,
        )

        self.assertIn("performance", resp)
        self.assertIn("total_seconds", resp["performance"])
        self.assertIsInstance(resp["performance"]["total_seconds"], (int, float))
        self.assertGreaterEqual(resp["performance"]["total_seconds"], 0.0)

    # ==================================================
    # 4. Performance contains stage timings
    # ==================================================

    def test_performance_stages(self):
        """Verify performance.stages contains all major pipeline stages."""
        pipeline = LocationPipeline()
        pipeline.builder = MagicMock()
        pipeline.resolver = MagicMock()
        pipeline.gemini = MagicMock()

        mock_candidate = {
            "place": {
                "place_id": "p1",
                "travel_name": "Salzburg",
                "country": "Austria",
                "matched_sources": ["caption"],
            },
            "score": 90.0,
            "confidence": "VERY_HIGH",
        }
        pipeline.builder.build_caption.return_value = {"caption": "Salzburg"}
        pipeline.builder.combine.return_value = {"caption": "Salzburg"}
        pipeline.resolver.resolve.return_value = {
            "winner": mock_candidate,
            "ranked_places": [mock_candidate],
            "stage_timings": {
                "candidate_resolution": 0.45,
                "nearby_places": 0.82,
                "travel_intelligence": 0.15,
            },
        }
        pipeline.gemini.verify.return_value = {
            "winner": mock_candidate,
            "verification_status": "VERIFIED",
            "confidence": 0.95,
            "reason": "Confirmed Salzburg",
            "vision": None,
        }

        resp = pipeline.run(
            metadata={"caption": "Salzburg"},
            video_path=None,
            provider_duration=2.15,
        )

        perf = resp["performance"]
        self.assertIn("stages", perf)
        stages = perf["stages"]

        expected_stages = [
            "provider",
            "location_extraction",
            "candidate_resolution",
            "verification",
            "nearby_places",
            "travel_intelligence",
            "response_building",
        ]
        for stage_name in expected_stages:
            self.assertIn(
                stage_name,
                stages,
                f"Missing expected stage timing '{stage_name}' in performance.stages",
            )
            self.assertIsInstance(
                stages[stage_name],
                (int, float),
                f"Stage '{stage_name}' timing must be numeric",
            )
            self.assertGreaterEqual(stages[stage_name], 0.0)


if __name__ == "__main__":
    unittest.main()
