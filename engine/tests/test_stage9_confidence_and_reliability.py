"""
Regression tests for Stage 9 Accuracy, Confidence & Production Reliability.
Validates generalizable fixes:
1. Tech platform & promotional map suppression (Google Map, Instagram, Pinterest, etc.)
2. Corporate and office workspace business filtering (corporate_office, coworking_space)
3. Geographic consistency and country mismatch penalty
4. Truthful uncertainty gating on uncorroborated low-confidence OCR artifacts
5. Spanish/Portuguese natural landmark (Salto/Cascada) extraction
6. Address formatting: postal code detachment from country
"""

import pytest
from engine.app.services.location.candidate_service import (
    CandidateService,
    BOILERPLATE_WORDS,
)
from engine.app.services.location.location_resolver import BUSINESS_TYPES
from engine.app.services.scoring.scoring_service import (
    ScoringService,
    BAD_PLACE_TYPES,
)
from engine.app.services.location.location_formatter import LocationFormatter
from engine.app.pipelines.location_pipeline import LocationPipeline


class TestStage9FalsePositiveProtection:
    def test_tech_platform_words_in_boilerplate(self):
        assert "google" in BOILERPLATE_WORDS
        assert "instagram" in BOILERPLATE_WORDS
        assert "tiktok" in BOILERPLATE_WORDS
        assert "pinterest" in BOILERPLATE_WORDS
        assert "map" in BOILERPLATE_WORDS
        assert "maps" in BOILERPLATE_WORDS

    def test_tech_platform_candidate_rejected(self):
        service = CandidateService()
        assert not service.is_valid_candidate("Google Map")
        assert not service.is_valid_candidate("Google Maps")
        assert not service.is_valid_candidate("Instagram Reel")
        assert not service.is_valid_candidate("Pinterest Inspiration")

    def test_corporate_office_in_business_types(self):
        assert "corporate_office" in BUSINESS_TYPES
        assert "office" in BUSINESS_TYPES
        assert "coworking_space" in BUSINESS_TYPES
        assert "corporate_office" in BAD_PLACE_TYPES
        assert "office" in BAD_PLACE_TYPES


class TestStage9GeographicConsistency:
    def test_geographic_consistency_country_mismatch_penalty(self):
        scorer = ScoringService()
        evidence = {
            "title": "",
            "caption": "Fairy Tale town, Switzerland",
            "speech_text": "",
            "ocr_text": "",
        }
        # Two mock candidate places: one in Switzerland, one in India
        place_switzerland = {
            "travel_name": "Switzerland",
            "country": "Switzerland",
            "city": "Switzerland",
            "types": ["country", "political"],
            "rating": 4.8,
            "user_rating_count": 1000,
        }
        place_india = {
            "travel_name": "Fairy Tale",
            "country": "India",
            "city": "Mumbai",
            "types": ["point_of_interest", "establishment"],
            "rating": 4.5,
            "user_rating_count": 500,
        }
        ranked = scorer.rank_places([place_switzerland, place_india], evidence)
        assert len(ranked) >= 2
        # Switzerland must rank #1 over India because India directly contradicts caption country
        assert ranked[0]["place"]["country"] == "Switzerland"
        assert ranked[0]["score"] > ranked[1]["score"]


class TestStage9TruthfulUncertaintyGating:
    def test_low_confidence_ocr_artifact_rejected(self):
        pipeline = LocationPipeline()
        # Mock OCR resolver result with score < 60 and unverified status
        resolver_mock = {
            "winner": {
                "score": 41.6,
                "confidence": "VERY_LOW",
                "place": {
                    "travel_name": "Bemett WideSans To, Czechia",
                    "matched_sources": ["ocr"],
                },
            }
        }
        gemini_failed = {"verification_status": "FAILED"}
        # Credibility check should reject this weak OCR artifact
        is_credible = pipeline._is_credible_destination(
            resolver_mock, gemini_result=gemini_failed, stage="ocr"
        )
        assert not is_credible

    def test_high_confidence_ocr_destination_accepted(self):
        pipeline = LocationPipeline()
        # Legitimate OCR result with score >= 60 (e.g. Case #50 Adashino Nenbutsuji)
        resolver_mock = {
            "winner": {
                "score": 78.0,
                "confidence": "MEDIUM",
                "place": {
                    "travel_name": "Adashino Nenbutsuji, Japan",
                    "matched_sources": ["ocr"],
                },
            }
        }
        gemini_failed = {"verification_status": "FAILED"}
        is_credible = pipeline._is_credible_destination(
            resolver_mock, gemini_result=gemini_failed, stage="ocr"
        )
        assert is_credible

    def test_verified_gemini_candidate_accepted_regardless_of_score(self):
        pipeline = LocationPipeline()
        resolver_mock = {
            "winner": {
                "score": 45.0,
                "confidence": "LOW",
                "place": {
                    "travel_name": "Historic Shrine",
                    "matched_sources": ["ocr"],
                },
            }
        }
        gemini_verified = {"verification_status": "VERIFIED"}
        assert pipeline._is_credible_destination(
            resolver_mock, gemini_result=gemini_verified, stage="ocr"
        )


class TestStage9LandmarksAndAddressFormatting:
    def test_spanish_waterfall_pattern_extraction(self):
        service = CandidateService()
        meta = {
            "caption": "Cero filtro - salto golondrina más conocido como salto el fuego 🔥 #venezuela"
        }
        cands = service.generate(meta, "", "")
        assert any("Salto Golondrina" in c or "Salto el Fuego" in c or "Salto" in c for c in cands)

    def test_address_formatter_handles_postal_codes(self):
        formatter = LocationFormatter()
        # Address with trailing postal code
        raw_place = {
            "id": "test_id",
            "display_name": "Houtouwan",
            "formatted_address": "Houtouwan, Shengsi County, Zhoushan, Zhejiang, China, 202457",
        }
        formatted = formatter.format("Houtouwan China", raw_place)
        # Country must be China, not postal code 202457
        assert formatted["country"] == "China"
        assert formatted["state"] == "Zhejiang"
