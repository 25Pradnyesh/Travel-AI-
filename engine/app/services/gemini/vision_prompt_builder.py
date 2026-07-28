class VisionPromptBuilder:

    # ==================================================
    # Build Vision Prompt
    # ==================================================

    def build(
        self,
        evidence: dict,
        candidates: list,
    ):

        title = evidence.get(
            "title",
            "",
        )

        caption = evidence.get(
            "caption",
            "",
        )

        ocr = evidence.get(
            "ocr_text",
            "",
        )

        speech = evidence.get(
            "speech_text",
            "",
        )

        hashtags = ", ".join(
            evidence.get(
                "hashtags",
                [],
            )
        )

        candidate_list = "\n".join(

            f"- {candidate}"

            for candidate in candidates

        )

        return f"""
You are an expert travel geolocation AI.

Your task is to identify the exact travel location shown in the provided image.

Use BOTH:

1. The image itself
2. The contextual information

Context
-------

Title:
{title}

Caption:
{caption}

OCR:
{ocr}

Speech:
{speech}

Hashtags:
{hashtags}

Possible Google Candidates
--------------------------

{candidate_list}

Instructions
------------

1. Study the visual landmarks carefully.

2. Compare them against the candidate locations.

3. If none of the candidates match, infer the most likely real-world location.

4. Consider:

- Mountains
- Lakes
- Beaches
- Architecture
- Skylines
- Forests
- Waterfalls
- Roads
- Monuments
- Bridges
- Churches
- Temples
- Castles
- Vegetation
- Terrain
- Snow
- Coastlines

Return ONLY valid JSON.

Schema

{{
    "best_match": "...",
    "confidence": 0-100,
    "reason": "...",
    "visual_clues": [
        "...",
        "..."
    ],
    "matches_candidate": true
}}

Do not include markdown.

Do not explain anything outside the JSON.
"""