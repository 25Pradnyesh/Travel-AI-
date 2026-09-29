"""
Error Categorization for Travel AI Observability.

Provides structured, machine-readable failure categories to classify production errors
without leaking internal stack traces or sensitive implementation details to API clients.
"""

from enum import Enum
import socket
from typing import Any


class ErrorCategory(str, Enum):
    EXTRACTION_FAILURE = "EXTRACTION_FAILURE"
    MEDIA_UNAVAILABLE = "MEDIA_UNAVAILABLE"
    OCR_FAILURE = "OCR_FAILURE"
    SPEECH_FAILURE = "SPEECH_FAILURE"
    CANDIDATE_GENERATION_FAILURE = "CANDIDATE_GENERATION_FAILURE"
    RESOLUTION_FAILURE = "RESOLUTION_FAILURE"
    EXTERNAL_API_FAILURE = "EXTERNAL_API_FAILURE"
    TIMEOUT = "TIMEOUT"
    VERIFICATION_FAILURE = "VERIFICATION_FAILURE"
    UNEXPECTED_INTERNAL_FAILURE = "UNEXPECTED_INTERNAL_FAILURE"

    def __str__(self) -> str:
        return self.value


def categorize_error(
    exc: Exception | None = None,
    stage: str | None = None,
    message: str | None = None,
) -> ErrorCategory:
    """
    Deterministic error classifier mapping exceptions, stage context, and diagnostic
    messages into a canonical ErrorCategory.
    """
    err_str = f"{type(exc).__name__}: {exc}" if exc else ""
    if message:
        err_str = f"{err_str} {message}".strip()
    err_lower = err_str.lower()
    stage_lower = (stage or "").lower()

    # 1. Timeout errors
    if isinstance(exc, (TimeoutError, socket.timeout)):
        return ErrorCategory.TIMEOUT
    if "timeout" in err_lower or "timed out" in err_lower:
        return ErrorCategory.TIMEOUT

    # 2. Media / Download unavailability
    if isinstance(exc, FileNotFoundError) and ("video" in err_lower or "reel" in err_lower or "media" in err_lower):
        return ErrorCategory.MEDIA_UNAVAILABLE
    if any(k in err_lower for k in ["unavailable", "private post", "deleted", "login required", "not publicly available"]):
        return ErrorCategory.MEDIA_UNAVAILABLE

    # 3. Upstream extraction failure (Instagram / yt-dlp)
    if stage_lower in ("instagram_extraction", "ingestion") or "yt_dlp" in err_lower or "reel download" in err_lower:
        if any(k in err_lower for k in ["download error", "extraction error", "extractor"]):
            return ErrorCategory.EXTRACTION_FAILURE
        return ErrorCategory.EXTRACTION_FAILURE

    # 4. OCR failure
    if stage_lower in ("frame_extraction", "evidence_ocr") or "ocr" in err_lower or "easyocr" in err_lower or "cv2" in err_lower:
        return ErrorCategory.OCR_FAILURE

    # 5. Speech transcription failure
    if stage_lower in ("evidence_speech", "speech") or "whisper" in err_lower or "ffmpeg" in err_lower or "audio" in err_lower:
        return ErrorCategory.SPEECH_FAILURE

    # 6. Candidate generation failure
    if stage_lower == "candidate_generation" or "candidate generation" in err_lower:
        return ErrorCategory.CANDIDATE_GENERATION_FAILURE

    # 7. Gemini verification failure
    if stage_lower == "gemini_verification" or "gemini" in err_lower:
        return ErrorCategory.VERIFICATION_FAILURE

    # 8. External API failures (Google Places / Gemini network)
    if any(k in err_lower for k in ["places api", "google places", "quota exceeded", "rate limit", "429", "403 forbidden", "api key"]):
        return ErrorCategory.EXTERNAL_API_FAILURE

    # 9. Location resolution failures (unresolved destinations / insufficient confidence)
    if stage_lower in ("candidate_resolution", "resolution", "scoring") or any(k in err_lower for k in [
        "no destination",
        "no verified destination",
        "no credible travel destination",
        "unresolved",
        "lacked sufficient confidence",
        "no candidates found",
    ]):
        return ErrorCategory.RESOLUTION_FAILURE

    # 10. Fallback: Unexpected internal failure
    return ErrorCategory.UNEXPECTED_INTERNAL_FAILURE
