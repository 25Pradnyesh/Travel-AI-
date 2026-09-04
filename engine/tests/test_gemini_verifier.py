import json
import unittest
from unittest.mock import MagicMock, patch

from engine.app.services.gemini.text_prompt_builder import PromptBuilder
from engine.app.services.gemini.text_response_parser import ResponseParser
from engine.app.services.gemini.vision_prompt_builder import VisionPromptBuilder
from engine.app.services.gemini.vision_response_parser import VisionResponseParser
from engine.app.services.gemini.gemini_verifier import GeminiVerifier


class TestPromptBuilder(unittest.TestCase):

    def setUp(self):
        self.builder = PromptBuilder()

    def test_prompt_contains_candidates_and_evidence(self):
        evidence = {
            "caption": "Exploring the majestic peaks in the Alps! #mountains #travel",
            "hashtags": ["mountains", "travel"],
            "ocr_text": "WELCOME TO SEEBENSEE",
            "speech_text": "This alpine lake is breathtaking.",
            "metadata": {"title": "Alpine Adventure", "creator": "traveler123"},
        }
        ranked_places = [
            {
                "place": {
                    "travel_name": "Seebensee",
                    "display_name": "Seebensee Lake",
                    "formatted_address": "Ehrwald, Austria",
                    "country": "Austria",
                    "city": "Ehrwald",
                    "region": "Tyrol",
                    "latitude": 47.3689,
                    "longitude": 10.9234,
                    "types": ["natural_feature", "tourist_attraction"],
                    "rating": 4.9,
                    "user_rating_count": 820,
                    # internal heavy payload fields to exclude
                    "reviews_raw": ["a" * 500],
                    "raw_photos": ["b" * 500],
                },
                "score": 92.0,
                "confidence": "VERY_HIGH",
            },
            {
                "place": {
                    "travel_name": "Lake Garda",
                    "display_name": "Lake Garda",
                    "formatted_address": "Garda, Italy",
                    "country": "Italy",
                    "city": "Garda",
                    "region": "Veneto",
                    "latitude": 45.5806,
                    "longitude": 10.6206,
                    "types": ["natural_feature"],
                    "rating": 4.7,
                    "user_rating_count": 12000,
                },
                "score": 75.0,
                "confidence": "MEDIUM",
            },
        ]

        prompt = self.builder.build(evidence, ranked_places)

        # Prompt must contain rules and guidelines
        self.assertIn("You are verifying the most likely real-world destination", prompt)
        self.assertIn("winner must be the candidate index", prompt)
        self.assertIn("confidence must be a number between 0.0 and 1.0", prompt)
        self.assertIn("Seebensee", prompt)
        self.assertIn("Austria", prompt)
        self.assertIn("Lake Garda", prompt)
        self.assertIn("Ehrwald", prompt)
        # Heavy internal blobs should not be in the prompt
        self.assertNotIn("reviews_raw", prompt)
        self.assertNotIn("raw_photos", prompt)


class TestTextResponseParser(unittest.TestCase):

    def setUp(self):
        self.parser = ResponseParser()
        self.candidates = [
            {"place": {"travel_name": "Place Alpha", "place_id": "id_1"}, "score": 90.0},
            {"place": {"travel_name": "Place Beta", "place_id": "id_2"}, "score": 85.0},
            {"place": {"travel_name": "Place Gamma", "place_id": "id_3"}, "score": 70.0},
        ]

    def test_valid_json(self):
        response = {"winner": 1, "confidence": 0.95, "reason": "Explicit OCR match."}
        result = self.parser.parse(response, self.candidates)

        self.assertEqual(result["status"], "verified")
        self.assertEqual(result["winner_index"], 1)
        self.assertEqual(result["confidence"], 0.95)
        self.assertEqual(result["winner"]["place"]["travel_name"], "Place Alpha")
        self.assertEqual(result["reason"], "Explicit OCR match.")

    def test_markdown_wrapped_json(self):
        response_str = "```json\n{\n  \"winner\": 2,\n  \"confidence\": 0.88,\n  \"reason\": \"Matches speech transcript.\"\n}\n```"
        result = self.parser.parse(response_str, self.candidates)

        self.assertEqual(result["status"], "verified")
        self.assertEqual(result["winner_index"], 2)
        self.assertEqual(result["confidence"], 0.88)
        self.assertEqual(result["winner"]["place"]["travel_name"], "Place Beta")

    def test_percentage_confidence_normalization(self):
        # Model returns percentage 92 instead of 0.92
        response = {"winner": 1, "confidence": 92, "reason": "High confidence."}
        result = self.parser.parse(response, self.candidates)

        self.assertEqual(result["confidence"], 0.92)

    def test_confidence_clamping(self):
        self.assertEqual(self.parser.normalize_confidence(-5), 0.0)
        self.assertEqual(self.parser.normalize_confidence(1.5), 0.015)
        self.assertEqual(self.parser.normalize_confidence("invalid"), 0.0)
        self.assertEqual(self.parser.normalize_confidence(0.75), 0.75)

    def test_null_winner(self):
        response = {"winner": None, "confidence": 0.0, "reason": "Insufficient evidence."}
        result = self.parser.parse(response, self.candidates)

        self.assertEqual(result["status"], "no_winner")
        self.assertIsNone(result["winner"])
        self.assertIsNone(result["winner_index"])
        self.assertEqual(result["confidence"], 0.0)

    def test_invalid_winner_out_of_range(self):
        response = {"winner": 99, "confidence": 0.9, "reason": "Non-existent candidate."}
        result = self.parser.parse(response, self.candidates)

        self.assertEqual(result["status"], "failed")
        self.assertIsNone(result["winner"])

    def test_invalid_winner_string_or_zero(self):
        response = {"winner": 0, "confidence": 0.9, "reason": "Zero index."}
        result = self.parser.parse(response, self.candidates)
        self.assertEqual(result["status"], "failed")

        response_str_valid = {"winner": "2", "confidence": 0.8, "reason": "String index."}
        result = self.parser.parse(response_str_valid, self.candidates)
        self.assertEqual(result["status"], "verified")
        self.assertEqual(result["winner_index"], 2)

    def test_malformed_json_string(self):
        response_str = "This is not json at all!"
        result = self.parser.parse(response_str, self.candidates)

        self.assertEqual(result["status"], "failed")
        self.assertIsNone(result["winner"])

    def test_empty_candidate_list(self):
        response = {"winner": 1, "confidence": 0.9, "reason": "Test"}
        result = self.parser.parse(response, [])

        self.assertEqual(result["status"], "failed")
        self.assertIsNone(result["winner"])


class TestVisionParser(unittest.TestCase):

    def setUp(self):
        self.parser = VisionResponseParser()

    def test_valid_vision_json(self):
        resp = """```json
        {
            "matched_index": 1,
            "matches_candidate": true,
            "confidence": 0.9,
            "reason": "Scene matches alpine lake",
            "visual_clues": ["lake", "mountains"],
            "detected_landmarks": ["peaks"],
            "detected_country": "Austria",
            "detected_region": "Tyrol"
        }
        ```"""
        result = self.parser.parse(resp)
        self.assertTrue(result["matches_candidate"])
        self.assertEqual(result["matched_index"], 1)
        self.assertEqual(result["confidence"], 0.9)
        self.assertIn("lake", result["visual_clues"])
        self.assertEqual(result["detected_country"], "Austria")

    def test_empty_vision_response(self):
        result = self.parser.parse("")
        self.assertFalse(result["matches_candidate"])
        self.assertEqual(result["confidence"], 0.0)


class TestGeminiVerifierDecisionMatrix(unittest.TestCase):

    def setUp(self):
        self.verifier = GeminiVerifier()
        # Mock models so network is not invoked in unit tests
        self.verifier.text_model = MagicMock()
        self.verifier.text_model.available = True
        self.verifier.vision_model = MagicMock()
        self.verifier.vision_model.available = True

        self.candidates = [
            {
                "place": {
                    "place_id": "ch_1",
                    "travel_name": "Matterhorn",
                    "display_name": "Matterhorn Peak",
                    "country": "Switzerland",
                    "city": "Zermatt",
                    "formatted_address": "Zermatt, Switzerland",
                    "latitude": 45.9763,
                    "longitude": 7.6586,
                    "types": ["natural_feature"],
                    "rating": 4.9,
                    "user_rating_count": 5000,
                },
                "score": 90.0,
                "confidence": "VERY_HIGH",
            },
            {
                "place": {
                    "place_id": "fr_2",
                    "travel_name": "Mont Blanc",
                    "display_name": "Mont Blanc",
                    "country": "France",
                    "city": "Chamonix",
                    "formatted_address": "Chamonix, France",
                    "latitude": 45.8326,
                    "longitude": 6.8652,
                    "types": ["natural_feature"],
                    "rating": 4.8,
                    "user_rating_count": 4000,
                },
                "score": 82.0,
                "confidence": "HIGH",
            },
            {
                "place": {
                    "place_id": "it_3",
                    "travel_name": "Dolomites",
                    "display_name": "Dolomites",
                    "country": "Italy",
                    "city": "Cortina",
                    "formatted_address": "Cortina, Italy",
                    "latitude": 46.4102,
                    "longitude": 11.8440,
                    "types": ["natural_feature"],
                    "rating": 4.9,
                    "user_rating_count": 8000,
                },
                "score": 60.0,
                "confidence": "LOW",
            },
        ]
        self.evidence = {
            "caption": "Hiking around Zermatt with view of the pyramid peak.",
            "ocr_text": "ZERMATT 1620m",
            "speech_text": "Behold the Matterhorn.",
            "hashtags": ["zermatt", "swissalps"],
        }

    def test_agreement_with_top_candidate(self):
        """When Gemini agrees with scoring candidate #1 with high confidence -> VERIFIED status."""
        self.verifier.text_model.verify_location.return_value = {
            "winner": 1,
            "confidence": 0.95,
            "reason": "Speech and OCR explicitly identify Matterhorn in Zermatt.",
        }

        result = self.verifier.verify(self.evidence, self.candidates)

        self.assertEqual(result["verification_status"], "VERIFIED")
        self.assertEqual(result["winner"]["place"]["travel_name"], "Matterhorn")
        self.assertEqual(result["winner"]["place"]["place_id"], "ch_1")
        self.assertEqual(result["winner"]["confidence"], "VERIFIED")
        self.assertTrue(result["winner"]["place"]["gemini_verified"])
        self.assertEqual(result["winner"]["place"]["gemini_confidence"], 0.95)
        # Score got boosted
        self.assertGreaterEqual(result["winner"]["score"], 95.0)

    def test_disagreement_with_high_confidence_and_small_gap(self):
        """When Gemini selects candidate #2 with high confidence and close scores -> switches winner."""
        self.verifier.text_model.verify_location.return_value = {
            "winner": 2,
            "confidence": 0.92,
            "reason": "Visual clues and OCR specifically match Mont Blanc Chamonix.",
        }

        result = self.verifier.verify(self.evidence, self.candidates)

        # Should switch to candidate #2
        self.assertEqual(result["verification_status"], "VERIFIED")
        self.assertEqual(result["winner"]["place"]["travel_name"], "Mont Blanc")
        self.assertEqual(result["winner"]["place"]["place_id"], "fr_2")
        self.assertEqual(result["winner"]["place"]["gemini_confidence"], 0.92)

    def test_disagreement_with_large_score_gap(self):
        """When Gemini selects candidate #3 with large score gap (60 vs 90) -> retains candidate #1."""
        self.verifier.text_model.verify_location.return_value = {
            "winner": 3,
            "confidence": 0.60,
            "reason": "Weak visual resemblance to Dolomites.",
        }

        result = self.verifier.verify(self.evidence, self.candidates)

        # Retains candidate #1 due to large gap and moderate confidence
        self.assertEqual(result["verification_status"], "PARTIAL")
        self.assertEqual(result["winner"]["place"]["travel_name"], "Matterhorn")
        self.assertEqual(result["winner"]["place"]["place_id"], "ch_1")

    def test_insufficient_evidence_null_winner(self):
        """When Gemini returns null winner -> retains top candidate with PARTIAL status."""
        self.verifier.text_model.verify_location.return_value = {
            "winner": None,
            "confidence": 0.0,
            "reason": "Insufficient evidence to verify any candidate.",
        }

        result = self.verifier.verify(self.evidence, self.candidates)

        self.assertEqual(result["verification_status"], "PARTIAL")
        self.assertEqual(result["winner"]["place"]["travel_name"], "Matterhorn")

    def test_gemini_api_failure_fallback(self):
        """When Gemini throws or returns None -> fallback to scoring top candidate with FAILED status."""
        self.verifier.text_model.verify_location.return_value = None

        result = self.verifier.verify(self.evidence, self.candidates)

        self.assertEqual(result["verification_status"], "FAILED")
        self.assertEqual(result["winner"]["place"]["travel_name"], "Matterhorn")
        self.assertEqual(result["winner"]["place"]["place_id"], "ch_1")
        self.assertFalse(result["winner"]["place"]["gemini_verified"])

    def test_single_strong_candidate_skip_optimization(self):
        """When only 1 candidate exists with high confidence -> skips Gemini call."""
        single_candidate = [
            {
                "place": {
                    "place_id": "single_1",
                    "travel_name": "Eiffel Tower",
                    "country": "France",
                },
                "score": 98.0,
                "confidence": "VERY_HIGH",
            }
        ]

        result = self.verifier.verify(self.evidence, single_candidate)

        self.assertEqual(result["verification_status"], "SKIPPED")
        self.assertEqual(result["winner"]["place"]["travel_name"], "Eiffel Tower")
        # Text model was not called
        self.verifier.text_model.verify_location.assert_not_called()

    def test_no_candidates(self):
        """When candidates list is empty -> returns safe failed result."""
        result = self.verifier.verify(self.evidence, [])
        self.assertEqual(result["verification_status"], "FAILED")
        self.assertIsNone(result["winner"])

    def test_vision_unavailable_graceful_text_only(self):
        """When no image frame is provided -> vision is skipped and text verification succeeds."""
        self.verifier.text_model.verify_location.return_value = {
            "winner": 1,
            "confidence": 0.88,
            "reason": "Text match confirmed.",
        }

        result = self.verifier.verify(self.evidence, self.candidates, image_path=None)

        self.assertEqual(result["verification_status"], "VERIFIED")
        self.assertIsNone(result["vision"])
        self.verifier.vision_model.verify.assert_not_called()


if __name__ == "__main__":
    unittest.main()
