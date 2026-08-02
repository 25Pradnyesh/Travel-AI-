import json


class PromptBuilder:

    # ==================================================
    # Build Verification Prompt
    # ==================================================

    def build(
        self,
        evidence: dict,
        ranked_places: list,
    ) -> str:

        candidates = []

        for index, item in enumerate(
            ranked_places,
            start=1,
        ):

            place = item["place"]

            candidates.append(

                {

                    "rank": index,

                    "travel_name": place.get(
                        "travel_name",
                        "",
                    ),

                    "city": place.get(
                        "city",
                        "",
                    ),

                    "state": place.get(
                        "state",
                        "",
                    ),

                    "country": place.get(
                        "country",
                        "",
                    ),

                    "category": place.get(
                        "category",
                        "",
                    ),

                    "primary_type": place.get(
                        "primary_type",
                        "",
                    ),

                    "rating": place.get(
                        "rating",
                        0,
                    ),

                    "reviews": place.get(
                        "user_rating_count",
                        0,
                    ),

                    "score": item.get(
                        "score",
                        0,
                    ),

                    "confidence": item.get(
                        "confidence",
                        "",
                    ),

                }

            )

        payload = {

            "title": evidence.get(
                "title",
                "",
            ),

            "caption": evidence.get(
                "caption",
                "",
            ),

            "ocr_text": evidence.get(
                "ocr_text",
                "",
            ),

            "speech_text": evidence.get(
                "speech_text",
                "",
            ),

            "hashtags": evidence.get(
                "hashtags",
                [],
            ),

            "combined_text": evidence.get(
                "combined_text",
                "",
            ),

            "rule_engine_candidates": candidates,

        }

        return f"""
You are Travel AI's final verification engine.

Your task is to determine which candidate location is MOST LIKELY correct.

IMPORTANT RULES

• NEVER invent a new place.
• ONLY choose from the supplied candidates.
• NEVER change spellings.
• NEVER merge two locations.
• If evidence is weak, choose the highest scoring candidate.
• Give extra importance to:
  - OCR text
  - Spoken location names
  - Famous landmarks
  - Mountains
  - Lakes
  - Beaches
  - Architecture
  - National Parks
  - Monuments
  - City skylines

Ignore:

- emojis
- filler words
- unrelated hashtags
- promotional text
- creator opinions

Reasoning Priority

1. OCR
2. Speech
3. Caption
4. Title
5. Hashtags
6. Rule Engine Score

Return ONLY valid JSON.

Schema

{{
    "selected_rank": 1,
    "confidence": 94,
    "reason": "OCR and speech both mention Seebensee while caption confirms Austria.",
    "matched_sources": [
        "ocr",
        "speech",
        "caption"
    ]
}}

Input Data

{json.dumps(payload, indent=2, ensure_ascii=False)}
"""