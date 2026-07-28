import json


class PromptBuilder:

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

                    "region": place.get(
                        "region",
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

                    "primary_type": place.get(
                        "primary_type",
                        "",
                    ),

                    "types": place.get(
                        "types",
                        [],
                    ),

                    "rating": place.get(
                        "rating",
                        0,
                    ),

                    "user_rating_count": place.get(
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

            "ocr": evidence.get(
                "ocr_text",
                "",
            ),

            "speech": evidence.get(
                "speech_text",
                "",
            ),

            "hashtags": evidence.get(
                "hashtags",
                [],
            ),

            "rule_engine_candidates": candidates,

        }

        prompt = f"""
You are an expert travel location verification engine.

Your task is NOT to discover new locations.

Your task is ONLY to select the SINGLE BEST travel destination from the provided candidates.

Rules:

1. NEVER invent a location.
2. NEVER return a place that is not in the candidate list.
3. Use caption, OCR, speech and hashtags together.
4. Prefer landmarks over countries.
5. Prefer tourist attractions over businesses.
6. Prefer the highest confidence evidence.
7. If uncertain, choose the highest scoring candidate.
8. Output ONLY valid JSON.

Return exactly this schema:

{{
    "selected_rank": 1,
    "reason": "...",
    "confidence": 0.95
}}

Input:

{json.dumps(payload, indent=2)}
"""

        return prompt