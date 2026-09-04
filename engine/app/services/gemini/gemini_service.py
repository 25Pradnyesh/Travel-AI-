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
            import google.generativeai as genai

            genai.configure(
                api_key=self.api_key,
            )

            model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

            self.model = genai.GenerativeModel(
                model_name=model_name,
                generation_config={
                    "temperature": 0.0,
                    "top_p": 0.9,
                    "top_k": 20,
                    "max_output_tokens": 2048,
                    "response_mime_type": "application/json",
                },
            )
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

        if not self.available or not self.model:
            logger.warning("[GEMINI] Service unavailable. Skipping Gemini request.")
            return None

        try:
            response = self.model.generate_content(
                prompt,
            )

        except Exception as e:
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