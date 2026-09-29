"""
Pipeline Stage Definitions for Travel AI Observability.

Defines canonical stage names for end-to-end tracing and granular execution timing across
Instagram ingestion, media processing, evidence extraction, candidate generation,
resolution, verification, enrichment, and response building.
"""

from enum import Enum


class PipelineStage(str, Enum):
    # Ingestion & Provider
    INSTAGRAM_EXTRACTION = "instagram_extraction"
    INGESTION = "instagram_extraction"

    # Evidence Extraction
    EVIDENCE_CAPTION = "evidence_caption"
    FRAME_EXTRACTION = "frame_extraction"
    EVIDENCE_OCR = "evidence_ocr"
    EVIDENCE_SPEECH = "evidence_speech"

    # Location Intelligence & Resolution
    CANDIDATE_GENERATION = "candidate_generation"
    SCORING = "scoring"
    GOOGLE_PLACES_SEARCH = "google_places_search"
    GOOGLE_PLACES_DETAILS = "google_places_details"
    GEMINI_VERIFICATION = "gemini_verification"

    # Enrichment & Response
    ENRICHMENT = "enrichment"
    RESPONSE_CONSTRUCTION = "response_construction"

    # Overall Request
    TOTAL = "total"

    def __str__(self) -> str:
        return self.value
