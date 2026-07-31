import json
import os
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv


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

        api_key = os.getenv(
            "GEMINI_API_KEY",
        )

        if not api_key:

            raise RuntimeError(
                "GEMINI_API_KEY not found."
            )

        genai.configure(
            api_key=api_key,
        )

        self.model = genai.GenerativeModel(

            model_name="gemini-2.5-flash",

            generation_config={

                "temperature": 0.0,

                "top_p": 0.9,

                "top_k": 20,

                "max_output_tokens": 2048,

                "response_mime_type": "application/json",

            },

        )

    # ==================================================
    # Generic JSON Generation
    # ==================================================

    def generate_json(
        self,
        prompt: str,
    ):

        try:

            response = self.model.generate_content(
                prompt,
            )

        except Exception as e:

            print(
                f"\n❌ Gemini API Error\n{e}\n"
            )

            return None

        text = getattr(
            response,
            "text",
            "",
        ).strip()

        if not text:

            print(
                "⚠️ Gemini returned an empty response."
            )

            return None

        try:

            return json.loads(
                text,
            )

        except json.JSONDecodeError:

            print(
                "\n⚠️ Gemini returned invalid JSON:\n"
            )

            print(text)

            return None

    # ==================================================
    # Location Verification
    # ==================================================

    def verify_location(
        self,
        prompt: str,
    ):

        result = self.generate_json(
            prompt,
        )

        if not result:

            return {

                "winner": None,

                "confidence": 0,

                "reason": "Gemini verification failed.",

            }

        return result

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
    ):

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