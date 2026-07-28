import json
import re


class VisionResponseParser:

    # ==================================================
    # Parse Gemini Vision Response
    # ==================================================

    def parse(
        self,
        response: str,
    ):

        if not response:

            return self.empty()

        response = response.strip()

        # ------------------------------------------
        # Remove Markdown Code Blocks
        # ------------------------------------------

        response = re.sub(
            r"^```(?:json)?",
            "",
            response,
            flags=re.IGNORECASE,
        )

        response = re.sub(
            r"```$",
            "",
            response,
        ).strip()

        # ------------------------------------------
        # Parse JSON
        # ------------------------------------------

        try:

            data = json.loads(
                response,
            )

        except json.JSONDecodeError:

            return self.empty(
                reason="Invalid JSON returned by Gemini.",
            )

        return {

            "best_match": str(
                data.get(
                    "best_match",
                    "",
                )
            ).strip(),

            "confidence": self.normalize_confidence(
                data.get(
                    "confidence",
                    0,
                )
            ),

            "reason": str(
                data.get(
                    "reason",
                    "",
                )
            ).strip(),

            "visual_clues": self.normalize_list(
                data.get(
                    "visual_clues",
                    [],
                )
            ),

            "matches_candidate": bool(
                data.get(
                    "matches_candidate",
                    False,
                )
            ),

        }

    # ==================================================
    # Helpers
    # ==================================================

    def normalize_confidence(
        self,
        value,
    ):

        try:

            value = int(value)

        except (TypeError, ValueError):

            return 0

        return max(
            0,
            min(
                value,
                100,
            ),
        )

    def normalize_list(
        self,
        value,
    ):

        if not isinstance(
            value,
            list,
        ):

            return []

        cleaned = []

        seen = set()

        for item in value:

            item = str(item).strip()

            if not item:
                continue

            key = item.lower()

            if key in seen:
                continue

            seen.add(key)

            cleaned.append(item)

        return cleaned

    # ==================================================
    # Empty Response
    # ==================================================

    def empty(
        self,
        reason: str = "",
    ):

        return {

            "best_match": "",

            "confidence": 0,

            "reason": reason,

            "visual_clues": [],

            "matches_candidate": False,

        }