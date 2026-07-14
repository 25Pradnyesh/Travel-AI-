import os
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv


class GeminiService:

    def __init__(self):

        env_path = Path(__file__).resolve().parents[3] / ".env"
        load_dotenv(env_path, override=True)

        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError("GEMINI_API_KEY not found.")

        genai.configure(api_key=api_key)

        self.model = genai.GenerativeModel(
            "gemini-2.0-flash"
        )

    def generate_candidates(self, evidence: dict):

        prompt = f"""
You are a travel location extraction engine.

Extract only location names.

Title:
{evidence.get("title","")}

Caption:
{evidence.get("caption","")}

OCR:
{evidence.get("ocr_text","")}

Hashtags:
{", ".join(evidence.get("hashtags", []))}

Return ONLY comma-separated locations.

Example:
Seebensee, Tyrol, Austria
"""

        response = self.model.generate_content(prompt)

        return [
            x.strip()
            for x in response.text.split(",")
            if x.strip()
        ]