import time
import unittest
from unittest.mock import MagicMock, patch
import numpy as np

from engine.app.services.ocr.ocr_service import OCRService, get_ocr_reader
import engine.app.services.ocr.ocr_service as ocr_module
from engine.app.services.speech.speech_service import SpeechService, get_whisper_model
import engine.app.services.speech.speech_service as speech_module
from engine.app.services.location.location_resolver import LocationResolver
from engine.app.pipelines.location_pipeline import LocationPipeline
from engine.app.services.maps.nearby_search_service import NearbySearchService
from engine.app.services.response.response_builder import ResponseBuilder
from engine.domain.schemas.responses import AnalysisResponse


class TestPhase7Performance(unittest.TestCase):

    # ==================================================
    # 1. Heavy ML Resource Reuse: Lazy EasyOCR
    # ==================================================

    def test_ocr_service_lazy_reader_and_reuse(self):
        """
        Verify that OCRService does NOT eagerly load the EasyOCR model on instantiation
        or during OpenCV-only operations, and reuses the singleton reader once accessed.
        """
        # Save previous global reader and reset
        prev_reader = ocr_module._ocr_reader
        try:
            ocr_module._ocr_reader = None

            # Instantiation must be fast and lazy
            service1 = OCRService()
            self.assertIsNone(ocr_module._ocr_reader, "EasyOCR reader should not be initialized on __init__")

            # Calling OpenCV image metrics should NOT initialize EasyOCR reader
            blank_image = np.zeros((50, 50, 3), dtype=np.uint8)
            density = service1.estimate_text_density(blank_image)
            sharpness = service1.calculate_sharpness(blank_image)
            brightness = service1.calculate_brightness(blank_image)

            self.assertIsInstance(density, float)
            self.assertIsInstance(sharpness, float)
            self.assertIsInstance(brightness, float)
            self.assertIsNone(ocr_module._ocr_reader, "OpenCV helper methods must not trigger EasyOCR initialization")

            # Mock easyocr.Reader to verify single initialization and shared reuse
            mock_reader_instance = MagicMock()
            with patch("easyocr.Reader", return_value=mock_reader_instance) as mock_reader_cls:
                reader_first = service1.reader
                service2 = OCRService()
                reader_second = service2.reader

                self.assertIs(reader_first, reader_second)
                self.assertIs(reader_first, mock_reader_instance)
                mock_reader_cls.assert_called_once_with(["en"], gpu=False)
        finally:
            ocr_module._ocr_reader = prev_reader

    # ==================================================
    # 2. Heavy ML Resource Reuse: Whisper Singleton
    # ==================================================

    def test_whisper_model_reuse(self):
        """Verify that SpeechService reuses the whisper singleton across instances."""
        prev_model = speech_module._whisper_model
        try:
            speech_module._whisper_model = None
            mock_whisper_instance = MagicMock()

            with patch("whisper.load_model", return_value=mock_whisper_instance) as mock_load:
                service1 = SpeechService()
                service2 = SpeechService()

                model1 = service1.model
                model2 = service2.model

                self.assertIs(model1, model2)
                self.assertIs(model1, mock_whisper_instance)
                mock_load.assert_called_once_with("small")
        finally:
            speech_module._whisper_model = prev_model

    # ==================================================
    # 3. Location Resolver: Winner-Only Enrichment
    # ==================================================

    def test_location_resolver_winner_only_enrichment(self):
        """
        Verify that LocationResolver.resolve only executes nearby search and travel
        enrichment for the top winning candidate, avoiding 5x Google Places calls.
        """
        resolver = LocationResolver()

        cand1 = {
            "place": {
                "id": "place_winner_1",
                "travel_name": "Winner Peak",
                "latitude": 47.123,
                "longitude": 10.456,
            },
            "score": 95.0,
            "confidence": "VERY_HIGH",
        }
        cand2 = {
            "place": {
                "id": "place_second_2",
                "travel_name": "Second Spot",
                "latitude": 47.234,
                "longitude": 10.567,
            },
            "score": 82.0,
            "confidence": "HIGH",
        }
        cand3 = {
            "place": {
                "id": "place_third_3",
                "travel_name": "Third Spot",
                "latitude": 47.345,
                "longitude": 10.678,
            },
            "score": 71.0,
            "confidence": "MEDIUM",
        }

        resolver.candidates.generate = MagicMock(return_value=["Candidate Query"])
        resolver.search.search = MagicMock(return_value=[{"id": "place_winner_1"}])
        resolver.details.get_details = MagicMock(return_value={"id": "place_winner_1"})
        resolver.formatter.format = MagicMock(return_value={"id": "place_winner_1"})
        resolver.geo.enrich = MagicMock(return_value={
            "id": "place_winner_1",
            "travel_name": "Winner Peak",
            "latitude": 47.123,
            "longitude": 10.456,
        })
        resolver.scorer.rank_places = MagicMock(return_value=[cand1, cand2, cand3])

        mock_nearby_data = {
            "must_visit": [{"id": "attr_1", "name": "Castle"}],
            "statistics": {"places_found": 1, "categories": 1},
        }

        with patch.object(resolver.nearby, "search", return_value=mock_nearby_data) as mock_nb_search, \
             patch.object(resolver.travel, "enrich", side_effect=lambda p: {**p, "travel_summary": "Enriched Summary", "category_emoji": "🏔"}) as mock_tr_enrich:

            result = resolver.resolve({"caption": "Explore Winner Peak in Austria"})

            self.assertIsNotNone(result)
            # Must ONLY call nearby search and travel enrichment ONCE for the winner
            self.assertEqual(mock_nb_search.call_count, 1)
            self.assertEqual(mock_tr_enrich.call_count, 1)

            # Winner is candidate 1 and has nearby data
            winner = result["winner"]
            self.assertEqual(winner["place"]["travel_name"], "Winner Peak")
            self.assertIn("must_visit", winner["place"]["nearby"])

            # All 3 candidates are preserved in ranked_places for Gemini verification
            self.assertEqual(len(result["ranked_places"]), 3)

            # Non-winning candidates have valid default structures without invoking Google Places
            second_cand = result["ranked_places"][1]
            self.assertEqual(second_cand["place"]["travel_name"], "Second Spot")
            self.assertEqual(second_cand["place"]["nearby"], {})

    # ==================================================
    # 4. Location Pipeline: On-Demand Candidate Enrichment
    # ==================================================

    def test_pipeline_on_demand_enrichment_when_gemini_selects_lower_candidate(self):
        """
        Verify that if Gemini selects candidate 2 (which was not enriched in resolve),
        LocationPipeline.build_response enriches candidate 2 on demand.
        """
        pipeline = LocationPipeline()

        cand1 = {
            "place": {
                "id": "p1",
                "travel_name": "Top Candidate",
                "latitude": 47.1,
                "longitude": 10.2,
                "nearby": {"must_visit": []},
            },
            "score": 90.0,
            "confidence": "VERY_HIGH",
        }
        cand2 = {
            "place": {
                "id": "p2",
                "travel_name": "Gemini Selected Candidate",
                "latitude": 47.3,
                "longitude": 10.4,
                "nearby": {},  # Not enriched yet
            },
            "score": 85.0,
            "confidence": "HIGH",
        }

        resolver_result = {
            "winner": cand1,
            "ranked_places": [cand1, cand2],
            "stage_timings": {
                "candidate_resolution": 0.5,
                "nearby_places": 0.3,
                "travel_intelligence": 0.1,
            },
        }

        gemini_result = {
            "winner": cand2,
            "confidence": 0.95,
            "reason": "Multimodal visual match confirms candidate 2.",
            "verification_status": "VERIFIED",
        }

        with patch.object(pipeline.resolver, "_enrich_candidate", side_effect=lambda item: (
            {**item, "place": {**item["place"], "nearby": {"must_visit": [{"id": "nb_1"}]}}},
            0.2,
            0.05,
        )) as mock_enrich:
            response = pipeline.build_response(
                stage="caption",
                evidence={"caption": "test"},
                resolver_result=resolver_result,
                gemini_result=gemini_result,
                total_start=time.perf_counter(),
                provider_duration=0.5,
                extract_seconds=0.1,
                verify_seconds=0.4,
            )

            mock_enrich.assert_called_once()
            self.assertEqual(response["best_guess"]["name"], "Gemini Selected Candidate")
            self.assertIn("performance", response)
            self.assertIn("stages", response["performance"])

    # ==================================================
    # 5. Nearby Places: Concurrency & Deduplication
    # ==================================================

    def test_nearby_search_category_concurrency_and_deduplication(self):
        """
        Verify search_category queries place types concurrently, deduplicates
        places across types, attaches travel_category, and isolates errors.
        """
        service = NearbySearchService()

        place_a = {"id": "place_A", "name": "Place Alpha", "rating": 4.5, "user_rating_count": 100, "distance_km": 1.2}
        place_b = {"id": "place_B", "name": "Place Beta", "rating": 4.8, "user_rating_count": 200, "distance_km": 0.8}
        place_a_dup = {"id": "place_A", "name": "Place Alpha Duplicate", "rating": 4.5, "user_rating_count": 100, "distance_km": 1.2}

        def mock_search_single(lat, lng, ptype):
            if ptype == "tourist_attraction":
                return [place_a]
            elif ptype == "historical_landmark":
                return [place_b, place_a_dup]  # Contains duplicate
            elif ptype == "museum":
                raise RuntimeError("Simulated network timeout for museum")
            return []

        with patch.object(service, "search_single_type", side_effect=mock_search_single) as mock_single:
            results = service.search_category(
                latitude=47.368,
                longitude=10.923,
                category="must_visit",
                place_types=["tourist_attraction", "historical_landmark", "museum"],
            )

            # All 3 types should have been queried
            self.assertEqual(mock_single.call_count, 3)

            # Deduplication: place_A should only appear once
            ids = [p["id"] for p in results]
            self.assertEqual(len(ids), 2)
            self.assertIn("place_A", ids)
            self.assertIn("place_B", ids)

            # All results must have travel_category set
            for p in results:
                self.assertEqual(p["travel_category"], "must_visit")

            # Best rated first: place_B (4.8) should come before place_A (4.5)
            self.assertEqual(results[0]["id"], "place_B")

    # ==================================================
    # 6. Response Builder: No Duplicate Travel Enrichment
    # ==================================================

    def test_response_builder_avoids_duplicate_travel_enrichment(self):
        """Verify build_travel_intelligence does not re-run enrich if place is already enriched."""
        builder = ResponseBuilder()

        already_enriched_place = {
            "travel_name": "Seebensee",
            "category": "Lake",
            "category_emoji": "🌊",
            "best_season": "Summer",
            "travel_summary": "🌊 Lake • 📅 Summer • 💰 Moderate • 🕒 1-3 Days",
            "peak_months": ["July", "August"],
            "budget_level": "Moderate",
            "estimated_daily_budget": "$100 - $150",
            "currency": "EUR",
            "recommended_trip_days": "1 Day",
            "travel_tips": ["Pack hiking boots."],
            "activities": ["Hiking", "Photography"],
            "packing_list": {"essential": ["Water", "Sunscreen"]},
            "timing": {"optimal_window": "Jun - Sep"},
            "sample_itinerary": [],
        }

        with patch.object(builder.travel_service, "enrich") as mock_enrich:
            intel = builder.build_travel_intelligence(already_enriched_place)

            mock_enrich.assert_not_called()
            self.assertEqual(intel["category"], "Lake")
            self.assertEqual(intel["category_emoji"], "🌊")
            self.assertEqual(intel["travel_summary"], already_enriched_place["travel_summary"])

    # ==================================================
    # 7. Graceful Degradation: Enrichment Failure Non-Fatal
    # ==================================================

    def test_optional_enrichment_failure_graceful_degradation(self):
        """Verify that an exception in travel intelligence enrichment degrades to {} without crashing."""
        builder = ResponseBuilder()
        unenriched_place = {"travel_name": "Unknown Spot"}

        with patch.object(builder.travel_service, "enrich", side_effect=RuntimeError("AI Timeout")):
            intel = builder.build_travel_intelligence(unenriched_place)
            self.assertEqual(intel, {}, "Failed enrichment must gracefully return empty dictionary")

    # ==================================================
    # 8. Performance Telemetry Contract Preservation
    # ==================================================

    def test_performance_telemetry_stages_preserved(self):
        """Verify that performance.total_seconds and performance.stages are properly emitted."""
        pipeline = LocationPipeline()

        cand = {
            "place": {
                "id": "p_austria",
                "travel_name": "Seebensee",
                "formatted_address": "Ehrwald, Austria",
                "latitude": 47.368,
                "longitude": 10.923,
                "country": "Austria",
                "nearby": {},
            },
            "score": 94.0,
            "confidence": "VERY_HIGH",
        }

        resolver_result = {
            "winner": cand,
            "ranked_places": [cand],
            "stage_timings": {
                "candidate_resolution": 0.42,
                "nearby_places": 0.28,
                "travel_intelligence": 0.15,
            },
        }

        response = pipeline.build_response(
            stage="caption",
            evidence={"caption": "Seebensee, Austria"},
            resolver_result=resolver_result,
            gemini_result=None,
            total_start=time.perf_counter() - 1.25,
            provider_duration=0.35,
            extract_seconds=0.05,
            verify_seconds=0.0,
        )

        self.assertIn("performance", response)
        perf = response["performance"]
        self.assertIn("total_seconds", perf)
        self.assertGreater(perf["total_seconds"], 0)

        stages = perf.get("stages", {})
        expected_stage_keys = [
            "provider",
            "location_extraction",
            "candidate_resolution",
            "verification",
            "nearby_places",
            "travel_intelligence",
            "response_building",
        ]
        for key in expected_stage_keys:
            self.assertIn(key, stages, f"Missing expected stage timing '{key}'")
            self.assertIsInstance(stages[key], float)


if __name__ == "__main__":
    unittest.main()
