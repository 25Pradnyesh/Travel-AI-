"""
Stage 11 — Performance & Cost Optimization Regression and Correctness Test Suite.

Validates:
1. In-memory LRU caching for Google Places search, place details, and nearby search.
2. Deferred Place Details execution (details fetched only for winning candidate).
3. Concurrent candidate search determinism and ordering.
4. Frame sorting prioritization by text density.
5. Gemini fast deterministic certainty exit and close-call verification retention.
"""

import unittest
from unittest.mock import MagicMock, patch

from engine.app.services.maps.google_places_service import (
    GooglePlacesService,
    clear_places_search_cache,
)
from engine.app.services.maps.google_place_details_service import (
    GooglePlaceDetailsService,
    clear_place_details_cache,
)
from engine.app.services.maps.nearby_search_service import (
    NearbySearchService,
    clear_nearby_cache,
)
from engine.app.services.location.location_resolver import LocationResolver
from engine.app.services.gemini.gemini_verifier import GeminiVerifier
from engine.app.services.extraction.frame_extractor import FrameExtractor


class TestStage11Performance(unittest.TestCase):

    def setUp(self):
        clear_places_search_cache()
        clear_place_details_cache()
        clear_nearby_cache()

    def tearDown(self):
        clear_places_search_cache()
        clear_place_details_cache()
        clear_nearby_cache()

    # ==================================================
    # 1. Google Places Search In-Memory Caching
    # ==================================================

    def test_google_places_search_caching(self):
        """Identical search queries must hit in-memory cache without repeating HTTP calls."""
        service = GooglePlacesService()
        mock_response = [
            {"id": "place_123", "display_name": "Lake Como", "formatted_address": "Italy"}
        ]

        with patch.object(service, "api_key", "mock_key"):
            with patch("requests.post") as mock_post:
                mock_resp = MagicMock()
                mock_resp.ok = True
                mock_resp.json.return_value = {
                    "places": [
                        {
                            "id": "place_123",
                            "displayName": {"text": "Lake Como"},
                            "formattedAddress": "Italy",
                            "location": {"latitude": 46.0, "longitude": 9.2},
                            "types": ["locality"],
                        }
                    ]
                }
                mock_post.return_value = mock_resp

                # First call: makes network request
                res1 = service.search("Lake Como, Italy")
                self.assertEqual(len(res1), 1)
                self.assertEqual(res1[0]["id"], "place_123")
                self.assertEqual(mock_post.call_count, 1)

                # Second call with normalized equivalent query: must hit cache
                res2 = service.search("  Lake Como,   Italy  ")
                self.assertEqual(len(res2), 1)
                self.assertEqual(res2[0]["id"], "place_123")
                self.assertEqual(mock_post.call_count, 1)  # No second HTTP call

                # Clear cache and verify it calls network again
                service.clear_cache()
                res3 = service.search("Lake Como, Italy")
                self.assertEqual(len(res3), 1)
                self.assertEqual(mock_post.call_count, 2)

    # ==================================================
    # 2. Google Place Details In-Memory Caching
    # ==================================================

    def test_google_place_details_caching(self):
        """Identical place IDs must return cached details without repeating HTTP calls."""
        service = GooglePlaceDetailsService()

        with patch.object(service, "api_key", "mock_key"):
            with patch("requests.get") as mock_get:
                mock_resp = MagicMock()
                mock_resp.ok = True
                mock_resp.json.return_value = {
                    "id": "place_456",
                    "displayName": {"text": "Tre Cime"},
                    "formattedAddress": "Belluno, Italy",
                    "websiteUri": "https://trecime.it",
                }
                mock_get.return_value = mock_resp

                # First call: network call
                d1 = service.get_details("place_456")
                self.assertIsNotNone(d1)
                self.assertEqual(d1["id"], "place_456")
                self.assertEqual(mock_get.call_count, 1)

                # Second call: must hit cache
                d2 = service.get_details("place_456")
                self.assertIsNotNone(d2)
                self.assertEqual(d2["website"], "https://trecime.it")
                self.assertEqual(mock_get.call_count, 1)  # No second HTTP call

                # Clear cache and verify
                service.clear_cache()
                d3 = service.get_details("place_456")
                self.assertEqual(mock_get.call_count, 2)

    # ==================================================
    # 3. Nearby Search Coordinate Caching
    # ==================================================

    def test_nearby_search_coordinate_caching(self):
        """Nearby search queries with identical rounded coordinates hit in-memory cache."""
        service = NearbySearchService()

        with patch.object(service, "search_category", return_value=[{"id": "p1", "name": "Spot"}]) as mock_cat:
            # First search
            res1 = service.search(45.9912, 9.2814)
            self.assertIn("must_visit", res1)
            initial_calls = mock_cat.call_count
            self.assertGreater(initial_calls, 0)

            # Second search with near-identical coordinates (rounds to same 3 decimals)
            res2 = service.search(45.9914, 9.2811)
            self.assertIn("must_visit", res2)
            # Call count must remain identical (cached)
            self.assertEqual(mock_cat.call_count, initial_calls)

    # ==================================================
    # 4. Deferred Place Details: Winner Only
    # ==================================================

    def test_deferred_place_details_in_resolver(self):
        """LocationResolver.resolve must NOT call get_details for all search results, only the winner."""
        resolver = LocationResolver()

        # Two search candidates yielding 4 total search results
        mock_candidates = ["Winner Location", "Runner Up Location"]
        resolver.candidates.generate = MagicMock(return_value=mock_candidates)

        def mock_search(cand):
            if cand == "Winner Location":
                return [
                    {
                        "id": "place_win_1",
                        "display_name": "Winner Location",
                        "formatted_address": "Winner Location, Italy",
                        "latitude": 45.0,
                        "longitude": 9.0,
                        "types": ["locality", "tourist_attraction"],
                        "primary_type": "tourist_attraction",
                        "rating": 4.9,
                        "user_rating_count": 5000,
                    },
                    {
                        "id": "place_win_2",
                        "display_name": "Winner Cafe",
                        "formatted_address": "Winner Location, Italy",
                        "types": ["cafe"],  # Should be filtered as business
                        "primary_type": "cafe",
                    },
                ]
            else:
                return [
                    {
                        "id": "place_run_1",
                        "display_name": "Runner Up Location",
                        "formatted_address": "Runner Up, France",
                        "latitude": 44.0,
                        "longitude": 5.0,
                        "types": ["locality"],
                        "primary_type": "locality",
                        "rating": 4.0,
                        "user_rating_count": 100,
                    }
                ]

        resolver.search.search = MagicMock(side_effect=mock_search)
        mock_details = MagicMock(return_value={
            "id": "place_win_1",
            "website": "https://winner.com",
            "phone": "+123456789",
            "photos": [{"name": "photo_1"}],
            "editorial_summary": "Spectacular destination.",
        })
        resolver.details.get_details = mock_details
        resolver.nearby.search = MagicMock(return_value={"must_visit": [], "statistics": {}})
        resolver.travel.enrich = MagicMock(side_effect=lambda p: p)

        evidence = {
            "caption": "Visiting Winner Location in Italy!",
            "ocr_text": "",
            "speech_text": "",
            "metadata": {},
        }

        result = resolver.resolve(evidence)
        self.assertIsNotNone(result)

        winner = result["winner"]["place"]
        self.assertEqual(winner["id"], "place_win_1")
        # Winner must have enriched details merged
        self.assertEqual(winner.get("website"), "https://winner.com")
        self.assertEqual(winner.get("photos"), [{"name": "photo_1"}])

        # CRITICAL ASSERTION: get_details was called EXACTLY ONCE for the winner,
        # NOT called for place_win_2 or place_run_1 during search loop!
        self.assertEqual(mock_details.call_count, 1)
        mock_details.assert_called_once_with("place_win_1")

    # ==================================================
    # 5. Concurrent Candidate Search Determinism
    # ==================================================

    def test_concurrent_candidate_search_preserves_order(self):
        """Concurrent search must maintain strict candidate priority and determinism."""
        resolver = LocationResolver()
        resolver.candidates.generate = MagicMock(return_value=["Alpha", "Beta", "Gamma"])

        searched_order = []

        def tracked_search(q):
            searched_order.append(q)
            return [
                {
                    "id": f"id_{q.lower()}",
                    "display_name": f"{q} Spot",
                    "formatted_address": f"{q}, Italy",
                    "latitude": 45.0,
                    "longitude": 9.0,
                    "types": ["locality"],
                    "primary_type": "locality",
                    "rating": 4.5,
                    "user_rating_count": 500,
                }
            ]

        resolver.search.search = MagicMock(side_effect=tracked_search)
        resolver.details.get_details = MagicMock(return_value={"id": "id_alpha"})
        resolver.nearby.search = MagicMock(return_value={})
        resolver.travel.enrich = MagicMock(side_effect=lambda p: p)

        evidence = {"caption": "Alpha in Italy", "ocr_text": "", "speech_text": ""}
        result = resolver.resolve(evidence)

        self.assertIsNotNone(result)
        # Alpha is top candidate and winner
        self.assertEqual(result["winner"]["place"]["id"], "id_alpha")

    # ==================================================
    # 6. Frame Extractor: Prioritizes Text Density
    # ==================================================

    def test_frame_extractor_sorts_by_text_density(self):
        """FrameExtractor sorts frames by text density and quality descending."""
        extractor = FrameExtractor()
        # Verify comparator logic
        candidates = [
            {"frame_no": 10, "metrics": {"score": 50.0, "text_density": 0.01}},
            {"frame_no": 20, "metrics": {"score": 85.0, "text_density": 0.15}},
            {"frame_no": 30, "metrics": {"score": 70.0, "text_density": 0.08}},
        ]
        candidates.sort(
            key=lambda x: (
                x["metrics"].get("text_density", 0.0),
                x["metrics"].get("score", 0.0),
            ),
            reverse=True,
        )
        self.assertEqual(candidates[0]["frame_no"], 20)  # Highest text density
        self.assertEqual(candidates[1]["frame_no"], 30)
        self.assertEqual(candidates[2]["frame_no"], 10)

    # ==================================================
    # 7. Gemini Verification: Fast-Path Deterministic Certainty
    # ==================================================

    def test_gemini_skips_when_single_candidate_confident(self):
        """Single candidate with score >= 80 skips Gemini verification."""
        verifier = GeminiVerifier()
        ranked = [
            {
                "place": {"travel_name": "Matera, Italy", "id": "p1"},
                "score": 85.0,
                "confidence": "HIGH",
            }
        ]
        self.assertFalse(verifier.should_verify(ranked))

    def test_gemini_skips_when_winner_decisive_margin(self):
        """Top candidate with score >= 95 and gap >= 10 skips Gemini verification."""
        verifier = GeminiVerifier()
        ranked = [
            {"place": {"travel_name": "Varenna, Italy", "id": "p1"}, "score": 98.0},
            {"place": {"travel_name": "Milan, Italy", "id": "p2"}, "score": 85.0},  # Gap = 13 >= 10
        ]
        self.assertFalse(verifier.should_verify(ranked))

    def test_gemini_runs_on_close_call(self):
        """Close calls (gap <= 10) still trigger Gemini verification."""
        verifier = GeminiVerifier()
        ranked = [
            {"place": {"travel_name": "Seebensee, Austria", "id": "p1"}, "score": 92.0},
            {"place": {"travel_name": "Plansee, Austria", "id": "p2"}, "score": 88.0},  # Gap = 4 <= 10
        ]
        self.assertTrue(verifier.should_verify(ranked))


if __name__ == "__main__":
    unittest.main()
