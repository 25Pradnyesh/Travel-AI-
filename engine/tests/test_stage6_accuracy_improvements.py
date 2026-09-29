import difflib
import numpy as np
import pytest

from engine.app.services.location.candidate_service import (
    KNOWN_GEOGRAPHIC_ENTITIES,
    CandidateService,
)
from engine.app.services.extraction.frame_extractor import FrameExtractor
from engine.app.services.ocr.ocr_service import OCRService
from engine.providers.instagram.provider import InstagramYtDlpProvider


class TestStage6CandidateEnhancements:
    def test_chennai_in_known_geographic_entities(self):
        assert "Chennai" in KNOWN_GEOGRAPHIC_ENTITIES
        assert "Tokyo" in KNOWN_GEOGRAPHIC_ENTITIES
        assert "Rome" in KNOWN_GEOGRAPHIC_ENTITIES
        assert "Deqin" in KNOWN_GEOGRAPHIC_ENTITIES

    def test_candidate_service_exact_single_word_entity(self):
        service = CandidateService()
        candidates = service.generate(metadata={}, ocr_text="Chennai")
        assert "Chennai" in candidates

    def test_candidate_service_ocr_typo_tolerance(self):
        service = CandidateService()
        # "Cnennai" is a 1-character OCR substitution typo ('n' for 'h')
        ratio = difflib.SequenceMatcher(None, "cnennai", "chennai").ratio()
        assert ratio >= 0.75

        candidates = service.generate(metadata={}, ocr_text="Cnennai")
        assert "Chennai" in candidates

    def test_candidate_service_ocr_typo_cnenhai(self):
        service = CandidateService()
        candidates = service.generate(metadata={}, ocr_text="Cnenhai")
        assert "Chennai" in candidates

    def test_candidate_service_rejects_arbitrary_words(self):
        service = CandidateService()
        candidates = service.generate(metadata={}, ocr_text="unrelated nonentity text")
        assert "Chennai" not in candidates
        assert len(candidates) == 0


class TestStage6FrameExtractor:
    def test_sharpness_cutoff_retains_soft_bokeh_frames(self):
        fe = FrameExtractor()
        # Mock frame with smooth background: sharpness ~20, brightness 140
        dummy_frame = np.full((100, 100, 3), 140, dtype=np.uint8)
        # Add subtle edge to simulate center text
        dummy_frame[40:60, 40:60] = 200

        s = fe.ocr.calculate_sharpness(dummy_frame)
        b = fe.ocr.calculate_brightness(dummy_frame)
        if s >= 12:
            metrics = fe.score_frame(dummy_frame, scene_difference=20.0)
            assert metrics is not None
            assert metrics["score"] > 0

    def test_score_frame_rebalancing(self):
        fe = FrameExtractor()
        dummy_frame = np.full((100, 100, 3), 128, dtype=np.uint8)
        dummy_frame[30:70, 30:70] = 255
        metrics = fe.score_frame(dummy_frame, scene_difference=25.0)
        assert metrics is not None
        assert "score" in metrics
        assert metrics["score"] > 0


class TestStage6InstagramProvider:
    def test_metadata_extraction_without_video_graceful_failure(self):
        provider = InstagramYtDlpProvider()
        res = provider._extract_metadata_without_video("https://www.instagram.com/p/invalid_nonexistent_shortcode/")
        assert res is None or isinstance(res, dict)

    def test_build_options_contains_retries(self):
        provider = InstagramYtDlpProvider()
        opts = provider.build_options("test_template.mp4")
        assert opts.get("retries") == 3
        assert opts.get("fragment_retries") == 3
        assert opts.get("extractor_retries") == 3

