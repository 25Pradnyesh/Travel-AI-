"""
Stage 3 Regression Test Suite: Location Intelligence Improvements.

Covers:
1. Candidate extraction does not turn ordinary capitalized words into locations.
2. Pin/location extraction preserves text boundaries correctly.
3. A legitimate single-word location can still become a candidate.
4. Generic boilerplate does not outrank a strong geographic candidate.
5. Multiple legitimate locations can survive the resolution pipeline.
6. /reel/ URLs continue to work.
7. /p/ URLs are accepted by the URL-validation layer.
"""

import unittest
from engine.app.api.analyze import AnalyzeRequest
from engine.app.services.location.candidate_service import CandidateService
from engine.app.services.response.response_builder import ResponseBuilder
from engine.app.services.scoring.scoring_service import ScoringService


class TestStage3LocationImprovements(unittest.TestCase):

    def setUp(self):
        self.candidate_service = CandidateService()
        self.scoring_service = ScoringService()
        self.response_builder = ResponseBuilder()

    # ==================================================
    # 1. Ordinary Capitalized Words Filtered
    # ==================================================

    def test_candidate_extraction_does_not_turn_ordinary_capitalized_words_into_locations(self):
        """Sentence-initial verbs, demonyms, participles, and social boilerplate must not become candidates."""
        caption = (
            "Planning a trip to Meghalaya?\n"
            "Bina kuch soche, add these 4 places in your itinerary. You're going to love them.\n"
            "Built in the 1930s, this masterpiece was inspired by European architecture.\n"
            "Standing by a lake, trying to capture the view.\n"
            "Wander around the charming streets.\n"
            "Contact for licensing and fee.\n"
            "There's a very Japanese appreciation for quality."
        )

        candidates = self.candidate_service.generate(
            metadata={"caption": caption},
            ocr_text="",
            speech_text="",
        )

        cand_lower = {c.lower() for c in candidates}

        # Verbs / participles
        self.assertNotIn("planning", cand_lower)
        self.assertNotIn("built", cand_lower)
        self.assertNotIn("trying", cand_lower)
        self.assertNotIn("standing", cand_lower)
        self.assertNotIn("wander", cand_lower)

        # Demonyms
        self.assertNotIn("japanese", cand_lower)
        self.assertNotIn("european", cand_lower)

        # Boilerplate
        self.assertNotIn("contact", cand_lower)
        self.assertNotIn("licensing", cand_lower)
        self.assertNotIn("fee", cand_lower)

        # Legitimate destination extracted via trigger phrase
        self.assertIn("meghalaya", cand_lower)

    # ==================================================
    # 2. Pin Location Extraction Preserves Boundaries
    # ==================================================

    def test_pin_location_extraction_preserves_text_boundaries_correctly(self):
        """Pin extraction must isolate the pin location without swallowing entire paragraphs or notes."""
        caption_1 = (
            "The biggest stationery store in the world has 12 floors.\n"
            "Because once you walk into Itoya in Ginza, stationery stops feeling like stationery.\n"
            "📍Itoya, Ginza, Tokyo - open since 1904 🕰️\n"
            "Bring adult money at your own risk."
        )
        pins_1 = self.candidate_service.extract_pin_locations(self.candidate_service.clean(caption_1))
        self.assertEqual(len(pins_1), 1)
        self.assertEqual(pins_1[0], "Itoya, Ginza, Tokyo")

        caption_2 = (
            "Imagine living in a house where a river flows right underneath it ✨\n"
            "📍The Fulling Mill, Alresford, Hampshire\n"
            "(⚠️ This is a private home, so please be respectful if you're visiting or passing by)\n"
            "🚗 Around 1.5 hours from London"
        )
        pins_2 = self.candidate_service.extract_pin_locations(self.candidate_service.clean(caption_2))
        self.assertEqual(len(pins_2), 1)
        self.assertEqual(pins_2[0], "The Fulling Mill, Alresford, Hampshire")

    # ==================================================
    # 3. Legitimate Single-Word Location Allowed
    # ==================================================

    def test_legitimate_single_word_location_can_still_become_candidate(self):
        """Legitimate single-word destinations from hashtags, gazetteer, or triggers must survive."""
        # From hashtags
        candidates_hashtag = self.candidate_service.generate(
            metadata={"caption": "Exploring ancient caves.", "hashtags": ["#matera", "#deqin"]},
            ocr_text="",
            speech_text="",
        )
        cand_lower = {c.lower() for c in candidates_hashtag}
        self.assertIn("matera", cand_lower)
        self.assertIn("deqin", cand_lower)

        # From contextual trigger
        candidates_trigger = self.candidate_service.generate(
            metadata={"caption": "Planning a weekend road trip to Mysuru! Free to enter."},
            ocr_text="",
            speech_text="",
        )
        cand_trigger_lower = {c.lower() for c in candidates_trigger}
        self.assertIn("mysuru", cand_trigger_lower)

    # ==================================================
    # 4. Generic Boilerplate Does Not Outrank Geographic Candidate
    # ==================================================

    def test_generic_boilerplate_does_not_outrank_strong_geographic_candidate(self):
        """A boilerplate candidate like 'Contact' must not outrank a legitimate destination like 'Matera'."""
        evidence = {
            "caption": (
                "Matera is one of the oldest continuously inhabited cities in the world.\n"
                "©️Copyright. Contact for licensing and fee.\n"
                "#matera #visititaly"
            ),
            "ocr_text": "",
            "speech_text": "",
            "title": "Matera Travel Guide",
        }

        boilerplate_place = {
            "place": {
                "travel_name": "Contact",
                "name": "Contact",
                "primary_type": "point_of_interest",
                "types": ["point_of_interest", "establishment"],
                "country": "India",
                "rating": 3.5,
                "user_rating_count": 12,
                "verified_query": "Contact",
            }
        }

        geographic_place = {
            "place": {
                "travel_name": "Matera",
                "name": "Matera",
                "primary_type": "locality",
                "types": ["locality", "political"],
                "country": "Italy",
                "rating": 4.8,
                "user_rating_count": 5200,
                "verified_query": "Matera",
            }
        }

        ranked = self.scoring_service.rank_places([boilerplate_place["place"], geographic_place["place"]], evidence)
        self.assertGreater(len(ranked), 0)
        self.assertEqual(ranked[0]["place"]["travel_name"], "Matera")
        self.assertGreater(ranked[0]["score"], ranked[1]["score"])

    # ==================================================
    # 5. Multi-Location Pipeline Support
    # ==================================================

    def test_multiple_legitimate_locations_can_survive_resolution_pipeline(self):
        """When multiple legitimate destinations are resolved, they are preserved in response.locations."""
        winner = {
            "score": 95,
            "place": {
                "place_id": "place_katmai",
                "travel_name": "Katmai National Park and Preserve",
                "name": "Katmai National Park and Preserve",
                "formatted_address": "King Salmon, AK 99613, USA",
                "country": "United States",
                "types": ["national_park", "tourist_attraction"],
                "rating": 4.9,
                "user_rating_count": 1500,
                "confidence": 95,
                "verification_status": "VERIFIED",
            },
        }

        second_place = {
            "score": 90,
            "place": {
                "place_id": "place_yellowstone",
                "travel_name": "Yellowstone National Park",
                "name": "Yellowstone National Park",
                "formatted_address": "Yellowstone National Park, WY 82190, USA",
                "country": "United States",
                "types": ["national_park", "tourist_attraction"],
                "rating": 4.8,
                "user_rating_count": 35000,
                "confidence": 90,
                "verification_status": "VERIFIED",
            },
        }

        third_place = {
            "score": 88,
            "place": {
                "place_id": "place_glacier_bay",
                "travel_name": "Glacier Bay National Park and Preserve",
                "name": "Glacier Bay National Park and Preserve",
                "formatted_address": "Gustavus, AK 99826, USA",
                "country": "United States",
                "types": ["national_park", "tourist_attraction"],
                "rating": 4.8,
                "user_rating_count": 800,
                "confidence": 88,
                "verification_status": "VERIFIED",
            },
        }

        ranked_places = [winner, second_place, third_place]

        response = self.response_builder.build(
            winner=winner,
            gemini_result=None,
            stage="caption",
            ranked_places=ranked_places,
        )

        self.assertTrue(response.success)
        self.assertIsNotNone(response.best_guess)
        self.assertEqual(response.best_guess.name, "Katmai National Park and Preserve")

        # Multi-location list contains all 3 verified destinations
        self.assertEqual(len(response.locations), 3)
        names = [loc.name for loc in response.locations]
        self.assertIn("Katmai National Park and Preserve", names)
        self.assertIn("Yellowstone National Park", names)
        self.assertIn("Glacier Bay National Park and Preserve", names)

    # ==================================================
    # 6. /reel/ URLs Continue to Work
    # ==================================================

    def test_reel_urls_continue_to_work(self):
        """Standard /reel/ and /reels/ URLs must continue to pass validation."""
        valid_reels = [
            "https://www.instagram.com/reel/DbYymykNiS2/",
            "https://instagram.com/reel/DbYymykNiS2",
            "https://www.instagram.com/reels/DZNJ_7wtP4v/",
        ]
        for url in valid_reels:
            with self.subTest(url=url):
                req = AnalyzeRequest(reel_url=url)
                self.assertEqual(req.target_url, url)

    # ==================================================
    # 7. /p/ URLs Accepted by Validation Layer
    # ==================================================

    def test_p_urls_accepted_by_url_validation_layer(self):
        """Instagram post URLs (/p/) must be accepted by URL validation layer."""
        valid_posts = [
            "https://www.instagram.com/p/DbAvsNRsvX0/",
            "https://instagram.com/p/DbAvsNRsvX0",
            "http://www.instagram.com/p/C1234567890/",
        ]
        for url in valid_posts:
            with self.subTest(url=url):
                req = AnalyzeRequest(reel_url=url)
                self.assertEqual(req.target_url, url)

        # Other unsupported Instagram formats still rejected
        with self.assertRaises(ValueError):
            AnalyzeRequest(reel_url="https://instagram.com/stories/user/12345/")
        with self.assertRaises(ValueError):
            AnalyzeRequest(reel_url="https://example.com/not-instagram")


if __name__ == "__main__":
    unittest.main()
