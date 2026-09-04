import logging
from pathlib import Path
import time

from engine.app.services.extraction.evidence_builder import (
    EvidenceBuilder,
)
from engine.app.services.extraction.frame_extractor import (
    FrameExtractor,
)
from engine.app.services.location.location_resolver import (
    LocationResolver,
)
from engine.app.services.gemini.gemini_verifier import (
    GeminiVerifier,
)
from engine.app.services.travel.travel_intelligence_service import (
    TravelIntelligenceService,
)

logger = logging.getLogger(__name__)


class LocationPipeline:

    def __init__(self):

        self.builder = EvidenceBuilder()
        self.frames = FrameExtractor()
        self.resolver = LocationResolver()
        self.gemini = GeminiVerifier()
        self.travel = TravelIntelligenceService()

    # ==================================================
    # Final Response Builder
    # ==================================================

    def build_response(
        self,
        stage: str,
        evidence: dict,
        resolver_result: dict,
        gemini_result: dict | None,
        total_start: float,
    ) -> dict:

        winner = resolver_result.get("winner")
        ranked = resolver_result.get("ranked_places", [])

        gemini_used = False
        gemini_status = "SKIPPED"
        gemini_reason = ""
        gemini_confidence = None
        vision = None
        scene = None

        if gemini_result:
            gemini_status = gemini_result.get("verification_status", "SKIPPED")
            gemini_used = gemini_status in ("VERIFIED", "PARTIAL")

            if gemini_result.get("winner"):
                winner = gemini_result["winner"]

            gemini_reason = gemini_result.get("reason", "")
            gemini_confidence = gemini_result.get("confidence")
            vision = gemini_result.get("vision")

            if vision and isinstance(vision, dict):
                scene = vision.get("scene")

        # --------------------------------------------------
        # Travel Intelligence on Final Verified Destination
        # --------------------------------------------------
        if winner and isinstance(winner, dict) and "place" in winner:
            try:
                winner["place"] = self.travel.enrich(winner["place"])
            except Exception as e:
                logger.warning("[LOCATION] Travel intelligence enrichment error: %s", type(e).__name__)

        return {
            "stage": stage,
            "best_guess": winner,
            "verification_status": gemini_status,
            "confidence": winner.get("confidence") if winner else "VERY_LOW",
            "ranked_candidates": ranked,
            "evidence": evidence,
            "candidate_count": resolver_result.get("candidate_count", 0),
            "verified_places": resolver_result.get("verified_count", 0),
            "search_results": resolver_result.get("search_results", 0),
            "gemini": {
                "used": gemini_used,
                "status": gemini_status,
                "confidence": gemini_confidence,
                "reason": gemini_reason,
                "vision": vision,
                "scene": scene,
            },
            "performance": {
                "total_seconds": round(
                    time.perf_counter() - total_start,
                    2,
                ),
            },
        }

    # ==================================================
    # Gemini Decision
    # ==================================================

    def verify_if_needed(
        self,
        evidence: dict,
        resolver_result: dict,
        frame_paths: list,
    ) -> dict | None:

        ranked = resolver_result.get("ranked_places", [])
        if not ranked:
            return None

        image = None
        if frame_paths:
            for fp in frame_paths:
                if fp and Path(fp).exists():
                    image = str(fp)
                    break
            if not image and frame_paths:
                image = str(frame_paths[0])

        try:
            return self.gemini.verify(
                evidence=evidence,
                ranked_places=ranked,
                image_path=image,
            )
        except Exception as exc:
            logger.error("[GEMINI] Verification failed with exception: %s", type(exc).__name__)
            # Fallback to top candidate gracefully
            top_winner = ranked[0]
            top_winner["place"]["verification_status"] = "FAILED"
            top_winner["place"]["gemini_verified"] = False
            top_winner["place"]["gemini_reason"] = f"Gemini error: {type(exc).__name__}"
            return {
                "winner": top_winner,
                "confidence": 0.0,
                "reason": f"Gemini error: {type(exc).__name__}",
                "verification_status": "FAILED",
                "vision": None,
            }

    # ==================================================
    # Pipeline Execution
    # ==================================================

    def run(
        self,
        metadata: dict,
        video_path: str | None = None,
    ) -> dict:

        total_start = time.perf_counter()
        frame_paths = []

        # ==================================================
        # STAGE 1 : Caption
        # ==================================================
        print("\n--- Stage 1: Caption ---")
        evidence = self.builder.build_caption(metadata)
        evidence = self.builder.combine(evidence)

        resolver = self.resolver.resolve(evidence)

        if resolver:
            gemini = self.verify_if_needed(
                evidence,
                resolver,
                frame_paths,
            )
            return self.build_response(
                "caption",
                evidence,
                resolver,
                gemini,
                total_start,
            )

        # ==================================================
        # STAGE 2 : OCR
        # ==================================================
        print("\n--- Stage 2: OCR ---")
        if video_path and Path(video_path).exists():
            try:
                frame_paths = self.frames.extract(
                    video_path,
                    "engine/assets/frames",
                )
            except Exception as e:
                logger.warning("[PIPELINE] Frame extraction failed: %s", type(e).__name__)
                frame_paths = []

        evidence = self.builder.build_ocr(
            evidence,
            frame_paths,
        )
        evidence = self.builder.combine(evidence)

        resolver = self.resolver.resolve(evidence)

        if resolver:
            gemini = self.verify_if_needed(
                evidence,
                resolver,
                frame_paths,
            )
            return self.build_response(
                "ocr",
                evidence,
                resolver,
                gemini,
                total_start,
            )

        # ==================================================
        # STAGE 3 : Speech
        # ==================================================
        print("\n--- Stage 3: Speech ---")
        if video_path and Path(video_path).exists():
            try:
                evidence = self.builder.build_speech(
                    evidence,
                    video_path,
                )
            except Exception as e:
                logger.warning("[PIPELINE] Speech extraction failed: %s", type(e).__name__)

        evidence = self.builder.combine(evidence)

        resolver = self.resolver.resolve(evidence)

        if resolver:
            gemini = self.verify_if_needed(
                evidence,
                resolver,
                frame_paths,
            )
            return self.build_response(
                "speech",
                evidence,
                resolver,
                gemini,
                total_start,
            )

        # ==================================================
        # Nothing Found
        # ==================================================
        return {
            "stage": "failed",
            "best_guess": None,
            "verification_status": "FAILED",
            "confidence": "VERY_LOW",
            "ranked_candidates": [],
            "evidence": evidence,
            "candidate_count": 0,
            "verified_places": 0,
            "search_results": 0,
            "gemini": {
                "used": False,
                "status": "FAILED",
                "confidence": None,
                "reason": "No destination candidates found.",
                "vision": None,
                "scene": None,
            },
            "performance": {
                "total_seconds": round(
                    time.perf_counter() - total_start,
                    2,
                ),
            },
        }