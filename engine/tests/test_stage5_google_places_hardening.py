"""
Stage 5 Regression Test Suite: Google Places Resolution & Enrichment Hardening.

Covers:
1. Google Places search handles null/missing fields (displayName, location, viewport, types) without crashing.
2. Google Place Details handles null/missing fields (hours, summary, photos, accessibility) without crashing.
3. Query normalization collapses whitespace, normalizes commas, and strips trailing punctuation.
4. Query relaxation fallback succeeds on parenthetical and multi-segment candidates when exact search returns 0 results.
5. Graceful Details fallback: if Google Place Details fails/returns None, search result data is preserved.
6. Landmark vs. generic business filtering: commercial services are filtered, while cultural landmarks are preserved.
7. Country/region consistency: matching country receives bonus; mismatching country is penalized; multi-country captions do not penalize either.
8. API failure / quota error tracking: last_error records status code and diagnostic messages.
9. Upstream candidate evidence preservation: build_unresolved preserves extracted_candidates.
10. Deterministic ranking: score ties are deterministically resolved by place ID.
11. Stage 3 multi-location behavior is preserved in AnalysisResponse.
"""

import unittest
from unittest.mock import MagicMock, patch

from engine.app.services.maps.google_places_service import GooglePlacesService
from engine.app.services.maps.google_place_details_service import GooglePlaceDetailsService
from engine.app.services.location.location_resolver import LocationResolver
from engine.app.services.scoring.scoring_service import ScoringService
from engine.app.services.response.response_builder import ResponseBuilder
from engine.domain.schemas.responses import AnalysisResponse, BestGuess


class TestStage5GooglePlacesHardening(unittest.TestCase):

    def setUp(self):
        self.places_service = GooglePlacesService()
        self.details_service = GooglePlaceDetailsService()
        self.resolver = LocationResolver()
        self.scorer = ScoringService()
        self.response_builder = ResponseBuilder()

    # ==================================================
    # 1. Null Safety: GooglePlacesService.search
    # ==================================================

    def test_places_search_null_safety(self):
        """API response containing null displayName, null location, or null types must not raise exceptions."""
        self.places_service.api_key = "test_key"

        mock_payload = {
            "places": [
                {
                    "id": "place_null_fields_1",
                    "displayName": None,  # Can crash .get("displayName", {}).get("text")
                    "formattedAddress": None,
                    "location": None,     # Can crash .get("location", {}).get("latitude")
                    "types": None,
                    "primaryType": None,
                    "rating": None,
                    "userRatingCount": None,
                    "businessStatus": None,
                    "viewport": None,
                    "googleMapsUri": None,
                },
                {
                    "id": "place_valid_2",
                    "displayName": {"text": "Valid Place"},
                    "formattedAddress": "123 Main St, Rome, Italy",
                    "location": {"latitude": 41.9, "longitude": 12.5},
                    "types": ["tourist_attraction"],
                    "primaryType": "tourist_attraction",
                    "rating": 4.7,
                    "userRatingCount": 350,
                },
                # Null place item in places list
                None,
            ]
        }

        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = mock_payload

        with patch("requests.post", return_value=mock_resp):
            results = self.places_service.search("Valid Place")

        self.assertEqual(len(results), 2)
        # Place 1: handled gracefully with safe fallbacks
        self.assertEqual(results[0]["id"], "place_null_fields_1")
        self.assertEqual(results[0]["display_name"], "")
        self.assertIsNone(results[0]["latitude"])
        self.assertEqual(results[0]["types"], [])
        self.assertEqual(results[0]["viewport"], {})

        # Place 2: parsed accurately
        self.assertEqual(results[1]["id"], "place_valid_2")
        self.assertEqual(results[1]["display_name"], "Valid Place")
        self.assertEqual(results[1]["latitude"], 41.9)

    def test_places_search_null_places_array(self):
        """API response with 'places': null (zero results variant) must return [] without crashing."""
        self.places_service.api_key = "test_key"
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = {"places": None}

        with patch("requests.post", return_value=mock_resp):
            results = self.places_service.search("Empty Query")

        self.assertEqual(results, [])

    # ==================================================
    # 2. Null Safety: GooglePlaceDetailsService.get_details
    # ==================================================

    def test_place_details_null_safety(self):
        """Place Details containing null hours, summary, photos, or accessibility must not crash."""
        self.details_service.api_key = "test_key"

        mock_payload = {
            "id": "details_null_1",
            "displayName": None,
            "formattedAddress": "Lake Como, Italy",
            "location": None,
            "primaryType": None,
            "types": None,
            "rating": None,
            "userRatingCount": None,
            "googleMapsUri": None,
            "regularOpeningHours": None,  # Can crash .get("regularOpeningHours", {}).get(...)
            "currentOpeningHours": None,
            "editorialSummary": None,     # Can crash .get("editorialSummary", {}).get("text")
            "photos": None,               # Can crash [p for p in data.get("photos", [])]
            "accessibilityOptions": None,
            "plusCode": None,
            "viewport": None,
            "utcOffsetMinutes": None,
        }

        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = mock_payload

        with patch("requests.get", return_value=mock_resp):
            details = self.details_service.get_details("details_null_1")

        self.assertIsNotNone(details)
        self.assertEqual(details["id"], "details_null_1")
        self.assertEqual(details["display_name"], "")
        self.assertIsNone(details["latitude"])
        self.assertEqual(details["opening_hours"], [])
        self.assertEqual(details["current_opening_hours"], [])
        self.assertEqual(details["editorial_summary"], "")
        self.assertEqual(details["photos"], [])
        self.assertEqual(details["rating"], 0.0)

    # ==================================================
    # 3. Query Construction & Normalization
    # ==================================================

    def test_query_normalization(self):
        """Query normalization collapses spaces, formats commas, and strips trailing punctuation."""
        cases = [
            ("   Lago  di   Predil  ,  Italy   ", "Lago di Predil, Italy"),
            ("The Fulling Mill, Alresford, Hampshire.\n", "The Fulling Mill, Alresford, Hampshire"),
            ("\"Varenna, Lake Como\"", "Varenna, Lake Como"),
            ("   ", ""),
            ("???", ""),
            ("Rome -", "Rome"),
        ]

        for raw, expected in cases:
            with self.subTest(raw=raw):
                norm = self.places_service.normalize_query(raw)
                self.assertEqual(norm, expected)

    def test_search_rejects_empty_or_non_alphanumeric(self):
        """Queries without alphanumeric characters are rejected before making network calls."""
        with patch("requests.post") as mock_post:
            self.assertEqual(self.places_service.search(""), [])
            self.assertEqual(self.places_service.search("   "), [])
            self.assertEqual(self.places_service.search("..."), [])
            self.assertEqual(self.places_service.search("?!,"), [])
            mock_post.assert_not_called()

    # ==================================================
    # 4. Query Relaxation on Zero Results
    # ==================================================

    def test_query_fallbacks_generation(self):
        """_generate_query_fallbacks generates appropriate parenthetical and comma relaxations."""
        # Parenthetical
        fb1 = self.resolver._generate_query_fallbacks("St. Joseph's Cathedral (St. Philomena's shrine)")
        self.assertIn("St. Joseph's Cathedral", fb1)
        self.assertIn("St. Philomena's shrine", fb1)

        # 3+ comma segments
        fb2 = self.resolver._generate_query_fallbacks("The Fulling Mill, Alresford, Hampshire")
        self.assertIn("The Fulling Mill, Hampshire", fb2)
        self.assertIn("The Fulling Mill, Alresford", fb2)

    def test_query_relaxation_resolves_when_exact_fails(self):
        """When exact candidate returns 0 results, relaxed fallback query is attempted and succeeds."""
        # Mock search service: returns [] on exact complex query, returns result on relaxed query
        def mock_search_side_effect(q):
            if "St. Joseph's Cathedral (St. Philomena's shrine)" in q:
                return []
            if "St. Philomena's shrine" in q or "St. Joseph's Cathedral" in q:
                return [
                    {
                        "id": "shrine_place_123",
                        "display_name": "St. Philomena's Cathedral",
                        "formatted_address": "Mysuru, Karnataka, India",
                        "latitude": 12.32,
                        "longitude": 76.66,
                        "types": ["church", "place_of_worship", "tourist_attraction"],
                        "primary_type": "church",
                        "rating": 4.6,
                        "user_rating_count": 8900,
                        "business_status": "OPERATIONAL",
                        "google_maps_url": "https://maps.google.com/?cid=123",
                    }
                ]
            return []

        with patch.object(self.resolver.search, "search", side_effect=mock_search_side_effect):
            with patch.object(self.resolver.details, "get_details", return_value=None):
                evidence = {
                    "caption": "Visiting St. Joseph's Cathedral (St. Philomena's shrine) in Mysuru, India.",
                    "ocr_text": "",
                    "speech_text": "",
                    "metadata": {},
                }
                # Feed the complex candidate
                with patch.object(self.resolver.candidates, "generate", return_value=["St. Joseph's Cathedral (St. Philomena's shrine)"]):
                    result = self.resolver.resolve(evidence)

        self.assertIsNotNone(result)
        winner = result["winner"]["place"]
        # Original candidate is preserved
        self.assertEqual(winner["matched_candidate"], "St. Joseph's Cathedral (St. Philomena's shrine)")
        # Resolved via relaxed query
        self.assertIn("St. Joseph's Cathedral", winner["resolved_via_query"])

    # ==================================================
    # 5. Graceful Details Fallback
    # ==================================================

    def test_details_failure_preserves_search_result(self):
        """If get_details fails (None), candidate is NOT dropped; search result data is used."""
        search_mock_result = [
            {
                "id": "place_fallback_456",
                "display_name": "Varenna",
                "formatted_address": "23829 Varenna, Province of Lecco, Italy",
                "latitude": 45.99,
                "longitude": 9.28,
                "types": ["locality", "political"],
                "primary_type": "locality",
                "rating": 4.8,
                "user_rating_count": 2100,
                "business_status": "OPERATIONAL",
                "google_maps_url": "https://maps.google.com/?cid=456",
            }
        ]

        with patch.object(self.resolver.search, "search", return_value=search_mock_result):
            # Details API fails / returns None
            with patch.object(self.resolver.details, "get_details", return_value=None):
                evidence = {
                    "caption": "Exploring Varenna on Lake Como in Italy.",
                    "ocr_text": "",
                    "speech_text": "",
                    "metadata": {},
                }
                with patch.object(self.resolver.candidates, "generate", return_value=["Varenna"]):
                    res = self.resolver.resolve(evidence)

        self.assertIsNotNone(res)
        winner = res["winner"]["place"]
        self.assertEqual(winner["name"], "Varenna")
        self.assertEqual(winner["country"], "Italy")
        self.assertEqual(winner["latitude"], 45.99)

    # ==================================================
    # 6. Landmark Protection vs Generic Business
    # ==================================================

    def test_commercial_services_filtered_landmarks_preserved(self):
        """Generic retail/services (dentist, real estate) are filtered; landmarks/cultural sites are preserved."""
        # Commercial service: should be filtered
        dentist = {
            "display_name": "Lake Como Dental Clinic",
            "primary_type": "dentist",
            "types": ["dentist", "health", "point_of_interest", "establishment"],
        }
        self.assertTrue(self.resolver.is_business(dentist))

        real_estate = {
            "display_name": "Alpine Real Estate Agency",
            "primary_type": "real_estate_agency",
            "types": ["real_estate_agency", "point_of_interest", "establishment"],
        }
        self.assertTrue(self.resolver.is_business(real_estate))

        # Tourist landmark with commercial tag: MUST NOT be filtered
        art_gallery = {
            "display_name": "Itoya Ginza Stationery",
            "primary_type": "store",
            "types": ["art_gallery", "tourist_attraction", "store", "point_of_interest"],
        }
        self.assertFalse(self.resolver.is_business(art_gallery))

        historic_cathedral = {
            "display_name": "St. Joseph's Cathedral",
            "primary_type": "church",
            "types": ["church", "place_of_worship", "historical_landmark", "point_of_interest"],
        }
        self.assertFalse(self.resolver.is_business(historic_cathedral))

    # ==================================================
    # 7. Country / Region Consistency
    # ==================================================

    def test_country_consistency_scoring(self):
        """Candidates matching evidence country receive a bonus; mismatched countries receive penalty."""
        evidence = {
            "caption": "Spending a beautiful weekend in Italy exploring Lake Como.",
            "speech_text": "",
            "ocr_text": "",
            "hashtags": ["#italy", "#travel"],
            "title": "Italy Guide",
        }

        italian_place = {
            "travel_name": "Varenna",
            "name": "Varenna",
            "country": "Italy",
            "primary_type": "locality",
            "types": ["locality"],
            "rating": 4.8,
            "user_rating_count": 2000,
        }

        indian_place = {
            "travel_name": "Varenna Clinic",
            "name": "Varenna Clinic",
            "country": "India",
            "primary_type": "locality",
            "types": ["locality"],
            "rating": 4.8,
            "user_rating_count": 2000,
        }

        ranked = self.scorer.rank_places([{"place": italian_place}, {"place": indian_place}], evidence)
        self.assertEqual(len(ranked), 2)
        # Italian destination must outrank Indian entity decisively
        self.assertEqual(ranked[0]["place"]["country"], "Italy")
        self.assertGreater(ranked[0]["score"], ranked[1]["score"] + 40)

    def test_multi_country_evidence_no_false_penalties(self):
        """When caption mentions two countries (e.g. Italy and Austria), neither country is penalized."""
        evidence = {
            "caption": "Road trip from Austria across the border into Italy to see the lakes.",
            "speech_text": "",
            "ocr_text": "",
            "hashtags": [],
            "title": "",
        }

        austrian_place = {
            "travel_name": "Seebensee",
            "name": "Seebensee",
            "country": "Austria",
            "primary_type": "natural_feature",
            "types": ["natural_feature"],
            "rating": 4.9,
            "user_rating_count": 1000,
        }

        italian_place = {
            "travel_name": "Lago di Predil",
            "name": "Lago di Predil",
            "country": "Italy",
            "primary_type": "natural_feature",
            "types": ["natural_feature"],
            "rating": 4.8,
            "user_rating_count": 1000,
        }

        ranked = self.scorer.rank_places([{"place": austrian_place}, {"place": italian_place}], evidence)
        # Both should have strong positive scores (no -90 mismatch penalty on either)
        self.assertGreater(ranked[0]["score"], 60)
        self.assertGreater(ranked[1]["score"], 60)

    # ==================================================
    # 8. Error Tracking and Quota Handling
    # ==================================================

    def test_api_quota_error_tracked(self):
        """HTTP 429 quota error sets explicit diagnostic last_error without crashing."""
        self.places_service.api_key = "test_key"
        mock_resp = MagicMock()
        mock_resp.ok = False
        mock_resp.status_code = 429

        with patch("requests.post", return_value=mock_resp):
            res = self.places_service.search("Rome")

        self.assertEqual(res, [])
        self.assertIsNotNone(self.places_service.last_error)
        self.assertEqual(self.places_service.last_error["status"], 429)
        self.assertIn("quota or rate limit", self.places_service.last_error["message"].lower())

    # ==================================================
    # 9. Evidence Preservation on Resolution Failure
    # ==================================================

    def test_build_unresolved_preserves_extracted_candidates(self):
        """When candidate resolution returns 0 places, build_unresolved preserves candidate names."""
        attempted = ["Grand Teton National Park", "Yellowstone National Park"]
        resp = self.response_builder.build_unresolved(
            stage="caption",
            error="Google Places returned no verified destinations.",
            extracted_candidates=attempted,
        )

        self.assertFalse(resp.success)
        self.assertIsNone(resp.best_guess)
        self.assertEqual(resp.extracted_candidates, attempted)
        self.assertIn("no verified destinations", resp.error)

    # ==================================================
    # 10. Deterministic Ranking on Ties
    # ==================================================

    def test_deterministic_ranking_on_score_ties(self):
        """Identical candidate scores are deterministically ordered by place ID."""
        place_b = {
            "travel_name": "Destination B",
            "name": "Destination B",
            "id": "place_b_id",
            "country": "France",
            "primary_type": "natural_feature",
            "types": ["natural_feature"],
            "rating": 4.5,
            "user_rating_count": 500,
        }
        place_a = {
            "travel_name": "Destination A",
            "name": "Destination A",
            "id": "place_a_id",
            "country": "France",
            "primary_type": "natural_feature",
            "types": ["natural_feature"],
            "rating": 4.5,
            "user_rating_count": 500,
        }

        evidence = {"caption": "France trip", "speech_text": "", "ocr_text": "", "hashtags": []}

        # Run multiple times with different initial order; output order must be deterministic
        order_1 = self.scorer.rank_places([{"place": place_b}, {"place": place_a}], evidence)
        order_2 = self.scorer.rank_places([{"place": place_a}, {"place": place_b}], evidence)

        self.assertEqual(
            [x["place"]["id"] for x in order_1],
            [x["place"]["id"] for x in order_2],
        )

    # ==================================================
    # 11. Preservation of Stage 3 Multi-Location Behavior
    # ==================================================

    def test_multi_location_preservation(self):
        """build preserves multi-location candidates in response.locations with best_guess compatibility."""
        winner_item = {
            "place": {
                "travel_name": "Grand Teton National Park, Wyoming, USA",
                "name": "Grand Teton National Park",
                "id": "place_teton",
                "country": "USA",
                "primary_type": "national_park",
                "types": ["national_park"],
                "rating": 4.9,
                "user_rating_count": 12000,
                "formatted_address": "Wyoming, USA",
                "latitude": 43.79,
                "longitude": -110.68,
                "verification_status": "VERIFIED",
            },
            "score": 95.0,
            "confidence": "VERY_HIGH",
        }

        second_item = {
            "place": {
                "travel_name": "Yellowstone National Park, Wyoming, USA",
                "name": "Yellowstone National Park",
                "id": "place_yellowstone",
                "country": "USA",
                "primary_type": "national_park",
                "types": ["national_park"],
                "rating": 4.8,
                "user_rating_count": 45000,
                "formatted_address": "Wyoming, USA",
                "latitude": 44.42,
                "longitude": -110.58,
                "verification_status": "VERIFIED",
            },
            "score": 91.0,
            "confidence": "VERY_HIGH",
        }

        resp = self.response_builder.build(
            winner=winner_item,
            gemini_result=None,
            stage="caption",
            ranked_places=[winner_item, second_item],
        )

        self.assertTrue(resp.success)
        self.assertEqual(resp.best_guess.name, "Grand Teton National Park, Wyoming, USA")
        self.assertEqual(len(resp.locations), 2)
        self.assertEqual(resp.locations[0].name, "Grand Teton National Park, Wyoming, USA")
        self.assertEqual(resp.locations[1].name, "Yellowstone National Park, Wyoming, USA")


if __name__ == "__main__":
    unittest.main()
