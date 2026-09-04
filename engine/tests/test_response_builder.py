import unittest
from unittest.mock import MagicMock, patch

from engine.domain.schemas.responses import AnalysisResponse, BestGuess
from engine.app.services.response.response_builder import ResponseBuilder


class TestResponseBuilder(unittest.TestCase):

    def setUp(self):
        self.builder = ResponseBuilder()

        self.mock_place = {
            "place_id": "ChIJ_3jP9EabmUcR5kCgX_X1AAA",
            "id": "ChIJ_3jP9EabmUcR5kCgX_X1AAA",
            "travel_name": "Seebensee",
            "display_name": "Seebensee Alpine Lake",
            "formatted_address": "Ehrwald 6632, Tyrol, Austria",
            "country": "Austria",
            "city": "Ehrwald",
            "region": "Tyrol",
            "latitude": 47.368912,
            "longitude": 10.923456,
            "rating": 4.9,
            "user_rating_count": 850,
            "types": ["natural_feature", "tourist_attraction"],
            "google_maps_url": "https://maps.google.com/?cid=998877",
            "photos": [
                {
                    "url": "https://example.com/seebensee1.jpg",
                    "width": 1920,
                    "height": 1080,
                    "author": ["Photographer Alpha"],
                },
                {
                    "name": "places/ChIJ/photos/ref_abc",
                    "width": 1200,
                    "height": 800,
                },
            ],
            "matched_sources": ["ocr", "caption", "speech"],
            "category": "Nature",
            "category_emoji": "🏔️",
            "best_season": "Summer & Autumn",
            "budget_level": "$$",
            "estimated_daily_budget": "$120 - $180",
            "travel_tips": ["Bring sturdy hiking boots.", "Start early in the morning."],
            "nearby": {
                "must_visit": [
                    {
                        "id": "nb_1",
                        "name": "Coburger Hütte",
                        "formatted_address": "Ehrwald, Austria",
                        "latitude": 47.3645,
                        "longitude": 10.9250,
                        "rating": 4.8,
                        "user_rating_count": 520,
                        "types": ["lodging", "restaurant"],
                        "distance_km": 1.2,
                        "google_maps_url": "https://maps.google.com/?cid=111",
                    }
                ],
                "food": [
                    {
                        "id": "nb_2",
                        "name": "Almgasthof",
                        "formatted_address": "Ehrwald, Austria",
                        "latitude": 47.3700,
                        "longitude": 10.9200,
                        "rating": 4.5,
                        "user_rating_count": 180,
                        "types": ["restaurant"],
                        "distance_km": 2.5,
                    }
                ],
            },
        }

        self.mock_winner = {
            "place": self.mock_place,
            "score": 94.5,
            "confidence": "VERIFIED",
        }

        self.mock_gemini = {
            "winner": self.mock_winner,
            "confidence": 0.96,
            "reason": "Caption and OCR explicitly identify Seebensee in Tyrol, Austria.",
            "verification_status": "VERIFIED",
            "vision": {
                "matches_candidate": True,
                "visual_clues": ["alpine lake", "mountain reflection"],
            },
        }

    def test_successful_response_preserves_all_metadata(self):
        """Test complete canonical response structure and metadata preservation."""
        response = self.builder.build(
            winner=self.mock_winner,
            gemini_result=self.mock_gemini,
            stage="caption",
        )

        self.assertTrue(response.success)
        self.assertIsInstance(response, AnalysisResponse)
        self.assertIsNotNone(response.best_guess)

        bg = response.best_guess
        self.assertEqual(bg.place_id, "ChIJ_3jP9EabmUcR5kCgX_X1AAA")
        self.assertEqual(bg.name, "Seebensee")
        self.assertEqual(bg.formatted_address, "Ehrwald 6632, Tyrol, Austria")
        self.assertEqual(bg.country, "Austria")
        self.assertEqual(bg.city, "Ehrwald")
        self.assertEqual(bg.region, "Tyrol")
        self.assertAlmostEqual(bg.latitude, 47.368912, places=5)
        self.assertAlmostEqual(bg.longitude, 10.923456, places=5)
        self.assertEqual(bg.rating, 4.9)
        self.assertEqual(bg.user_ratings_total, 850)
        self.assertIn("natural_feature", bg.types)
        self.assertEqual(bg.maps_url, "https://maps.google.com/?cid=998877")

        # Confidence: score 94.5 -> integer 94 (round half to even)
        self.assertEqual(bg.confidence, int(round(94.5)))
        self.assertEqual(bg.confidence_level, "VERIFIED")
        self.assertEqual(bg.verification_status, "VERIFIED")
        self.assertEqual(bg.gemini_confidence, 0.96)
        self.assertIn("Seebensee", bg.why)

    def test_photos_normalization(self):
        """Test that photos with direct URLs or resource names are normalized."""
        photos = self.builder.normalize_photos(self.mock_place["photos"])
        self.assertEqual(len(photos), 2)
        self.assertEqual(photos[0].url, "https://example.com/seebensee1.jpg")
        self.assertEqual(photos[0].width, 1920)
        self.assertEqual(photos[0].height, 1080)
        self.assertEqual(photos[0].author, ["Photographer Alpha"])
        # Second photo has constructed media URL from photo resource name
        self.assertIn("places/ChIJ/photos/ref_abc", photos[1].url)

    def test_coordinates_normalization_and_validation(self):
        """Test numeric validation and bounds checking for coordinates."""
        # Valid
        lat, lng = self.builder.normalize_coordinates("45.1234", "10.5678")
        self.assertEqual(lat, 45.1234)
        self.assertEqual(lng, 10.5678)

        # Invalid bounds
        lat_oob, lng_oob = self.builder.normalize_coordinates(120.0, 50.0)
        self.assertIsNone(lat_oob)
        self.assertIsNone(lng_oob)

        # Non-numeric
        lat_err, lng_err = self.builder.normalize_coordinates("invalid", None)
        self.assertIsNone(lat_err)
        self.assertIsNone(lng_err)

    def test_maps_url_fallback_generation(self):
        """When google_maps_url is empty, generates Google Maps search query URL."""
        place_without_maps = {
            "place_id": "test_id_999",
            "latitude": 46.1234,
            "longitude": 11.5678,
            "travel_name": "Test Mountain",
        }
        url = self.builder.build_maps_url(place_without_maps, 46.1234, 11.5678, "test_id_999")
        self.assertIn("https://www.google.com/maps/search/", url)
        self.assertIn("46.1234,11.5678", url)
        self.assertIn("test_id_999", url)

    def test_travel_intelligence_attached_to_winner(self):
        """Test Travel Intelligence is packaged cleanly with categories, season, and tips."""
        response = self.builder.build(
            winner=self.mock_winner,
            gemini_result=self.mock_gemini,
        )
        ti = response.travel_intelligence
        self.assertIsInstance(ti, dict)
        self.assertIn("category", ti)
        self.assertIn("best_season", ti)
        self.assertIn("budget_level", ti)
        self.assertIn("travel_tips", ti)

    def test_nearby_places_normalization(self):
        """Test nearby places are deduplicated and formatted with distance and category."""
        response = self.builder.build(
            winner=self.mock_winner,
            gemini_result=self.mock_gemini,
        )
        nearby = response.nearby_places
        self.assertEqual(len(nearby), 2)
        self.assertEqual(nearby[0].name, "Coburger Hütte")
        self.assertEqual(nearby[0].category, "Attraction")
        self.assertEqual(nearby[0].distance_km, 1.2)
        self.assertEqual(nearby[1].name, "Almgasthof")
        self.assertEqual(nearby[1].category, "Food & Drink")

    def test_graceful_degradation_when_enrichments_fail(self):
        """Test that missing nearby data or travel intelligence does not fail the core response."""
        minimal_winner = {
            "place": {
                "travel_name": "Lake Como",
                "country": "Italy",
                "city": "Como",
                "latitude": 45.9,
                "longitude": 9.2,
                "nearby": None,
                "photos": None,
            },
            "score": 85.0,
            "confidence": "HIGH",
        }

        # Travel intelligence service raises exception
        with patch.object(self.builder.travel_service, "enrich", side_effect=Exception("API Error")):
            response = self.builder.build(
                winner=minimal_winner,
                gemini_result=None,
            )

        self.assertTrue(response.success)
        self.assertIsNotNone(response.best_guess)
        self.assertEqual(response.best_guess.name, "Lake Como")
        self.assertEqual(response.nearby_places, [])
        self.assertEqual(response.travel_intelligence, {})

    def test_unresolved_destination_response(self):
        """Test clean contract when no destination could be verified."""
        response = self.builder.build_unresolved(
            stage="failed",
            error="No destination candidates found from the Reel.",
        )

        self.assertFalse(response.success)
        self.assertIsNone(response.best_guess)
        self.assertEqual(response.nearby_places, [])
        self.assertEqual(response.travel_intelligence, {})
        self.assertEqual(response.gemini.status, "FAILED")
        self.assertEqual(response.error, "No destination candidates found from the Reel.")


if __name__ == "__main__":
    unittest.main()
