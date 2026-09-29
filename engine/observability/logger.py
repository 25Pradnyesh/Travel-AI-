"""
Structured and Privacy-Preserving Logger for Travel AI Observability.

Automatically injects active request IDs, redacts credentials, secrets,
cookies, and tokens, and emits standardized structured log messages.
"""

import json
import logging
from typing import Any

from engine.observability.context import get_current_context
from engine.observability.redactor import redact_sensitive_data


class StructuredLogger:
    """
    Lightweight logging wrapper that ensures consistent request ID tracing
    and deterministic credential redaction.
    """

    def __init__(self, name: str):
        self._logger = logging.getLogger(name)

    def _format(self, stage: str, message: str, **kwargs: Any) -> str:
        ctx = get_current_context()
        req_id = ctx.request_id if ctx else "no-trace"
        safe_msg = redact_sensitive_data(message)

        if kwargs:
            safe_kwargs = {k: redact_sensitive_data(v) for k, v in kwargs.items()}
            try:
                meta_str = json.dumps(safe_kwargs, default=str)
            except Exception:
                meta_str = str(safe_kwargs)
            return f"[{req_id}] [{stage}] {safe_msg} | meta={meta_str}"

        return f"[{req_id}] [{stage}] {safe_msg}"

    def info(self, stage: str, message: str, **kwargs: Any) -> None:
        self._logger.info(self._format(stage, message, **kwargs))

    def warning(self, stage: str, message: str, **kwargs: Any) -> None:
        self._logger.warning(self._format(stage, message, **kwargs))

    def error(self, stage: str, message: str, **kwargs: Any) -> None:
        self._logger.error(self._format(stage, message, **kwargs))

    def debug(self, stage: str, message: str, **kwargs: Any) -> None:
        self._logger.debug(self._format(stage, message, **kwargs))


_loggers: dict[str, StructuredLogger] = {}


def get_logger(name: str) -> StructuredLogger:
    """Factory to retrieve or create a StructuredLogger instance."""
    if name not in _loggers:
        _loggers[name] = StructuredLogger(name)
    return _loggers[name]
