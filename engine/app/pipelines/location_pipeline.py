import logging
from pathlib import Path
import time
import uuid

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
from engine.observability.context import (
    get_current_context,
    start_request_context,
    measure_stage,
)
from engine.observability.stages import PipelineStage
from engine.observability.errors import ErrorCategory
from engine.observability.logger import get_logger
from engine.observability.metrics import get_metrics_aggregator

logger = logging.getLogger(__name__)
obs_logger = get_logger("engine.app.pipelines.location_pipeline")


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

        # On-demand enrichment if Gemini chose a candidate that was not already enriched
        if (
            gemini_result
            and gemini_result.get("winner")
            and resolver_result
            and gemini_result.get("winner") != resolver_result.get("winner")
            and hasattr(self.resolver, "_enrich_candidate")
        ):
            place = winner.get("place", {}) if isinstance(winner, dict) else {}
            if isinstance(place, dict) and not place.get("nearby"):
                try:
                    res_tuple = self.resolver._enrich_candidate(winner)
                    if isinstance(res_tuple, tuple) and len(res_tuple) == 3:
                        winner, nb_sec, tr_sec = res_tuple
                        nearby_sec += nb_sec
                        travel_sec += tr_sec
                except Exception as exc:
                    logger.warning("[PIPELINE] On-demand candidate enrichment failed: %s", exc)

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
            raw_err = getattr(self.resolver, "last_resolver_error", None)
            err_msg = str(raw_err) if isinstance(raw_err, str) else "No verified destination candidate resolved."
            raw_cands = getattr(self.resolver, "last_attempted_candidates", [])
            attempted = [str(c) for c in raw_cands if isinstance(c, str)] if isinstance(raw_cands, list) else []

            ctx = get_current_context()
            if ctx:
                ctx.final_stage = stage
                ctx.success = False
                ctx.failure_stage = "location_resolution"
                ctx.error_category = str(ErrorCategory.RESOLUTION_FAILURE)
                ctx.places_resolution_status = "NOT_FOUND"
                perf["request_id"] = ctx.request_id
                perf["metrics"] = ctx.get_telemetry_dict()
                get_metrics_aggregator().record_request(ctx.get_telemetry_dict())
                obs_logger.warning("pipeline", f"Analysis unresolved at stage {stage}", error=err_msg)

            with measure_stage(PipelineStage.RESPONSE_CONSTRUCTION):
                return self.response_builder.build_unresolved(
                    stage=stage,
                    error=err_msg,
                    performance=perf,
                    extracted_candidates=attempted,
                    error_category=str(ErrorCategory.RESOLUTION_FAILURE),
                ).model_dump()

        ctx = get_current_context()
        if ctx:
            ctx.final_stage = stage
            ctx.success = True
            p = winner.get("place", {}) if isinstance(winner, dict) else {}
            ctx.selected_candidate = p.get("travel_name") or p.get("display_name")
            ctx.confidence = winner.get("score")
            ctx.confidence_level = winner.get("confidence") or p.get("confidence")
            ctx.places_resolution_status = "FOUND"
            ctx.gemini_verification_status = (gemini_result.get("verification_status") if gemini_result else None) or "SKIPPED"

        with measure_stage(PipelineStage.RESPONSE_CONSTRUCTION):
            resp = self.response_builder.build(
                winner=winner,
                gemini_result=gemini_result,
                stage=stage,
                performance=None,
                ranked_places=resolver_result.get("ranked_places", []) if isinstance(resolver_result, dict) else None,
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
        if ctx:
            perf["request_id"] = ctx.request_id
            perf["metrics"] = ctx.get_telemetry_dict()
            get_metrics_aggregator().record_request(ctx.get_telemetry_dict())
            obs_logger.info(
                "pipeline",
                f"Analysis resolved successfully at stage '{stage}'",
                winner=ctx.selected_candidate,
                confidence=ctx.confidence,
                confidence_level=ctx.confidence_level,
            )

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
        Handles Windows transient file locks, residual .part/.ytdl fragments,
        and request-scoped frame directories.
        """
        if frame_paths:
            parent_dirs = set()
            for fp in frame_paths:
                try:
                    p = Path(fp)
                    if p.is_file():
                        for attempt in range(3):
                            try:
                                p.unlink(missing_ok=True)
                                break
                            except (PermissionError, OSError):
                                if attempt < 2:
                                    time.sleep(0.05)
                    if p.parent.name not in ("frames", "assets"):
                        parent_dirs.add(p.parent)
                except Exception as exc:
                    logger.warning("[PIPELINE] Failed to remove temp frame %s: %s", fp, type(exc).__name__)

            for pdir in parent_dirs:
                try:
                    if pdir.exists() and not any(pdir.iterdir()):
                        pdir.rmdir()
                except Exception:
                    pass

        if video_path:
            try:
                vp = Path(video_path)
                file_stem = vp.stem
                if file_stem and vp.parent.exists():
                    for sibling in vp.parent.glob(f"{file_stem}*"):
                        if sibling.is_file():
                            for attempt in range(3):
                                try:
                                    sibling.unlink(missing_ok=True)
                                    break
                                except (PermissionError, OSError):
                                    if attempt < 2:
                                        time.sleep(0.05)
                elif vp.is_file():
                    vp.unlink(missing_ok=True)
            except Exception as exc:
                logger.warning("[PIPELINE] Failed to remove temp video %s: %s", video_path, type(exc).__name__)

    def _is_credible_destination(
        self,
        resolver_result: dict | None,
        gemini_result: dict | None = None,
        stage: str = "caption",
    ) -> bool:
        """
        Validates that a resolved destination meets the minimum evidence credibility threshold.
        Prevents weak OCR/speech hallucinations and non-destination noise from being returned
        as confident locations.
        """
        if not resolver_result or not isinstance(resolver_result, dict):
            return False

        winner = resolver_result.get("winner")
        if not winner or not isinstance(winner, dict):
            return False

        gemini_status = (gemini_result.get("verification_status") if gemini_result else "").upper()
        if gemini_status == "VERIFIED":
            return True

        score = float(winner.get("score") or 0.0)
        place = winner.get("place") or {}
        matched_sources = place.get("matched_sources") or []

        # Multi-source corroboration (e.g. caption + speech, or caption + OCR)
        if len(matched_sources) >= 2 and score >= 45.0:
            return True

        # Stage-specific credibility gates:
        # Caption is author-written text: requires at least score >= 45.0
        if stage == "caption":
            return score >= 45.0

        # OCR is video frame text: easily corrupted by fonts, subtitles, or watermarks.
        # Reject if score is VERY_LOW (< 60.0) and unverified
        if stage == "ocr":
            if score < 60.0:
                logger.info(
                    "[PIPELINE] OCR candidate '%s' rejected for insufficient credibility (score=%.1f < 60.0, unverified)",
                    place.get("travel_name"),
                    score,
                )
                return False
            return True

        # Speech is audio transcription: phoneme noise
        if stage == "speech":
            if score < 55.0:
                logger.info(
                    "[PIPELINE] Speech candidate '%s' rejected for insufficient credibility (score=%.1f < 55.0, unverified)",
                    place.get("travel_name"),
                    score,
                )
                return False
            return True

        return score >= 50.0

    # ==================================================
    # Pipeline Execution
    # ==================================================

    def run(
        self,
        metadata: dict,
        video_path: str | None = None,
        total_start: float | None = None,
        provider_duration: float | None = None,
        request_id: str | None = None,
    ) -> dict:

        if total_start is None:
            total_start = time.perf_counter()

        ctx = get_current_context()
        if ctx is None:
            ctx = start_request_context(request_id=request_id)
        elif request_id and ctx.request_id != request_id:
            ctx.request_id = request_id

        if provider_duration is not None:
            ctx.record_stage_duration(PipelineStage.INSTAGRAM_EXTRACTION, provider_duration)

        frame_paths = []
        extract_seconds = 0.0

        try:
            # ==================================================
            # STAGE 1 : Caption
            # ==================================================
            print("\n--- Stage 1: Caption ---")
            t_ext = time.perf_counter()
            with measure_stage(PipelineStage.EVIDENCE_CAPTION):
                evidence = self.builder.build_caption(metadata)
                evidence = self.builder.combine(evidence)
            extract_seconds += (time.perf_counter() - t_ext)
            if "caption" not in ctx.evidence_sources:
                ctx.evidence_sources.append("caption")

            resolver = self.resolver.resolve(evidence)

            if resolver:
                t_ver = time.perf_counter()
                with measure_stage(PipelineStage.GEMINI_VERIFICATION):
                    gemini = self.verify_if_needed(
                        evidence,
                        resolver,
                        frame_paths,
                    )
                verify_seconds = time.perf_counter() - t_ver
                if self._is_credible_destination(resolver, gemini, stage="caption"):
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
                    req_folder = (ctx.request_id if (ctx and ctx.request_id) else uuid.uuid4().hex).replace(":", "_")
                    frames_dir = Path("engine/assets/frames") / req_folder
                    with measure_stage(PipelineStage.FRAME_EXTRACTION):
                        frame_paths = self.frames.extract(
                            video_path,
                            str(frames_dir),
                        )
                except Exception as e:
                    obs_logger.warning("frame_extraction", f"Frame extraction failed: {type(e).__name__}")
                    frame_paths = []

            with measure_stage(PipelineStage.EVIDENCE_OCR):
                evidence = self.builder.build_ocr(
                    evidence,
                    frame_paths,
                )
                evidence = self.builder.combine(evidence)
            extract_seconds += (time.perf_counter() - t_ext)
            if "ocr" not in ctx.evidence_sources:
                ctx.evidence_sources.append("ocr")

            resolver = self.resolver.resolve(evidence)

            if resolver:
                t_ver = time.perf_counter()
                with measure_stage(PipelineStage.GEMINI_VERIFICATION):
                    gemini = self.verify_if_needed(
                        evidence,
                        resolver,
                        frame_paths,
                    )
                verify_seconds = time.perf_counter() - t_ver
                if self._is_credible_destination(resolver, gemini, stage="ocr"):
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
                    with measure_stage(PipelineStage.EVIDENCE_SPEECH):
                        evidence = self.builder.build_speech(
                            evidence,
                            video_path,
                        )
                except Exception as e:
                    obs_logger.warning("evidence_speech", f"Speech extraction failed: {type(e).__name__}")

            evidence = self.builder.combine(evidence)
            extract_seconds += (time.perf_counter() - t_ext)
            if "speech" not in ctx.evidence_sources:
                ctx.evidence_sources.append("speech")

            resolver = self.resolver.resolve(evidence)

            if resolver:
                t_ver = time.perf_counter()
                with measure_stage(PipelineStage.GEMINI_VERIFICATION):
                    gemini = self.verify_if_needed(
                        evidence,
                        resolver,
                        frame_paths,
                    )
                verify_seconds = time.perf_counter() - t_ver
                if self._is_credible_destination(resolver, gemini, stage="speech"):
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
            raw_cands = getattr(self.resolver, "last_attempted_candidates", [])
            attempted = [str(c) for c in raw_cands if isinstance(c, str)] if isinstance(raw_cands, list) else []
            raw_err = getattr(self.resolver, "last_resolver_error", None)
            if isinstance(raw_err, str):
                err_msg = raw_err
            elif attempted:
                err_msg = "No credible travel destination found (candidates lacked sufficient confidence)."
            else:
                err_msg = "No destination candidates found from the Reel."

            if ctx:
                ctx.final_stage = "failed"
                ctx.success = False
                ctx.failure_stage = "location_resolution"
                ctx.error_category = str(ErrorCategory.RESOLUTION_FAILURE)
                ctx.places_resolution_status = "NOT_FOUND"
                perf["request_id"] = ctx.request_id
                perf["metrics"] = ctx.get_telemetry_dict()
                get_metrics_aggregator().record_request(ctx.get_telemetry_dict())
                obs_logger.warning("pipeline", "Analysis completed: no destination resolved", error=err_msg)

            with measure_stage(PipelineStage.RESPONSE_CONSTRUCTION):
                return self.response_builder.build_unresolved(
                    stage="failed",
                    error=err_msg,
                    performance=perf,
                    extracted_candidates=attempted,
                    error_category=str(ErrorCategory.RESOLUTION_FAILURE),
                ).model_dump()

        finally:
            self._cleanup_temp_files(video_path, frame_paths)
