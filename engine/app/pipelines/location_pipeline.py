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
from engine.app.services.response.response_builder import (
    ResponseBuilder,
)

logger = logging.getLogger(__name__)


class LocationPipeline:

    def __init__(self):

        self.builder = EvidenceBuilder()
        self.frames = FrameExtractor()
        self.resolver = LocationResolver()
        self.gemini = GeminiVerifier()
        self.travel = TravelIntelligenceService()
        self.response_builder = ResponseBuilder()

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
        if gemini_result and gemini_result.get("winner"):
            winner = gemini_result["winner"]

        perf = {
            "total_seconds": round(time.perf_counter() - total_start, 2),
        }

        if not winner:
            return self.response_builder.build_unresolved(
                stage=stage,
                error="No verified destination candidate resolved.",
                performance=perf,
            ).model_dump()

        return self.response_builder.build(
            winner=winner,
            gemini_result=gemini_result,
            stage=stage,
            performance=perf,
        ).model_dump()


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
        perf = {
            "total_seconds": round(time.perf_counter() - total_start, 2),
        }
        return self.response_builder.build_unresolved(
            stage="failed",
            error="No destination candidates found from the Reel.",
            performance=perf,
        ).model_dump()
