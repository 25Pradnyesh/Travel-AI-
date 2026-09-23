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
        provider_duration: float | None = None,
        extract_seconds: float = 0.0,
        verify_seconds: float = 0.0,
    ) -> dict:

        t_build_start = time.perf_counter()

        winner = resolver_result.get("winner") if isinstance(resolver_result, dict) else None
        if gemini_result and gemini_result.get("winner"):
            winner = gemini_result["winner"]

        resolver_timings = (resolver_result.get("stage_timings") or {}) if isinstance(resolver_result, dict) else {}
        candidate_res_sec = resolver_timings.get("candidate_resolution", 0.0)
        nearby_sec = resolver_timings.get("nearby_places", 0.0)
        travel_sec = resolver_timings.get("travel_intelligence", 0.0)

        if not winner:
            build_sec = time.perf_counter() - t_build_start
            stages = {}
            if provider_duration is not None:
                stages["provider"] = round(provider_duration, 2)
            stages["location_extraction"] = round(extract_seconds, 2)
            stages["candidate_resolution"] = round(candidate_res_sec, 2)
            stages["verification"] = round(verify_seconds, 2)
            stages["nearby_places"] = round(nearby_sec, 2)
            stages["travel_intelligence"] = round(travel_sec, 2)
            stages["response_building"] = round(build_sec, 2)

            perf = {
                "total_seconds": round(time.perf_counter() - total_start, 2),
                "stages": stages,
            }
            return self.response_builder.build_unresolved(
                stage=stage,
                error="No verified destination candidate resolved.",
                performance=perf,
            ).model_dump()

        resp = self.response_builder.build(
            winner=winner,
            gemini_result=gemini_result,
            stage=stage,
            performance=None,
        )
        build_sec = time.perf_counter() - t_build_start

        stages = {}
        if provider_duration is not None:
            stages["provider"] = round(provider_duration, 2)
        stages["location_extraction"] = round(extract_seconds, 2)
        stages["candidate_resolution"] = round(candidate_res_sec, 2)
        stages["verification"] = round(verify_seconds, 2)
        stages["nearby_places"] = round(nearby_sec, 2)
        stages["travel_intelligence"] = round(travel_sec, 2)
        stages["response_building"] = round(build_sec, 2)

        perf = {
            "total_seconds": round(time.perf_counter() - total_start, 2),
            "stages": stages,
        }
        resp.performance = perf
        return resp.model_dump()


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
            top_winner["place"]["gemini_confidence"] = 0.0
            top_winner["place"]["gemini_reason"] = f"Gemini error: {type(exc).__name__}"
            fallback_conf = self.gemini.calculate_confidence_level(
                score=top_winner.get("score", 0.0),
                verification_status="FAILED",
                gemini_confidence=0.0,
            )
            top_winner["confidence"] = fallback_conf
            top_winner["place"]["confidence"] = fallback_conf
            return {
                "winner": top_winner,
                "confidence": 0.0,
                "reason": f"Gemini error: {type(exc).__name__}",
                "verification_status": "FAILED",
                "vision": None,
            }

    # ==================================================
    def _cleanup_temp_files(
        self,
        video_path: str | None,
        frame_paths: list[str],
    ) -> None:
        """
        Safely removes temporary video and extracted frame files after all
        pipeline stages (including Gemini vision) have completed or failed.
        """
        if frame_paths:
            for fp in frame_paths:
                try:
                    p = Path(fp)
                    if p.is_file():
                        p.unlink(missing_ok=True)
                except Exception as exc:
                    logger.warning("[PIPELINE] Failed to remove temp frame %s: %s", fp, type(exc).__name__)

        if video_path:
            try:
                vp = Path(video_path)
                if vp.is_file():
                    vp.unlink(missing_ok=True)
            except Exception as exc:
                logger.warning("[PIPELINE] Failed to remove temp video %s: %s", video_path, type(exc).__name__)

    # ==================================================
    # Pipeline Execution
    # ==================================================

    def run(
        self,
        metadata: dict,
        video_path: str | None = None,
        total_start: float | None = None,
        provider_duration: float | None = None,
    ) -> dict:

        if total_start is None:
            total_start = time.perf_counter()

        frame_paths = []
        extract_seconds = 0.0

        try:
            # ==================================================
            # STAGE 1 : Caption
            # ==================================================
            print("\n--- Stage 1: Caption ---")
            t_ext = time.perf_counter()
            evidence = self.builder.build_caption(metadata)
            evidence = self.builder.combine(evidence)
            extract_seconds += (time.perf_counter() - t_ext)

            resolver = self.resolver.resolve(evidence)

            if resolver:
                t_ver = time.perf_counter()
                gemini = self.verify_if_needed(
                    evidence,
                    resolver,
                    frame_paths,
                )
                verify_seconds = time.perf_counter() - t_ver
                return self.build_response(
                    "caption",
                    evidence,
                    resolver,
                    gemini,
                    total_start,
                    provider_duration=provider_duration,
                    extract_seconds=extract_seconds,
                    verify_seconds=verify_seconds,
                )

            # ==================================================
            # STAGE 2 : OCR
            # ==================================================
            print("\n--- Stage 2: OCR ---")
            t_ext = time.perf_counter()
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
            extract_seconds += (time.perf_counter() - t_ext)

            resolver = self.resolver.resolve(evidence)

            if resolver:
                t_ver = time.perf_counter()
                gemini = self.verify_if_needed(
                    evidence,
                    resolver,
                    frame_paths,
                )
                verify_seconds = time.perf_counter() - t_ver
                return self.build_response(
                    "ocr",
                    evidence,
                    resolver,
                    gemini,
                    total_start,
                    provider_duration=provider_duration,
                    extract_seconds=extract_seconds,
                    verify_seconds=verify_seconds,
                )

            # ==================================================
            # STAGE 3 : Speech
            # ==================================================
            print("\n--- Stage 3: Speech ---")
            t_ext = time.perf_counter()
            if video_path and Path(video_path).exists():
                try:
                    evidence = self.builder.build_speech(
                        evidence,
                        video_path,
                    )
                except Exception as e:
                    logger.warning("[PIPELINE] Speech extraction failed: %s", type(e).__name__)

            evidence = self.builder.combine(evidence)
            extract_seconds += (time.perf_counter() - t_ext)

            resolver = self.resolver.resolve(evidence)

            if resolver:
                t_ver = time.perf_counter()
                gemini = self.verify_if_needed(
                    evidence,
                    resolver,
                    frame_paths,
                )
                verify_seconds = time.perf_counter() - t_ver
                return self.build_response(
                    "speech",
                    evidence,
                    resolver,
                    gemini,
                    total_start,
                    provider_duration=provider_duration,
                    extract_seconds=extract_seconds,
                    verify_seconds=verify_seconds,
                )

            # ==================================================
            # Nothing Found
            # ==================================================
            build_start = time.perf_counter()
            stages = {}
            if provider_duration is not None:
                stages["provider"] = round(provider_duration, 2)
            stages["location_extraction"] = round(extract_seconds, 2)
            stages["candidate_resolution"] = 0.0
            stages["verification"] = 0.0
            stages["nearby_places"] = 0.0
            stages["travel_intelligence"] = 0.0
            stages["response_building"] = round(time.perf_counter() - build_start, 2)

            perf = {
                "total_seconds": round(time.perf_counter() - total_start, 2),
                "stages": stages,
            }
            return self.response_builder.build_unresolved(
                stage="failed",
                error="No destination candidates found from the Reel.",
                performance=perf,
            ).model_dump()

        finally:
            self._cleanup_temp_files(video_path, frame_paths)
