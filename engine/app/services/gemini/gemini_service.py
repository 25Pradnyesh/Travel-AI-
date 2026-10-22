import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv

logger = logging.getLogger(__name__)


class GeminiService:

    def __init__(self):

        env_path = (
            Path(__file__).resolve().parents[3]
            / ".env"
        )

        load_dotenv(
            env_path,
            override=True,
        )

        self.api_key = os.getenv(
            "GEMINI_API_KEY",
        )

        self.model = None
        self.available = False

        if not self.api_key:
            logger.warning(
                "[GEMINI] GEMINI_API_KEY not found. Gemini service running in fallback mode."
            )
            return

        try:
            from engine.app.services.gemini.client_adapter import GeminiClientAdapter

            configured_model = os.getenv("GEMINI_MODEL", "").strip()
            model_name = (
                configured_model
                if configured_model and configured_model not in ("gemini-2.5-flash", "gemini-1.5-flash")
                else "gemini-3.8-flash"
            )

            self.model = GeminiClientAdapter(
                api_key=self.api_key,
                model_name=model_name,
                generation_config={
                    "temperature": 0.0,
                    "top_p": 0.9,
                    "top_k": 20,
                    "max_output_tokens": 2048,
                    "response_mime_type": "application/json",
                },
            )
            self.model_name = model_name
            self.available = True
            logger.info("[GEMINI] GeminiService initialized successfully with model: %s", model_name)

        except Exception as e:
            logger.warning("[GEMINI] Failed to initialize GeminiService: %s", type(e).__name__)
            self.model = None
            self.available = False

    # ==================================================
    # Generic Content / JSON Generation
    # ==================================================

    def generate_json(
        self,
        prompt: str,
    ) -> dict | None:

        from engine.app.services.gemini.gemini_counter import gemini_counter

        if not self.available or not self.model:
            logger.warning("[GEMINI] Service unavailable. Skipping Gemini request.")
            return None

        if gemini_counter.is_quota_exhausted():
            logger.warning("[GEMINI] Daily quota exhausted. Skipping request.")
            return None

        try:
            try:
                response = self.model.generate_content(
                    prompt,
                    request_options={"timeout": 15.0},
                )
            except TypeError:
                response = self.model.generate_content(
                    prompt,
                )
            gemini_counter.increment()
        except Exception as e:
            err_str = str(e).lower()
            err_name = type(e).__name__
            if "notfound" in err_name.lower() or "not found" in err_str:
                current_m = getattr(self, "model_name", "unknown")
                fallback_model = "gemini-flash-latest" if current_m != "gemini-flash-latest" else "gemini-3.8-flash"
                if current_m == fallback_model:
                    logger.error("[GEMINI] Model %s returned NotFound and no distinct fallback available.", current_m)
                    return None
                logger.warning("[GEMINI] Model %s returned NotFound. Attempting fallback to %s.", current_m, fallback_model)
                try:
                    from engine.app.services.gemini.client_adapter import GeminiClientAdapter
                    self.model = GeminiClientAdapter(
                        api_key=self.api_key,
                        model_name=fallback_model,
                        generation_config={
                            "temperature": 0.0,
                            "top_p": 0.9,
                            "top_k": 20,
                            "max_output_tokens": 2048,
                            "response_mime_type": "application/json",
                        },
                    )
                    self.model_name = fallback_model
                    try:
                        response = self.model.generate_content(prompt, request_options={"timeout": 15.0})
                    except TypeError:
                        response = self.model.generate_content(prompt)
                    gemini_counter.increment()
                except Exception as fb_exc:
                    logger.error("[GEMINI] Fallback to %s failed: %s", fallback_model, type(fb_exc).__name__)
                    return None
            elif "429" in err_str or "quota" in err_str or "resourceexhausted" in str(type(e)).lower():
                logger.warning("[GEMINI] 429 / Quota exhausted received: %s. Marking quota exhausted.", e)
                gemini_counter.mark_quota_exhausted()
                return None
            else:
                logger.error("[GEMINI] API Error: %s", type(e).__name__)
                return None

        text = getattr(
            response,
            "text",
            "",
        )
        if text is None:
            text = ""
        text = text.strip()

        if not text:
            logger.warning("[GEMINI] Received empty text from model.")
            return None

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Return raw text so parser can handle markdown fences / regex
            return text

    # ==================================================
    # Location Verification
    # ==================================================

    def verify_location(
        self,
        prompt: str,
    ) -> dict | str | None:

        return self.generate_json(prompt)

    # ==================================================
    # Generic Prompt
    # ==================================================

    def ask(
        self,
        prompt: str,
    ):

        return self.generate_json(
            prompt,
        )

    # ==================================================
    # Health Check
    # ==================================================

    def health_check(
        self,
    ) -> bool:

        if not self.available or not self.model:
            return False

        try:
            response = self.model.generate_content(
                "Reply ONLY with JSON: {\"status\":\"ok\"}",
            )

            return bool(
                getattr(
                    response,
                    "text",
                    "",
                )
            )

        except Exception:
            return False