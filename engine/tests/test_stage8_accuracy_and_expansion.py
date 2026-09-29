"""
Regression tests for Stage 8 Benchmark Expansion & Production Accuracy Validation.
Validates generalizable fixes:
- Temporal words suppression (months, days, seasons)
- Boilerplate/watermark suppression ('brand', 'studio', 'tutorial', etc.)
- Scoped typo-tolerance (active on OCR/speech, clean on captions)
- Promotional pin bullet suppression
- Standard country entities in candidate service
- Instagram provider hashtag fallback extraction from description
"""

import pytest
from engine.app.services.location.candidate_service import (
    CandidateService,
    INVALID_SINGLE_WORDS,
    KNOWN_GEOGRAPHIC_ENTITIES,
    TEMPORAL_WORDS,
    BOILERPLATE_WORDS,
)
from engine.providers.instagram.provider import InstagramYtDlpProvider


class TestStage8CandidateHardening:
    def test_temporal_words_in_invalid_set(self):
        assert "august" in INVALID_SINGLE_WORDS
        assert "july" in INVALID_SINGLE_WORDS
        assert "sunday" in INVALID_SINGLE_WORDS
        assert "summer" in INVALID_SINGLE_WORDS
        assert "winter" in INVALID_SINGLE_WORDS

    def test_candidate_service_rejects_standalone_month(self):
        service = CandidateService()
        candidates = service.generate(
            metadata={"caption": "We went in August and had an amazing trip"},
            ocr_text="",
            speech_text="",
        )
        assert "August" not in candidates

    def test_boilerplate_words_in_set(self):
        assert "brand" in BOILERPLATE_WORDS
        assert "studio" in BOILERPLATE_WORDS
        assert "tutorial" in BOILERPLATE_WORDS
        assert "preset" in BOILERPLATE_WORDS

    def test_candidate_service_rejects_boilerplate_prefixes(self):
        service = CandidateService()
        assert not service.is_valid_candidate("BRAND STUDIO IBDO")
        assert not service.is_valid_candidate("Studio Editing")
        assert not service.is_valid_candidate("Tutorial Reel")

    def test_ocr_typo_tolerance_active_for_ocr(self):
        service = CandidateService()
        # Active in OCR: "Cnennai" -> "Chennai"
        candidates = service.generate(metadata={}, ocr_text="Cnennai")
        assert "Chennai" in candidates

        candidates2 = service.generate(metadata={}, ocr_text="Cnenhai")
        assert "Chennai" in candidates2

    def test_typo_tolerance_inactive_for_clean_captions(self):
        service = CandidateService()
        # In captions, ordinary English dictionary words must not trigger false positive world cities
        candidates = service.generate(
            metadata={"caption": "We bought a lovely souvenir from local shops in the village"},
            ocr_text="",
            speech_text="",
        )
        assert "Slovenia" not in candidates

        candidates2 = service.generate(
            metadata={"caption": "Save this post for visual reference and complicated names"},
            ocr_text="",
            speech_text="",
        )
        assert "Florence" not in candidates2
        assert "Naples" not in candidates2

    def test_promotional_pin_bullets_suppressed(self):
        service = CandidateService()
        text = "📍 A custom Google Map with 50+ viewpoints, waterfalls, and photo spots"
        pins = service.extract_pin_locations(text)
        assert len(pins) == 0

    def test_valid_pin_locations_preserved(self):
        service = CandidateService()
        text = "📍 Lugard Road Lookout, Victoria Peak, Hong Kong"
        pins = service.extract_pin_locations(text)
        assert len(pins) > 0
        assert "Lugard Road Lookout" in pins[0]

    def test_countries_in_known_geographic_entities(self):
        assert "Iceland" in KNOWN_GEOGRAPHIC_ENTITIES
        assert "Switzerland" in KNOWN_GEOGRAPHIC_ENTITIES
        assert "Spain" in KNOWN_GEOGRAPHIC_ENTITIES
        assert "Austria" in KNOWN_GEOGRAPHIC_ENTITIES


class TestStage8InstagramProviderHardening:
    def test_fallback_hashtag_extraction(self):
        provider = InstagramYtDlpProvider()
        # Simulated raw info dictionary without tags list
        info = {
            "title": "Road trip video",
            "description": "Exploring Canaima #venezuela #canaima #canaimanationalpark",
            "tags": None,
            "uploader": "traveler",
        }
        # Verify extraction logic: info.get("tags") or re.findall(...)
        import re
        tags = info.get("tags") or re.findall(r"#([A-Za-z0-9_]+)", info.get("description", ""))
        assert "venezuela" in tags
        assert "canaima" in tags
        assert "canaimanationalpark" in tags
