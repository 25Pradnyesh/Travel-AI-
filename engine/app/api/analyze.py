import logging
import os
from pathlib import Path
import re
import time
import urllib.parse
from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel, model_validator
import requests

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Analysis"])

INSTAGRAM_REEL_REGEX = re.compile(
    r"^https?://(?:www\.)?instagram\.com/(?:reel|reels)/([A-Za-z0-9_-]+)",
    re.IGNORECASE,
)

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



class AnalyzeRequest(BaseModel):
    reel_url: str | None = None
    url: str | None = None

    @property
    def target_url(self) -> str:
        return (self.reel_url or self.url or "").strip()

    @model_validator(mode="after")
    def check_url(self):
        if not self.target_url or not INSTAGRAM_REEL_REGEX.match(self.target_url):
            raise ValueError("Enter a valid public Instagram Reel URL.")
        return self


# ==================================================
# Full Pipeline Analysis
# ==================================================

@router.post("/analyze")
def analyze(request: AnalyzeRequest):
    url = request.target_url

    total_start = time.perf_counter()
    provider_duration = None
    provider_output = None
    video_path = None

    try:
        try:
            provider_start = time.perf_counter()
            provider = get_provider()
            provider_output = provider.extract(url)
            provider_duration = time.perf_counter() - provider_start
            video_path = provider_output.get("video_path") if isinstance(provider_output, dict) else None
        except ValueError as e:
            logger.warning("[API] Validation error: %s", type(e).__name__)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Enter a valid public Instagram Reel URL.",
            )
        except (RuntimeError, FileNotFoundError) as e:
            logger.warning("[API] Reel download error: %s", type(e).__name__)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="This Reel couldn't be accessed. Make sure it's publicly available.",
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error("[API] Unexpected error during extraction: %s", type(e).__name__)
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
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error("[API] Pipeline execution error: %s", type(e).__name__)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Travel AI couldn't complete the analysis.",
            )
    finally:
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
    """
    clean_name = (name or "").strip()
    clean_name = urllib.parse.unquote(clean_name)

    if not clean_name or not clean_name.startswith("places/"):
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
