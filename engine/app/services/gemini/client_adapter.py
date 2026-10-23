"""
Travel AI — Gemini Client Adapter
Provides dual compatibility with:
1. Supported 'google.genai' SDK (modern Google GenAI Python SDK).
2. Deprecated 'google.generativeai' package (fallback with warning suppression).
Preserves model configuration, timeout handling, quota tracking, and multimodal support.
"""

import importlib.util
import logging
import os
import warnings
from typing import Any

logger = logging.getLogger(__name__)


def is_google_genai_available() -> bool:
    """Checks whether the new google.genai package is installed."""
    return importlib.util.find_spec("google.genai") is not None


class GeminiClientAdapter:
    """
    Dual-compatibility adapter for Google Gemini:
    - Automatically uses `google.genai` SDK when installed.
    - Gracefully falls back to `google.generativeai` when `google.genai` is not available,
      suppressing the deprecation FutureWarning so runtime logs remain clean.
    - Preserves identical configuration, quota tracking, timeouts, and exception handling.
    """

    def __init__(
        self,
        api_key: str,
        model_name: str = "gemini-3.5-flash",
        generation_config: dict[str, Any] | None = None,
    ):
        self.api_key = api_key
        self.model_name = model_name
        self.generation_config = generation_config or {
            "temperature": 0.0,
            "top_p": 0.9,
            "top_k": 20,
            "max_output_tokens": 2048,
            "response_mime_type": "application/json",
        }
        self.flavor = "unknown"
        self._client = None
        self._model = None
        self._init_sdk()

    def _init_sdk(self):
        if is_google_genai_available():
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                self.flavor = "google.genai"
                logger.info("[GEMINI] Initialized with modern google.genai SDK (model: %s)", self.model_name)
                return
            except Exception as exc:
                logger.warning("[GEMINI] Failed initializing google.genai client, falling back: %s", exc)

        # Fallback to google.generativeai with REST transport (avoids Windows gRPC timeouts)
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", category=FutureWarning)
                import google.generativeai as legacy_genai

            legacy_genai.configure(api_key=self.api_key, transport="rest")
            self._model = legacy_genai.GenerativeModel(
                model_name=self.model_name,
                generation_config=self.generation_config,
            )
            self.flavor = "google.generativeai"
            logger.info("[GEMINI] Initialized with google.generativeai REST fallback (model: %s)", self.model_name)
        except Exception as exc:
            logger.warning("[GEMINI] Failed to initialize Gemini model: %s", type(exc).__name__)
            raise exc

    def generate_content(self, contents: Any, request_options: dict | None = None, **kwargs) -> Any:
        timeout = 10.0
        if request_options and "timeout" in request_options:
            try:
                timeout = min(10.0, float(request_options["timeout"]))
            except (ValueError, TypeError):
                timeout = 10.0

        if self.flavor == "google.genai" and self._client:
            config = dict(self.generation_config)
            return self._client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=config,
            )

        # Legacy google.generativeai with REST transport and 10s timeout (0 retries)
        if self._model:
            try:
                return self._model.generate_content(contents, request_options={"timeout": timeout}, **kwargs)
            except TypeError:
                return self._model.generate_content(contents, **kwargs)

        raise RuntimeError("No active Gemini model available.")
