import logging
import os
from pathlib import Path
import time
import urllib.parse
from fastapi import APIRouter, HTTPException, Request, Response, status
import requests

from engine.observability.context import (
    get_current_context,
    start_request_context,
    measure_stage,
)
from engine.observability.stages import PipelineStage
from engine.observability.errors import ErrorCategory, categorize_error
from engine.observability.logger import get_logger
from engine.observability.metrics import get_metrics_aggregator
from engine.observability.redactor import sanitize_url
from engine.domain.schemas.request import AnalyzeRequest
from engine.core.security import (
    validate_place_photo_name,
    rate_limiter,
    concurrency_limiter,
)

logger = logging.getLogger(__name__)
obs_logger = get_logger("engine.app.api.analyze")

router = APIRouter(tags=["Analysis"])

_provider = None
_pipeline = None


def get_provider():
    global _provider
    if _provider is None:
        from engine.providers.manager import ProviderManager
        _provider = ProviderManager()
    return _provider


def get_pipeline():
    global _pipeline
    if _pipeline is None:
        from engine.app.pipelines.location_pipeline import LocationPipeline
        _pipeline = LocationPipeline()
    return _pipeline


# ==================================================
# Full Pipeline Analysis
# ==================================================

@router.post("/analyze")
def analyze(payload: AnalyzeRequest, request: Request = None):
    # 1. Extract Client IP and enforce rate limiting
    client_ip = "127.0.0.1"
    if request is not None:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        elif request.client and request.client.host:
            client_ip = request.client.host

    allowed, retry_after = rate_limiter.is_allowed(client_ip)
    if not allowed:
        obs_logger.warning("security", f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Please try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

    # 2. Concurrency Protection
    slot_acquired = concurrency_limiter.acquire(timeout=2.0)
    if not slot_acquired:
        obs_logger.warning("security", "Server concurrency limit reached on /analyze")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Server is currently processing maximum concurrent analyses. Please try again shortly.",
            headers={"Retry-After": "5"},
        )

    url = payload.target_url

    total_start = time.perf_counter()
    provider_duration = None
    provider_output = None
    video_path = None

    ctx = get_current_context()
    if ctx is None:
        ctx = start_request_context(url=url)

    obs_logger.info("analyze", "Starting reel analysis", url=sanitize_url(url))

    try:
        try:
            provider_start = time.perf_counter()
            with measure_stage(PipelineStage.INSTAGRAM_EXTRACTION):
                provider = get_provider()
                provider_output = provider.extract(url)
            provider_duration = time.perf_counter() - provider_start
            ctx.record_external_call("instagram_download", provider_duration)
            video_path = provider_output.get("video_path") if isinstance(provider_output, dict) else None
        except ValueError as e:
            obs_logger.warning("instagram_extraction", f"Validation error: {type(e).__name__}")
            ctx.record_failure(PipelineStage.INSTAGRAM_EXTRACTION, ErrorCategory.EXTRACTION_FAILURE, str(e))
            get_metrics_aggregator().record_request(ctx.get_telemetry_dict())
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Enter a valid public Instagram Reel URL.",
            )
        except (RuntimeError, FileNotFoundError) as e:
            obs_logger.warning("instagram_extraction", f"Reel download error: {type(e).__name__}")
            ctx.record_failure(PipelineStage.INSTAGRAM_EXTRACTION, ErrorCategory.MEDIA_UNAVAILABLE, str(e))
            get_metrics_aggregator().record_request(ctx.get_telemetry_dict())
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="This Reel couldn't be accessed. Make sure it's publicly available.",
            )
        except HTTPException:
            raise
        except Exception as e:
            obs_logger.error("instagram_extraction", f"Unexpected error during extraction: {type(e).__name__}")
            cat = categorize_error(e, stage=PipelineStage.INSTAGRAM_EXTRACTION)
            ctx.record_failure(PipelineStage.INSTAGRAM_EXTRACTION, cat, str(e))
            get_metrics_aggregator().record_request(ctx.get_telemetry_dict())
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Travel AI couldn't analyze this Reel.",
            )

        try:
            pipeline = get_pipeline()
            return pipeline.run(
                metadata=provider_output["metadata"],
                video_path=video_path,
                total_start=total_start,
                provider_duration=provider_duration,
                request_id=ctx.request_id,
            )
        except HTTPException:
            raise
        except Exception as e:
            obs_logger.error("pipeline", f"Pipeline execution error: {type(e).__name__}")
            cat = categorize_error(e, stage="pipeline")
            ctx.record_failure("pipeline", cat, str(e))
            get_metrics_aggregator().record_request(ctx.get_telemetry_dict())
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Travel AI couldn't complete the analysis.",
            )
    finally:
        # Guarantee concurrency slot is released
        concurrency_limiter.release()

        # Guarantee video cleanup if not already unlinked by pipeline
        if video_path:
            try:
                vp = Path(video_path)
                if vp.is_file():
                    vp.unlink(missing_ok=True)
            except Exception as exc:
                logger.warning("[API] Failed to cleanup temp video %s: %s", video_path, type(exc).__name__)


# ==================================================
# Google Places Photo Proxy
# ==================================================

@router.get("/places/photo")
def get_place_photo(name: str):
    """
    Proxies Google Places photo media server-side so that
    GOOGLE_PLACES_API_KEY is never exposed to client bundles or browser logs.
    Enforces strict format validation to prevent path traversal or SSRF.
    """
    clean_name = (name or "").strip()
    clean_name = urllib.parse.unquote(clean_name)

    if not validate_place_photo_name(clean_name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid photo reference name.",
        )

    api_key = os.getenv("GOOGLE_PLACES_API_KEY", "")
    if not api_key:
        logger.warning("[API] GOOGLE_PLACES_API_KEY missing for photo proxy.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Places service not configured.",
        )

    target_url = f"https://places.googleapis.com/v1/{clean_name}/media"
    params = {
        "key": api_key,
        "maxHeightPx": 1000,
        "maxWidthPx": 1000,
    }

    try:
        resp = requests.get(target_url, params=params, stream=True, timeout=10)
        if not resp.ok:
            logger.warning("[API] Google Places photo fetch failed with status %d", resp.status_code)
            raise HTTPException(
                status_code=resp.status_code,
                detail="Could not retrieve photo from Google Places.",
            )

        content_type = resp.headers.get("content-type", "image/jpeg")
        return Response(
            content=resp.content,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
            },
        )
    except requests.RequestException as e:
        logger.error("[API] Error fetching place photo from upstream: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch image from upstream provider.",
        )
