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

You are given MULTIPLE FRAMES extracted from the SAME travel reel.

Analyze ALL images together before making a decision.

Visual evidence is MORE IMPORTANT than captions or hashtags.

==================================================

TEXT CONTEXT

==================================================

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

==================================================

POSSIBLE GOOGLE LOCATION CANDIDATES

==================================================

{candidate_list}

==================================================

YOUR TASK

==================================================

Determine the exact travel destination shown.

Consider:

- Mountains
- Lakes
- Beaches
- Rivers
- Forests
- Waterfalls
- Snow
- Coastline
- Architecture
- Bridges
- Churches
- Temples
- Castles
- Skylines
- Road signs
- Language
- Vegetation
- Terrain
- Hiking trails
- Peaks
- Islands

Compare the visual clues against the provided candidate locations.

If none match, infer the most likely real-world location.

Never force a candidate if the visuals disagree.

==================================================

RETURN JSON ONLY

==================================================

{{
    "best_match": "...",
    "matches_candidate": true,
    "confidence": 0,
    "reason": "...",
    "visual_clues": [
        "...",
        "..."
    ],
    "detected_landmarks": [
        "...",
        "..."
    ],
    "detected_country": "...",
    "detected_region": "..."
}}

Do not return markdown.

Do not explain anything outside the JSON.
"""