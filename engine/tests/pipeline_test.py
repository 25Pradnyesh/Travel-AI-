import unittest
from unittest.mock import MagicMock, patch

from engine.app.pipelines.location_pipeline import LocationPipeline


class TestLocationPipeline(unittest.TestCase):

    def setUp(self):
        self.pipeline = LocationPipeline()
        # Mock external heavy services
        self.pipeline.builder = MagicMock()
        self.pipeline.frames = MagicMock()
        self.pipeline.resolver = MagicMock()
        self.pipeline.gemini = MagicMock()

        self.mock_place = {
            "place_id": "google_place_123",
            "travel_name": "Seebensee",
            "display_name": "Seebensee Lake",
            "formatted_address": "Ehrwald 6632, Austria",
            "country": "Austria",
            "city": "Ehrwald",
            "region": "Tyrol",
            "latitude": 47.3689,
            "longitude": 10.9234,
            "types": ["natural_feature", "tourist_attraction"],
            "rating": 4.9,
            "user_rating_count": 820,
            "photos": ["photo_ref_1"],
            "google_maps_url": "https://maps.google.com/?cid=123",
        }

        self.mock_candidate = {
            "place": self.mock_place.copy(),
            "score": 92.0,
            "confidence": "VERY_HIGH",
            "rank": 1,
        }

        self.mock_resolver_result = {
            "winner": self.mock_candidate,
            "ranked_places": [self.mock_candidate],
            "statistics": {
                "candidate_count": 1,
                "verified_places": 1,
                "google_search_results": 5,
            },
            "candidate_count": 1,
            "verified_count": 1,
            "search_results": 5,
        }

    def test_pipeline_runs_caption_stage_with_gemini_verification(self):
        """Test stage 1 caption success with Gemini verification."""
        evidence = {
            "caption": "Seebensee is crystal clear! #austria",
            "hashtags": ["austria", "seebensee"],
            "ocr_text": "",
            "speech_text": "",
            "metadata": {"title": "Austria Reel"},
        }
        self.pipeline.builder.build_caption.return_value = evidence
        self.pipeline.builder.combine.return_value = evidence
        self.pipeline.resolver.resolve.return_value = self.mock_resolver_result

        # Mock Gemini verifier returning verified winner
        verified_winner = self.mock_candidate.copy()
        verified_winner["confidence"] = "VERIFIED"
        verified_winner["place"]["verification_status"] = "VERIFIED"
        verified_winner["place"]["gemini_verified"] = True
        verified_winner["place"]["gemini_confidence"] = 0.96
        verified_winner["place"]["gemini_reason"] = "Caption specifically identifies Seebensee in Austria."

        self.pipeline.gemini.verify.return_value = {
            "winner": verified_winner,
            "confidence": 0.96,
            "reason": "Caption specifically identifies Seebensee in Austria.",
            "verification_status": "VERIFIED",
            "vision": None,
        }

        response = self.pipeline.run(
            metadata={"caption": "Seebensee is crystal clear!"},
            video_path=None,
        )

        self.assertEqual(response["stage"], "caption")
        self.assertEqual(response["verification_status"], "VERIFIED")
        self.assertTrue(response["gemini"]["used"])
        self.assertEqual(response["gemini"]["confidence"], 0.96)
        self.assertEqual(response["best_guess"]["place"]["travel_name"], "Seebensee")
        self.assertEqual(response["best_guess"]["place"]["place_id"], "google_place_123")
        self.assertEqual(response["best_guess"]["place"]["formatted_address"], "Ehrwald 6632, Austria")
        self.assertIn("category", response["best_guess"]["place"])
        self.assertIn("travel_summary", response["best_guess"]["place"])

    def test_pipeline_handles_gemini_failure_gracefully(self):
        """When Gemini verifier throws an exception, pipeline must not crash and fallback to scoring."""
        evidence = {"caption": "Lake trip"}
        self.pipeline.builder.build_caption.return_value = evidence
        self.pipeline.builder.combine.return_value = evidence
        self.pipeline.resolver.resolve.return_value = self.mock_resolver_result

        # Gemini raises an unhandled exception
        self.pipeline.gemini.verify.side_effect = RuntimeError("Gemini API Network Timeout")

        response = self.pipeline.run(
            metadata={"caption": "Lake trip"},
            video_path=None,
        )

        # Pipeline recovers and falls back
        self.assertEqual(response["stage"], "caption")
        self.assertEqual(response["verification_status"], "FAILED")
        self.assertIsNotNone(response["best_guess"])
        self.assertEqual(response["best_guess"]["place"]["travel_name"], "Seebensee")

    def test_pipeline_returns_failed_when_no_candidates_found(self):
        """When resolver finds no candidates, pipeline returns clean failed response."""
        evidence = {"caption": "Unrelated home video"}
        self.pipeline.builder.build_caption.return_value = evidence
        self.pipeline.builder.combine.return_value = evidence
        self.pipeline.resolver.resolve.return_value = None

        response = self.pipeline.run(
            metadata={"caption": "Unrelated"},
            video_path=None,
        )

        self.assertEqual(response["stage"], "failed")
        self.assertIsNone(response["best_guess"])
        self.assertEqual(response["verification_status"], "FAILED")
        self.assertFalse(response["gemini"]["used"])


if __name__ == "__main__":
    unittest.main()
