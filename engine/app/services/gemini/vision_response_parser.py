import json
import logging
import re

logger = logging.getLogger(__name__)


class VisionResponseParser:

    # ==================================================
    # Parse Gemini Vision Response
    # ==================================================

    def parse(
        self,
        response: str | dict | None,
    ) -> dict:

        if not response:
            return self.empty("No vision response returned.")

        data = None

        if isinstance(response, str):
            raw_text = response.strip()

            # Remove markdown fences
            fence_match = re.search(
                r"```(?:json)?\s*([\s\S]*?)\s*```",
                raw_text,
                re.IGNORECASE,
            )
            if fence_match:
                candidate_json = fence_match.group(1).strip()
            else:
                candidate_json = raw_text

            try:
                data = json.loads(candidate_json)
            except json.JSONDecodeError:
                bracket_match = re.search(r"\{[\s\S]*\}", candidate_json)
                if bracket_match:
                    try:
                        data = json.loads(bracket_match.group(0))
                    except json.JSONDecodeError:
                        data = None

            if not isinstance(data, dict):
                logger.warning("[GEMINI] Failed to parse vision JSON: %s", raw_text[:200])
                return self.empty("Invalid JSON returned by Gemini Vision.")
        elif isinstance(response, dict):
            data = response
        else:
            return self.empty(f"Unexpected vision response type: {type(response).__name__}")

        # Matched index
        raw_idx = data.get("matched_index")
        matched_index = None
        if raw_idx is not None:
            try:
                matched_index = int(raw_idx)
            except (ValueError, TypeError):
                matched_index = None

        return {
            "matched_index": matched_index,
            "best_match": str(data.get("best_match", "") or "").strip(),
            "matches_candidate": bool(data.get("matches_candidate", False)),
            "confidence": self.normalize_confidence(data.get("confidence", 0.0)),
            "reason": str(data.get("reason", "") or "").strip(),
            "visual_clues": self.normalize_list(data.get("visual_clues", [])),
            "detected_landmarks": self.normalize_list(data.get("detected_landmarks", [])),
            "detected_country": str(data.get("detected_country", "") or "").strip(),
            "detected_region": str(data.get("detected_region", "") or "").strip(),
        }

    # ==================================================
    # Normalize Confidence to 0.0 - 1.0
    # ==================================================

    def normalize_confidence(
        self,
        value: any,
    ) -> float:

        try:
            val = float(value)
        except (TypeError, ValueError):
            return 0.0

        if 1.0 < val <= 100.0:
            val = val / 100.0

        val = max(0.0, min(1.0, val))

        return round(val, 4)

    # ==================================================
    # Normalize List
    # ==================================================

    def normalize_list(
        self,
        value: any,
    ) -> list:

        if not isinstance(value, list):
            return []

        cleaned = []
        seen = set()

        for item in value:
            text = str(item).strip()
            if not text:
                continue

            key = text.lower()
            if key in seen:
                continue

            seen.add(key)
            cleaned.append(text)

        return cleaned

    # ==================================================
    # Empty / Fallback
    # ==================================================

    def empty(
        self,
        reason: str = "",
    ) -> dict:

        return {
            "matched_index": None,
            "best_match": "",
            "matches_candidate": False,
            "confidence": 0.0,
            "reason": reason,
            "visual_clues": [],
            "detected_landmarks": [],
            "detected_country": "",
            "detected_region": "",
        }