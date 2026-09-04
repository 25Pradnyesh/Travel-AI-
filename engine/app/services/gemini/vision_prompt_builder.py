import json


class VisionPromptBuilder:

    # ==================================================
    # Build Vision Prompt
    # ==================================================

    def build(
        self,
        evidence: dict,
        candidates: list,
    ) -> str:

        metadata = evidence.get("metadata", {})

        title = evidence.get("title", "") or metadata.get("title", "")
        caption = evidence.get("caption", "") or metadata.get("caption", "")
        ocr = evidence.get("ocr_text", "")
        speech = evidence.get("speech_text", "")

        hashtags = evidence.get("hashtags") or metadata.get("hashtags") or []
        if isinstance(hashtags, list):
            hashtags_str = ", ".join(str(tag) for tag in hashtags)
        else:
            hashtags_str = str(hashtags)

        formatted_candidates = []
        for index, item in enumerate(candidates, start=1):
            if isinstance(item, dict):
                name = item.get("name") or item.get("travel_name") or item.get("display_name", "")
                country = item.get("country", "")
                city = item.get("city", "")
                formatted_candidates.append(f"{index}. {name} ({city}, {country})")
            else:
                formatted_candidates.append(f"{index}. {item}")

        candidate_list_str = "\n".join(formatted_candidates)

        return f"""You are a travel geolocation verification AI.

Analyze the image frames extracted from a travel Reel to verify which candidate location from the provided list matches the visual evidence.

CRITICAL RULES:
- Do NOT hallucinate or invent new destinations.
- Your goal is to verify if one of the supplied candidates matches the scene.
- Check architecture, landscape, terrain, water bodies, mountains, flora, landmarks, language signs.
- If the visual evidence clearly matches a candidate, select it with high confidence.
- If the visuals contradict a candidate or none clearly match, state that no candidate matches.

CANDIDATE DESTINATIONS:
{candidate_list_str}

REEL CONTEXT:
Title: {title}
Caption: {caption}
OCR: {ocr}
Speech: {speech}
Hashtags: {hashtags_str}

RETURN ONLY VALID JSON matching this schema:
{{
    "matched_index": 1,
    "matches_candidate": true,
    "confidence": 0.85,
    "reason": "The mountain lake and alpine architecture visually match candidate 1.",
    "visual_clues": ["alpine lake", "pine trees", "snow-capped peaks"],
    "detected_landmarks": ["mountain lake"],
    "detected_country": "Austria",
    "detected_region": "Tyrol"
}}

If none of the candidates match or the image is ambiguous, return:
{{
    "matched_index": null,
    "matches_candidate": false,
    "confidence": 0.2,
    "reason": "Visual clues do not specifically identify or verify any candidate.",
    "visual_clues": [],
    "detected_landmarks": [],
    "detected_country": "",
    "detected_region": ""
}}
"""