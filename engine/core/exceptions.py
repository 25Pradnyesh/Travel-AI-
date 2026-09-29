"""
Travel AI — Core Exceptions and Domain Error Mapping
Stage 12: Production API Hardening & Security
"""

from fastapi import HTTPException, status
from engine.observability.errors import ErrorCategory


class TravelAIException(Exception):
    """Base exception for all domain errors within Travel AI."""
    def __init__(self, message: str, category: ErrorCategory = ErrorCategory.PIPELINE_ERROR, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.category = category
        self.status_code = status_code


class MediaExtractionError(TravelAIException):
    def __init__(self, message: str = "This Reel couldn't be accessed. Make sure it's publicly available."):
        super().__init__(message, category=ErrorCategory.MEDIA_UNAVAILABLE, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class MediaTimeoutError(TravelAIException):
    def __init__(self, message: str = "Media extraction timed out. Please try again."):
        super().__init__(message, category=ErrorCategory.MEDIA_UNAVAILABLE, status_code=status.HTTP_504_GATEWAY_TIMEOUT)


class UpstreamTimeoutError(TravelAIException):
    def __init__(self, service: str, message: str | None = None):
        msg = message or f"Upstream service '{service}' timed out."
        super().__init__(msg, category=ErrorCategory.TIMEOUT, status_code=status.HTTP_504_GATEWAY_TIMEOUT)


class RateLimitError(TravelAIException):
    def __init__(self, retry_after: int, message: str | None = None):
        msg = message or f"Rate limit exceeded. Please try again in {retry_after} seconds."
        super().__init__(msg, category=ErrorCategory.RATE_LIMIT_EXCEEDED, status_code=status.HTTP_429_TOO_MANY_REQUESTS)
        self.retry_after = retry_after


class ConcurrencyLimitError(TravelAIException):
    def __init__(self, retry_after: int = 5, message: str | None = None):
        msg = message or "Server is processing maximum concurrent analyses. Please try again shortly."
        super().__init__(msg, category=ErrorCategory.RATE_LIMIT_EXCEEDED, status_code=status.HTTP_429_TOO_MANY_REQUESTS)
        self.retry_after = retry_after
