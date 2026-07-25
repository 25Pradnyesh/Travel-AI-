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
            "GEMINI_API_KEY"
        )

        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY not found."
            )

        genai.configure(
            api_key=api_key,
        )

        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config={

                "temperature": 0,

                "top_p": 0.95,

                "top_k": 20,

                "max_output_tokens": 1024,

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

            text = response.text.strip()

            return json.loads(text)

        except Exception as e:

            print(
                f"❌ Gemini Error: {e}"
            )

            return None

    # ==================================================
    # Verify Ranked Locations
    # ==================================================

    def verify_location(
        self,
        prompt: str,
    ):

        result = self.generate_json(
            prompt,
        )

        if result is None:
            return None

        return result