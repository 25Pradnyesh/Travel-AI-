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
            place = item.get("place", item)

            name = (
                place.get("travel_name")
                or place.get("display_name")
                or place.get("name")
                or "Unknown"
            )

            candidates.append(
                {
                    "index": index,
                    "name": name,
                    "formatted_address": place.get("formatted_address", ""),
                    "country": place.get("country", ""),
                    "city": place.get("city", ""),
                    "region": place.get("region") or place.get("state", ""),
                    "latitude": place.get("latitude", 0.0),
                    "longitude": place.get("longitude", 0.0),
                    "types": place.get("types", []),
                    "rating": place.get("rating", 0.0),
                    "user_ratings_total": place.get("user_rating_count", 0),
                }
            )

        metadata = evidence.get("metadata", {})
        frame_info = evidence.get("frame_summary") or evidence.get("scene") or ""

        reel_evidence = {
            "caption": evidence.get("caption", ""),
            "hashtags": evidence.get("hashtags", []),
            "speech_transcript": evidence.get("speech_text", ""),
            "ocr_text": evidence.get("ocr_text", ""),
            "metadata": {
                "title": evidence.get("title", ""),
                "creator": evidence.get("creator", "") or metadata.get("creator", ""),
                "location_tag": evidence.get("location", "") or metadata.get("location", ""),
            },
        }

        if frame_info:
            reel_evidence["frame_information"] = frame_info

        payload = {
            "reel_evidence": reel_evidence,
            "candidates": candidates,
        }

        return f"""You are verifying the most likely real-world destination represented by a travel Reel.

You have:
- Reel evidence
- a ranked list of real Google Places candidates

Your job is NOT to search for new locations.

Your job is to compare the supplied candidates against the evidence and select the candidate that best explains the evidence.

Consider:
- explicit place names
- city names
- country names
- geographic clues
- landmarks
- spoken references
- OCR text
- caption
- hashtags
- contextual consistency
- candidate address
- candidate type
- geographic plausibility

Do not choose a candidate simply because its name contains a matching keyword.

Return ONLY valid JSON.

Expected structure:
{{
  "winner": 1,
  "confidence": 0.96,
  "reason": "..."
}}

Rules:
- winner must be the candidate index (integer corresponding to one of the supplied candidates)
- confidence must be a number between 0.0 and 1.0
- reason must briefly explain the evidence connecting the Reel to the candidate
- never invent a candidate
- never return a place outside the supplied candidate list
- if evidence is weak, confidence must be low
- if no candidate is sufficiently supported, return winner as null:
{{
  "winner": null,
  "confidence": 0.0,
  "reason": "Insufficient evidence to confidently verify any supplied candidate."
}}

INPUT DATA:
{json.dumps(payload, indent=2, ensure_ascii=False)}
"""